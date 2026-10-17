/*!
 * vsrc — Apple-style liquid glass refraction for any element.
 *
 * Port of liquid-glass.js (MIT). Technique per
 * https://github.com/deepika-builds/liquid-glass and
 * https://aave.com/design/building-glass-for-the-web
 *
 * The engine owns the optics: SVG filter, displacement map, backdrop-filter
 * wiring, resize handling, and the frosted-blur fallback where SVG-filtered
 * backdrops are unsupported (Safari, Firefox). Material dressing (tint,
 * speculars, shadows) is CSS on the target element.
 */

export interface LiquidGlassOptions {
  /** Displacement strength; negative = magnifying bulge. −60 subtle … −180 dramatic. */
  scale?: number;
  /** Per-channel scale stagger (prism fringe at the rim); 0 disables. */
  chroma?: number;
  /** Neutral interior inset as a fraction of the smaller side — confines refraction to an edge band. */
  border?: number;
  /** Curvature of the bulge (px): small = hard rim, large = dome. */
  mapBlur?: number;
  /** Backdrop blur (px) inside the glass; raise for busy backgrounds. */
  blur?: number;
  /** Backdrop saturation boost. */
  saturate?: number;
  /** Corner radius override (px); defaults to the element's computed border-radius. */
  radius?: number | null;
  /** Frosted blur (px) where refraction is unsupported. */
  fallbackBlur?: number;
}

/**
 * How the effect was applied.
 * - `refract` — real displacement-map refraction (Chromium).
 * - `frosted` — blur/saturate fallback (Safari, Firefox).
 * - `reduced` — user prefers reduced transparency; no backdrop effect, style opaquely via CSS.
 * - `none`    — no DOM available (SSR) or element missing; inert instance.
 */
export type GlassMode = "refract" | "frosted" | "reduced" | "none";

export interface LiquidGlassInstance {
  /** True only when real refraction is active (`mode === "refract"`). */
  readonly supported: boolean;
  readonly mode: GlassMode;
  /** Regenerate the displacement map after manual size changes (automatic on resize). */
  refresh(): void;
  /** Remove the effect and all listeners. */
  destroy(): void;
}

const DEFAULTS: Required<LiquidGlassOptions> = {
  scale: -112,
  chroma: 6,
  border: 0.07,
  mapBlur: 12,
  blur: 3,
  saturate: 1.5,
  radius: null,
  // Barely-there frost (glasscn's Safari path is blur(4)): the backdrop must
  // stay vivid through the panel. Heavier blur turns thin content to fog.
  fallbackBlur: 3,
};

/** Named optics bundles so callers can say `glass="subtle"` instead of tuning numbers. */
export type GlassPreset = "subtle" | "regular" | "heavy";

/** `regular` is the engine DEFAULTS; `subtle`/`heavy` step the whole bundle together. */
export const GLASS_PRESETS: Record<GlassPreset, LiquidGlassOptions> = {
  subtle: { scale: -56, chroma: 3, border: 0.14, mapBlur: 8, blur: 2, saturate: 1.35, fallbackBlur: 2 },
  regular: { scale: -112, chroma: 6, border: 0.07, mapBlur: 12, blur: 3, saturate: 1.5, fallbackBlur: 3 },
  heavy: { scale: -170, chroma: 10, border: 0.05, mapBlur: 16, blur: 4, saturate: 1.6, fallbackBlur: 5 },
};

/**
 * Resolve a component's tuned optics against the public `glass` prop.
 * A string preset REPLACES the base (it defines every knob); an object merges
 * over it; `false` disables refraction. Spreading a string directly would scatter
 * it into indexed characters — always route preset strings through here.
 */
export function mergeGlass(
  base: LiquidGlassOptions,
  glass?: LiquidGlassOptions | GlassPreset | false,
): LiquidGlassOptions | false {
  if (glass === false) return false;
  if (typeof glass === "string") return { ...base, ...GLASS_PRESETS[glass] };
  return { ...base, ...glass };
}

