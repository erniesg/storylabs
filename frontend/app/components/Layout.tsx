import Link from 'next/link'
import { Github } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-center items-center">
        <Link href="/" className="flex items-center gap-4">
          <img 
            src="/storylabs.png" 
            alt="StoryLabs Logo" 
            className="h-10 w-auto object-contain" 
          />
          <span className="text-3xl font-bold text-white">StoryLabs</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-8">
        <div className="flex justify-center items-center gap-4 w-full">
          <span className="text-white">
            Made with ❤️ by{' '}
            <Link 
              href="https://github.com/chengyongyeo" 
              className="text-purple-200 hover:text-white font-semibold hover:underline"
            >
              chengyongyeo
            </Link>{' '}
            &{' '}
            <Link 
              href="https://github.com/erniesg" 
              className="text-purple-200 hover:text-white font-semibold hover:underline"
            >
              erniesg
            </Link>
          </span>
          <Link
            href="https://github.com/erniesg/storylabs"
            className="text-purple-200 hover:text-white transition-colors"
            title="View on GitHub"
          >
            <Github className="w-6 h-6" />
          </Link>
        </div>
      </footer>
    </div>
  )
} 