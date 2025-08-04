import * as React from "react"

import { cn } from "@/lib/utils"

<<<<<<< HEAD
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
=======
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  customProp?: string;
}


const Input = React.forwardRef<HTMLInputElement, InputProps>(
>>>>>>> d2d74a7243ae1683ee43b70f57dfe8bcf1e3d73e
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
<<<<<<< HEAD
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
=======
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
>>>>>>> d2d74a7243ae1683ee43b70f57dfe8bcf1e3d73e
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
