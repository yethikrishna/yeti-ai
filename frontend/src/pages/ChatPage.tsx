import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Globe, Code, Plus, Menu, Settings, Zap, Brain, BarChart3, Wifi, WifiOff, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ChatMessage from '@/components/chat/ChatMessage'
import ChatHistory from '@/components/chat/ChatHistory'
import WebModeToggle from '@/components/chat/WebModeToggle'
import WebSearchResults from '@/components/chat/WebSearchResults'
import AgentFlowchart from '@/components/agent/AgentFlowchart'
import { YetiModels, ModelSelector } from '@/components/chat/ModelSelector'
import { yetiIdentity } from '@/lib/yetiIdentity'
import { backendService, BrowserAgentResponse } from '@/lib/backendService'

// Enhanced message interface
interface ChatMessageType {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  timestamp: string
  webSearchData?: {
    query: string;
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      source: string;
    }>;
    total_results: number;
    search_time: number;
    sources: string[];
    error?: string;
  } | null;
  browserAgentData?: BrowserAgentResponse | null; // New field for browser agent data
  isIdentityResponse?: boolean
  taskId?: string
  modelUsed?: any
  reasoning?: string
}

// Enhanced mock data with identity awareness
const initialMessages: ChatMessageType[] = [
  { 
    id: '1', 
    role: 'assistant', 
    content: `Hello! I'm ${yetiIdentity.name}, your autonomous AI assistant created by ${yetiIdentity.creator.name}. I'm equipped with adaptive intelligence that automatically selects the best approach for each task. I can help with research, coding, web browsing, creative writing, and much more. What can I do for you today?`,
    model: 'yeti-default',
    timestamp: new Date().toISOString(),
    isIdentityResponse: true
  }
]

