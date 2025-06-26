import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Sparkles, User } from 'lucide-react'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    model?: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={cn(
      "flex items-start gap-4 animate-fade-in",
      isUser ? "flex-row-reverse" : ""
    )}>
      <Avatar className={cn(
        "h-8 w-8 border",
        isUser ? "bg-primary" : "bg-secondary"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
      </Avatar>
      
      <div className={cn(
        "rounded-lg p-4 max-w-[80%] animate-slide-up",
        isUser ? "bg-primary text-primary-foreground" : "bg-card"
      )}>
        <div className="prose prose-sm dark:prose-invert">
          {message.content}
        </div>
        
        {!isUser && message.model && (
          <div className="mt-2 text-xs text-muted-foreground">
            {message.model}
          </div>
        )}
      </div>
    </div>
  )
}