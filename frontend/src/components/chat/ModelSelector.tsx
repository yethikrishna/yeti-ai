import { Check, ChevronsUpDown, Brain, Zap, Globe, Code, Sparkles, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { yetiModelConfigs } from "@/lib/yetiModelRouter"

export type YetiModels = 'yeti-default' | 'yeti-web' | 'yeti-code' | 'yeti-creative' | 'yeti-fast'

const modelIcons = {
  'yeti-default': <Brain className="h-4 w-4" />,
  'yeti-web': <Globe className="h-4 w-4" />,
  'yeti-code': <Code className="h-4 w-4" />,
  'yeti-creative': <Sparkles className="h-4 w-4" />,
  'yeti-fast': <Zap className="h-4 w-4" />
}

interface ModelSelectorProps {
  value: YetiModels
  onValueChange: (value: YetiModels) => void
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  
  const selectedModel = yetiModelConfigs[value]
  const models = Object.entries(yetiModelConfigs)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between"
        >
          <div className="flex items-center gap-2">
            {modelIcons[value]}
            <span className="truncate">{selectedModel?.displayName || "Select model..."}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search Yeti AI models..." />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup>
            {models.map(([modelId, config]) => (
              <CommandItem
                key={modelId}
                value={modelId}
                onSelect={(currentValue) => {
                  onValueChange(currentValue as YetiModels)
                  setOpen(false)
                }}
                className="flex flex-col items-start p-3 space-y-1"
              >
                <div className="flex items-center w-full">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === modelId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-grow">
                    {modelIcons[modelId as YetiModels]}
                    <span className="font-medium">{config.displayName}</span>
                  </div>
                  {modelId === 'yeti-default' && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="ml-6 text-xs text-muted-foreground">
                  {config.description}
                </div>
                <div className="ml-6 flex flex-wrap gap-1">
                  {config.strengths.slice(0, 3).map((strength) => (
                    <Badge key={strength} variant="outline" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Export the type for backward compatibility
export type AIModels = YetiModels