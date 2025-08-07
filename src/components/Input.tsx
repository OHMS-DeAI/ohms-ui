import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-textOnDark">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-primary/60 border rounded-lg text-textOnDark placeholder-textOnDark/50 focus:outline-none focus:ring-2 focus:ring-accentGold/50 focus:border-accentGold transition-colors ${
            error ? 'border-red-500/50' : 'border-accentGold/40'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-textOnDark/60">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input