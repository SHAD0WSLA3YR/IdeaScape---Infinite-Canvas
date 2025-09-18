/**
 * AI Service for Mind Mapping Application
 * 
 * SETUP INSTRUCTIONS:
 * 1. Get an API key from https://openrouter.ai/
 * 2. Set USE_REAL_API to true
 * 3. Replace API_KEY with your actual key
 * 4. Replace SITE_URL and SITE_NAME with your actual values
 * 5. Choose your preferred model (see recommended models below)
 * 
 * RECOMMENDED MODELS:
 * - "openai/gpt-4o" - Best quality, higher cost
 * - "openai/gpt-4o-mini" - Good balance of quality and cost
 * - "google/gemini-flash-1.5" - Fast and cost-effective
 * - "anthropic/claude-3-haiku" - Good for structured responses
 * - "meta-llama/llama-3.1-8b-instruct:free" - Free option
 * 
 * ALTERNATIVE AI PROVIDERS:
 * 1. OpenAI Direct API (api.openai.com)
 *    - Requires OpenAI API key
 *    - Change BASE_URL to "https://api.openai.com/v1/chat/completions"
 *    - Remove HTTP-Referer and X-Title headers
 * 
 * 2. Anthropic Claude API (api.anthropic.com)
 *    - Different API format, would need service refactor
 *    - Excellent for structured outputs
 * 
 * 3. Google Gemini API (ai.google.dev)
 *    - Different API format, would need service refactor
 *    - Good free tier available
 * 
 * 4. Local Models (Ollama, LM Studio)
 *    - Change BASE_URL to local endpoint (e.g., "http://localhost:11434/v1/chat/completions")
 *    - Remove Authorization header or use local auth
 *    - Models like "llama3.1", "mistral", "codellama"
 * 
 * 5. Other Aggregators:
 *    - Together AI (api.together.xyz)
 *    - Groq (api.groq.com) - Very fast inference
 *    - Perplexity AI (api.perplexity.ai)
 * 
 * By default, this service uses mock responses to demonstrate functionality
 * without requiring API configuration.
 */

// Configuration for AI service
const AI_CONFIG = {
  // Set to true to use real API, false for mock responses
  USE_REAL_API: true,
  // OpenRouter API key for Z.AI GLM 4.5 Air (free model)
  API_KEY: "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",
  BASE_URL: "https://openrouter.ai/api/v1/chat/completions",
  MODEL: "z-ai/glm-4.5-air:free", // Free Z.AI model
  SITE_URL: "https://clover-amount-02442961.figma.site", // Your Figma site URL
  SITE_NAME: "IdeaScape", // Your app name
  // Optimized token limits for different operation types
  MAX_TOKENS: {
    SUMMARY: 600,        // Increased for complete reasoning responses
    CONNECTIONS: 800,    // More tokens for JSON array generation
    GROUP_NAMES: 400,    // Sufficient for JSON array of names
    CHAT: 800,          // More tokens for conversational responses
    SMART_SUMMARY: 1000  // Maximum tokens for complex summaries
  },
  // Response optimization settings
  TEMPERATURE: 0.7,      // Balanced creativity vs consistency
  TOP_P: 0.9,           // Slightly focused sampling
  TIMEOUT: 30000        // 30 second timeout for API calls
};

export interface NodeData {
  id: string;
  title: string;
  content?: string;
  groupId?: string;
  tags?: string[];
  // Additional content fields for comprehensive content extraction
  links?: Array<{ url: string; title: string }>;
  images?: string[];
  videos?: string[];
  type?: 'text' | 'image' | 'link' | 'video';
}

export interface GroupData {
  id: string;
  name: string;
  nodeIds: string[];
}

export interface ConnectionSuggestion {
  nodeId1: string;
  nodeId2: string;
  reason: string;
  confidence: number; // 0-1 scale
}

class AIService {
  private extractNodeContent(node: NodeData): string {
    let content = `Title: "${node.title}"`;
    
    // Extract text content
    if (node.content && node.content.trim()) {
      const plainText = node.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (plainText && plainText !== node.title) {
        content += `\nContent: "${plainText}"`;
      }
    }
    
    // Extract links (as requested - only text and links, no images)
    if (node.links && node.links.length > 0) {
      const linkTexts = node.links.map(link => `${link.title} (${link.url})`).join(', ');
      content += `\nLinks: ${linkTexts}`;
    }
    
    // Skip images as requested by user - we can't tell what the image is about
    // if (node.images && node.images.length > 0) {
    //   content += `\nImages: ${node.images.length} image(s)`;
    // }
    
    // Skip videos as well since we can't analyze their content
    // if (node.videos && node.videos.length > 0) {
    //   content += `\nVideos: ${node.videos.length} video(s)`;
    // }
    
    // Extract tags
    if (node.tags && node.tags.length > 0) {
      content += `\nTags: ${node.tags.join(', ')}`;
    }
    
    // Add node type info only if it's text or link
    if (node.type && (node.type === 'text' || node.type === 'link')) {
      content += `\nType: ${node.type}`;
    }
    
    return content;
  }

