import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Naukrify — AI Job Hunt Co-pilot for India',
    template: '%s | Naukrify',
  },
  description:
    'Tailored CVs and cover letters for every Indian job application. Voice-filtered output. Application tracker. Bring your own Gemini key — zero ongoing cost.',
  keywords: ['job hunt India', 'AI cover letter India', 'tailored CV', 'Naukri', 'LinkedIn jobs India', 'job application tracker'],
  openGraph: {
    title: 'Naukrify — AI Job Hunt Co-pilot for India',
    description:
      'Stop spending 4 hours a day on job applications. Tailored CV + cover letter in 30 seconds. Built for India.',
    url: 'https://naukrify.com',
    siteName: 'Naukrify',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naukrify — AI Job Hunt Co-pilot for India',
    description:
      'Tailored CVs and cover letters for every Indian job application. Built for Naukri, LinkedIn, Wellfound. One-time payment.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
