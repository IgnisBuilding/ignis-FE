// src/components/ui/button.tsx
import { cn } from "@/lib/utils" // optional helper if you want class merging

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost"
}

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded font-medium transition"
  const styles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100"
  }

  return (
    <button className={cn(base, styles[variant], className)} {...props} />
  )
}
