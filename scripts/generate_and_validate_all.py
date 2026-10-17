#!/usr/bin/env python3
"""Generates YAML files for Batch 4A & 4B, validates them, and updates curriculum.json."""

import json
import sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from app.content_schema import QuestionContent
from scripts.validate_content import validate, check_solution
from data_batch4a import LESSONS_4A
from data_batch4b import LESSONS_4B

ALL_LESSONS = LESSONS_4A + LESSONS_4B


def dump_yaml(data: dict) -> str:
    """Format dictionary cleanly into YAML preserving block literals."""
    return yaml.dump(data, sort_keys=False, allow_unicode=True, width=120)


def main():
    print(f"Total lessons to process: {len(ALL_LESSONS)}")
    content_dir = ROOT / "content"

    # Step 1: Write all YAML files and validate each one
    failed = 0
    for idx, item in enumerate(ALL_LESSONS):
        dir_name = item["dir"]
        slug = item["slug"]
        lc = item["lc"]
        data = item["data"]

        target_dir = content_dir / "questions" / dir_name
        target_dir.mkdir(parents=True, exist_ok=True)
        yaml_file = target_dir / f"{slug}.yaml"

        # Validate against Pydantic schema first
        try:
            content_obj = QuestionContent.model_validate(data)
        except Exception as e:
            print(f"[{idx+1}/{len(ALL_LESSONS)}] FAIL {slug} (Pydantic schema): {e}")
            failed += 1
            continue

        # Write YAML file
        yaml_text = dump_yaml(data)
        yaml_file.write_text(yaml_text)

        # Run validate() execution check
        errors, warnings = validate(content_obj)
        if errors:
            print(f"[{idx+1}/{len(ALL_LESSONS)}] FAIL {slug} (Execution):")
            for err in errors:
                print(f"   error: {err}")
            failed += 1
        else:
            warn_str = f" ({len(warnings)} warnings)" if warnings else ""
            print(f"[{idx+1}/{len(ALL_LESSONS)}] ok   W{item['world_id']:02d} #{lc} {slug}{warn_str}")
            for w in warnings:
                print(f"   warn: {w}")

    if failed:
        print(f"\nAborting curriculum update: {failed} lessons failed validation.")
        return 1

    print("\nAll 17 lessons validated successfully! Updating content/curriculum.json...")

    # Step 2: Update content/curriculum.json
    curr_path = content_dir / "curriculum.json"
    curriculum = json.loads(curr_path.read_text())

    # Map world_id to world object in curriculum
    world_map = {w["id"]: w for w in curriculum["worlds"]}

    # Track how many questions added
    added_count = 0

    for item in ALL_LESSONS:
        w_id = item["world_id"]
        if w_id not in world_map:
            print(f"Error: World {w_id} not found in curriculum!")
            return 1

        w = world_map[w_id]
        existing_slugs = {q["slug"] for q in w.get("questions", [])}

        if item["slug"] not in existing_slugs:
            q_entry = {
                "slug": item["slug"],
                "lc": item["lc"],
                "title": item["title"],
                "difficulty": item["difficulty"],
                "visualizer": item["visualizer"],
                "patterns": item["patterns"],
                "runner_type": item["runner_type"],
                "brick_layer": item["brick_layer"],
                "world_id": w_id,
            }
            w.setdefault("questions", []).append(q_entry)
            added_count += 1
            print(f"Added #{item['lc']} {item['slug']} to World {w_id} ({w['slug']})")

        # Set status to live if questions > 0
        if len(w.get("questions", [])) > 0:
            w["status"] = "live"

    # Save updated curriculum.json
    curr_path.write_text(json.dumps(curriculum, indent=2))
    print(f"\nSuccessfully added {added_count} new questions to curriculum.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
