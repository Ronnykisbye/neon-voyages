import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonCardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border shadow-card",
        glow: "border-primary/30 shadow-neon-primary",
        accent: "border-accent/30 shadow-neon-accent",
        glass: "glass border-border/50",
        interactive:
          "border-border shadow-card hover:shadow-neon-primary hover:border-primary/50 cursor-pointer",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface NeonCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof neonCardVariants> {}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(neonCardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);
NeonCard.displayName = "NeonCard";

const NeonCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
NeonCardHeader.displayName = "NeonCardHeader";

const NeonCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
NeonCardTitle.displayName = "NeonCardTitle";

const NeonCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
NeonCardDescription.displayName = "NeonCardDescription";

const NeonCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
NeonCardContent.displayName = "NeonCardContent";

export {
  NeonCard,
  NeonCardHeader,
  NeonCardTitle,
  NeonCardDescription,
  NeonCardContent,
  neonCardVariants,
};
