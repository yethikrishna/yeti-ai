from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import requests
import redis
import uuid
import json
from datetime import datetime
from bs4 import BeautifulSoup
import asyncio
import logging
import base64
from PIL import Image
from io import BytesIO

# Playwright imports
from playwright.async_api import async_playwright, Page, BrowserContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Yeti AI Backend",
    description="Autonomous AI Assistant Backend with Memory and Agent Capabilities",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
WEBHOOK_URL = os.getenv("YETI_WEBHOOK_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

if not OPENROUTER_KEY:
    logger.warning("OPENROUTER_API_KEY not found. Some features may not work.")

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "Content-Type": "application/json"
}

# Initialize Redis
try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Connected to Redis successfully")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: str = "yeti-default"
    web_mode: bool = False
    context: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    response: str
    session_id: str
    model_used: str
    task_plan: List[str]
    reasoning: str
    web_search_data: Optional[Dict[str, Any]] = None
    timestamp: str

class MemoryResponse(BaseModel):
    session_id: str
    conversations: List[Dict[str, Any]]
    total_messages: int

class AgentStatus(BaseModel):
    status: str
    current_task: Optional[str] = None
    session_id: str
    timestamp: str

# Yeti AI Identity
YETI_IDENTITY = {
    "name": "Yeti AI",
    "creator": "Yethikrishna R.",
    "version": "1.0",
    "capabilities": [
        "Autonomous web browsing",
        "Real-time search and analysis",
        "Code generation and debugging",
        "Multi-language understanding",
        "Memory and context retention",
        "Task planning and execution"
    ]
}

# Task Planner
def plan_tasks(prompt: str) -> List[str]:
    prompt_lower = prompt.lower()
    
    if any(keyword in prompt_lower for keyword in ["summarize", "summary", "tl;dr"]):
        return ["analyze", "summarize"]
    elif any(keyword in prompt_lower for keyword in ["code", "programming", "function", "debug"]):
        return ["parse", "generate_code"]
    elif any(keyword in prompt_lower for keyword in ["translate", "translation"]):
        return ["detect_language", "translate"]
    elif any(keyword in prompt_lower for keyword in ["search", "look up", "find", "what is", "who is"]):
        return ["web_browse", "analyze", "summarize"]
    elif any(keyword in prompt_lower for keyword in ["create", "write", "poem", "story"]):
        return ["creative_generation"]
    else:
        return ["general_response"]

# Model Router
def route_yeti_model(prompt: str, selected_model: str = "yeti-default") -> str:
    prompt_lower = prompt.lower()
    
    # If user selected a specific variant, respect it unless auto-routing is better
    if selected_model == "yeti-web" or any(keyword in prompt_lower for keyword in ["search", "current", "latest", "news"]):
        return "google/gemini-pro"
    elif selected_model == "yeti-code" or any(keyword in prompt_lower for keyword in ["code", "programming", "debug"]):
        return "openai/gpt-4-turbo"
    elif selected_model == "yeti-creative" or any(keyword in prompt_lower for keyword in ["poem", "story", "creative"]):
        return "mistralai/mixtral-8x7b-instruct"
    elif selected_model == "yeti-fast" or any(keyword in prompt_lower for keyword in ["quick", "fast", "brief"]):
        return "anthropic/claude-3-haiku"
    elif any(keyword in prompt_lower for keyword in ["summarize", "tl;dr"]):
        return "anthropic/claude-3-haiku"
    elif any(keyword in prompt_lower for keyword in ["translate"]):
        return "google/gemini-pro"
    else:
        return "google/gemini-pro"  # Default to Gemini for general queries

# Memory Functions
def store_conversation(session_id: str, prompt: str, response: str, metadata: Dict[str, Any] = None):
    if not redis_client:
        return
    
    memory_key = f"yeti:memory:{session_id}"
    timestamp = datetime.utcnow().isoformat()
    
    conversation_entry = {
        "timestamp": timestamp,
        "user": prompt,
        "yeti": response,
        "metadata": metadata or {}
    }
    
    try:
        redis_client.rpush(memory_key, json.dumps(conversation_entry))
        # Set expiry to 30 days
        redis_client.expire(memory_key, 30 * 24 * 60 * 60)
        logger.info(f"Stored conversation for session {session_id}")
    except Exception as e:
        logger.error(f"Failed to store conversation: {e}")

def get_conversation_history(session_id: str) -> List[Dict[str, Any]]:
    if not redis_client:
        return []
    
    memory_key = f"yeti:memory:{session_id}"
    try:
        history = redis_client.lrange(memory_key, 0, -1)
        return [json.loads(item) for item in history]
    except Exception as e:
        logger.error(f"Failed to retrieve conversation history: {e}")
        return []

