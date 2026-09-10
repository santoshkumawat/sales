import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg border border-line bg-white px-3 text-sm text-navy-900 placeholder:text-navy-300',
        'transition-colors hover:border-navy-200 focus:border-reef-500',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