export const DATA_ATTR = "data-vsrc-glass";

const SVG_NS = "http://www.w3.org/2000/svg";
let uid = 0;
let svgDefs: SVGDefsElement | null = null;

/**
 * Chromium can apply SVG filters via backdrop-filter; Safari and Firefox
 * silently no-op, so they get the frosted fallback instead. Detection is
 * lazy and memoized — never touches window/navigator at module scope (SSR).
 */
let refractionSupport: boolean | null = null;
export function canRefract(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (refractionSupport !== null) return refractionSupport;
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  let ok =
    !isSafari &&
    !isFirefox &&
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("backdrop-filter", "url(#lg)");
  if (ok) {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 4;
      c.getContext("2d")!.getImageData(0, 0, 1, 1);
    } catch {
      ok = false;
    }
  }
  refractionSupport = ok;
  return ok;
}

export function prefersReducedTransparency(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-transparency: reduce)").matches
  );
}

function ensureDefs(): SVGDefsElement {
  if (svgDefs && svgDefs.isConnected) return svgDefs;
  const svg = document.createElementNS(SVG_NS, "svg");
  // width/height 0 keeps it renderable (display:none would break feImage)
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svgDefs = document.createElementNS(SVG_NS, "defs");
  svg.appendChild(svgDefs);
  document.body.appendChild(svg);
  return svgDefs;
}

/**
 * Displacement map, gradient-difference method: a red left→right ramp encodes
 * X displacement, a blue top→bottom ramp encodes Y ("difference" keeps both
 * since the channels are disjoint). A blurred, inset 50%-gray rounded rect
 * neutralizes the interior, confining the refraction bulge to an edge band
 * whose curvature is set by the blur radius.
 */
function makeMap(w: number, h: number, radius: number, border: number, mapBlur: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const gx = ctx.createLinearGradient(0, 0, w, 0);
  gx.addColorStop(0, "rgb(0,0,0)");
  gx.addColorStop(1, "rgb(255,0,0)");
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, w, h);

  const gy = ctx.createLinearGradient(0, 0, 0, h);
  gy.addColorStop(0, "rgb(0,0,0)");
  gy.addColorStop(1, "rgb(0,0,255)");
  ctx.globalCompositeOperation = "difference";
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";
  const inset = border * Math.min(w, h);
  ctx.filter = `blur(${mapBlur}px)`;
  ctx.fillStyle = "rgba(128,128,128,0.93)";
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, Math.max(radius - inset, 2));
  ctx.fill();
  ctx.filter = "none";
  return canvas.toDataURL();
}

/**
 * Three displacement passes at staggered scales (R strongest), channels
 * isolated with feColorMatrix and recombined with screen blends — the faint
 * prism fringe at the rim.
 */
function buildFilter(id: string, scales: [number, number, number]) {
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", "100%");
  filter.setAttribute("height", "100%");
  // Load-bearing: filters default to linearRGB, which re-maps the map's
  // neutral gray 128 to ~0.216 and injects a constant phantom displacement.
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const feImage = document.createElementNS(SVG_NS, "feImage");
  feImage.setAttribute("x", "0");
  feImage.setAttribute("y", "0");
  feImage.setAttribute("result", "map");
  feImage.setAttribute("preserveAspectRatio", "none");
  filter.appendChild(feImage);

  const keep = [
    "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
    "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
    "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
  ] as const;
  const channels: string[] = [];
  for (let i = 0; i < 3; i++) {
    const disp = document.createElementNS(SVG_NS, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "map");
    disp.setAttribute("scale", String(scales[i]));
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "B");
    disp.setAttribute("result", `d${i}`);
    filter.appendChild(disp);

    const cm = document.createElementNS(SVG_NS, "feColorMatrix");
    cm.setAttribute("in", `d${i}`);
    cm.setAttribute("type", "matrix");
    cm.setAttribute("values", keep[i]!);
    cm.setAttribute("result", `c${i}`);
    filter.appendChild(cm);
    channels.push(`c${i}`);
  }

  const blend1 = document.createElementNS(SVG_NS, "feBlend");
  blend1.setAttribute("in", channels[0]!);
  blend1.setAttribute("in2", channels[1]!);
  blend1.setAttribute("mode", "screen");
  blend1.setAttribute("result", "c01");
  filter.appendChild(blend1);

  const blend2 = document.createElementNS(SVG_NS, "feBlend");
  blend2.setAttribute("in", "c01");
  blend2.setAttribute("in2", channels[2]!);
  blend2.setAttribute("mode", "screen");
  filter.appendChild(blend2);

  ensureDefs().appendChild(filter);
  return { filter, feImage };
}

