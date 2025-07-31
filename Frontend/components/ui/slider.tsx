"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackClassName?: string
  rangeClassName?: string
  thumbClassName?: string
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, trackClassName, rangeClassName, thumbClassName, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className={cn("relative h-2 w-full grow rounded-full bg-secondary slider-pill-track", trackClassName)} style={{ overflow: 'visible' }}>
      <SliderPrimitive.Range className={cn("absolute h-full bg-primary slider-pill-range", rangeClassName)} style={{ borderRadius: '9999px', borderTopLeftRadius: '9999px', borderBottomLeftRadius: '9999px', borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px' }} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={cn("block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", thumbClassName)} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider, type SliderProps }
