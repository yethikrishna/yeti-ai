// This file will now primarily act as a wrapper for the backend's web browsing capabilities.
// The direct DuckDuckGo search will be handled by the backend.

import { backendService, BrowserAgentResponse } from './backendService';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  timestamp?: string;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  sources: string[];
  browserData?: BrowserAgentResponse; // Add browser agent data
}

class WebSearchService {
  async search(query: string): Promise<WebSearchResponse> {
    // In this updated architecture, the 'search' function will trigger the backend's
    // AI processing, which might internally decide to use the browser agent.
    // For a direct web search that returns structured results, we'll rely on the backend's
    // browse_web_and_summarize function (which uses DuckDuckGo for now).
    // The full browser agent (navigate_and_screenshot) is exposed via backendService.browse
    // and can be called directly when needed for visual browsing.

    // This is a placeholder to satisfy the frontend's current expectation of webSearchService.search
    // The actual web browsing with screenshot will be triggered by the /agent/browse endpoint.
    console.warn("webSearchService.search is deprecated. Use backendService.chat with web_mode or backendService.browse directly.");

    // Simulate a basic search response for compatibility
    return {
      query: query,
      results: [], // Actual results would come from backendService.chat's web_search_data
      totalResults: 0,
      searchTime: 0,
      sources: [],
      browserData: undefined // No browser data for this simulated search
    };
  }

  // This function can be used to trigger the full browser agent directly
  async browseUrl(url: string, sessionId?: string, headless: boolean = true): Promise<BrowserAgentResponse> {
    return backendService.browse(url, sessionId, headless);
  }
}

export const webSearchService = new WebSearchService();