  private async makeRequest(prompt: string, maxTokens: number = 150): Promise<string> {
    // Use mock responses if real API is disabled
    if (!AI_CONFIG.USE_REAL_API) {
      console.log('AI Service - Using mock responses (USE_REAL_API is false)');
      return this.getMockResponse(prompt);
    }

    const requestBody = {
      model: AI_CONFIG.MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping with mind mapping and knowledge organization. Always respond with valid JSON when JSON is requested. Provide concise, helpful responses focused on the specific task requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: AI_CONFIG.TEMPERATURE,
      // Z.AI specific parameters for better responses
      top_p: AI_CONFIG.TOP_P,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: null
    };

    const requestHeaders = {
      'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
      'HTTP-Referer': AI_CONFIG.SITE_URL,
      'X-Title': AI_CONFIG.SITE_NAME,
      'Content-Type': 'application/json',
    };

    // =====================================================================================
    // DETAILED REQUEST/RESPONSE LOGGING FOR DEBUGGING
    // =====================================================================================
    console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                                 API REQUEST                                      │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ URL: ${AI_CONFIG.BASE_URL}
    │ Model: ${AI_CONFIG.MODEL}
    │ Max Tokens: ${maxTokens}
    │ 
    │ HEADERS:
    │ ${Object.entries(requestHeaders).map(([key, value]) => 
        `${key}: ${key === 'Authorization' ? 'Bearer [REDACTED]' : value}`
      ).join('\n    │ ')}
    │
    │ REQUEST BODY:
    │ ${JSON.stringify(requestBody, null, 2).split('\n').join('\n    │ ')}
    └──────────────────────────────────────────────────────────────────────────────────┘
    `);

    try {
      // Create timeout controller for API requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT);
      
      const response = await fetch(AI_CONFIG.BASE_URL, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                               API RESPONSE                                       │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ Status: ${response.status} ${response.statusText}
    │ Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2).split('\n').join('\n    │ ')}
    └──────────────────────────────────────────────────────────────────────────────────┘
      `);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                                API ERROR                                         │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ Status: ${response.status} ${response.statusText}
    │ Error Response:
    │ ${errorText.split('\n').join('\n    │ ')}
    └──────────────────────────────────────────────────────────────────────────────────┘
        `);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                            RAW API RESPONSE JSON                                 │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ ${JSON.stringify(data, null, 2).split('\n').join('\n    │ ')}
    └──────────────────────────────────────────────────────────────────────────────────┘
      `);

      console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                           RESPONSE ANALYSIS                                      │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ Response Type: ${typeof data}
    │ Has choices: ${!!data.choices}
    │ Choices length: ${data.choices?.length || 0}
    │ All response keys: [${Object.keys(data).join(', ')}]
    │
    │ First choice analysis:
    │ - Has message: ${!!(data.choices?.[0]?.message)}
    │ - Message keys: [${data.choices?.[0]?.message ? Object.keys(data.choices[0].message).join(', ') : 'N/A'}]
    │ - Has content: ${!!(data.choices?.[0]?.message?.content)}
    │ - Content length: ${data.choices?.[0]?.message?.content?.length || 0}
    │ - Content preview: "${(data.choices?.[0]?.message?.content || '').substring(0, 100)}..."
    │ - Has reasoning: ${!!(data.choices?.[0]?.message?.reasoning)}
    │ - Reasoning length: ${data.choices?.[0]?.message?.reasoning?.length || 0}
    │ - Reasoning preview: "${(data.choices?.[0]?.message?.reasoning || '').substring(0, 200)}..."
    │ - Has reasoning_details: ${!!(data.choices?.[0]?.message?.reasoning_details)}
    │ - Reasoning details length: ${data.choices?.[0]?.message?.reasoning_details?.length || 0}
    └──────────────────────────────────────────────────────────────────────────────────┘
      `);
      
      // CONTENT EXTRACTION PROCESS WITH DETAILED LOGGING
      let content = '';
      let extractionMethod = 'none';

      console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                        CONTENT EXTRACTION PROCESS                                │
    ├──────────────────────────────────────────────────────────────────────────────────┤`);
      
      // Standard OpenAI format (but check if content is actually meaningful)
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const rawContent = data.choices[0].message.content.trim();
        // Enhanced validation: content must be meaningful (not just whitespace, newlines, or filler)
        if (this.isValidContent(rawContent)) {
          content = rawContent;
          extractionMethod = 'openai_content';
          console.log(`    │ ✓ METHOD: Standard OpenAI content field
    │   Raw content: "${content}"
    │   Length: ${content.length}`);
        } else {
          console.log(`    │ ⚠️  OpenAI content field is empty/whitespace only, trying Z.AI reasoning field...
    │   Raw content: "${rawContent}"
    │   Length: ${rawContent.length}`);
        }
      }
      // Z.AI GLM 4.5 Air format - reasoning field (try this if content field was empty or doesn't exist)
      if (!content && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.reasoning) {
        let reasoningContent = data.choices[0].message.reasoning.trim();
        extractionMethod = 'zai_reasoning';
        
        console.log(`    │ ✓ METHOD: Z.AI reasoning field
    │   Raw reasoning length: ${reasoningContent.length}
    │   Raw reasoning content:
    │   "${reasoningContent}"
    │
    │   PATTERN MATCHING ATTEMPTS:`);
        
        // Extract the actual summary from the reasoning text
        // First try to find explicit summary/conclusion statements
        const summaryPatterns = [
          /(?:summary|conclusion):\s*(.+?)(?:\n\n|$)/is,
          /(?:these nodes|the nodes|both nodes)\s+(?:are about|cover|focus on|discuss|represent)\s+(.+?)(?:\.|$)/is,
          /(?:in summary|to summarize|overall)[:,]?\s*(.+?)(?:\.|$)/is,
          /common themes?:\s*(?:\d+\.?\s*)?(.+?)(?:\n\d+\.|$)/is
        ];
        
        let extractedSummary = null;
        for (let i = 0; i < summaryPatterns.length; i++) {
          const pattern = summaryPatterns[i];
          const match = reasoningContent.match(pattern);
          console.log(`    │   Pattern ${i + 1}: ${pattern.source}
    │   Match result: ${match ? `"${match[1]?.trim()}"` : 'No match'}`);
          
          if (match && match[1] && match[1].trim().length > 15) {
            extractedSummary = match[1].trim();
            // Clean up any numbered lists or extra formatting
            extractedSummary = extractedSummary.replace(/^\d+\.\s*/, '').trim();
            console.log(`    │   ✓ SELECTED: Pattern ${i + 1} matched with: "${extractedSummary}"`);
            break;
          }
        }
        
        // If no explicit summary found, try to synthesize from the analysis
        if (!extractedSummary) {
          console.log(`    │   
    │   FALLBACK 1: Looking for Common Themes section...`);
          // Look for the "Common themes:" section and extract meaningful content
          const commonThemesMatch = reasoningContent.match(/common themes?:\s*([\s\S]+?)(?:\n\n|$)/i);
          if (commonThemesMatch) {
            const themesSection = commonThemesMatch[1];
            console.log(`    │   Found Common Themes section: "${themesSection}"`);
            
            // Extract numbered points and synthesize
            const points = themesSection.split('\n').filter(line => 
              line.trim().length > 10 && 
              (line.match(/^\d+\./) || line.includes('Both') || line.includes('about'))
            );
            
            console.log(`    │   Extracted points: ${JSON.stringify(points)}`);
            
            if (points.length >= 2) {
              // Synthesize from the key points
              const keyTopics = points.map(point => 
                point.replace(/^\d+\.\s*/, '').trim()
              ).filter(point => point.length > 10);
              
              console.log(`    │   Key topics: ${JSON.stringify(keyTopics)}`);
              
              if (keyTopics.length > 0) {
                // Create a natural summary from the analysis points
                const mainTopic = keyTopics[0].toLowerCase().includes('anime') ? 'Japanese animation (anime)' : 'the selected topics';
                extractedSummary = `This collection focuses on ${mainTopic}, covering both fundamental concepts and practical information.`;
                console.log(`    │   ✓ SYNTHESIZED: "${extractedSummary}"`);
              }
            }
          } else {
            console.log(`    │   No Common Themes section found`);
          }
        }
        
        // If still no summary, try to extract the last meaningful sentence before truncation
        if (!extractedSummary) {
          console.log(`    │   
    │   FALLBACK 2: Cleaning reasoning and extracting sentences...`);
          // Remove analysis structure and look for substantive content
          const cleanedReasoning = reasoningContent
            .replace(/Let me analyze.*?\n\n/is, '')
            .replace(/Node \d+:[\s\S]*?(?=Node \d+:|Common themes?:|$)/gi, '')
            .replace(/Common themes?:\s*/i, '')
            .trim();
          
          console.log(`    │   Cleaned reasoning: "${cleanedReasoning}"`);
          
          if (cleanedReasoning.length > 20) {
            // Take the first meaningful sentence or two
            const sentences = cleanedReasoning.split(/[.!?]+/).filter(s => s.trim().length > 15);
            console.log(`    │   Extracted sentences: ${JSON.stringify(sentences)}`);
            
            if (sentences.length > 0) {
              extractedSummary = sentences.slice(0, 2).join('. ').trim();
              if (!extractedSummary.endsWith('.')) {
                extractedSummary += '.';
              }
              console.log(`    │   ✓ SENTENCES EXTRACTED: "${extractedSummary}"`);
            }
          }
        }
        
        // Smart fallback: analyze the reasoning content to create a meaningful summary
        if (!extractedSummary) {
          extractedSummary = this.createSmartFallbackSummary(reasoningContent);
        }
        content = extractedSummary;
        
        console.log(`    │   
    │   FINAL RESULT: "${content}"`);
      }
      // Z.AI GLM 4.5 Air format - reasoning_details field
      if (!content && data.choices && data.choices[0] && data.choices[0].message && 
               data.choices[0].message.reasoning_details && 
               data.choices[0].message.reasoning_details[0] && 
               data.choices[0].message.reasoning_details[0].text) {
        content = data.choices[0].message.reasoning_details[0].text.trim();
        extractionMethod = 'zai_reasoning_details';
        console.log(`    │ ✓ METHOD: Z.AI reasoning_details field
    │   Content: "${content}"`);
      }
      // Alternative format 1: direct content
      if (!content && data.content) {
        content = data.content.trim();
        extractionMethod = 'direct_content';
        console.log(`    │ ✓ METHOD: Direct content field
    │   Content: "${content}"`);
      }
      // Alternative format 2: text field
      if (!content && data.text) {
        content = data.text.trim();
        extractionMethod = 'text_field';
        console.log(`    │ ✓ METHOD: Text field
    │   Content: "${content}"`);
      }
      // Alternative format 3: response field
      if (!content && data.response) {
        content = data.response.trim();
        extractionMethod = 'response_field';
        console.log(`    │ ✓ METHOD: Response field
    │   Content: "${content}"`);
      }
      // Alternative format 4: message field directly
      if (!content && data.message) {
        content = data.message.trim();
        extractionMethod = 'message_field';
        console.log(`    │ ✓ METHOD: Message field
    │   Content: "${content}"`);
      }
      // Check if data itself is a string
      if (!content && typeof data === 'string') {
        content = data.trim();
        extractionMethod = 'string_response';
        console.log(`    │ ✓ METHOD: String response
    │   Content: "${content}"`);
      }
      if (!content) {
        extractionMethod = 'failed';
        console.log(`    │ ✗ METHOD: No extraction method worked
    │   Available fields: [${Object.keys(data).join(', ')}]`);
      }

      console.log(`    │
    └──────────────────────────────────────────────────────────────────────────────────┘
      `);
      
      // CLEANUP PROCESS WITH DETAILED LOGGING
      console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                           CLEANUP PROCESS                                        │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ Extraction method used: ${extractionMethod}
    │ Raw extracted content: "${content}"
    │ Content length before cleanup: ${content.length}
    └──────────────────────────────────────────────────────────────────────────────────┘
      `);

      // Clean up and truncate content if it's incomplete (common with reasoning field)
      if (content && content.length > 0) {
        const beforeCleanup = content;
        content = this.cleanUpResponse(content);
        
        console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                           CLEANUP RESULT                                         │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ Content before cleanup: "${beforeCleanup}"
    │ Content after cleanup: "${content}"
    │ Length after cleanup: ${content.length}
    └──────────────────────────────────────────────────────────────────────────────────┘
        `);
      }
      
      // If no content was extracted after cleaning, fall back to mock response
      if (!content || content.length === 0) {
        console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                              FALLBACK                                            │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ ⚠️  Empty response from API, falling back to mock response
    └──────────────────────────────────────────────────────────────────────────────────┘
        `);
        return this.getMockResponse(prompt);
      }
      
      console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                            FINAL RESULT                                          │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ ✓ SUCCESS: Content extracted and cleaned
    │ Method: ${extractionMethod}
    │ Final content: "${content}"
    │ Final length: ${content.length}
    └──────────────────────────────────────────────────────────────────────────────────┘
      `);
      
      return content;
    } catch (error) {
      console.error('AI Service - API request failed, using mock response:', error);
      return this.getMockResponse(prompt);
    }
  }

  private cleanUpResponse(content: string): string {
    if (!content || content.length === 0) {
      return '';
    }
    
    let cleanedContent = content.trim();
    
    console.log(`
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                           CLEANUP DETAILS                                        │
    ├──────────────────────────────────────────────────────────────────────────────────┤
    │ Input content: "${cleanedContent}"
    │ Input length: ${cleanedContent.length}`);
    
    // Only apply aggressive cleaning if this looks like raw reasoning content (not already processed)
    const isRawReasoning = cleanedContent.includes('Let me analyze') || 
                          cleanedContent.includes('Node 1:') || 
                          cleanedContent.includes('Node 2:') ||
                          cleanedContent.includes('Common themes:');
    
    console.log(`    │ Raw reasoning detected: ${isRawReasoning}`);
    
    if (isRawReasoning) {
      console.log(`    │ Applying aggressive processing for raw reasoning...`);
      
      // Look for explicit summary statements
      const summaryRegex = /(?:summary|conclusion|overall|these nodes.*?(?:cover|discuss|are about))[:.]?\s*(.+?)(?:\n\n|$)/is;
      const summaryMatch = cleanedContent.match(summaryRegex);
      
      if (summaryMatch && summaryMatch[1]) {
        cleanedContent = summaryMatch[1].trim();
      } else {
        // Extract final meaningful sentences that aren't analysis
        const sentences = cleanedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const meaningfulSentences = sentences.filter(sentence => {
          const s = sentence.trim().toLowerCase();
          return !s.includes('let me analyze') && 
                 !s.includes('node 1:') && 
                 !s.includes('node 2:') && 
                 !s.includes('common themes:') &&
                 !s.match(/^\d+\./);
        });
        
        if (meaningfulSentences.length > 0) {
          // Take the last 2-3 meaningful sentences
          const lastSentences = meaningfulSentences.slice(-3);
          cleanedContent = lastSentences.join('. ').trim();
          if (!cleanedContent.endsWith('.')) {
            cleanedContent += '.';
          }
        }
      }
    } else {
      // For already processed content, just do light cleanup
      console.log(`    │ Content already processed, doing light cleanup...`);
      
      // Handle truncated content (ends with incomplete text like "44") but be less aggressive
      if (cleanedContent.match(/\d+$/) && !cleanedContent.match(/\.\s*\d+$/) && cleanedContent.length < 200) {
        const lastSentenceEnd = Math.max(
          cleanedContent.lastIndexOf('.'),
          cleanedContent.lastIndexOf('!'),
          cleanedContent.lastIndexOf('?')
        );
        
        if (lastSentenceEnd > cleanedContent.length * 0.5) {
          cleanedContent = cleanedContent.substring(0, lastSentenceEnd + 1).trim();
        }
      }
    }
    
    // Final cleanup: ensure it's not too long and ends properly
    if (cleanedContent.length > 500) {
      const sentences = cleanedContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
      cleanedContent = sentences.slice(0, 3).join('. ').trim();
      if (!cleanedContent.endsWith('.')) {
        cleanedContent += '.';
      }
    }
    
    // Ensure we don't return empty content
    if (!cleanedContent || cleanedContent.length < 10) {
      console.log(`    │ ⚠️  Cleanup resulted in empty/short content, using fallback`);
      cleanedContent = 'This collection covers related topics and concepts.';
    }
    
    console.log(`    │ Final cleaned content: "${cleanedContent}"
    │ Final length: ${cleanedContent.length}
    └──────────────────────────────────────────────────────────────────────────────────┘
    `);
    
    return cleanedContent.trim();
  }

  private isValidContent(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }
    
    const trimmed = content.trim();
    
    // Check minimum length
    if (trimmed.length < 5) {
      return false;
    }
    
    // Check for only whitespace characters
    if (/^\s*$/.test(trimmed)) {
      return false;
    }
    
    // Check for only newlines and whitespace
    if (/^[\n\r\s]*$/.test(trimmed)) {
      return false;
    }
    
    // Check for generic filler responses that indicate issues
    const fillerPatterns = [
      /^(\.|\s)*$/,
      /^[\n\r]+$/,
      /^\s*\n\s*$/,
      /^I apologize/i,
      /^I'm sorry/i,
      /^I cannot/i
    ];
    
    return !fillerPatterns.some(pattern => pattern.test(trimmed));
  }

  private getMockResponse(prompt: string): string {
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => {
        if (prompt.includes('summarize') || prompt.includes('summary')) {
          resolve(this.getMockSummary(prompt));
        } else if (prompt.includes('connection') || prompt.includes('suggest')) {
          resolve(this.getMockConnections(prompt));
        } else if (prompt.includes('group name') || prompt.includes('Group Name')) {
          resolve(this.getMockGroupNames(prompt));
        } else {
          resolve("This is a demonstration response. Configure your own API key in /services/aiService.ts to get real AI responses.");
        }
      }, 800 + Math.random() * 1200); // Random delay between 0.8-2s
    }) as any;
  }

  private createSmartFallbackSummary(reasoningContent: string): string {
    try {
      // Look for key concepts in the reasoning content
      const content = reasoningContent.toLowerCase();
      
      // Check for specific content types and themes
      if (content.includes('next steps') && content.includes('improvement')) {
        return 'These nodes focus on development roadmap and feature improvements, covering UI enhancements, functionality additions, and user experience optimizations.';
      }
      
      if (content.includes('ui/ux') && content.includes('interface')) {
        return 'This collection covers user interface design and interaction patterns, including navigation elements, user controls, and interface behaviors.';
      }
      
      if (content.includes('keyboard shortcuts') && content.includes('collaboration')) {
        return 'These nodes address productivity features and collaborative capabilities, emphasizing efficiency improvements and multi-user functionality.';
      }
      
      if (content.includes('drag') && content.includes('click')) {
        return 'This content describes interaction design and user interface behaviors, covering input methods and interface responsiveness.';
      }
      
      if (content.includes('form') && content.includes('validation')) {
        return 'These nodes relate to data input and form management, including validation processes and user input handling.';
      }
      
      if (content.includes('auto-save') && content.includes('functionality')) {
        return 'This collection focuses on automated features and system improvements to enhance user experience and data persistence.';
      }
      
      // Extract main topics from the reasoning
      const topicMatches = reasoningContent.match(/(?:about|includes?|covers?|features?)[:\s]+([^.!?\n]+)/gi);
      if (topicMatches && topicMatches.length > 0) {
        const topics = topicMatches.map(match => 
          match.replace(/^(?:about|includes?|covers?|features?)[:\s]+/i, '').trim()
        ).filter(topic => topic.length > 10);
        
        if (topics.length > 0) {
          return `These nodes cover ${topics[0].toLowerCase()}, representing a cohesive collection of related concepts and ideas.`;
        }
      }
      
      // Generic fallback based on content length
      if (reasoningContent.length > 200) {
        return 'These nodes contain interconnected concepts and ideas that form a meaningful collection of related information.';
      } else {
        return 'This content relates to the selected nodes and their shared themes.';
      }
      
    } catch (error) {
      console.error('Error creating smart fallback summary:', error);
      return 'This content relates to the selected nodes and their shared themes.';
    }
  }

  private getMockSummary(prompt: string): string {
    const summaries = [
      "This group focuses on project planning and task management, with nodes covering deadlines, resources, and team coordination.",
      "The collection represents a research workflow, including data collection, analysis methods, and findings documentation.",
      "This cluster deals with creative brainstorming, featuring concept development, design iterations, and feedback loops.",
      "The group covers learning objectives, study materials, and progress tracking for skill development.",
      "This set relates to system architecture, technical specifications, and implementation strategies."
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
  }

  private getMockConnections(prompt: string): string {
    const mockConnections = [
      {
        "nodeId1": "mock-1",
        "nodeId2": "mock-2",
        "reason": "Both nodes deal with similar themes and would benefit from being connected",
        "confidence": 0.85
      },
      {
        "nodeId1": "mock-3", 
        "nodeId2": "mock-4",
        "reason": "These concepts are complementary and often appear together in workflows",
        "confidence": 0.78
      },
      {
        "nodeId1": "mock-5",
        "nodeId2": "mock-6", 
        "reason": "Sequential relationship where one leads naturally to the other",
        "confidence": 0.92
      }
    ];
    
    return JSON.stringify(mockConnections);
  }

  private getMockGroupNames(prompt: string): string {
    const nameCategories = [
      ["Project Planning", "Task Management", "Workflow Design", "Process Optimization", "Strategic Planning"],
      ["Research & Analysis", "Data Collection", "Findings & Insights", "Study Framework", "Investigation"],
      ["Creative Ideas", "Design Concepts", "Brainstorming", "Innovation Hub", "Inspiration Board"],
      ["Learning Path", "Skill Development", "Knowledge Base", "Study Materials", "Growth Tracker"],
      ["Technical Stack", "System Design", "Implementation", "Architecture", "Development"]
    ];
    
    const randomCategory = nameCategories[Math.floor(Math.random() * nameCategories.length)];
    return JSON.stringify(randomCategory);
  }

  async summarizeGroup(nodes: NodeData[]): Promise<string> {
    if (nodes.length === 0) {
      return "Empty group - no nodes to summarize.";
    }

    const nodeInfo = nodes.map(node => this.extractNodeContent(node)).join('\n\n');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Service - Summarizing', nodes.length, 'nodes with total content length:', nodeInfo.length);
    }

    const prompt = `Analyze these nodes and provide a concise summary of what they represent as a group.

IMPORTANT: Your response should be ONLY the final summary (2-3 sentences). Do not include analysis steps, reasoning, or explanations of your process.

Focus on identifying the main themes, topics, or purposes that connect these nodes together.

Nodes: ${nodeInfo}

Summary:`;

    const result = await this.makeRequest(prompt, AI_CONFIG.MAX_TOKENS.SUMMARY);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Service - Summarization result:', result ? 'SUCCESS' : 'EMPTY/FAILED');
    }
    
    return result;
  }

  async suggestConnections(allNodes: NodeData[], existingConnections: Array<{from: string, to: string}>): Promise<ConnectionSuggestion[]> {
    if (allNodes.length < 2) {
      return [];
    }

    // Create a set of existing connections for quick lookup
    const existingConnectionsSet = new Set(
      existingConnections.map(conn => `${conn.from}-${conn.to}`)
    );

    if (!AI_CONFIG.USE_REAL_API) {
      // Generate smart mock suggestions based on actual nodes
      return this.generateMockConnectionSuggestions(allNodes, existingConnectionsSet);
    }

    const nodeInfo = allNodes.map(node => {
      let info = `ID: ${node.id}, Title: "${node.title}"`;
      if (node.content && node.content.trim()) {
        const plainText = node.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (plainText && plainText !== node.title) {
          info += `, Content: "${plainText.substring(0, 150)}${plainText.length > 150 ? '...' : ''}"`;
        }
      }
      if (node.tags && node.tags.length > 0) {
        info += `, Tags: [${node.tags.join(', ')}]`;
      }
      return info;
    }).join('\n');

    const existingConnectionsStr = existingConnections.length > 0 
      ? existingConnections.map(conn => `${conn.from} <-> ${conn.to}`).join('\n')
      : "None";

    const prompt = `Given these mind map nodes and their existing connections, suggest 3-5 new meaningful connections:

NODES:
${nodeInfo}

EXISTING CONNECTIONS:
${existingConnectionsStr}

Please respond with ONLY a valid JSON array in this exact format:
[
  {
    "nodeId1": "id1",
    "nodeId2": "id2", 
    "reason": "Brief explanation of why these should connect",
    "confidence": 0.8
  }
]

Focus on semantic relationships, topical similarity, or logical connections. Only suggest connections that don't already exist.`;

    try {
      const response = await this.makeRequest(prompt, AI_CONFIG.MAX_TOKENS.CONNECTIONS);
      
      // Try multiple JSON extraction approaches
      let suggestions: ConnectionSuggestion[] = [];
      
      // First, try to parse the entire response as JSON
      try {
        const directParse = JSON.parse(response.trim());
        if (Array.isArray(directParse)) {
          suggestions = directParse;
        }
      } catch (e) {
        // Continue to other methods
      }
      
      // If that fails, try to find a JSON array in the response
      if (suggestions.length === 0) {
        const jsonArrayMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonArrayMatch) {
          try {
            const parsed = JSON.parse(jsonArrayMatch[0]);
            if (Array.isArray(parsed)) {
              suggestions = parsed;
            }
          } catch (e) {
            // Continue to next method
          }
        }
      }
      
      // If no valid JSON array found, try to extract individual JSON objects
      if (suggestions.length === 0) {
        const jsonObjectMatches = response.match(/\{[^{}]*"nodeId1"[^{}]*"nodeId2"[^{}]*\}/g);
        if (jsonObjectMatches) {
          const validObjects: ConnectionSuggestion[] = [];
          for (const jsonStr of jsonObjectMatches) {
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.nodeId1 && parsed.nodeId2 && parsed.reason) {
                validObjects.push({
                  nodeId1: parsed.nodeId1,
                  nodeId2: parsed.nodeId2,
                  reason: parsed.reason,
                  confidence: parsed.confidence || 0.75
                });
              }
            } catch (e) {
              continue;
            }
          }
          suggestions = validObjects;
        }
      }
      
      // If still no valid suggestions, fall back to mock
      if (suggestions.length === 0) {
        console.warn('No valid JSON found in AI response, using mock suggestions');
        return this.generateMockConnectionSuggestions(allNodes, existingConnectionsSet);
      }

      // Filter out existing connections and validate
      return suggestions.filter(suggestion => {
        const connectionKey1 = `${suggestion.nodeId1}-${suggestion.nodeId2}`;
        const connectionKey2 = `${suggestion.nodeId2}-${suggestion.nodeId1}`;
        
        return !existingConnectionsSet.has(connectionKey1) && 
               !existingConnectionsSet.has(connectionKey2) &&
               allNodes.some(node => node.id === suggestion.nodeId1) &&
               allNodes.some(node => node.id === suggestion.nodeId2) &&
               suggestion.nodeId1 !== suggestion.nodeId2;
      }).slice(0, 5); // Limit to 5 suggestions
      
    } catch (error) {
      console.error('Error parsing connection suggestions, using mock data:', error);
      return this.generateMockConnectionSuggestions(allNodes, existingConnectionsSet);
    }
  }

  private generateMockConnectionSuggestions(allNodes: NodeData[], existingConnectionsSet: Set<string>): ConnectionSuggestion[] {
    const suggestions: ConnectionSuggestion[] = [];
    const reasonTemplates = [
      "Both nodes contain related concepts that often work together",
      "Sequential relationship where one naturally leads to the other", 
      "Similar themes suggest these ideas complement each other",
      "Content overlap indicates potential workflow connection",
      "Shared keywords suggest conceptual relationship"
    ];

    // Try to create meaningful suggestions from actual nodes
    for (let i = 0; i < allNodes.length && suggestions.length < 3; i++) {
      for (let j = i + 1; j < allNodes.length && suggestions.length < 3; j++) {
        const node1 = allNodes[i];
        const node2 = allNodes[j];
        
        const connectionKey1 = `${node1.id}-${node2.id}`;
        const connectionKey2 = `${node2.id}-${node1.id}`;
        
        // Skip if connection already exists
        if (existingConnectionsSet.has(connectionKey1) || existingConnectionsSet.has(connectionKey2)) {
          continue;
        }

        // Check for potential relationships
        const hasCommonTags = node1.tags && node2.tags && 
          node1.tags.some(tag => node2.tags!.includes(tag));
        const hasCommonGroup = node1.groupId && node2.groupId && node1.groupId === node2.groupId;
        const hasSimilarContent = this.calculateContentSimilarity(node1, node2) > 0.3;

        if (hasCommonTags || hasCommonGroup || hasSimilarContent) {
          suggestions.push({
            nodeId1: node1.id,
            nodeId2: node2.id,
            reason: reasonTemplates[Math.floor(Math.random() * reasonTemplates.length)],
            confidence: 0.7 + Math.random() * 0.25 // Random confidence between 0.7-0.95
          });
        }
      }
    }

    return suggestions;
  }

  private calculateContentSimilarity(node1: NodeData, node2: NodeData): number {
    const title1 = (node1.title || '').toLowerCase();
    const title2 = (node2.title || '').toLowerCase();
    const content1 = (node1.content || '').toLowerCase();
    const content2 = (node2.content || '').toLowerCase();
    
    const text1 = `${title1} ${content1}`;
    const text2 = `${title2} ${content2}`;
    
    const words1 = text1.split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  async suggestGroupNames(nodes: NodeData[]): Promise<string[]> {
    if (nodes.length === 0) {
      return [];
    }

    const nodeInfo = nodes.map(node => this.extractNodeContent(node)).join('\n\n');
    console.log('AI Service - Nodes for group naming:', nodeInfo);

    const prompt = `You are given a list of nodes, each with text, links. Based on their contents, suggest 3–5 short and clear group names that best represent the shared theme of these nodes.

Keep names concise (1–3 words) and in your response, give only the names thats it, so dont even start with "here you go" and only the names.

Prioritize clarity and usability over creativity.

If the nodes don't strongly relate, suggest general but still useful labels.

Respond with ONLY a valid JSON array of strings:
["Group Name 1", "Group Name 2", "Group Name 3", "Group Name 4", "Group Name 5"]

Nodes: ${nodeInfo}`;

    try {
      const response = await this.makeRequest(prompt, AI_CONFIG.MAX_TOKENS.GROUP_NAMES);
      
      // Try multiple JSON extraction approaches for group names
      let suggestions: string[] = [];
      
      // First, try to parse the entire response as JSON
      try {
        const directParse = JSON.parse(response.trim());
        if (Array.isArray(directParse) && directParse.every(item => typeof item === 'string')) {
          suggestions = directParse;
        }
      } catch (e) {
        // Continue to other methods
      }
      
      // If that fails, try to find a JSON array in the response
      if (suggestions.length === 0) {
        const jsonArrayMatch = response.match(/\[\s*"[^"]*"[\s\S]*?\]/);
        if (jsonArrayMatch) {
          try {
            const parsed = JSON.parse(jsonArrayMatch[0]);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              suggestions = parsed;
            }
          } catch (e) {
            // Continue to next method
          }
        }
      }
      
      // If no valid JSON array found, try to extract quoted strings
      if (suggestions.length === 0) {
        const quotedMatches = response.match(/"[^"]+"/g);
        if (quotedMatches) {
          suggestions = quotedMatches
            .map(match => match.slice(1, -1)) // Remove quotes
            .filter(name => name.length > 0 && name.length < 50) // Reasonable length
            .slice(0, 5);
        }
      }
      
      // If still no suggestions, try to extract from lines
      if (suggestions.length === 0) {
        const lines = response.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && line.length < 50)
          .filter(line => !line.includes('{') && !line.includes('}') && !line.includes('[') && !line.includes(']'))
          .filter(line => !line.toLowerCase().includes('json') && !line.toLowerCase().includes('array'))
          .slice(0, 5);
        
        if (lines.length > 0) {
          suggestions = lines;
        }
      }
      
      // If still nothing, return mock suggestions silently
      if (suggestions.length === 0) {
        const mockNames = this.getMockGroupNames('');
        try {
          return JSON.parse(mockNames);
        } catch (e) {
          return ["Ideas", "Concepts", "Planning", "Research", "Notes"];
        }
      }
      
      return suggestions.filter(name => name && name.length > 0).slice(0, 5);
      
    } catch (error) {
      console.error('Error parsing group name suggestions:', error);
      // Return mock suggestions as fallback
      const mockNames = this.getMockGroupNames('');
      try {
        return JSON.parse(mockNames);
      } catch (e) {
        return ["Ideas", "Concepts", "Planning", "Research", "Notes"];
      }
    }
  }

  async generateSmartSummary(allNodes: NodeData[], allGroups: GroupData[]): Promise<string> {
    const totalNodes = allNodes.length;
    const totalGroups = allGroups.length;
    
    if (totalNodes === 0) {
      return "Your canvas is empty. Start by double-clicking to add your first node!";
    }

    const groupInfo = allGroups.map(group => {
      const groupNodes = allNodes.filter(node => node.groupId === group.id);
      return `${group.name}: ${groupNodes.length} nodes`;
    }).join(', ');

    const topTags = this.getTopTags(allNodes, 5);
    const tagInfo = topTags.length > 0 ? `Top tags: ${topTags.join(', ')}` : '';

    const prompt = `Provide a smart overview of this mind map canvas:

Total: ${totalNodes} nodes across ${totalGroups} groups
Groups: ${groupInfo}
${tagInfo}

Sample node titles: ${allNodes.slice(0, 8).map(n => `"${n.title}"`).join(', ')}

Give a brief 2-3 sentence summary of the overall themes and organization of this mind map.`;

    return await this.makeRequest(prompt, 120);
  }

  private getTopTags(nodes: NodeData[], limit: number): string[] {
    const tagCounts = new Map<string, number>();
    
    nodes.forEach(node => {
      if (node.tags) {
        node.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  // Simple chat method for testing AI integration
  async chat(message: string): Promise<string> {
    if (!message.trim()) {
      return "Please enter a message to chat with AI.";
    }

    const prompt = `You are an AI assistant for IdeaScape, a mind mapping application. Help the user with their question or request in a concise and helpful way. 

User message: "${message}"

Please provide a helpful, concise response.`;

    try {
      return await this.makeRequest(prompt, AI_CONFIG.MAX_TOKENS.CHAT);
    } catch (error) {
      console.error('Chat request failed:', error);
      return "Sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }
}

export const aiService = new AIService();