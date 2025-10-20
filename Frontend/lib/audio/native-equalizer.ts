/**
 * Native Equalizer using C++ module via Electron IPC
 * Works with local audio files through Web Audio API integration
 */

export interface EQPreset {
  name: string
  gains: number[]
}

export const EQ_PRESETS: Record<string, EQPreset> = {
  flat: { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  rock: { name: 'Rock', gains: [5, 3, -2, -3, -1, 1, 3, 4, 5, 5] },
  pop: { name: 'Pop', gains: [-1, 2, 4, 4, 2, 0, -1, -1, -1, -1] },
  jazz: { name: 'Jazz', gains: [4, 3, 1, 2, -1, -1, 0, 1, 3, 4] },
  classical: { name: 'Classical', gains: [5, 4, 3, 2, -1, -1, 0, 2, 3, 4] },
  electronic: { name: 'Electronic', gains: [5, 4, 2, 0, -2, 2, 1, 2, 4, 5] },
  hiphop: { name: 'Hip-Hop', gains: [5, 4, 1, 3, -1, -1, 1, -1, 2, 3] },
  acoustic: { name: 'Acoustic', gains: [4, 3, 2, 1, 2, 1, 2, 3, 4, 3] },
  bass_boost: { name: 'Bass Boost', gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  treble_boost: { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 0, 2, 4, 6, 8] },
  vocal_boost: { name: 'Vocal Boost', gains: [-2, -1, 0, 1, 4, 4, 3, 1, 0, -1] },
  dance: { name: 'Dance', gains: [4, 3, 2, 0, 0, -1, 2, 3, 4, 4] }
}

export const BAND_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

class NativeEqualizer {
  private native: any = null
  private initialized: boolean = false

  constructor() {
    // Only load in browser environment
    if (typeof window !== 'undefined') {
      this.loadNativeModule()
    }
  }

  private loadNativeModule() {
    try {
      // Try immediately first
      this.attemptLoad()
      
      // Also try after delays in case Electron needs time
      setTimeout(() => {
        this.attemptLoad()
      }, 1000)
      
      setTimeout(() => {
        this.attemptLoad()
      }, 3000)
    } catch (error) {
      // Silent fail
    }
  }

  private async attemptLoad() {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      // Check if we're in Electron environment with electronAPI
      if (typeof window !== 'undefined' && (window as any).electronAPI?.equalizerIsAvailable) {
        // Check if equalizer is available in main process
        const available = await (window as any).electronAPI.equalizerIsAvailable()
        if (available) {
          this.native = 'ipc' // Mark as using IPC
          return
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Initialize the equalizer
   */
  async initialize(sampleRate: number = 44100): Promise<boolean> {
    if (!this.native) {
      return false
    }

    try {
      
      let success = false
      if (this.native === 'ipc') {
        // Use IPC
        success = await (window as any).electronAPI.equalizerInitialize()
      }
      
      if (success) {
        this.initialized = true
        
        // Apply default flat preset
        await this.applyPreset('flat')
        
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  /**
   * Set gain for a specific band
   */
  async setBandGain(bandIndex: number, gainDB: number): Promise<boolean> {
    if (!this.native || !this.initialized) return false
    
    try {
      if (this.native === 'ipc') {
        return await (window as any).electronAPI.equalizerSetBandGain(bandIndex, gainDB)
      }
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Get current gain for a band
   */
  async getBandGain(bandIndex: number): Promise<number> {
    if (!this.native || !this.initialized) return 0
    
    try {
      if (this.native === 'ipc') {
        return await (window as any).electronAPI.equalizerGetBandGain(bandIndex)
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Apply a preset
   */
  async applyPreset(presetName: string): Promise<boolean> {
    if (!this.native || !this.initialized) return false
    
    try {
      if (this.native === 'ipc') {
        return await (window as any).electronAPI.equalizerApplyPreset(presetName)
      }
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Enable/disable the equalizer
   */
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (!this.native || !this.initialized) return false
    
    try {
      if (this.native === 'ipc') {
        return await (window as any).electronAPI.equalizerSetEnabled(enabled)
      }
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Get all current gains
   */
  async getCurrentGains(): Promise<number[]> {
    const gains: number[] = []
    for (let i = 0; i < 10; i++) {
      gains.push(await this.getBandGain(i))
    }
    return gains
  }

  /**
   * Check if native module is available
   */
  isAvailable(): boolean {
    return this.native !== null
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Export singleton instance
export const nativeEqualizer = new NativeEqualizer()
