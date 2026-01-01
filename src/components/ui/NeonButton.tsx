import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-neon-primary hover:shadow-[0_0_35px_hsl(180_100%_60%/0.6),0_0_70px_hsl(180_100%_50%/0.4)] hover:bg-primary/90",
        accent:
          "bg-accent text-accent-foreground shadow-neon-accent hover:shadow-[0_0_35px_hsl(320_100%_70%/0.6),0_0_70px_hsl(320_100%_65%/0.4)] hover:bg-accent/90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-neon-secondary hover:shadow-[0_0_35px_hsl(260_80%_70%/0.6)] hover:bg-secondary/80",
        outline:
          "border-2 border-primary bg-transparent text-primary shadow-neon-primary hover:bg-primary/10",
        ghost:
          "bg-transparent text-foreground hover:bg-muted",
        menu:
          "bg-card text-card-foreground border border-border shadow-card hover:shadow-neon-primary hover:border-primary/50 text-left",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        xl: "h-16 px-10 py-5 text-xl",
        icon: "h-12 w-12",
        menu: "h-auto min-h-[4.5rem] px-5 py-4 w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  asChild?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(neonButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
NeonButton.displayName = "NeonButton";

export { NeonButton, neonButtonVariants };
