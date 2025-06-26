import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Search, 
  Globe, 
  Code, 
  Mail, 
  CheckCircle, 
  ArrowRight, 
  Brain,
  Zap,
  Eye,
  MousePointer,
  FileText,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'completed' | 'skipped'
  type: 'input' | 'decision' | 'action' | 'output'
}

interface AgentFlowchartProps {
  currentStep?: string
  steps?: FlowStep[]
  className?: string
}

const defaultSteps: FlowStep[] = [
  {
    id: 'input',
    title: 'User Input',
    description: 'Receive and parse user request',
    icon: <MessageSquare className="h-4 w-4" />,
    status: 'completed',
    type: 'input'
  },
  {
    id: 'parse',
    title: 'Task Parser',
    description: 'Analyze intent and extract requirements',
    icon: <Brain className="h-4 w-4" />,
    status: 'completed',
    type: 'decision'
  },
  {
    id: 'plan',
    title: 'Task Planner',
    description: 'Create execution strategy',
    icon: <Zap className="h-4 w-4" />,
    status: 'active',
    type: 'decision'
  },
  {
    id: 'web-check',
    title: 'Need Web Data?',
    description: 'Determine if real-time web search is required',
    icon: <Globe className="h-4 w-4" />,
    status: 'pending',
    type: 'decision'
  },
  {
    id: 'browser',
    title: 'Browser Agent',
    description: 'Launch autonomous web browsing',
    icon: <Search className="h-4 w-4" />,
    status: 'pending',
    type: 'action'
  },
  {
    id: 'interact',
    title: 'Web Interaction',
    description: 'Navigate, click, and extract data',
    icon: <MousePointer className="h-4 w-4" />,
    status: 'pending',
    type: 'action'
  },
  {
    id: 'analyze',
    title: 'Content Analysis',
    description: 'Process and understand extracted content',
    icon: <Eye className="h-4 w-4" />,
    status: 'pending',
    type: 'action'
  },
  {
    id: 'code-check',
    title: 'Need Code/Text?',
    description: 'Determine response type required',
    icon: <Code className="h-4 w-4" />,
    status: 'pending',
    type: 'decision'
  },
  {
    id: 'generate',
    title: 'Content Generation',
    description: 'Create code, text, or analysis',
    icon: <FileText className="h-4 w-4" />,
    status: 'pending',
    type: 'action'
  },
  {
    id: 'action-check',
    title: 'Need Action?',
    description: 'Determine if external actions required',
    icon: <Send className="h-4 w-4" />,
    status: 'pending',
    type: 'decision'
  },
  {
    id: 'mcp',
    title: 'MCP Integration',
    description: 'Execute external actions (email, social, etc.)',
    icon: <Mail className="h-4 w-4" />,
    status: 'pending',
    type: 'action'
  },
  {
    id: 'output',
    title: 'Final Output',
    description: 'Compose and deliver response to user',
    icon: <CheckCircle className="h-4 w-4" />,
    status: 'pending',
    type: 'output'
  }
]

export default function AgentFlowchart({ currentStep, steps = defaultSteps, className }: AgentFlowchartProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const getStepColor = (status: FlowStep['status'], type: FlowStep['type']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'active':
        return 'bg-blue-100 border-blue-300 text-blue-800 animate-pulse'
      case 'pending':
        return 'bg-gray-100 border-gray-300 text-gray-600'
      case 'skipped':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600'
    }
  }

  const getTypeIcon = (type: FlowStep['type']) => {
    switch (type) {
      case 'decision':
        return '🤔'
      case 'action':
        return '⚡'
      case 'input':
        return '📥'
      case 'output':
        return '📤'
      default:
        return '🔄'
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Yeti AI Agent Flow
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time visualization of autonomous decision-making process
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div 
                className={cn(
                  "flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                  getStepColor(step.status, step.type),
                  expandedStep === step.id && "ring-2 ring-primary/20"
                )}
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              >
                <div className="flex items-center gap-3 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(step.type)}</span>
                    {step.icon}
                  </div>
                  
                  <div className="flex-grow">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    <p className="text-xs opacity-75">{step.description}</p>
                  </div>
                  
                  <Badge 
                    variant={step.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {step.status}
                  </Badge>
                </div>
              </div>
              
              {/* Connection Arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {/* Expanded Details */}
              {expandedStep === step.id && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">{step.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className="capitalize">{step.status}</span>
                    </div>
                    {step.status === 'active' && (
                      <div className="text-primary font-medium">
                        🔄 Currently processing...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Autonomous Agent Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Active</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}