interface StreamingMessage extends ChatMessageType {
  isStreaming: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState<YetiModels>('yeti-default')
  const [isWebMode, setIsWebMode] = useState(false)
  const [currentChatId, setCurrentChatId] = useState('current')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAgentFlow, setShowAgentFlow] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await backendService.healthCheck()
      setBackendStatus(isOnline ? 'online' : 'offline')
    }
    
    checkBackend()
    
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000)
    return () => clearInterval(interval)
  }, [])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollInView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
      }
    }
  }, [])

  const simulateStreaming = (fullResponse: string, messageId: string, messageData: Partial<ChatMessageType>) => {
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
      ...messageData
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
          role: 'assistant',
          content: fullResponse,
          model: selectedModel,
          timestamp: new Date().toISOString(),
          ...messageData
        }])
        
        // Clear streaming message
        setStreamingMessage(null)
      }
    }, 80) // Slightly faster streaming for better UX
  }
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || streamingMessage) return
    
    const userMessage: ChatMessageType = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: inputValue,
      model: selectedModel,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    const userInput = inputValue
    setInputValue('')
    setIsTyping(true)
    
    try {
      // Call backend service
      const backendResponse = await backendService.chat({
        message: userInput,
        session_id: currentChatId,
        model: selectedModel,
        web_mode: isWebMode,
        context: {}
      })
      
      const messageId = (Date.now() + 1).toString()
      
      // If web_mode is active and the backend indicates a web browse action,
      // trigger the full browser agent and include its data.
      let browserAgentData: BrowserAgentResponse | null = null;
      if (isWebMode && backendResponse.task_plan.includes('web_browse') && backendResponse.web_search_data?.query) {
        // Use the query from web_search_data to trigger the full browser agent
        // This simulates the agent deciding to browse a specific URL after an initial search
        // In a real scenario, the backend would return the URL to browse.
        const targetUrl = backendResponse.web_search_data.results[0]?.url || `https://duckduckgo.com/?q=${encodeURIComponent(backendResponse.web_search_data.query)}`;
        browserAgentData = await backendService.browse(targetUrl, currentChatId);
      }

      // Start streaming the response
      simulateStreaming(backendResponse.response, messageId, {
        webSearchData: backendResponse.web_search_data,
        browserAgentData: browserAgentData, // Pass browser agent data here
        isIdentityResponse: false,
        taskId: backendResponse.session_id,
        modelUsed: { displayName: `Yeti AI (${backendResponse.model_used})` },
        reasoning: backendResponse.reasoning
      })
      
    } catch (error) {
      console.error('Error processing message:', error)
      setIsTyping(false)
      
      // Add error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error while processing your request. Please try again.",
        model: selectedModel,
        timestamp: new Date().toISOString()
      }])
    }
  }

  const handleNewChat = () => {
    // Clear any ongoing streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current)
      streamingIntervalRef.current = null
    }
    setStreamingMessage(null)
    setIsTyping(false)
    
    const newChatId = Date.now().toString()
    setCurrentChatId(newChatId)
    
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hello! I'm ${yetiIdentity.name}, ready to help you with a new conversation. I'm an autonomous AI assistant with adaptive intelligence that automatically optimizes for each task. What would you like to discuss?`,
      model: selectedModel,
      timestamp: new Date().toISOString(),
      isIdentityResponse: true
    }])
  }

  const handleSelectChat = (chatId: string) => {
    // Clear any ongoing streaming when switching chats
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current)
      streamingIntervalRef.current = null
    }
    setStreamingMessage(null)
    setIsTyping(false)
    
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
          <h1 className="text-xl font-bold text-foreground">{yetiIdentity.name}</h1>
          
          <div className="flex items-center space-x-1">
            {/* Backend Status Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={backendStatus === 'online' ? 'default' : 'secondary'} 
                    className="hidden sm:flex items-center text-xs"
                  >
                    {backendStatus === 'online' ? (
                      <Wifi className="h-3 w-3 mr-1" />
                    ) : (
                      <WifiOff className="h-3 w-3 mr-1" />
                    )}
                    {backendStatus === 'checking' ? 'Checking...' : backendStatus}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Backend Service: {backendStatus}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isWebMode && (
              <Badge variant="secondary" className="hidden sm:flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                Web Mode
              </Badge>
            )}
            <Badge variant="outline" className="hidden md:flex items-center text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Autonomous
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ModelSelector 
            value={selectedModel} 
            onValueChange={setSelectedModel} 
          />
          
          {/* Agent Flow Visualization */}
          <Sheet open={showAgentFlow} onOpenChange={setShowAgentFlow}>
            <SheetTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <BarChart3 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Agent Flow Visualization</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <AgentFlowchart />
            </SheetContent>
          </Sheet>
          
          {/* Settings Sheet */}
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
                    <p>Settings & Agent Configuration</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Agent Configuration</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure your autonomous AI assistant
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Autonomous Capabilities</h3>
                    <WebModeToggle 
                      isWebMode={isWebMode}
                      onToggle={setIsWebMode}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Backend Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className={backendStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                          {backendStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span>{selectedModel}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Agent Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creator:</span>
                        <span>{yetiIdentity.creator.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{yetiIdentity.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capabilities:</span>
                        <span>{yetiIdentity.capabilities.length}</span>
                      </div>
                    </div>
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
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        size="sm"
                        onClick={() => setShowAgentFlow(true)}
                      >
                        <Brain className="mr-2 h-4 w-4" />
                        Agent Flow
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      {/* Backend Status Alert */}
      {backendStatus === 'offline' && (
        <Alert className="mx-4 mt-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Backend service is offline. Running in demo mode with simulated responses.
          </AlertDescription>
        </Alert>
      )}
      
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
              <TabsTrigger value="agent" className="flex items-center">
                <Brain className="mr-2 h-4 w-4" />
                Agent Flow
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
                      
                      {/* Show model reasoning for assistant messages */}
                      {message.role === 'assistant' && message.reasoning && (
                        <div className="ml-12">
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Brain className="h-3 w-3" />
                              <span className="font-medium">Model Selection:</span>
                            </div>
                            <p>{message.reasoning}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Show web search results (DuckDuckGo) */}
                      {message.webSearchData && (
                        <div className="ml-12">
                          <WebSearchResults 
                            searchData={message.webSearchData}
                            isLoading={false}
                          />
                        </div>
                      )}

                      {/* Show Browser Agent Data (Screenshot + Text) */}
                      {message.browserAgentData && (
                        <div className="ml-12 border rounded-lg shadow-sm overflow-hidden">
                          <div className="p-3 bg-muted/50 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Autonomous Browser Agent</span>
                            </div>
                            <a 
                              href={message.browserAgentData.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-primary hover:underline"
                            >
                              {message.browserAgentData.url.split('/')[2]}
                            </a>
                          </div>
                          <div className="p-3">
                            {message.browserAgentData.screenshot_base64 && (
                              <div className="mb-3">
                                <img 
                                  src={`data:image/png;base64,${message.browserAgentData.screenshot_base64}`} 
                                  alt="Website Screenshot" 
                                  className="w-full h-auto rounded-md border" 
                                />
                                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Screenshot of the page
                                </p>
                              </div>
                            )}
                            {message.browserAgentData.text_content && (
                              <div>
                                <p className="text-sm text-muted-foreground line-clamp-5">
                                  <FileText className="h-4 w-4 inline-block mr-1 align-text-bottom" />
                                  {message.browserAgentData.text_content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  (Extracted text content)
                                </p>
                              </div>
                            )}
                            {message.browserAgentData.error && (
                              <p className="text-sm text-destructive">
                                Error: {message.browserAgentData.error}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-4 animate-fade-in">
                      <div className="h-8 w-8 rounded-full bg-secondary border flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="bg-card rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-muted-foreground">Yeti AI processing...</span>
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
                    placeholder={`Ask ${yetiIdentity.name} anything...`}
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
                
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${backendStatus === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span>Powered by {yetiIdentity.name} {selectedModel}</span>
                  </div>
                  {isWebMode && (
                    <>
                      <span>•</span>
                      <span>Autonomous web browsing active</span>
                    </>
                  )}
                </div>
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
            
            <TabsContent value="agent" className="data-[state=active]:h-full p-4">
              <AgentFlowchart />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}