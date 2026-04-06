"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // Base — all buttons share these
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap",
    "cursor-pointer select-none outline-none",
    // Transitions — polished 200ms
    "transition-all duration-200 ease-in-out",
    // Focus ring
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    // Active press
    "active:not-aria-[haspopup]:translate-y-px",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-40",
    // Aria invalid
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    // SVG children
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — violet + subtle inner glow on hover
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_1px_2px_0_rgb(0_0_0/0.2),inset_0_1px_0_0_rgb(255_255_255/0.12)]",
          "hover:brightness-110 hover:shadow-[0_2px_8px_0_rgb(0_0_0/0.3),inset_0_1px_0_0_rgb(255_255_255/0.15)]",
          "[a]:hover:bg-primary/80",
        ].join(" "),
        // Outline — clean with border, hover reveals muted fill
        outline: [
          "border-border bg-background text-foreground",
          "hover:bg-muted/60 hover:border-border/80",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]",
          "shadow-[0_1px_2px_0_rgb(0_0_0/0.06)]",
        ].join(" "),
        // Secondary — muted fill
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/70",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
          "dark:bg-white/[0.06] dark:hover:bg-white/[0.09]",
        ].join(" "),
        // Ghost — invisible until hovered
        ghost: [
          "text-foreground/80",
          "hover:bg-muted/70 hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:hover:bg-white/[0.06]",
        ].join(" "),
        // Destructive — red tinted
        destructive: [
          "bg-destructive/10 text-destructive",
          "hover:bg-destructive/20",
          "focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
          "dark:bg-destructive/15 dark:hover:bg-destructive/25 dark:focus-visible:ring-destructive/40",
        ].join(" "),
        // Link — pure text link style
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-8 px-3 text-sm",
        xs:      "h-6 px-2 text-xs rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-7 px-2.5 text-[0.8rem] rounded-[min(var(--radius-md),12px)] [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-9 px-4 text-sm",
        xl:      "h-10 px-5 text-sm",
        icon:    "size-8",
        "icon-xs":  "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":  "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg":  "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
