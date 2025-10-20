/**
 * Extract dominant color from an image URL
 * Returns RGB color array [r, g, b]
 * Uses median cut algorithm for accurate dominant color
 */
export async function extractDominantColor(imageUrl: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Use medium canvas for good sampling
        canvas.width = 150
        canvas.height = 150
        
        ctx.drawImage(img, 0, 0, 150, 150)
        const imageData = ctx.getImageData(0, 0, 150, 150)
        const data = imageData.data
        
        // Collect all colors with their frequency
        const pixels: Array<[number, number, number]> = []
        
        // Sample every pixel but skip transparent/invalid ones
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          
          // Skip transparent, very dark, and very light pixels
          if (a < 125) continue
          if (r < 15 && g < 15 && b < 15) continue // Too dark
          if (r > 245 && g > 245 && b > 245) continue // Too light
          
          pixels.push([r, g, b])
        }
        
        if (pixels.length === 0) {
          resolve([80, 80, 100])
          return
        }
        
        // Simple frequency-based approach with saturation weighting
        const colorCount = new Map<string, { count: number, rgb: [number, number, number], sat: number }>()
        
        pixels.forEach(([r, g, b]) => {
          // Quantize to reduce similar colors
          const qr = Math.round(r / 5) * 5
          const qg = Math.round(g / 5) * 5
          const qb = Math.round(b / 5) * 5
          
          const key = `${qr},${qg},${qb}`
          
          // Calculate saturation
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const saturation = max === 0 ? 0 : (max - min) / max
          
          if (!colorCount.has(key)) {
            colorCount.set(key, { count: 0, rgb: [qr, qg, qb], sat: saturation })
          }
          const entry = colorCount.get(key)!
          entry.count++
          entry.sat = Math.max(entry.sat, saturation)
        })
        
        // Find dominant color by frequency and saturation
        let bestScore = 0
        let dominantColor: [number, number, number] = [80, 80, 100]
        
        colorCount.forEach((entry) => {
          // Only consider colors with minimum saturation
          if (entry.sat < 0.15) return // Skip gray colors
          
          // Score = frequency × (1 + saturation) to slightly favor vibrant
          const score = entry.count * (1 + entry.sat)
          if (score > bestScore) {
            bestScore = score
            dominantColor = entry.rgb
          }
        })
        
        resolve(dominantColor)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = imageUrl
  })
}

/**
 * Convert RGB array to CSS color string with opacity
 */
export function rgbToCss(rgb: number[], opacity: number = 1): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`
}

/**
 * Darken a color by reducing brightness while preserving saturation
 */
export function darkenColor(rgb: number[], factor: number = 0.7): number[] {
  // Apply factor but ensure minimum color values to preserve vibrancy
  const minValue = 30
  return [
    Math.max(minValue, Math.floor(rgb[0] * factor)),
    Math.max(minValue, Math.floor(rgb[1] * factor)),
    Math.max(minValue, Math.floor(rgb[2] * factor))
  ]
}
