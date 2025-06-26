import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Globe, Code, Plus, Menu, Settings, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatHistory from '@/components/chat/ChatHistory'
import WebModeToggle from '@/components/chat/WebModeToggle'
import WebSearchResults from '@/components/chat/WebSearchResults'
import { AIModels, ModelSelector } from '@/components/chat/ModelSelector'
import { webSearchService, WebSearchResponse } from '@/lib/webSearch'

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

interface StreamingMessage {
  id: string
  role: 'assistant'
  content: string
  model: string
  timestamp: string
  isStreaming: boolean
  webSearchData?: WebSearchResponse
}

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState<AIModels>('gemini-pro')
  const [isWebMode, setIsWebMode] = useState(false)
  const [currentChatId, setCurrentChatId] = useState('current')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Web search query using React Query
  const { data: webSearchData, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['webSearch', currentSearchQuery],
    queryFn: () => currentSearchQuery ? webSearchService.search(currentSearchQuery) : null,
    enabled: !!currentSearchQuery && isWebMode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage, webSearchData])

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
      }
    }
  }, [])

  const simulateStreaming = (fullResponse: string, messageId: string, searchData?: WebSearchResponse) => {
    const words = fullResponse.split(' ')
    let currentIndex = 0
    
    // Initialize streaming message
    const initialStreamingMessage: StreamingMessage = {
      id: messageId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      timestamp: new Date().toISOString(),
      isStreaming: true,
      webSearchData: searchData
    }
    
    setStreamingMessage(initialStreamingMessage)
    setIsTyping(false)

    // Stream words one by one
    streamingIntervalRef.current = setInterval(() => {
      if (currentIndex < words.length) {
        const currentContent = words.slice(0, currentIndex + 1).join(' ')
        setStreamingMessage(prev => prev ? {
          ...prev,
          content: currentContent
        } : null)
        currentIndex++
      } else {
        // Streaming complete
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current)
          streamingIntervalRef.current = null
        }
        
        // Add final message to messages array
        setMessages(prev => [...prev, {
          id: messageId,
          role: 'assistant' as const,
          content: fullResponse,
          model: selectedModel,
          timestamp: new Date().toISOString(),
          webSearchData: searchData
        }])
        
        // Clear streaming message
        setStreamingMessage(null)
      }
    }, 100) // Adjust speed here (100ms per word)
  }

  const generateWebSearchResponse = (query: string, searchData: WebSearchResponse): string => {
    if (!searchData.results.length) {
      return `I searched the web for "${query}" but couldn't find relevant results. This might be due to network issues or the query being too specific. Let me try to help based on my existing knowledge instead.`
    }

    const topResults = searchData.results.slice(0, 3)
    const sources = topResults.map(r => new URL(r.url).hostname).join(', ')
    
    return `🌐 I found ${searchData.totalResults} results for "${query}" in ${searchData.searchTime}ms from ${searchData.sources.join(', ')}. 

Based on the search results from ${sources}, here's what I found:

${topResults.map((result, index) => 
  `${index + 1}. **${result.title}**: ${result.snippet.substring(0, 150)}...`
).join('\n\n')}

The search results provide comprehensive information about your query. You can click on any result above to explore the full content. Would you like me to search for more specific information or help you with something else?`
  }
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || streamingMessage) return
    
    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user' as const, 
      content: inputValue,
      model: selectedModel,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    const userInput = inputValue
    setInputValue('')
    setIsTyping(true)
    
    // If web mode is enabled, trigger search
    if (isWebMode) {
      setCurrentSearchQuery(userInput)
    }
    
    // Simulate initial delay before streaming starts
    setTimeout(async () => {
      let response: string
      let searchData: WebSearchResponse | undefined
      
      if (isWebMode && webSearchData) {
        searchData = webSearchData
        response = generateWebSearchResponse(userInput, webSearchData)
      } else if (isWebMode && isSearching) {
        response = `🔍 Searching the web for "${userInput}"... Please wait while I gather real-time information from multiple sources.`
      } else if (isWebMode && searchError) {
        response = `❌ I encountered an error while searching for "${userInput}". Let me help you based on my existing knowledge instead. The error might be due to network connectivity or API limitations.`
      } else {
        // Standard responses without web search
        const standardResponses = [
          `I understand you're asking about "${userInput}". Let me help you with that using ${selectedModel}. This response is based on my training data.`,
          `That's an interesting question about "${userInput}". Based on my knowledge, here's what I can tell you using ${selectedModel}.`,
          `Great question! I'll analyze "${userInput}" for you using ${selectedModel} based on my existing knowledge base.`
        ]
        response = standardResponses[Math.floor(Math.random() * standardResponses.length)]
      }
      
      const messageId = (Date.now() + 1).toString()
      simulateStreaming(response, messageId, searchData)
    }, 800) // Initial delay before streaming starts
  }

  // Effect to handle web search completion
  useEffect(() => {
    if (webSearchData && currentSearchQuery && streamingMessage) {
      // Update streaming message with search data
      const response = generateWebSearchResponse(currentSearchQuery, webSearchData)
      
      // Clear current streaming and start new one with search results
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
        streamingIntervalRef.current = null
      }
      
      const messageId = streamingMessage.id
      simulateStreaming(response, messageId, webSearchData)
      setCurrentSearchQuery(null) // Reset search query
    }
  }, [webSearchData, currentSearchQuery])

  const handleNewChat = () => {
    // Clear any ongoing streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current)
      streamingIntervalRef.current = null
    }
    setStreamingMessage(null)
    setIsTyping(false)
    setCurrentSearchQuery(null)
    
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
    // Clear any ongoing streaming when switching chats
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current)
      streamingIntervalRef.current = null
    }
    setStreamingMessage(null)
    setIsTyping(false)
    setCurrentSearchQuery(null)
    
    setCurrentChatId(chatId)
    // In a real app, this would load the chat history from the backend
    console.log('Loading chat:', chatId)
  }

  // Combine regular messages with streaming message for display
  const displayMessages = streamingMessage 
    ? [...messages, streamingMessage]
    : messages

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
          
          {isWebMode && (
            <Badge variant="secondary" className="hidden sm:flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Web Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <ModelSelector 
            value={selectedModel} 
            onValueChange={setSelectedModel} 
          />
          
          {/* Settings Sheet for Web Mode Toggle */}
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings & Web Mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure your AI assistant preferences
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Web Browsing</h3>
                    <WebModeToggle 
                      isWebMode={isWebMode}
                      onToggle={setIsWebMode}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Globe className="mr-2 h-4 w-4" />
                        Browse Current Page
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Code className="mr-2 h-4 w-4" />
                        Generate Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
            
            {/* Web Mode Toggle in Sidebar */}
            <div className="mb-4">
              <WebModeToggle 
                isWebMode={isWebMode}
                onToggle={setIsWebMode}
                className="w-full"
              />
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
                  {displayMessages.map((message) => (
                    <div key={message.id} className="space-y-4">
                      <ChatMessage 
                        message={message}
                        isStreaming={streamingMessage?.id === message.id}
                      />
                      
                      {/* Show web search results */}
                      {message.webSearchData && (
                        <div className="ml-12">
                          <WebSearchResults 
                            searchData={message.webSearchData}
                            isLoading={false}
                          />
                        </div>
                      )}
                      
                      {/* Show loading search results for streaming message */}
                      {streamingMessage?.id === message.id && isSearching && (
                        <div className="ml-12">
                          <WebSearchResults 
                            searchData={{ query: '', results: [], totalResults: 0, searchTime: 0, sources: [] }}
                            isLoading={true}
                          />
                        </div>
                      )}
                    </div>
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
                    placeholder={isWebMode ? "Ask anything... (Web search enabled)" : "Ask anything..."}
                    className="pr-12 py-6 text-base"
                    disabled={isTyping || !!streamingMessage}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping || !!streamingMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {isWebMode && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Web browsing active</span>
                    </div>
                    <span>•</span>
                    <span>Real-time search enabled</span>
                    {isSearching && (
                      <>
                        <span>•</span>
                        <span className="text-primary">Searching...</span>
                      </>
                    )}
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