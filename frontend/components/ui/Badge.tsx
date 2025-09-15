interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  pulse?: boolean
}

export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  pulse = false 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-full'
  
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    info: 'bg-cyan-100 text-cyan-800 border border-cyan-200'
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }

  const pulseClass = pulse ? 'animate-pulse' : ''

  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${pulseClass} ${className}`}>
      {children}
    </span>
  )
}