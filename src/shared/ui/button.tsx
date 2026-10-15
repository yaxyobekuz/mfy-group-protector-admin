"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

/**
 * ⚠️ `rounded-full` — "TABLETKA" SHAKLI. Panel kartalari yirik
 * radiusli va to'g'ri burchakli tugma ularning ichida begona
 * ko'rinardi.
 *
 * ⚠️ `active:scale-[0.97]`: bosilganda tugma sal kichrayadi. Bu
 * bezak emas — sekin tarmoqda so'rov ketganini KO'RSATADIGAN
 * yagona darhol belgi, usiz odam tugmani ikkinchi marta bosardi.
 */
const buttonVariants = cva(
  // ⚠️ `disabled:pointer-events-none`: usiz o'chirilgan tugma
  // bosilib, mutatsiya ikki marta ketardi.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-card hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90",
        // ⚠️ FON `card`, `background` EMAS: tugma ko'pincha karta
        // USTIDA turadi va fon rangi bilan u "teshik" bo'lib
        // ko'rinardi.
        outline:
          "border border-input bg-card hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-11 px-7",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
