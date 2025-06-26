import { webSearchService } from './webSearch'
import { getIdentityResponse, yetiIdentity } from './yetiIdentity'

export interface Task {
  id: string
  type: 'chat' | 'web_search' | 'code_generation' | 'file_analysis' | 'mcp_action'
  input: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  steps: TaskStep[]
  result?: any
  metadata?: Record<string, any>
}

export interface TaskStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  result?: any
  error?: string
}

export interface AgentMemory {
  userId: string
  sessionId: string
  conversations: Array<{
    id: string
    timestamp: string
    messages: any[]
  }>
  userProfile?: {
    name?: string
    preferences?: Record<string, any>
    context?: string[]
  }
  longTermMemory: Array<{
    id: string
    content: string
    timestamp: string
    importance: number
    tags: string[]
  }>
}

class TaskOrchestrator {
  private tasks: Map<string, Task> = new Map()
  private memory: AgentMemory
  
  constructor(userId: string, sessionId: string) {
    this.memory = {
      userId,
      sessionId,
      conversations: [],
      longTermMemory: []
    }
  }

  async processUserInput(input: string, context: any = {}): Promise<{
    response: string
    task?: Task
    isIdentityResponse: boolean
    webSearchData?: any
  }> {
    // First check for identity-aware responses
    const identityResponse = getIdentityResponse(input)
    if (identityResponse) {
      this.addToMemory(input, identityResponse, 'identity')
      return {
        response: identityResponse,
        isIdentityResponse: true
      }
    }

    // Create a new task for complex queries
    const task = this.createTask(input, context)
    
    try {
      const result = await this.executeTask(task)
      this.addToMemory(input, result.response, 'ai_generated', result.webSearchData)
      
      return {
        response: result.response,
        task,
        isIdentityResponse: false,
        webSearchData: result.webSearchData
      }
    } catch (error) {
      console.error('Task execution failed:', error)
      return {
        response: "I encountered an error while processing your request. Please try again.",
        task,
        isIdentityResponse: false
      }
    }
  }

  private createTask(input: string, context: any): Task {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Determine task type based on input analysis
    let taskType: Task['type'] = 'chat'
    
    if (this.isWebSearchQuery(input)) {
      taskType = 'web_search'
    } else if (this.isCodeQuery(input)) {
      taskType = 'code_generation'
    }

    const task: Task = {
      id: taskId,
      type: taskType,
      input,
      status: 'pending',
      steps: [],
      metadata: {
        timestamp: new Date().toISOString(),
        model: context.selectedModel || 'gemini-pro',
        webMode: context.isWebMode || false
      }
    }

    this.tasks.set(taskId, task)
    return task
  }

  private async executeTask(task: Task): Promise<{ response: string; webSearchData?: any }> {
    task.status = 'running'
    
    try {
      switch (task.type) {
        case 'web_search':
          return await this.executeWebSearchTask(task)
        case 'code_generation':
          return await this.executeCodeGenerationTask(task)
        default:
          return await this.executeChatTask(task)
      }
    } catch (error) {
      task.status = 'failed'
      throw error
    }
  }

