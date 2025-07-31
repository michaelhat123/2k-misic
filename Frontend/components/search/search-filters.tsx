"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Music, User, Album, List } from "lucide-react"

interface SearchFiltersProps {
  selectedType: string
  onTypeChange: (type: string) => void
}

const filterTypes = [
  { value: "all", label: "All", icon: null },
  { value: "tracks", label: "Songs", icon: Music },
  { value: "users", label: "Artists", icon: User },
  { value: "albums", label: "Albums", icon: Album },
  { value: "playlists", label: "Playlists", icon: List },
]

export function SearchFilters({ selectedType, onTypeChange }: SearchFiltersProps) {
  return (
    <motion.div
      className="flex space-x-2 overflow-x-auto pb-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {filterTypes.map((type) => (
        <Button
          key={type.value}
          variant={selectedType === type.value ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(type.value)}
          className="flex items-center space-x-2 whitespace-nowrap rounded-full"
        >
          {type.icon && <type.icon className="h-4 w-4" />}
          <span>{type.label}</span>
        </Button>
      ))}
    </motion.div>
  )
}
