"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 h-9 px-0 relative overflow-hidden group"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
          
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === "light" && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === "system" && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Enhanced theme toggle with more visual feedback
export function ThemeToggleEnhanced() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 px-0">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-10 h-10 px-0 relative overflow-hidden group bg-gradient-to-br from-background to-muted/20 hover:from-primary/5 hover:to-orange-100/50 dark:hover:to-orange-900/20 border border-border/50 hover:border-primary/30 transition-all duration-300"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
          
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md blur-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] backdrop-blur-sm bg-background/95 border border-border/50 shadow-xl">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Theme Preference
        </div>
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer group hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                <Sun className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">Light</div>
                <div className="text-xs text-muted-foreground">Bright and clean</div>
              </div>
            </div>
            {theme === "light" && (
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-900/20"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                <Moon className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <div className="font-medium">Dark</div>
                <div className="text-xs text-muted-foreground">Easy on the eyes</div>
              </div>
            </div>
            {theme === "dark" && (
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-800 dark:to-indigo-900 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <div className="font-medium">System</div>
                <div className="text-xs text-muted-foreground">Follows device</div>
              </div>
            </div>
            {theme === "system" && (
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
