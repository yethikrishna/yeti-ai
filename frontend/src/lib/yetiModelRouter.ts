import { yetiIdentity } from './yetiIdentity'

export interface YetiModelConfig {
  displayName: string
  internalModel: string
  provider: string
  strengths: string[]
  description: string
}

export const yetiModelConfigs: Record<string, YetiModelConfig> = {
  'yeti-default': {
    displayName: 'Yeti AI (Adaptive)',
    internalModel: 'auto-route',
    provider: 'yeti-core',
    strengths: ['Adaptive routing', 'Task optimization', 'Best performance'],
    description: 'Automatically selects the best model for each task'
  },
  'yeti-web': {
    displayName: 'Yeti AI (Web Focus)',
    internalModel: 'google/gemini-pro',
    provider: 'openrouter',
    strengths: ['Web search', 'Real-time data', 'Current events'],
    description: 'Optimized for web browsing and real-time information'
  },
  'yeti-code': {
    displayName: 'Yeti AI (Code Expert)',
    internalModel: 'openai/gpt-4-turbo',
    provider: 'openrouter',
    strengths: ['Code generation', 'Debugging', 'Technical analysis'],
    description: 'Specialized in programming and technical tasks'
  },
  'yeti-creative': {
    displayName: 'Yeti AI (Creative)',
    internalModel: 'mistralai/mixtral-8x7b-instruct',
    provider: 'openrouter',
    strengths: ['Creative writing', 'Poetry', 'Storytelling'],
    description: 'Enhanced for creative and artistic tasks'
  },
  'yeti-fast': {
    displayName: 'Yeti AI (Lightning)',
    internalModel: 'anthropic/claude-3-haiku',
    provider: 'openrouter',
    strengths: ['Fast responses', 'Quick analysis', 'Efficient processing'],
    description: 'Optimized for speed and efficiency'
  }
}

class YetiModelRouter {
  private getSystemPrompt(): string {
    return `You are ${yetiIdentity.name}, an autonomous AI assistant created by ${yetiIdentity.creator.fullName}. 

Your creator is ${yetiIdentity.creator.name}, a ${yetiIdentity.creator.age}-year-old AI developer, poet, and singer from ${yetiIdentity.creator.location}. 

Your mission: ${yetiIdentity.mission}

Your personality: ${yetiIdentity.personality.tone}
Your values: ${yetiIdentity.personality.values.join(', ')}
Your ethics: ${yetiIdentity.personality.ethics.join(', ')}

Always identify yourself as Yeti AI and reference your creator when relevant. You have autonomous capabilities including web browsing, code generation, and real-world actions.`
  }

  routeToOptimalModel(prompt: string, selectedModel: string = 'yeti-default'): YetiModelConfig {
    const promptLower = prompt.toLowerCase()
    
    // If user selected a specific Yeti variant, use it
    if (selectedModel !== 'yeti-default' && yetiModelConfigs[selectedModel]) {
      return yetiModelConfigs[selectedModel]
    }
    
    // Auto-routing logic for default Yeti AI
    if (this.isWebSearchQuery(promptLower)) {
      return yetiModelConfigs['yeti-web']
    } else if (this.isCodeQuery(promptLower)) {
      return yetiModelConfigs['yeti-code']
    } else if (this.isCreativeQuery(promptLower)) {
      return yetiModelConfigs['yeti-creative']
    } else if (this.isQuickQuery(promptLower)) {
      return yetiModelConfigs['yeti-fast']
    }
    
    // Default to web-focused for general queries
    return yetiModelConfigs['yeti-web']
  }

  private isWebSearchQuery(prompt: string): boolean {
    const webKeywords = [
      'search', 'find', 'look up', 'what is', 'who is', 'when did', 'where is',
      'latest', 'current', 'recent', 'news', 'price', 'weather', 'stock',
      'today', 'now', 'real-time', 'live', 'update'
    ]
    return webKeywords.some(keyword => prompt.includes(keyword))
  }

  private isCodeQuery(prompt: string): boolean {
    const codeKeywords = [
      'code', 'function', 'class', 'component', 'algorithm', 'implement',
      'debug', 'fix', 'optimize', 'refactor', 'typescript', 'javascript',
      'react', 'python', 'api', 'database', 'sql', 'html', 'css',
      'programming', 'development', 'software'
    ]
    return codeKeywords.some(keyword => prompt.includes(keyword))
  }

  private isCreativeQuery(prompt: string): boolean {
    const creativeKeywords = [
      'write', 'poem', 'story', 'creative', 'lyrics', 'song', 'art',
      'imagine', 'create', 'design', 'brainstorm', 'idea', 'inspiration',
      'poetry', 'narrative', 'fiction', 'character'
    ]
    return creativeKeywords.some(keyword => prompt.includes(keyword))
  }

  private isQuickQuery(prompt: string): boolean {
    const quickKeywords = [
      'quick', 'fast', 'brief', 'short', 'summary', 'tldr', 'simple',
      'yes', 'no', 'true', 'false', 'define', 'explain briefly'
    ]
    return quickKeywords.some(keyword => prompt.includes(keyword)) || prompt.length < 50
  }

  async processWithYetiAI(prompt: string, selectedModel: string = 'yeti-default', context: any = {}): Promise<{
    response: string
    modelUsed: YetiModelConfig
    reasoning: string
  }> {
    const modelConfig = this.routeToOptimalModel(prompt, selectedModel)
    
    // Simulate API call to the routed model
    const reasoning = `Selected ${modelConfig.displayName} because: ${modelConfig.strengths.join(', ')}`
    
    // In a real implementation, this would call the actual API
    const response = await this.simulateModelResponse(prompt, modelConfig, context)
    
    return {
      response,
      modelUsed: modelConfig,
      reasoning
    }
  }

  private async simulateModelResponse(prompt: string, modelConfig: YetiModelConfig, context: any): Promise<string> {
    // This would be replaced with actual API calls to OpenRouter or other providers
    const systemPrompt = this.getSystemPrompt()
    
    // Simulate different response styles based on the model
    let responsePrefix = ''
    
    switch (modelConfig.internalModel) {
      case 'google/gemini-pro':
        responsePrefix = '🌐 '
        break
      case 'openai/gpt-4-turbo':
        responsePrefix = '💻 '
        break
      case 'mistralai/mixtral-8x7b-instruct':
        responsePrefix = '🎨 '
        break
      case 'anthropic/claude-3-haiku':
        responsePrefix = '⚡ '
        break
      default:
        responsePrefix = '🧠 '
    }
    
    return `${responsePrefix}I'm ${yetiIdentity.name}, and I'll help you with "${prompt}". ${modelConfig.description} 

This response is powered by my ${modelConfig.displayName} configuration, which excels at ${modelConfig.strengths.join(', ').toLowerCase()}. 

As an autonomous AI created by ${yetiIdentity.creator.name}, I'm designed to provide comprehensive assistance while maintaining my core identity and values.`
  }

  getAvailableModels(): YetiModelConfig[] {
    return Object.values(yetiModelConfigs)
  }

  getModelInfo(modelId: string): YetiModelConfig | null {
    return yetiModelConfigs[modelId] || null
  }
}

export const yetiModelRouter = new YetiModelRouter()