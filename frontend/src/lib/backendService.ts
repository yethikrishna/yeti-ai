import { yetiIdentity } from './yetiIdentity'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export interface BackendChatRequest {
  message: string
  session_id?: string
  model: string
  web_mode: boolean
  context?: Record<string, any>
}

export interface BackendChatResponse {
  response: string
  session_id: string
  model_used: string
  task_plan: string[]
  reasoning: string
  web_search_data: {
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
  timestamp: string;
}

export interface MemoryResponse {
  session_id: string
  conversations: Array<{
    timestamp: string
    user: string
    yeti: string
    metadata?: Record<string, any>
  }>
  total_messages: number
}

export interface AgentStatus {
  status: string
  current_task?: string
  session_id: string
  timestamp: string
}

export interface BrowserAgentResponse {
  url: string;
  screenshot_base64?: string;
  html_content?: string;
  text_content?: string;
  timestamp: string;
  error?: string;
}

class BackendService {
  private baseUrl: string

  constructor() {
    this.baseUrl = BACKEND_URL
  }

  async chat(request: BackendChatRequest): Promise<BackendChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Backend chat error:', error)
      
      // Fallback response when backend is unavailable
      return {
        response: `I'm ${yetiIdentity.name}, and I'd love to help you with "${request.message}", but I'm currently running in demo mode. The backend service is not available. This showcases the frontend interface and user experience.`,
        session_id: request.session_id || `demo_${Date.now()}`,
        model_used: request.model,
        task_plan: ['demo_response'],
        reasoning: 'Backend service unavailable - showing demo response',
        timestamp: new Date().toISOString(),
        web_search_data: null
      }
    }
  }

  async getMemory(sessionId: string): Promise<MemoryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/${sessionId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Backend memory error:', error)
      return {
        session_id: sessionId,
        conversations: [],
        total_messages: 0
      }
    }
  }

  async clearMemory(sessionId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/${sessionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Backend clear memory error:', error)
      return { message: 'Failed to clear memory' }
    }
  }

  async getAgentStatus(sessionId: string): Promise<AgentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/status/${sessionId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Backend agent status error:', error)
      return {
        status: 'offline',
        session_id: sessionId,
        timestamp: new Date().toISOString()
      }
    }
  }

  async browse(url: string, sessionId?: string, headless: boolean = true): Promise<BrowserAgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/browse?url=${encodeURIComponent(url)}&session_id=${sessionId || ''}&headless=${headless}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Backend browse error:', error)
      return {
        url,
        error: 'Backend service unavailable or error during browsing',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getAvailableModels(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/models`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Backend models error:', error)
      return {}
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const backendService = new BackendService()