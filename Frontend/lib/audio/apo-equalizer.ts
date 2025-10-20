/**
 * Equalizer APO Integration for 2K Music System Equalizer
 * Provides system-wide audio processing through APO config files
 */

export interface APOBand {
  frequency: number
  gain: number
  q: number
}

export interface APOPreset {
  name: string
  bands: APOBand[]
}

export const APO_PRESETS: Record<string, APOPreset> = {
  custom: {
    name: 'Custom',
    bands: [
      { frequency: 31, gain: 0, q: 1.0 },
      { frequency: 62, gain: 0, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: 0, q: 1.0 },
      { frequency: 4000, gain: 0, q: 1.0 },
      { frequency: 8000, gain: 0, q: 1.0 },
      { frequency: 16000, gain: 0, q: 1.0 }
    ]
  },
  flat: {
    name: 'Flat',
    bands: [
      { frequency: 31, gain: 0, q: 1.0 },
      { frequency: 62, gain: 0, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: 0, q: 1.0 },
      { frequency: 4000, gain: 0, q: 1.0 },
      { frequency: 8000, gain: 0, q: 1.0 },
      { frequency: 16000, gain: 0, q: 1.0 }
    ]
  },
  rock: {
    name: 'Rock',
    bands: [
      { frequency: 31, gain: 5, q: 1.0 },
      { frequency: 62, gain: 3, q: 1.0 },
      { frequency: 125, gain: -2, q: 1.0 },
      { frequency: 250, gain: -3, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: 1, q: 1.0 },
      { frequency: 2000, gain: 3, q: 1.0 },
      { frequency: 4000, gain: 4, q: 1.0 },
      { frequency: 8000, gain: 5, q: 1.0 },
      { frequency: 16000, gain: 5, q: 1.0 }
    ]
  },
  pop: {
    name: 'Pop',
    bands: [
      { frequency: 31, gain: -1, q: 1.0 },
      { frequency: 62, gain: 2, q: 1.0 },
      { frequency: 125, gain: 4, q: 1.0 },
      { frequency: 250, gain: 4, q: 1.0 },
      { frequency: 500, gain: 2, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: -1, q: 1.0 },
      { frequency: 4000, gain: -1, q: 1.0 },
      { frequency: 8000, gain: -1, q: 1.0 },
      { frequency: 16000, gain: -1, q: 1.0 }
    ]
  },
  bass_boost: {
    name: 'Bass Boost',
    bands: [
      { frequency: 31, gain: 8, q: 1.0 },
      { frequency: 62, gain: 6, q: 1.0 },
      { frequency: 125, gain: 4, q: 1.0 },
      { frequency: 250, gain: 2, q: 1.0 },
      { frequency: 500, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: 0, q: 1.0 },
      { frequency: 4000, gain: 0, q: 1.0 },
      { frequency: 8000, gain: 0, q: 1.0 },
      { frequency: 16000, gain: 0, q: 1.0 }
    ]
  },
  treble_boost: {
    name: 'Treble Boost',
    bands: [
      { frequency: 31, gain: 0, q: 1.0 },
      { frequency: 62, gain: 0, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 2, q: 1.0 },
      { frequency: 2000, gain: 4, q: 1.0 },
      { frequency: 4000, gain: 6, q: 1.0 },
      { frequency: 8000, gain: 8, q: 1.0 },
      { frequency: 16000, gain: 8, q: 1.0 }
    ]
  },
  jazz: {
    name: 'Jazz',
    bands: [
      { frequency: 31, gain: 3, q: 1.0 },
      { frequency: 62, gain: 2, q: 1.0 },
      { frequency: 125, gain: 1, q: 1.0 },
      { frequency: 250, gain: 2, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: -1, q: 1.0 },
      { frequency: 2000, gain: 0, q: 1.0 },
      { frequency: 4000, gain: 2, q: 1.0 },
      { frequency: 8000, gain: 3, q: 1.0 },
      { frequency: 16000, gain: 3, q: 1.0 }
    ]
  },
  classical: {
    name: 'Classical',
    bands: [
      { frequency: 31, gain: 4, q: 1.0 },
      { frequency: 62, gain: 3, q: 1.0 },
      { frequency: 125, gain: 2, q: 1.0 },
      { frequency: 250, gain: 2, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: -1, q: 1.0 },
      { frequency: 2000, gain: 0, q: 1.0 },
      { frequency: 4000, gain: 2, q: 1.0 },
      { frequency: 8000, gain: 3, q: 1.0 },
      { frequency: 16000, gain: 4, q: 1.0 }
    ]
  },
  vocal_boost: {
    name: 'Vocal Boost',
    bands: [
      { frequency: 31, gain: -2, q: 1.0 },
      { frequency: 62, gain: -1, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: 2, q: 1.0 },
      { frequency: 500, gain: 4, q: 1.0 },
      { frequency: 1000, gain: 5, q: 1.0 },
      { frequency: 2000, gain: 4, q: 1.0 },
      { frequency: 4000, gain: 2, q: 1.0 },
      { frequency: 8000, gain: 0, q: 1.0 },
      { frequency: 16000, gain: -1, q: 1.0 }
    ]
  },
  electronic: {
    name: 'Electronic',
    bands: [
      { frequency: 31, gain: 6, q: 1.0 },
      { frequency: 62, gain: 5, q: 1.0 },
      { frequency: 125, gain: 2, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: 2, q: 1.0 },
      { frequency: 2000, gain: 3, q: 1.0 },
      { frequency: 4000, gain: 4, q: 1.0 },
      { frequency: 8000, gain: 5, q: 1.0 },
      { frequency: 16000, gain: 6, q: 1.0 }
    ]
  },
  hip_hop: {
    name: 'Hip Hop',
    bands: [
      { frequency: 31, gain: 7, q: 1.0 },
      { frequency: 62, gain: 6, q: 1.0 },
      { frequency: 125, gain: 3, q: 1.0 },
      { frequency: 250, gain: 1, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: -1, q: 1.0 },
      { frequency: 2000, gain: 1, q: 1.0 },
      { frequency: 4000, gain: 2, q: 1.0 },
      { frequency: 8000, gain: 3, q: 1.0 },
      { frequency: 16000, gain: 4, q: 1.0 }
    ]
  },
  acoustic: {
    name: 'Acoustic',
    bands: [
      { frequency: 31, gain: 4, q: 1.0 },
      { frequency: 62, gain: 3, q: 1.0 },
      { frequency: 125, gain: 2, q: 1.0 },
      { frequency: 250, gain: 1, q: 1.0 },
      { frequency: 500, gain: 2, q: 1.0 },
      { frequency: 1000, gain: 3, q: 1.0 },
      { frequency: 2000, gain: 4, q: 1.0 },
      { frequency: 4000, gain: 3, q: 1.0 },
      { frequency: 8000, gain: 2, q: 1.0 },
      { frequency: 16000, gain: 2, q: 1.0 }
    ]
  },
  lounge: {
    name: 'Lounge',
    bands: [
      { frequency: 31, gain: 2, q: 1.0 },
      { frequency: 62, gain: 2, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: -1, q: 1.0 },
      { frequency: 500, gain: -2, q: 1.0 },
      { frequency: 1000, gain: -1, q: 1.0 },
      { frequency: 2000, gain: 0, q: 1.0 },
      { frequency: 4000, gain: 1, q: 1.0 },
      { frequency: 8000, gain: 2, q: 1.0 },
      { frequency: 16000, gain: 2, q: 1.0 }
    ]
  },
  dance: {
    name: 'Dance',
    bands: [
      { frequency: 31, gain: 7, q: 1.0 },
      { frequency: 62, gain: 5, q: 1.0 },
      { frequency: 125, gain: 3, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 2, q: 1.0 },
      { frequency: 2000, gain: 4, q: 1.0 },
      { frequency: 4000, gain: 5, q: 1.0 },
      { frequency: 8000, gain: 5, q: 1.0 },
      { frequency: 16000, gain: 4, q: 1.0 }
    ]
  },
  r_and_b: {
    name: 'R&B',
    bands: [
      { frequency: 31, gain: 6, q: 1.0 },
      { frequency: 62, gain: 5, q: 1.0 },
      { frequency: 125, gain: 2, q: 1.0 },
      { frequency: 250, gain: 1, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: 2, q: 1.0 },
      { frequency: 2000, gain: 3, q: 1.0 },
      { frequency: 4000, gain: 3, q: 1.0 },
      { frequency: 8000, gain: 3, q: 1.0 },
      { frequency: 16000, gain: 4, q: 1.0 }
    ]
  },
  metal: {
    name: 'Metal',
    bands: [
      { frequency: 31, gain: 6, q: 1.0 },
      { frequency: 62, gain: 4, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: -2, q: 1.0 },
      { frequency: 500, gain: -2, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: 3, q: 1.0 },
      { frequency: 4000, gain: 5, q: 1.0 },
      { frequency: 8000, gain: 6, q: 1.0 },
      { frequency: 16000, gain: 6, q: 1.0 }
    ]
  },
  country: {
    name: 'Country',
    bands: [
      { frequency: 31, gain: 3, q: 1.0 },
      { frequency: 62, gain: 2, q: 1.0 },
      { frequency: 125, gain: 1, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: 1, q: 1.0 },
      { frequency: 1000, gain: 3, q: 1.0 },
      { frequency: 2000, gain: 4, q: 1.0 },
      { frequency: 4000, gain: 4, q: 1.0 },
      { frequency: 8000, gain: 3, q: 1.0 },
      { frequency: 16000, gain: 2, q: 1.0 }
    ]
  },
  reggae: {
    name: 'Reggae',
    bands: [
      { frequency: 31, gain: 6, q: 1.0 },
      { frequency: 62, gain: 5, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: -2, q: 1.0 },
      { frequency: 500, gain: -1, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: 2, q: 1.0 },
      { frequency: 4000, gain: 5, q: 1.0 },
      { frequency: 8000, gain: 6, q: 1.0 },
      { frequency: 16000, gain: 6, q: 1.0 }
    ]
  },
  latin: {
    name: 'Latin',
    bands: [
      { frequency: 31, gain: 5, q: 1.0 },
      { frequency: 62, gain: 4, q: 1.0 },
      { frequency: 125, gain: 2, q: 1.0 },
      { frequency: 250, gain: 0, q: 1.0 },
      { frequency: 500, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 2000, gain: 2, q: 1.0 },
      { frequency: 4000, gain: 4, q: 1.0 },
      { frequency: 8000, gain: 5, q: 1.0 },
      { frequency: 16000, gain: 5, q: 1.0 }
    ]
  },
  piano: {
    name: 'Piano',
    bands: [
      { frequency: 31, gain: 2, q: 1.0 },
      { frequency: 62, gain: 1, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: 2, q: 1.0 },
      { frequency: 500, gain: 3, q: 1.0 },
      { frequency: 1000, gain: 2, q: 1.0 },
      { frequency: 2000, gain: 3, q: 1.0 },
      { frequency: 4000, gain: 4, q: 1.0 },
      { frequency: 8000, gain: 3, q: 1.0 },
      { frequency: 16000, gain: 3, q: 1.0 }
    ]
  },
  spoken_word: {
    name: 'Spoken Word',
    bands: [
      { frequency: 31, gain: -3, q: 1.0 },
      { frequency: 62, gain: -2, q: 1.0 },
      { frequency: 125, gain: 0, q: 1.0 },
      { frequency: 250, gain: 3, q: 1.0 },
      { frequency: 500, gain: 5, q: 1.0 },
      { frequency: 1000, gain: 6, q: 1.0 },
      { frequency: 2000, gain: 5, q: 1.0 },
      { frequency: 4000, gain: 3, q: 1.0 },
      { frequency: 8000, gain: 1, q: 1.0 },
      { frequency: 16000, gain: 0, q: 1.0 }
    ]
  }
}

