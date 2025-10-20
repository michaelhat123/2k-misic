"use client"

import React from "react"
import { BrandedLoader } from "@/components/ui/BrandedLoader"

export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <BrandedLoader size="md" showText={false} />
    </div>
  )
}
