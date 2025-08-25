import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'purple'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  fullWidth = false,
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'bg-primary/60 text-text-on-dark border border-accent-gold/20 hover:bg-accent-gold/20',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    purple: 'btn-purple'
  }

  const sizeClasses = {
    xs: 'min-h-[44px] px-4 py-3 text-sm',  // 44px min height for touch
    sm: 'min-h-[44px] px-6 py-3 text-base', // 44px min height for touch
    md: 'min-h-[48px] px-8 py-4 text-lg',  // Larger for primary actions
    lg: 'min-h-[56px] px-10 py-5 text-xl'  // Extra large for hero CTAs
  }

  const widthClasses = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}

export default Button