import './globals.css';

export const metadata = {
  title: 'TinyAssets - Learn About Real-World Assets',
  description: 'Gamified learning platform for kids to understand RWAs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}