  private async executeWebSearchTask(task: Task): Promise<{ response: string; webSearchData: any }> {
    const searchStep: TaskStep = {
      id: `step_${Date.now()}`,
      name: 'Web Search',
      status: 'running',
      startTime: Date.now()
    }
    
    task.steps.push(searchStep)
    
    try {
      const searchData = await webSearchService.search(task.input)
      
      searchStep.status = 'completed'
      searchStep.endTime = Date.now()
      searchStep.result = searchData
      
      // Generate response based on search results
      const response = this.generateWebSearchResponse(task.input, searchData)
      
      task.status = 'completed'
      task.result = { response, searchData }
      
      return { response, webSearchData: searchData }
    } catch (error) {
      searchStep.status = 'failed'
      searchStep.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private async executeChatTask(task: Task): Promise<{ response: string }> {
    const chatStep: TaskStep = {
      id: `step_${Date.now()}`,
      name: 'AI Chat Response',
      status: 'running',
      startTime: Date.now()
    }
    
    task.steps.push(chatStep)
    
    // Simulate AI model processing with context awareness
    const response = this.generateContextualResponse(task.input, task.metadata)
    
    chatStep.status = 'completed'
    chatStep.endTime = Date.now()
    chatStep.result = response
    
    task.status = 'completed'
    task.result = response
    
    return { response }
  }

  private async executeCodeGenerationTask(task: Task): Promise<{ response: string }> {
    const codeStep: TaskStep = {
      id: `step_${Date.now()}`,
      name: 'Code Generation',
      status: 'running',
      startTime: Date.now()
    }
    
    task.steps.push(codeStep)
    
    // Enhanced code generation logic
    const response = this.generateCodeResponse(task.input)
    
    codeStep.status = 'completed'
    codeStep.endTime = Date.now()
    codeStep.result = response
    
    task.status = 'completed'
    task.result = response
    
    return { response }
  }

  private generateWebSearchResponse(query: string, searchData: any): string {
    if (!searchData.results.length) {
      return `I searched the web for "${query}" but couldn't find relevant results. Let me help based on my existing knowledge instead.`
    }

    const topResults = searchData.results.slice(0, 3)
    const sources = topResults.map((r: any) => new URL(r.url).hostname).join(', ')
    
    return `🌐 I found ${searchData.totalResults} results for "${query}" in ${searchData.searchTime}ms from ${searchData.sources.join(', ')}. 

Based on the search results from ${sources}, here's what I found:

${topResults.map((result: any, index: number) => 
  `${index + 1}. **${result.title}**: ${result.snippet.substring(0, 150)}...`
).join('\n\n')}

The search results provide comprehensive information about your query. Would you like me to search for more specific information or help you with something else?`
  }

  private generateContextualResponse(input: string, metadata: any): string {
    const model = metadata?.model || 'gemini-pro'
    const responses = [
      `I understand you're asking about "${input}". Let me help you with that using ${model}. As ${yetiIdentity.name}, I'm designed to provide comprehensive assistance based on my training and capabilities.`,
      `That's an interesting question about "${input}". Based on my knowledge and the context from our conversation, here's what I can tell you using ${model}.`,
      `Great question! I'll analyze "${input}" for you using ${model}. As an autonomous AI created by ${yetiIdentity.creator.name}, I'm equipped to handle a wide range of queries.`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  private generateCodeResponse(input: string): string {
    return `I'll help you with the coding task: "${input}". As ${yetiIdentity.name}, I'm equipped with advanced code generation capabilities. Let me analyze your requirements and provide a solution using best practices and modern development patterns.

\`\`\`typescript
// Example code structure for your request
// This would be dynamically generated based on the specific input
function solutionFor${input.replace(/\s+/g, '')}() {
  // Implementation would go here
  return "Generated solution";
}
\`\`\`

Would you like me to elaborate on any part of this solution or help you with implementation details?`
  }

  private isWebSearchQuery(input: string): boolean {
    const webSearchKeywords = [
      'search', 'find', 'look up', 'what is', 'who is', 'when did', 'where is',
      'latest', 'current', 'recent', 'news', 'price', 'weather', 'stock'
    ]
    
    return webSearchKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    )
  }

  private isCodeQuery(input: string): boolean {
    const codeKeywords = [
      'code', 'function', 'class', 'component', 'algorithm', 'implement',
      'debug', 'fix', 'optimize', 'refactor', 'typescript', 'javascript',
      'react', 'python', 'api'
    ]
    
    return codeKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    )
  }

  private addToMemory(input: string, response: string, type: string, metadata?: any) {
    this.memory.longTermMemory.push({
      id: `memory_${Date.now()}`,
      content: `User: ${input}\nAssistant: ${response}`,
      timestamp: new Date().toISOString(),
      importance: type === 'identity' ? 10 : 5,
      tags: [type, ...(metadata ? ['web_enhanced'] : [])]
    })

    // Keep only last 100 memories to prevent memory bloat
    if (this.memory.longTermMemory.length > 100) {
      this.memory.longTermMemory = this.memory.longTermMemory
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 100)
    }
  }

  getMemory(): AgentMemory {
    return this.memory
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId)
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values())
  }
}

export { TaskOrchestrator }