export const APO_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

class APOEqualizer {
  private apoPath: string = ''
  private configPath: string = ''
  private available: boolean = false
  private enabled: boolean = false
  private currentGains: number[] = Array(10).fill(0)

  constructor() {
    this.detectAPO()
  }

  /**
   * Detect if Equalizer APO is installed
   */
  private async detectAPO(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.apoDetectInstallation) {
        const detection = await (window as any).electronAPI.apoDetectInstallation()
        this.available = detection.available
        this.apoPath = detection.apoPath || ''
        this.configPath = detection.configPath || ''

        if (this.available) {
          await this.loadCurrentConfig()
        }
      }
    } catch (error) {
      this.available = false
    }
  }

  /**
   * Install Equalizer APO
   */
  async installAPO(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.apoInstall) {
        const success = await (window as any).electronAPI.apoInstall()
        
        if (success) {
          await this.detectAPO() // Re-detect after installation
          return true
        }
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Load current APO configuration
   */
  private async loadCurrentConfig(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.apoReadConfig) {
        const config = await (window as any).electronAPI.apoReadConfig()
        
        if (config && config.bands) {
          this.currentGains = config.bands.map((band: APOBand) => band.gain)
          this.enabled = config.enabled || false
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Generate APO config file content
   */
  private generateAPOConfig(): string {
    let config = `# 2K Music System Equalizer Configuration\n`
    config += `# Generated automatically - do not edit manually\n\n`
    
    if (!this.enabled) {
      config += `# Equalizer disabled\n`
      return config
    }

    config += `# 10-Band Parametric Equalizer\n`
    
    APO_FREQUENCIES.forEach((freq, index) => {
      const gain = this.currentGains[index] || 0
      if (gain !== 0) {
        config += `Filter: ON PK Fc ${freq} Hz Gain ${gain.toFixed(1)} dB Q 1.0\n`
      }
    })

    return config
  }

  /**
   * Write configuration to APO
   */
  private async writeAPOConfig(): Promise<boolean> {
    try {
      const configContent = this.generateAPOConfig()
      
      if (typeof window !== 'undefined' && (window as any).electronAPI?.apoWriteConfig) {
        const success = await (window as any).electronAPI.apoWriteConfig(configContent)
        
        if (success) {
          return true
        }
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Set gain for a specific band
   */
  async setBandGain(bandIndex: number, gainDB: number): Promise<boolean> {
    if (!this.available || bandIndex < 0 || bandIndex >= 10) return false
    
    this.currentGains[bandIndex] = Math.max(-15, Math.min(15, gainDB))
    return await this.writeAPOConfig()
  }

  /**
   * Get current gain for a band
   */
  getBandGain(bandIndex: number): number {
    if (bandIndex < 0 || bandIndex >= 10) return 0
    return this.currentGains[bandIndex]
  }

  /**
   * Apply a preset
   */
  async applyPreset(presetName: string): Promise<boolean> {
    const preset = APO_PRESETS[presetName]
    if (!preset || !this.available) return false

    preset.bands.forEach((band, index) => {
      this.currentGains[index] = band.gain
    })

    return await this.writeAPOConfig()
  }

  /**
   * Set custom gains array
   */
  async setGains(gains: number[]): Promise<boolean> {
    if (!this.available || gains.length !== 10) return false
    
    this.currentGains = [...gains]
    return await this.writeAPOConfig()
  }

  /**
   * Enable/disable the equalizer
   */
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (!this.available) return false
    
    this.enabled = enabled
    return await this.writeAPOConfig()
  }

  /**
   * Get all current gains
   */
  getCurrentGains(): number[] {
    return [...this.currentGains]
  }

  /**
   * Check if APO is available
   */
  isAvailable(): boolean {
    return this.available
  }

  /**
   * Check if equalizer is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Get system info
   */
  getSystemInfo(): string {
    if (!this.available) {
      return '2K Music System Equalizer not installed - Click "Install System Equalizer" to enable system-wide audio processing.'
    }
    
    if (!this.enabled) {
      return '2K Music System Equalizer installed but disabled - Toggle "Enable" to activate system-wide audio processing.'
    }
    
    return '2K Music System Equalizer active - Processing ALL system audio in real-time.'
  }

  /**
   * Refresh APO detection and config
   */
  async refresh(): Promise<void> {
    await this.detectAPO()
  }
}

// Export singleton instance
export const apoEqualizer = new APOEqualizer()
