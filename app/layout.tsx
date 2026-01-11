import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Timekeeper Countdown Bengkel',
  description: 'Timer countdown untuk aktivitas bengkel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}