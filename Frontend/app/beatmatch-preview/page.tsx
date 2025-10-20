"use client"

import { Zap } from 'lucide-react'

export default function BeatMatchPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">BeatMatch Challenge</h1>
            <p className="text-muted-foreground">
              Create your own playlist and challenge your friends!
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            BeatMatch Challenge is currently under development. 
            Stay tuned for the ultimate music card collecting experience!
          </p>
        </div>
      </div>
    </div>
  )
}
