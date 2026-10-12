import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_var(--gold)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_var(--gold)] hover:brightness-110",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:brightness-125",
        outline: "border border-gold/50 bg-transparent text-foreground hover:border-gold hover:bg-gold/10",
        ghost: "text-foreground hover:bg-accent",
        destructive: "bg-destructive text-white hover:brightness-110",
        success: "bg-success text-white shadow-[0_12px_30px_-12px_var(--success)] hover:-translate-y-0.5 hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        default: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-13 px-8 text-base [&_svg]:size-5",
        icon: "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, disabled, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  );
}
