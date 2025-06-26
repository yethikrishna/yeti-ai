import { useState } from 'react'
import { Send, Sparkles, Globe, Code, List, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ChatMessage from '@/components/chat/ChatMessage'
import { AIModels, ModelSelector } from '@/components/chat/ModelSelector'

// Mock data for initial UI
const initialMessages = [
  { 
    id: '1', 
    role: 'assistant', 
    content: 'Hello! I\'m Yeti AI, your autonomous AI assistant. I can help with research, coding, web browsing and more. What can I do for you today?',
    model: 'gemini-pro'
  }
]

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState<AIModels>('gemini-pro')
  const [isWebMode, setIsWebMode] = useState(false)
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    // Add user message
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'user', 
      content: inputValue,
      model: selectedModel
    }])
    
    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a simulated response to "${inputValue}" using ${selectedModel}${isWebMode ? ' with web browsing enabled' : ''}.`,
        model: selectedModel
      }])
    }, 1000)
    
    setInputValue('')
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Yeti AI</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <ModelSelector 
            value={selectedModel} 
            onValueChange={setSelectedModel} 
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isWebMode ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsWebMode(!isWebMode)}
                  className="transition-all"
                >
                  <Globe className={`h-5 w-5 ${isWebMode ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Web Browsing {isWebMode ? 'Enabled' : 'Disabled'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
      
      {/* Main Chat Area */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar (collapsed by default on mobile) */}
        <div className="hidden md:block w-64 border-r p-4">
          <div className="flex flex-col h-full">
            <h2 className="font-medium mb-4">Recent Chats</h2>
            <div className="flex-grow">
              <div className="p-3 rounded-lg border mb-2 hover:bg-secondary cursor-pointer transition-colors">
                <p className="font-medium truncate">Web research</p>
                <p className="text-sm text-muted-foreground truncate">Finding the best hotels in Kochi...</p>
              </div>
              <div className="p-3 rounded-lg border mb-2 hover:bg-secondary cursor-pointer transition-colors">
                <p className="font-medium truncate">Coding assistance</p>
                <p className="text-sm text-muted-foreground truncate">Help with React component...</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start">
              <Sparkles className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-grow flex flex-col">
          <Tabs defaultValue="chat" className="flex-grow flex flex-col">
            <TabsList className="mx-4 mt-4 justify-start">
              <TabsTrigger value="chat" className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center">
                <Code className="mr-2 h-4 w-4" />
                Code Editor
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-grow flex flex-col p-4 pt-0 space-y-4 data-[state=active]:h-full">
              <ScrollArea className="flex-grow pr-4">
                <div className="space-y-6 py-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </div>
              </ScrollArea>
              
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything..."
                  className="pr-12 py-6 text-base"
                />
                <Button 
                  size="icon" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {isWebMode && (
                <div className="text-xs text-muted-foreground">
                  Web browsing is enabled. Yeti AI will search the web for up-to-date information.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="code" className="data-[state=active]:h-full">
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <Code className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Code Editor</h3>
                  <p className="text-muted-foreground mb-4">
                    The VS Code-like editor will be implemented in the next phase.
                  </p>
                  <Button variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Coming Soon
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}