import './globals.css'

export const metadata = {
  title: 'MedReform — COMJNMH Ideas Platform',
  description: 'A structured space for students, residents, and faculty to surface real problems and propose actionable solutions for COMJNMH Kalyani.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Epilogue:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