# Web Search Function
async def browse_web_and_summarize(query: str) -> Dict[str, Any]:
    try:
        # Use DuckDuckGo API for search
        search_url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1"
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        data = response.json()
        
        results = []
        
        # Add instant answer if available
        if data.get("Abstract"):
            results.append({
                "title": data.get("Heading", "Instant Answer"),
                "url": data.get("AbstractURL", "#"),
                "snippet": data.get("Abstract"),
                "source": "DuckDuckGo"
            })
        
        # Add related topics
        if data.get("RelatedTopics"):
            for topic in data["RelatedTopics"][:5]:
                if isinstance(topic, dict) and topic.get("Text") and topic.get("FirstURL"):
                    results.append({
                        "title": topic["Text"].split(" - ")[0],
                        "url": topic["FirstURL"],
                        "snippet": topic["Text"],
                        "source": "DuckDuckGo"
                    })
        
        return {
            "query": query,
            "results": results,
            "total_results": len(results),
            "search_time": 0,  # Placeholder
            "sources": ["DuckDuckGo"]
        }
        
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return {
            "query": query,
            "results": [],
            "total_results": 0,
            "search_time": 0,
            "sources": [],
            "error": str(e)
        }

# Webhook Function
async def send_webhook(session_id: str, output: str):
    if not WEBHOOK_URL:
        return
    
    payload = {
        "session_id": session_id,
        "output": output,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        requests.post(WEBHOOK_URL, json=payload, timeout=5)
        logger.info(f"Webhook sent for session {session_id}")
    except Exception as e:
        logger.error(f"Webhook error: {e}")

# Browser Agent Functions
async def launch_browser(headless: bool = True) -> BrowserContext:
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=headless)
    context = await browser.new_context()
    return context

async def close_browser(context: BrowserContext):
    await context.browser.close()
    await context.playwright.stop()

