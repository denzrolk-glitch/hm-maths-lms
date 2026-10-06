import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:-translate-y-px hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-card hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "bg-success text-success-foreground hover:bg-success/90",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-teal-600 via-teal-500 to-brand-500 text-white shadow-lg shadow-teal-600/30 hover:-translate-y-px hover:shadow-xl hover:shadow-teal-600/30",
        orange: "rounded-full bg-gradient-to-r from-teal-600 to-brand-500 text-white shadow-lg shadow-teal-600/30 hover:-translate-y-px hover:shadow-xl",
        pink: "bg-pink-100 text-pink-600 hover:bg-pink-200",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-8 rounded-lg px-3 text-xs", lg: "h-12 rounded-2xl px-6 text-base", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
