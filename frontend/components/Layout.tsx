import { ReactNode } from 'react'
import Link from 'next/link'
import { 
  DocumentTextIcon, 
  FolderIcon, 
  UserGroupIcon, 
  CogIcon 
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FolderIcon },
    { name: 'RFPs', href: '/rfps', icon: DocumentTextIcon },
    { name: 'Proposals', href: '/proposals', icon: DocumentTextIcon },
    { name: 'Templates', href: '/templates', icon: CogIcon },
    { name: 'Content Library', href: '/content', icon: UserGroupIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">RFP System</h1>
        </div>
        
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <item.icon className="text-gray-400 mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}