/**
 * System Equalizer using C++ module via Electron IPC
 * Processes ALL system audio (not just app audio)
 */

export interface SystemEQPreset {
  name: string
  gains: number[]
}

export const SYSTEM_EQ_PRESETS: Record<string, SystemEQPreset> = {
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

export const SYSTEM_BAND_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

class SystemEqualizer {
  private available: boolean = false
  private initialized: boolean = false
  private capturing: boolean = false

  constructor() {
    // Only check availability in browser environment
    if (typeof window !== 'undefined') {
      this.checkAvailability()
    }
  }

  private async checkAvailability() {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.systemEqualizerIsAvailable) {
        this.available = await (window as any).electronAPI.systemEqualizerIsAvailable()
      }
    } catch (error) {
      this.available = false
    }
  }

  /**
   * Initialize the system equalizer
   */
  async initialize(): Promise<boolean> {
    if (!this.available) {
      return false
    }

    try {
      const success = await (window as any).electronAPI.systemEqualizerInitialize()
      
      if (success) {
        this.initialized = true
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  /**
   * Start system-wide audio capture
   */
  async startCapture(): Promise<boolean> {
    if (!this.available || !this.initialized) {
      return false
    }

    try {
      const success = await (window as any).electronAPI.systemEqualizerStartCapture()
      if (success) {
        this.capturing = true
      }
      return success
    } catch (error) {
      return false
    }
  }

  /**
   * Stop system-wide audio capture
   */
  async stopCapture(): Promise<boolean> {
    if (!this.available) return false

    try {
      const success = await (window as any).electronAPI.systemEqualizerStopCapture()
      if (success) {
        this.capturing = false
      }
      return success
    } catch (error) {
      return false
    }
  }

  /**
   * Set gain for a specific band
   */
  async setBandGain(bandIndex: number, gainDB: number): Promise<boolean> {
    if (!this.available || !this.initialized) return false
    
    try {
      return await (window as any).electronAPI.systemEqualizerSetBandGain(bandIndex, gainDB)
    } catch (error) {
      return false
    }
  }

  /**
   * Get current gain for a band
   */
  async getBandGain(bandIndex: number): Promise<number> {
    if (!this.available || !this.initialized) return 0
    
    try {
      return await (window as any).electronAPI.systemEqualizerGetBandGain(bandIndex)
    } catch (error) {
      return 0
    }
  }

  /**
   * Apply a preset
   */
  async applyPreset(presetName: string): Promise<boolean> {
    if (!this.available || !this.initialized) return false
    
    try {
      return await (window as any).electronAPI.systemEqualizerApplyPreset(presetName)
    } catch (error) {
      return false
    }
  }

  /**
   * Enable/disable the system equalizer
   */
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (!this.available || !this.initialized) return false
    
    try {
      return await (window as any).electronAPI.systemEqualizerSetEnabled(enabled)
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
   * Check if system equalizer is available
   */
  isAvailable(): boolean {
    return this.available
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Check if capturing system audio
   */
  isCapturing(): boolean {
    return this.capturing
  }

  /**
   * Get system info string
   */
  getSystemInfo(): string {
    if (!this.isAvailable()) return 'System equalizer not available - Build the native module with system audio support to enable.'
    if (!this.isInitialized()) return 'System equalizer not initialized - Click "Initialize" to set up system audio processing.'
    if (!this.isCapturing()) return 'System capture not active - Click "Start Capture" to process all system audio.'
    return 'System equalizer active - Processing all system audio in real-time.'
  }
}

// Export singleton instance
export const systemEqualizer = new SystemEqualizer()
