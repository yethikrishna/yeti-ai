import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Globe, Code, Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatHistory from '@/components/chat/ChatHistory'
import { AIModels, ModelSelector } from '@/components/chat/ModelSelector'

// Enhanced mock data with more realistic conversation
const initialMessages = [
  { 
    id: '1', 
    role: 'assistant' as const, 
    content: 'Hello! I\'m Yeti AI, your autonomous AI assistant. I can help with research, coding, web browsing and more. What can I do for you today?',
    model: 'gemini-pro',
    timestamp: new Date().toISOString()
  }
]

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState<AIModels>('gemini-pro')
  const [isWebMode, setIsWebMode] = useState(false)
  const [currentChatId, setCurrentChatId] = useState('current')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user' as const, 
      content: inputValue,
      model: selectedModel,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    
    // Simulate AI response with more realistic delay
    setTimeout(() => {
      const responses = [
        `I understand you're asking about "${inputValue}". Let me help you with that using ${selectedModel}${isWebMode ? ' with web browsing capabilities' : ''}.`,
        `That's an interesting question about "${inputValue}". Based on my knowledge${isWebMode ? ' and current web data' : ''}, here's what I can tell you...`,
        `Great question! I'll analyze "${inputValue}" for you using ${selectedModel}${isWebMode ? ' and search for the latest information online' : ''}.`
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: randomResponse,
        model: selectedModel,
        timestamp: new Date().toISOString()
      }])
      setIsTyping(false)
    }, 1500)
  }

  const handleNewChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: 'Hello! I\'m ready to help you with a new conversation. What would you like to discuss?',
      model: selectedModel,
      timestamp: new Date().toISOString()
    }])
    setCurrentChatId(Date.now().toString())
  }

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    // In a real app, this would load the chat history from the backend
    console.log('Loading chat:', chatId)
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-2">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-4 h-full">
                <ChatHistory 
                  onSelectChat={handleSelectChat}
                  currentChatId={currentChatId}
                />
              </div>
            </SheetContent>
          </Sheet>
          
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
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 border-r bg-muted/30">
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Button 
                onClick={handleNewChat}
                className="flex-grow justify-start"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>
            
            <div className="flex-grow">
              <ChatHistory 
                onSelectChat={handleSelectChat}
                currentChatId={currentChatId}
              />
            </div>
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
                <div className="space-y-6 py-4 max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-4 animate-fade-in">
                      <div className="h-8 w-8 rounded-full bg-secondary border flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="bg-card rounded-lg p-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="max-w-4xl mx-auto w-full">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask anything..."
                    className="pr-12 py-6 text-base"
                    disabled={isTyping}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {isWebMode && (
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    🌐 Web browsing is enabled. Yeti AI will search the web for up-to-date information.
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="data-[state=active]:h-full">
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Code Editor</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    The VS Code-like editor will be implemented in the next phase with syntax highlighting and AI assistance.
                  </p>
                  <Button variant="outline">
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