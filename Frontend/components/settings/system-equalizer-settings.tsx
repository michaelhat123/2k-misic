'use client'

import React, { useState, useEffect } from 'react'
import { apoEqualizer, APO_PRESETS, APO_FREQUENCIES } from '@/lib/audio'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sliders, Music2, Volume2, Zap, Play, Square, AlertTriangle, Save, Trash2 } from 'lucide-react'
import { useState as useReactState } from 'react'
import { toast } from 'sonner'

interface SystemEqualizerSettingsProps {
  externalEnabled?: boolean
  onExternalToggle?: (enabled: boolean) => void
}

export function SystemEqualizerSettings({ externalEnabled = false, onExternalToggle }: SystemEqualizerSettingsProps = {}) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [enabled, setEnabled] = useState(externalEnabled)
  const [systemInfo, setSystemInfo] = useState('')
  const [gains, setGains] = useState<number[]>(Array(10).fill(0))
  const [selectedPreset, setSelectedPreset] = useState('flat')
  const [customPresets, setCustomPresets] = useState<Record<string, { name: string, gains: number[] }>>({})
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    const loadAPOEqualizer = async () => {
      
      const available = apoEqualizer.isAvailable()
      setIsAvailable(available)
      
      if (available) {
        // Load saved state from localStorage
        const savedState = localStorage.getItem('eq-state')
        if (savedState) {
          try {
            const { enabled: savedEnabled, preset: savedPreset, gains: savedGains } = JSON.parse(savedState)
            
            if (savedEnabled !== undefined) {
              setEnabled(savedEnabled)
              await apoEqualizer.setEnabled(savedEnabled)
            }
            
            if (savedPreset) {
              setSelectedPreset(savedPreset)
            }
            
            if (savedGains && Array.isArray(savedGains)) {
              setGains(savedGains)
              await apoEqualizer.setGains(savedGains)
            }
          } catch (error) {
            // Fallback to current APO state
            setEnabled(apoEqualizer.isEnabled())
            setGains(apoEqualizer.getCurrentGains())
          }
        } else {
          // No saved state, use current APO state
          setEnabled(apoEqualizer.isEnabled())
          setGains(apoEqualizer.getCurrentGains())
        }
      } else {
        setSystemInfo(apoEqualizer.getSystemInfo())
      }
    }
    
    loadAPOEqualizer()
  }, [])

  const handleRefresh = async () => {
    await apoEqualizer.refresh()
    setIsAvailable(apoEqualizer.isAvailable())
    if (apoEqualizer.isAvailable()) {
      setGains(apoEqualizer.getCurrentGains())
    }
    setSystemInfo(apoEqualizer.getSystemInfo())
  }

  const handleBandChange = async (index: number, value: number[]) => {
    const newGains = [...gains]
    newGains[index] = value[0]
    setGains(newGains)
    
    // Set to custom when user manually adjusts
    setSelectedPreset('custom')
    
    // Apply to APO
    await apoEqualizer.setGains(newGains)
    
    // Save state
    localStorage.setItem('eq-state', JSON.stringify({
      enabled,
      preset: 'custom',
      gains: newGains
    }))
  }

  const handlePresetChange = async (presetName: string) => {
    // Don't apply if user selects "Custom" - it's just a label for manual adjustments
    if (presetName === 'custom') {
      setSelectedPreset(presetName)
      return
    }

    let newGains = gains
    
    // Check if it's a custom preset
    if (presetName.startsWith('custom_')) {
      const customPreset = customPresets[presetName]
      if (customPreset) {
        newGains = customPreset.gains
        setGains(newGains)
        await apoEqualizer.setGains(newGains)
      }
    } else {
      // Built-in preset
      await apoEqualizer.applyPreset(presetName)
      newGains = apoEqualizer.getCurrentGains()
      setGains(newGains)
    }
    setSelectedPreset(presetName)
    
    // Save state
    localStorage.setItem('eq-state', JSON.stringify({
      enabled,
      preset: presetName,
      gains: newGains
    }))
  }

  const handleReset = async () => {
    const flatGains = Array(10).fill(0)
    await apoEqualizer.applyPreset('flat')
    setGains(flatGains)
    setSelectedPreset('flat')
    
    // Save state
    localStorage.setItem('eq-state', JSON.stringify({
      enabled,
      preset: 'flat',
      gains: flatGains
    }))
  }

  // Sync with external toggle
  useEffect(() => {
    if (externalEnabled !== undefined) {
      handleToggle(externalEnabled)
    }
  }, [externalEnabled])

  const handleToggle = async (checked: boolean) => {
    await apoEqualizer.setEnabled(checked)
    setEnabled(checked)
    setSystemInfo(apoEqualizer.getSystemInfo())
    onExternalToggle?.(checked)
    
    // Save state
    localStorage.setItem('eq-state', JSON.stringify({
      enabled: checked,
      preset: selectedPreset,
      gains
    }))
  }

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    const presetKey = `custom_${Date.now()}`
    const newPreset = {
      name: presetName.trim(),
      gains: [...gains]
    }

    // Save to local state
    setCustomPresets(prev => ({
      ...prev,
      [presetKey]: newPreset
    }))

    // Save to localStorage for persistence
    const savedPresets = JSON.parse(localStorage.getItem('eq-custom-presets') || '{}')
    savedPresets[presetKey] = newPreset
    localStorage.setItem('eq-custom-presets', JSON.stringify(savedPresets))

    toast.success(`Preset "${presetName}" saved!`)
    setSaveDialogOpen(false)
    setPresetName('')
    setSelectedPreset(presetKey)
  }

  const handleDeletePreset = async (presetKey: string) => {
    // Remove from local state
    setCustomPresets(prev => {
      const newPresets = { ...prev }
      delete newPresets[presetKey]
      return newPresets
    })

    // Remove from localStorage
    const savedPresets = JSON.parse(localStorage.getItem('eq-custom-presets') || '{}')
    delete savedPresets[presetKey]
    localStorage.setItem('eq-custom-presets', JSON.stringify(savedPresets))

    // If deleted preset was selected, switch to flat
    if (selectedPreset === presetKey) {
      setSelectedPreset('flat')
    }

    toast.success('Preset deleted')
  }

  // Load custom presets on mount
  useEffect(() => {
    const savedPresets = JSON.parse(localStorage.getItem('eq-custom-presets') || '{}')
    setCustomPresets(savedPresets)
  }, [])

  if (!isAvailable) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            2K Music System Equalizer
          </CardTitle>
          <CardDescription>
            Install the 2K Music System Equalizer to process ALL system audio - YouTube, games, music, everything!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium mb-2">🎛️ Easy Setup:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Download Equalizer APO from <code>equalizerapo.com</code></li>
                <li>Install and restart your computer</li>
                <li>Click "Refresh" below to detect the installation</li>
                <li>Enable the equalizer and enjoy system-wide audio enhancement!</li>
              </ol>
              <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded text-xs">
                <strong>✨ What you get:</strong> Professional system-wide EQ that processes audio from ANY app - YouTube, Spotify, games, Discord, everything!
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.open('https://sourceforge.net/projects/equalizerapo/', '_blank')}
                className="flex-1"
              >
                Download Equalizer APO (Free)
              </Button>
              <Button 
                onClick={handleRefresh}
                variant="outline"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <CardHeader>
        <CardTitle>Equalizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Presets */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Presets</span>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(APO_PRESETS).map((key) => (
                <SelectItem key={key} value={key}>{APO_PRESETS[key].name}</SelectItem>
              ))}
              {Object.entries(customPresets).map(([key, preset]) => (
                <SelectItem key={key} value={key} className="group relative pr-8">
                  <span>{preset.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePreset(key)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={selectedPreset !== 'custom'}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Custom Preset</DialogTitle>
                <DialogDescription>
                  Give your custom EQ settings a name to save them for later use.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input
                    id="preset-name"
                    placeholder="My Custom EQ"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSavePreset()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePreset}>
                  Save Preset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* EQ Bands Visualization */}
        <div className="space-y-1">
            <div className="flex justify-end">
              <span className="text-xs text-gray-500">+12dB</span>
            </div>
            
            {/* Professional EQ Display */}
            <div className="rounded-lg relative">
              {/* EQ Graph Visualization */}
              <div className="relative w-full h-64 px-4">
                <svg className="absolute inset-0 w-full h-full" viewBox="-2 0 104 50" preserveAspectRatio="none">
                  {/* Vertical frequency lines */}
                  {APO_FREQUENCIES.map((_, i) => {
                    const xPos = (i / (APO_FREQUENCIES.length - 1)) * 100;
                    return (
                      <line
                        key={`v-${i}`}
                        x1={xPos}
                        y1="0"
                        x2={xPos}
                        y2="50"
                        stroke="#4b5563"
                        strokeWidth="0.3"
                        opacity="0.4"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                  
                  {/* Zero line (0dB reference) */}
                  <line
                    x1="0"
                    y1="25"
                    x2="100"
                    y2="25"
                    stroke="#6b7280"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                    opacity="0.3"
                    vectorEffect="non-scaling-stroke"
                  />
                  
                  {/* EQ curve line - solid sky blue */}
                  <path
                    d={APO_FREQUENCIES.map((_, i) => {
                      const xPos = (i / (APO_FREQUENCIES.length - 1)) * 100;
                      const yPos = 25 - (gains[i] * 1.8);
                      return i === 0 ? `M ${xPos} ${yPos}` : `L ${xPos} ${yPos}`;
                    }).join(' ')}
                    stroke="#00BFFF"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                    vectorEffect="non-scaling-stroke"
                  />
                  
                  {/* Control points (dots) - sky blue dots */}
                  {APO_FREQUENCIES.map((_, i) => {
                    const xPos = (i / (APO_FREQUENCIES.length - 1)) * 100;
                    const yPos = 25 - (gains[i] * 1.8);
                    return (
                      <circle
                        key={i}
                        cx={xPos}
                        cy={yPos}
                        r="0.8"
                        fill="#00BFFF"
                        className="transition-all duration-200 cursor-pointer"
                      />
                    );
                  })}
                </svg>

                {/* Interactive sliders (invisible but functional) */}
                <div className="absolute inset-0 flex items-stretch">
                  {APO_FREQUENCIES.map((freq, index) => (
                    <div key={index} className="flex-1 flex flex-col justify-center px-1">
                      <Slider
                        value={[gains[index]]}
                        min={-12}
                        max={12}
                        step={0.5}
                        orientation="vertical"
                        className="h-full opacity-0 hover:opacity-5 transition-opacity"
                        onValueChange={(value) => handleBandChange(index, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <span className="text-xs text-gray-500">-12dB</span>
              </div>

              {/* Frequency labels */}
              <div className="flex justify-between p-4 pt-2">
                {APO_FREQUENCIES.map((freq, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-400">
                      {freq >= 1000 ? `${(freq/1000).toFixed(freq >= 10000 ? 0 : 1)}k` : freq}Hz
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  )
}
