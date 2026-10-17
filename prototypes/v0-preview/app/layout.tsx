import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PatternForge — Engineering Mastery',
  description: 'A focused training ground for senior software engineers.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
