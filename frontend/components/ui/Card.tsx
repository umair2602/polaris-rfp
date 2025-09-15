import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export default function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden'
  const hoverClasses = hover ? 'hover:shadow-xl hover:border-blue-200 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30 transition-all duration-300 transform hover:-translate-y-1' : ''
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30' : ''
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200/50 bg-gray-50/50 ${className}`}>
      {children}
    </div>
  )
}