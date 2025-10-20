// BeatMatch Challenge - Professional Color System
// Inspired by gaming UI design (Hearthstone, FIFA, Clash Royale)

export const BeatMatchColors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff', 
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81'
  },

  // Card Rarity Colors (Gaming Industry Standard)
  rarity: {
    common: {
      name: 'Common',
      primary: '#9CA3AF', // Cool Gray
      secondary: '#6B7280',
      gradient: 'from-slate-400 via-gray-400 to-slate-500',
      bgGradient: 'from-slate-400/10 via-gray-400/5 to-slate-500/10',
      border: 'border-slate-400/40',
      glow: 'shadow-slate-400/30',
      text: 'text-slate-400',
      accent: '#F3F4F6'
    },
    rare: {
      name: 'Rare',
      primary: '#3B82F6', // Vibrant Blue
      secondary: '#1D4ED8',
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      bgGradient: 'from-blue-400/15 via-blue-500/10 to-blue-600/15',
      border: 'border-blue-500/50',
      glow: 'shadow-blue-500/40',
      text: 'text-blue-400',
      accent: '#DBEAFE'
    },
    epic: {
      name: 'Epic',
      primary: '#A855F7', // Rich Purple
      secondary: '#7C3AED',
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      bgGradient: 'from-purple-400/15 via-violet-500/10 to-purple-600/15',
      border: 'border-purple-500/50',
      glow: 'shadow-purple-500/40',
      text: 'text-purple-400',
      accent: '#F3E8FF'
    },
    legendary: {
      name: 'Legendary',
      primary: '#F59E0B', // Golden Orange
      secondary: '#D97706',
      gradient: 'from-amber-400 via-orange-500 to-yellow-500',
      bgGradient: 'from-amber-400/20 via-orange-500/15 to-yellow-500/20',
      border: 'border-orange-500/60',
      glow: 'shadow-orange-500/50',
      text: 'text-amber-400',
      accent: '#FEF3C7'
    }
  },

  // Division Colors (Competitive Gaming)
  division: {
    bronze: {
      name: 'Bronze',
      gradient: 'from-amber-600 via-orange-700 to-amber-800',
      bg: 'bg-gradient-to-br from-amber-600/10 to-orange-700/10',
      border: 'border-amber-600/40',
      text: 'text-amber-600',
      icon: '#D97706'
    },
    silver: {
      name: 'Silver', 
      gradient: 'from-slate-400 via-gray-500 to-slate-600',
      bg: 'bg-gradient-to-br from-slate-400/10 to-gray-500/10',
      border: 'border-slate-500/40',
      text: 'text-slate-400',
      icon: '#64748B'
    },
    gold: {
      name: 'Gold',
      gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
      bg: 'bg-gradient-to-br from-yellow-400/10 to-amber-500/10',
      border: 'border-yellow-500/40',
      text: 'text-yellow-500',
      icon: '#EAB308'
    },
    legendary: {
      name: 'Legendary',
      gradient: 'from-purple-500 via-pink-500 to-red-500',
      bg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/40',
      text: 'text-purple-400',
      icon: '#A855F7'
    }
  },

  // UI State Colors
  state: {
    success: {
      primary: '#10B981', // Emerald
      gradient: 'from-emerald-400 to-green-600',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-500'
    },
    warning: {
      primary: '#F59E0B', // Amber
      gradient: 'from-yellow-400 to-orange-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-500'
    },
    error: {
      primary: '#EF4444', // Red
      gradient: 'from-red-400 to-red-600',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500'
    },
    info: {
      primary: '#3B82F6', // Blue
      gradient: 'from-blue-400 to-indigo-600',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-500'
    }
  },

  // Gaming UI Colors
  gaming: {
    energy: {
      gradient: 'from-red-400 via-orange-500 to-yellow-500',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/30'
    },
    mana: {
      gradient: 'from-blue-400 via-cyan-500 to-blue-600',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/30'
    },
    health: {
      gradient: 'from-green-400 via-emerald-500 to-green-600',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/30'
    },
    xp: {
      gradient: 'from-purple-400 via-violet-500 to-purple-600',
      text: 'text-violet-400',
      glow: 'shadow-violet-500/30'
    }
  },

  // BeatCoins Currency
  currency: {
    beatcoins: {
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      bg: 'bg-gradient-to-r from-yellow-400/10 to-orange-500/10',
      border: 'border-yellow-500/40',
      text: 'text-yellow-500',
      glow: 'shadow-yellow-500/40'
    }
  },

  // Background Gradients
  backgrounds: {
    main: 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900',
    card: 'bg-gradient-to-br from-slate-800/50 to-slate-900/50',
    modal: 'bg-gradient-to-br from-slate-800 to-slate-900',
    header: 'bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-purple-600/10'
  }
} as const

// Helper Functions
export const getRarityConfig = (rarity: keyof typeof BeatMatchColors.rarity) => {
  return BeatMatchColors.rarity[rarity]
}

export const getDivisionConfig = (division: keyof typeof BeatMatchColors.division) => {
  return BeatMatchColors.division[division]
}

export const getStateConfig = (state: keyof typeof BeatMatchColors.state) => {
  return BeatMatchColors.state[state]
}

// Animation Presets
export const BeatMatchAnimations = {
  card: {
    hover: 'hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-out',
    press: 'active:scale-95 transition-transform duration-100',
    glow: 'hover:shadow-2xl transition-shadow duration-300'
  },
  button: {
    primary: 'hover:scale-105 active:scale-95 transition-all duration-200 ease-out',
    secondary: 'hover:scale-102 active:scale-98 transition-all duration-150',
    bounce: 'animate-bounce'
  },
  fade: {
    in: 'animate-in fade-in duration-300',
    out: 'animate-out fade-out duration-200',
    slide: 'animate-in slide-in-from-bottom-4 duration-400'
  }
}

export default BeatMatchColors
