import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Sparkles, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    model?: string
    timestamp?: string
  }
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false)
  const isUser = message.role === 'user'
  
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }
  
  return (
    <div 
      className={cn(
        "flex items-start gap-4 animate-fade-in group",
        isUser ? "flex-row-reverse" : ""
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className={cn(
        "h-8 w-8 border flex-shrink-0",
        isUser ? "bg-primary" : "bg-secondary"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className={cn(
            "h-4 w-4 text-primary",
            isStreaming && "animate-pulse"
          )} />
        )}
      </Avatar>
      
      <div className={cn(
        "rounded-lg p-4 max-w-[80%] animate-slide-up relative",
        isUser ? "bg-primary text-primary-foreground" : "bg-card border"
      )}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
            )}
          </p>
        </div>
        
        <div className={cn(
          "flex items-center justify-between mt-3 pt-2 border-t text-xs",
          isUser ? "border-primary-foreground/20 text-primary-foreground/70" : "border-border text-muted-foreground"
        )}>
          <div className="flex items-center gap-2">
            {!isUser && message.model && (
              <span className="font-medium">{message.model}</span>
            )}
            {message.timestamp && !isStreaming && (
              <span>{formatTime(message.timestamp)}</span>
            )}
            {isStreaming && (
              <span className="text-primary animate-pulse">Generating...</span>
            )}
          </div>
          
          {!isUser && showActions && !isStreaming && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}