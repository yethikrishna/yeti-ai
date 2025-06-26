import { useState } from 'react'
import { MessageSquare, Trash2, MoreHorizontal, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string
  preview: string
  timestamp: string
  messageCount: number
}

const mockChatHistory: ChatSession[] = [
  {
    id: '1',
    title: 'Web Research Project',
    preview: 'Finding the best hotels in Kochi for vacation...',
    timestamp: '2 hours ago',
    messageCount: 12
  },
  {
    id: '2', 
    title: 'React Component Help',
    preview: 'Help with creating a responsive navbar component...',
    timestamp: '1 day ago',
    messageCount: 8
  },
  {
    id: '3',
    title: 'Python Data Analysis',
    preview: 'Analyzing sales data with pandas and matplotlib...',
    timestamp: '2 days ago',
    messageCount: 15
  },
  {
    id: '4',
    title: 'Travel Planning',
    preview: 'Planning a trip to Japan, need recommendations...',
    timestamp: '3 days ago',
    messageCount: 6
  },
  {
    id: '5',
    title: 'Code Review',
    preview: 'Review my JavaScript function for optimization...',
    timestamp: '1 week ago',
    messageCount: 4
  },
  {
    id: '6',
    title: 'Learning TypeScript',
    preview: 'Explain TypeScript generics with examples...',
    timestamp: '1 week ago',
    messageCount: 10
  }
]

interface ChatHistoryProps {
  onSelectChat?: (chatId: string) => void
  currentChatId?: string
}

export default function ChatHistory({ onSelectChat, currentChatId }: ChatHistoryProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null)

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, this would call an API to delete the chat
    console.log('Delete chat:', chatId)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Chat History</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-grow">
        <div className="space-y-2">
          {mockChatHistory.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative p-3 rounded-lg border cursor-pointer transition-all duration-200",
                "hover:bg-secondary hover:shadow-sm",
                currentChatId === chat.id ? "bg-primary/10 border-primary/20" : "hover:border-border"
              )}
              onClick={() => onSelectChat?.(chat.id)}
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => setHoveredChat(null)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {chat.preview}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{chat.timestamp}</span>
                    </div>
                    <span>{chat.messageCount} messages</span>
                  </div>
                </div>
                
                {hoveredChat === chat.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}