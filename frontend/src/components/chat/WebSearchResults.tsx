import { ExternalLink, Clock, Globe, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WebSearchResponse } from '@/lib/webSearch'

interface WebSearchResultsProps {
  searchData: WebSearchResponse
  isLoading?: boolean
}

export default function WebSearchResults({ searchData, isLoading }: WebSearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!searchData.results.length) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No search results found for "{searchData.query}"</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Zap className="h-4 w-4 mr-2 text-primary" />
            Web Search Results
          </CardTitle>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{searchData.searchTime}ms</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            {searchData.totalResults} results from
          </span>
          {searchData.sources.map((source, index) => (
            <Badge key={source} variant="secondary" className="text-xs">
              {source}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {searchData.results.map((result, index) => (
          <div key={index} className="group">
            <div className="flex items-start space-x-3">
              {result.favicon && (
                <img 
                  src={result.favicon} 
                  alt="" 
                  className="w-4 h-4 mt-1 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {result.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {result.snippet}
                </p>
                
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <span className="truncate">{new URL(result.url).hostname}</span>
                </div>
              </div>
            </div>
            
            {index < searchData.results.length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
        
        <div className="pt-2 text-center">
          <Button variant="outline" size="sm" className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            View All Results
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}