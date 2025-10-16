import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Piranhaween',
  description: 'Compartilhe sua fantasia de Halloween',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" rel="stylesheet" />
        <link type="image/jpg" rel='icon' href='piranha.jpg' />
        
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}