export function resolveRadius(el: Element, w: number, h: number, override: number | null): number {
  if (override != null) return override;
  const raw = getComputedStyle(el).borderTopLeftRadius || "0px";
  const v = parseFloat(raw) || 0;
  return raw.trim().endsWith("%") ? (v / 100) * Math.min(w, h) : v;
}

const INERT: LiquidGlassInstance = {
  supported: false,
  mode: "none",
  refresh() {},
  destroy() {},
};

/** Apply liquid glass to an element. `opts` may be a named preset or an options object. */
export function liquidGlass(
  el: HTMLElement | null,
  opts?: LiquidGlassOptions | GlassPreset,
): LiquidGlassInstance {
  if (!el || typeof window === "undefined") return INERT;
  const o = { ...DEFAULTS, ...(typeof opts === "string" ? GLASS_PRESETS[opts] : opts) };

  if (prefersReducedTransparency()) {
    // No backdrop effect at all — the material layer styles this opaquely
    // via [data-vsrc-glass="reduced"].
    el.setAttribute(DATA_ATTR, "reduced");
    return {
      supported: false,
      mode: "reduced",
      refresh() {},
      destroy() {
        el.removeAttribute(DATA_ATTR);
      },
    };
  }

  if (!canRefract()) {
    const frosted = `blur(${o.fallbackBlur}px) saturate(${o.saturate})`;
    el.style.backdropFilter = frosted;
    // Safari still needs the prefix for backdrop-filter in some versions.
    (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = frosted;
    el.classList.add("lg-fallback");
    el.setAttribute(DATA_ATTR, "frosted");
    return {
      supported: false,
      mode: "frosted",
      refresh() {},
      destroy() {
        el.style.backdropFilter = "";
        (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = "";
        el.classList.remove("lg-fallback");
        el.removeAttribute(DATA_ATTR);
      },
    };
  }

  const id = `vsrc-lg-${++uid}`;
  const scales: [number, number, number] = [o.scale, o.scale + o.chroma, o.scale + 2 * o.chroma];
  const parts = buildFilter(id, scales);

  function refresh(): void {
    const w = el!.offsetWidth;
    const h = el!.offsetHeight;
    if (!w || !h) return;
    const radius = resolveRadius(el!, w, h, o.radius);
    parts.feImage.setAttribute("href", makeMap(w, h, radius, o.border, o.mapBlur));
    parts.feImage.setAttribute("width", String(w));
    parts.feImage.setAttribute("height", String(h));
  }

  refresh();
  el.style.backdropFilter = `url(#${id}) blur(${o.blur}px) saturate(${o.saturate})`;
  el.setAttribute(DATA_ATTR, "refract");

  let timer: ReturnType<typeof setTimeout> | undefined;
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 120);
  });
  ro.observe(el);

  return {
    supported: true,
    mode: "refract",
    refresh,
    destroy() {
      ro.disconnect();
      clearTimeout(timer);
      parts.filter.remove();
      el.style.backdropFilter = "";
      el.removeAttribute(DATA_ATTR);
    },
  };
}
