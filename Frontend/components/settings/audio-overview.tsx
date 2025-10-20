'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Music2, Volume2, Info } from 'lucide-react'

export function AudioOverview() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          2K Music Audio System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              2K Music Audio System
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded border-2 border-green-500/20">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium text-green-600 dark:text-green-400">Universal System Equalizer</div>
                    <div className="text-xs text-muted-foreground">
                      Processes ALL audio on your computer - YouTube, games, music, Discord, everything!
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500 text-white text-xs">
                  APO-Powered
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="font-medium text-green-700 dark:text-green-300 mb-2">
                🎵 What It Processes
              </div>
              <ul className="text-xs space-y-1 text-green-600 dark:text-green-400">
                <li>• Your music app audio</li>
                <li>• YouTube videos</li>
                <li>• Games and Discord</li>
                <li>• System sounds</li>
                <li>• ANY audio application</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                ⚡ Key Features
              </div>
              <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
                <li>• Real-time processing</li>
                <li>• Professional presets</li>
                <li>• 10-band equalizer</li>
                <li>• Zero latency</li>
                <li>• One EQ for everything</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
