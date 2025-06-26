import axios from 'axios'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  favicon?: string
  timestamp?: string
}

export interface WebSearchResponse {
  query: string
  results: SearchResult[]
  totalResults: number
  searchTime: number
  sources: string[]
}

// DuckDuckGo Instant Answer API (free, no API key required)
const DUCKDUCKGO_API = 'https://api.duckduckgo.com/'

// Serper API (alternative with API key)
const SERPER_API = 'https://google.serper.dev/search'

// Wikipedia API for additional context
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/'

class WebSearchService {
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const response = await axios.get(DUCKDUCKGO_API, {
        params: {
          q: query,
          format: 'json',
          no_html: '1',
          skip_disambig: '1'
        },
        timeout: 10000
      })

      const data = response.data
      const results: SearchResult[] = []

      // Add instant answer if available
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Instant Answer',
          url: data.AbstractURL || '#',
          snippet: data.Abstract,
          favicon: 'https://duckduckgo.com/favicon.ico'
        })
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              favicon: 'https://duckduckgo.com/favicon.ico'
            })
          }
        })
      }

      return results
    } catch (error) {
      console.error('DuckDuckGo search error:', error)
      return []
    }
  }

  private async searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
      // First, search for the page
      const searchResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query), {
        timeout: 5000
      })

      const data = searchResponse.data
      
      if (data.extract) {
        return [{
          title: data.title,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
          snippet: data.extract,
          favicon: 'https://en.wikipedia.org/favicon.ico'
        }]
      }

      return []
    } catch (error) {
      console.error('Wikipedia search error:', error)
      return []
    }
  }

  private async searchSerper(query: string): Promise<SearchResult[]> {
    const apiKey = import.meta.env.VITE_SERPER_API_KEY
    
    if (!apiKey) {
      console.warn('Serper API key not found. Add VITE_SERPER_API_KEY to your .env file for enhanced search results.')
      return []
    }

    try {
      const response = await axios.post(SERPER_API, {
        q: query,
        num: 10
      }, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      const data = response.data
      const results: SearchResult[] = []

      if (data.organic && Array.isArray(data.organic)) {
        data.organic.forEach((result: any) => {
          results.push({
            title: result.title,
            url: result.link,
            snippet: result.snippet || result.description || '',
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.link).hostname}`
          })
        })
      }

      return results
    } catch (error) {
      console.error('Serper search error:', error)
      return []
    }
  }

  private async fetchPageContent(url: string): Promise<string> {
    try {
      // Use a CORS proxy for demo purposes
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const response = await axios.get(proxyUrl, { timeout: 8000 })
      
      if (response.data.contents) {
        // Basic text extraction from HTML
        const text = response.data.contents.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        return text.substring(0, 500) + '...'
      }
      
      return ''
    } catch (error) {
      console.error('Error fetching page content:', error)
      return ''
    }
  }

  async search(query: string): Promise<WebSearchResponse> {
    const startTime = Date.now()
    const sources: string[] = []
    let allResults: SearchResult[] = []

    try {
      // Run multiple searches in parallel
      const searchPromises = [
        this.searchDuckDuckGo(query).then(results => {
          if (results.length > 0) sources.push('DuckDuckGo')
          return results
        }),
        this.searchWikipedia(query).then(results => {
          if (results.length > 0) sources.push('Wikipedia')
          return results
        }),
        this.searchSerper(query).then(results => {
          if (results.length > 0) sources.push('Google (Serper)')
          return results
        })
      ]

      const searchResults = await Promise.allSettled(searchPromises)
      
      searchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults = [...allResults, ...result.value]
        }
      })

      // Remove duplicates based on URL
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.url === result.url)
      )

      // Add timestamps
      const resultsWithTimestamp = uniqueResults.map(result => ({
        ...result,
        timestamp: new Date().toISOString()
      }))

      const searchTime = Date.now() - startTime

      return {
        query,
        results: resultsWithTimestamp.slice(0, 10), // Limit to 10 results
        totalResults: resultsWithTimestamp.length,
        searchTime,
        sources
      }
    } catch (error) {
      console.error('Web search error:', error)
      
      return {
        query,
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
        sources: []
      }
    }
  }

  async getPageSummary(url: string): Promise<string> {
    return this.fetchPageContent(url)
  }
}

export const webSearchService = new WebSearchService()