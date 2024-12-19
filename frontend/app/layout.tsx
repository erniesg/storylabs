import './globals.css'

export const metadata = {
  title: 'StoryLabs',
  description: 'An interactive reading adventure for children',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-purple-500">
        {children}
      </body>
    </html>
  )
}