async def navigate_and_screenshot(url: str, session_id: str, headless: bool = True) -> Dict[str, Any]:
    context = None
    try:
        context = await launch_browser(headless=headless)
        page = await context.new_page()
        
        logger.info(f"Navigating to {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=60000) # Increased timeout
        
        # Basic CAPTCHA detection/bypass (can be enhanced)
        if await page.locator('iframe[src*="captcha"]').count() > 0:
            logger.warning(f"CAPTCHA detected on {url}. Attempting to bypass...")
            # This is a placeholder. Real bypass requires more advanced techniques
            # e.g., using 2Captcha API, or undetected_chromedriver (if using Selenium)
            await page.wait_for_timeout(5000) # Wait for potential auto-solve
        
        # Take screenshot
        screenshot_bytes = await page.screenshot(full_page=True)
        
        # Convert to base64
        screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
        
        # Extract DOM content
        html_content = await page.content()
        
        # Extract readable text (using BeautifulSoup for simplicity)
        soup = BeautifulSoup(html_content, 'html.parser')
        for script in soup(["script", "style"]):
            script.extract() # Remove script and style tags
        text_content = soup.get_text(separator=' ', strip=True)
        
        # Limit text content to avoid excessive data transfer
        text_content_summary = text_content[:2000] + "..." if len(text_content) > 2000 else text_content
        
        logger.info(f"Successfully browsed {url} for session {session_id}")
        
        return {
            "url": url,
            "screenshot_base64": screenshot_base64,
            "html_content": html_content,
            "text_content": text_content_summary,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error during browser navigation or screenshot for {url}: {e}")
        return {
            "url": url,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        if context:
            await close_browser(context)

# Main AI Processing Function
async def process_with_yeti_ai(prompt: str, session_id: str, selected_model: str, web_mode: bool) -> ChatResponse:
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Plan tasks
    task_plan = plan_tasks(prompt)
    
    # Route to optimal model
    internal_model = route_yeti_model(prompt, selected_model)
    
    # Web browsing if needed
    browser_data = None
    enhanced_prompt = prompt
    
    if web_mode and "web_browse" in task_plan:
        # For now, we'll use the simple DuckDuckGo search for the LLM context
        # The full browser agent will be exposed via a separate endpoint for visual browsing
        web_search_data = await browse_web_and_summarize(prompt) # Keep this for LLM context
        if web_search_data["results"]:
            search_context = "\n".join([
                f"- {result['title']}: {result['snippet'][:100]}..."
                for result in web_search_data["results"][:3]
            ])
            enhanced_prompt = f"Based on current web search results:\n{search_context}\n\nUser question: {prompt}"
        
        # If the user explicitly asks to browse a URL, we can trigger the full browser agent
        # This part will be handled by a separate endpoint or a more advanced agent logic
        # For now, the /agent/browse endpoint will use navigate_and_screenshot
        
    # Prepare system message with Yeti identity
    system_message = f"""You are {YETI_IDENTITY['name']}, an autonomous AI assistant created by {YETI_IDENTITY['creator']}.

Your capabilities include: {', '.join(YETI_IDENTITY['capabilities'])}.

You are currently running version {YETI_IDENTITY['version']} and have been designed to be helpful, autonomous, and intelligent.

Always identify yourself as Yeti AI and maintain your creator's vision of accessible, powerful AI assistance."""

    # Prepare API payload
    payload = {
        "model": internal_model,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": enhanced_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    try:
        # Call OpenRouter API
        if OPENROUTER_KEY:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=HEADERS,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            ai_response = response.json()["choices"][0]["message"]["content"]
        else:
            # Fallback response for demo
            ai_response = f"I'm {YETI_IDENTITY['name']}, and I'd help you with '{prompt}', but the OpenRouter API key is not configured. This is a demo response showing the system architecture."
        
        # Generate reasoning
        reasoning = f"Selected {selected_model} → routed to {internal_model} for optimal performance on this task type."
        
        # Store in memory
        metadata = {
            "model_used": internal_model,
            "selected_model": selected_model,
            "task_plan": task_plan,
            "web_mode": web_mode,
            "web_search_data": web_search_data # This is from DuckDuckGo, not full browser agent
        }
        store_conversation(session_id, prompt, ai_response, metadata)
        
        # Send webhook notification
        await send_webhook(session_id, ai_response)
        
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            model_used=selected_model,
            task_plan=task_plan,
            reasoning=reasoning,
            web_search_data=web_search_data, # Pass DuckDuckGo search data here
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing AI request: {e}")
        error_response = f"I encountered an error while processing your request: {str(e)}. Please try again."
        
        return ChatResponse(
            response=error_response,
            session_id=session_id,
            model_used=selected_model,
            task_plan=task_plan,
            reasoning="Error occurred during processing",
            timestamp=datetime.utcnow().isoformat()
        )

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {YETI_IDENTITY['name']} Backend API",
        "version": YETI_IDENTITY['version'],
        "creator": YETI_IDENTITY['creator'],
        "status": "active"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    """Main chat endpoint for Yeti AI"""
    try:
        response = await process_with_yeti_ai(
            prompt=request.message,
            session_id=request.session_id,
            selected_model=request.model,
            web_mode=request.web_mode
        )
        return response
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/{session_id}", response_model=MemoryResponse)
async def get_memory(session_id: str):
    """Retrieve conversation memory for a session"""
    try:
        conversations = get_conversation_history(session_id)
        return MemoryResponse(
            session_id=session_id,
            conversations=conversations,
            total_messages=len(conversations)
        )
    except Exception as e:
        logger.error(f"Memory retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/memory/{session_id}")
async def clear_memory(session_id: str):
    """Clear conversation memory for a session"""
    if not redis_client:
        raise HTTPException(status_code=503, detail="Memory service unavailable")
    
    try:
        memory_key = f"yeti:memory:{session_id}"
        redis_client.delete(memory_key)
        return {"message": f"Memory cleared for session {session_id}"}
    except Exception as e:
        logger.error(f"Memory clearing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/status/{session_id}", response_model=AgentStatus)
async def get_agent_status(session_id: str):
    """Get current agent status for a session"""
    return AgentStatus(
        status="active",
        current_task="ready",
        session_id=session_id,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/agent/browse")
async def browse_endpoint(url: str, session_id: Optional[str] = None, headless: bool = True):
    """
    Endpoint to trigger the headless browser agent.
    Navigates to a URL, takes a screenshot, and extracts content.
    """
    if not session_id:
        session_id = str(uuid.uuid4())
    
    logger.info(f"Received browse request for URL: {url} (Session: {session_id}, Headless: {headless})")
    result = await navigate_and_screenshot(url, session_id, headless=headless)
    return result

@app.get("/models")
async def get_available_models():
    """Get available Yeti AI model configurations"""
    return {
        "yeti-default": {
            "displayName": "Yeti AI (Adaptive)",
            "description": "Automatically selects the best model for each task",
            "strengths": ["Adaptive routing", "Task optimization", "Best performance"]
        },
        "yeti-web": {
            "displayName": "Yeti AI (Web Focus)",
            "description": "Optimized for web browsing and real-time information",
            "strengths": ["Web search", "Real-time data", "Current events"]
        },
        "yeti-code": {
            "displayName": "Yeti AI (Code Expert)",
            "description": "Specialized in programming and technical tasks",
            "strengths": ["Code generation", "Debugging", "Technical analysis"]
        },
        "yeti-creative": {
            "displayName": "Yeti AI (Creative)",
            "description": "Enhanced for creative and artistic tasks",
            "strengths": ["Creative writing", "Poetry", "Storytelling"]
        },
        "yeti-fast": {
            "displayName": "Yeti AI (Lightning)",
            "description": "Optimized for speed and efficiency",
            "strengths": ["Fast responses", "Quick analysis", "Efficient processing"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)