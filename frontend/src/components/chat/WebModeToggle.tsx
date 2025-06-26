import { useState } from 'react'
import { Globe, Search, Zap, Info } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WebModeToggleProps {
  isWebMode: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export default function WebModeToggle({ isWebMode, onToggle, className }: WebModeToggleProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
              isWebMode 
                ? "bg-primary/10 border-primary/20 shadow-sm" 
                : "bg-background border-border hover:bg-secondary/50",
              className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onToggle(!isWebMode)}
          >
            <div className="flex items-center space-x-2">
              <div className={cn(
                "p-2 rounded-full transition-all duration-200",
                isWebMode 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {isWebMode ? (
                  <Search className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isHovered && "scale-110"
                  )} />
                ) : (
                  <Globe className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isHovered && "scale-110"
                  )} />
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <Label 
                    htmlFor="web-mode-switch" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Web Search Mode
                  </Label>
                  {isWebMode && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      <Zap className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isWebMode 
                    ? "Real-time web browsing enabled" 
                    : "Enable live web search & browsing"
                  }
                </p>
              </div>
            </div>
            
            <Switch
              id="web-mode-switch"
              checked={isWebMode}
              onCheckedChange={onToggle}
              className="ml-auto"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">
              {isWebMode ? "Web Search Mode Active" : "Enable Web Search Mode"}
            </p>
            <p className="text-xs">
              {isWebMode 
                ? "Yeti AI will browse the web in real-time, take screenshots, and interact with websites to provide up-to-date information."
                : "Toggle to enable real-time web browsing, live search results, and autonomous web interactions."
              }
            </p>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Powered by autonomous browsing</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}