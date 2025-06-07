// // // const OpenAI = require("openai");
// // // const dotenv = require('dotenv');
// // // dotenv.config();

// // // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// // // if (!OPENAI_API_KEY) {
// // //     console.error('OpenAI API key is missing. Please check your .env file.');
// // // }

// // // const openai = new OpenAI({
// // //     apiKey: OPENAI_API_KEY,
// // //     dangerouslyAllowBrowser: true
// // // });

// // // // More accurate token counting function for OpenAI models
// // // const countTokens = (text) => {
// // //     // A rough approximation: 1 token is roughly 4 characters for English text
// // //     // This is still an approximation; for production, consider using a tokenizer library
// // //     return Math.ceil(text.length / 4);
// // // };

// // // // Create chunks based on a maximum token count
// // // const createTokenAwareChunks = (transcripts, maxTokensPerChunk = 40000) => {
// // //     // Reserve tokens for system message and other conversation elements
// // //     const reservedTokens = 5000;
// // //     const effectiveMaxTokens = maxTokensPerChunk - reservedTokens;
    
// // //     const chunks = [];
// // //     let currentChunk = [];
// // //     let currentChunkTokens = 0;
    
// // //     for (let i = 0; i < transcripts.length; i++) {
// // //         const transcript = transcripts[i];
// // //         const transcriptJson = JSON.stringify(transcript, null, 2);
// // //         const transcriptTokens = countTokens(transcriptJson);
        
// // //         // If a single transcript exceeds the effective max tokens,
// // //         // we need to include it alone (can't split JSON objects easily)
// // //         if (transcriptTokens > effectiveMaxTokens) {
// // //             console.warn(`Transcript at index ${i} exceeds token limit (${transcriptTokens} tokens). Including it as a single chunk.`);
            
// // //             // If we have items in the current chunk, finalize it first
// // //             if (currentChunk.length > 0) {
// // //                 chunks.push([...currentChunk]);
// // //                 currentChunk = [];
// // //                 currentChunkTokens = 0;
// // //             }
            
// // //             // Add the large transcript as its own chunk
// // //             chunks.push([transcript]);
// // //             continue;
// // //         }
        
// // //         // If adding this transcript would exceed the token limit, finalize the current chunk
// // //         if (currentChunkTokens + transcriptTokens > effectiveMaxTokens && currentChunk.length > 0) {
// // //             chunks.push([...currentChunk]);
// // //             currentChunk = [];
// // //             currentChunkTokens = 0;
// // //         }
        
// // //         // Add the transcript to the current chunk
// // //         currentChunk.push(transcript);
// // //         currentChunkTokens += transcriptTokens;
// // //     }
    
// // //     // Add any remaining transcripts in the current chunk
// // //     if (currentChunk.length > 0) {
// // //         chunks.push(currentChunk);
// // //     }
    
// // //     return chunks;
// // // };

// // // // Sleep function for rate limit handling
// // // const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // // // Make OpenAI API call with retry logic for rate limits
// // // const callOpenAIWithRetry = async (messages, model, temperature, maxRetries = 3) => {
// // //     let retries = 0;
    
// // //     while (retries <= maxRetries) {
// // //         try {
// // //             const result = await openai.chat.completions.create({
// // //                 messages: messages,
// // //                 model: model,
// // //                 temperature: temperature,
// // //             });
            
// // //             return result;
// // //         } catch (error) {
// // //             // Check if it's a rate limit error
// // //             if (error.error?.code === 'rate_limit_exceeded' && retries < maxRetries) {
// // //                 // Get retry time from header or use exponential backoff
// // //                 const retryAfterMs = error.headers?.['retry-after-ms'] 
// // //                     ? parseInt(error.headers['retry-after-ms'])
// // //                     : Math.pow(2, retries) * 1000; // Exponential backoff: 1s, 2s, 4s, ...
                
// // //                 console.log(`Rate limit reached. Retrying in ${retryAfterMs/1000} seconds...`);
// // //                 await sleep(retryAfterMs);
// // //                 retries++;
// // //             } else {
// // //                 // For other errors or if we've exhausted retries, throw the error
// // //                 throw error;
// // //             }
// // //         }
// // //     }
// // // };

// // // const generateClips = async (req, res) => {
// // //     try {
// // //         const { transcripts, customPrompt } = req.body;

// // //         if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
// // //             return res.status(400).json({
// // //                 success: false,
// // //                 message: "Invalid or missing transcripts data"
// // //             });
// // //         }

// // //         console.log("Generating clips from transcripts:", transcripts.length);
        
// // //         // Calculate total tokens in all transcripts
// // //         const allTranscriptsJson = JSON.stringify(transcripts, null, 2);
// // //         const totalTokens = countTokens(allTranscriptsJson);
// // //         console.log(`Total estimated tokens in all transcripts: ${totalTokens}`);

// // //         // Split transcripts into smaller token-aware chunks (max 40k tokens per chunk)
// // //         const transcriptChunks = createTokenAwareChunks(transcripts, 40000);
// // //         console.log(`Split transcripts into ${transcriptChunks.length} token-aware chunks`);
        
// // //         // Log token counts for each chunk
// // //         transcriptChunks.forEach((chunk, idx) => {
// // //             const chunkJson = JSON.stringify(chunk, null, 2);
// // //             const chunkTokens = countTokens(chunkJson);
// // //             console.log(`Chunk ${idx+1}: ${chunk.length} transcripts, ~${chunkTokens} tokens`);
// // //         });

// // //         // Array to store important segments identified in each chunk
// // //         let potentialSegments = [];
        
// // //         // Process each chunk separately, maintaining a summary of important segments
// // //         for (let i = 0; i < transcriptChunks.length; i++) {
// // //             const chunk = transcriptChunks[i];
// // //             const isFirstChunk = i === 0;
// // //             const isLastChunk = i === transcriptChunks.length - 1;
            
// // //             // Reset messages for each chunk to avoid token limit
// // //             const messages = [
// // //                 {
// // //                     role: "system",
// // //                     content: "You are a precise transcript processor and master storyteller with an emphasis on narrative cohesion and accuracy. When generating clips, you must maintain the exact wording from the source material while creating a compelling narrative flow. Never modify, paraphrase, or correct the original transcript text. Your task is to identify the most meaningful segments across transcripts and weave them into a coherent story. Produce only valid JSON arrays with accurate numeric values and exact transcript quotes. Accuracy and fidelity to the original content remain your highest priority while creating an engaging storyline."
// // //                 }
// // //             ];
            
// // //             // If we have potential segments from previous chunks, include them
// // //             if (potentialSegments.length > 0 && !isFirstChunk) {
// // //                 messages.push({
// // //                     role: "user",
// // //                     content: `Important segments identified from previous chunks (for reference only):\n${JSON.stringify(potentialSegments, null, 2)}`
// // //                 });
                
// // //                 messages.push({
// // //                     role: "assistant",
// // //                     content: "I've noted these important segments from previous chunks and will consider them as I analyze the next chunk."
// // //                 });
// // //             }
            
// // //             let chunkPrompt;
            
// // //             if (!isLastChunk) {
// // //                 // Processing chunks (first or middle) - identify important segments
// // //                 chunkPrompt = `
// // // USER CONTEXT: ${customPrompt || "Generate engaging clips from the transcript with accurate timestamps."}

// // // TASK: This is chunk ${i+1} of ${transcriptChunks.length} of transcript data. 

// // // Please analyze these transcripts and identify the most important 5-10 segments that could be part of a cohesive narrative. For each segment, provide:
// // // 1. The videoId
// // // 2. The exact transcript text (do not modify it)
// // // 3. The start and end times

// // // Return the segments as a JSON array in this format:
// // // [
// // //   {
// // //     "videoId": "string",
// // //     "transcriptText": "exact quote from transcript",
// // //     "startTime": number,
// // //     "endTime": number,
// // //     "notes": "brief explanation of why this segment is important to the narrative"
// // //   }
// // // ]

// // // Transcript Chunk ${i+1}/${transcriptChunks.length}:
// // // ${JSON.stringify(chunk, null, 2)}`;
// // //             } else {
// // //                 // Last chunk - generate the final output
// // //                 chunkPrompt = `
// // // USER CONTEXT: ${customPrompt || "Generate engaging clips from the transcript with accurate timestamps."}

// // // TASK: This is the final chunk (${i+1} of ${transcriptChunks.length}) of transcript data.

// // // Now that you have analyzed all chunks of transcript data, please create a cohesive narrative story by selecting and combining the most meaningful segments from ALL chunks, including those from previous important segments list and this final chunk.

// // // IMPORTANT: Return ONLY a valid JSON array with the final clip selections. All numbers should be fixed to 2 decimal places. DO NOT use JavaScript expressions or functions.

// // // OUTPUT FORMAT:
// // // [
// // //   {
// // //     "videoId": "string",
// // //     "transcriptText": "exact quote from transcript - do not modify or paraphrase",
// // //     "startTime": number (add buffer of -2.00 if start > 2.00),
// // //     "endTime": number (add buffer of +2.00)
// // //   }
// // // ]

// // // RULES:
// // // 1. TIMESTAMPS:
// // //    - Use exact numbers with 2 decimal places
// // //    - Add 2.00 second buffer at start (if start > 2.00)
// // //    - Add 2.00 second buffer at end
// // //    - Minimum 0.50 second gap between clips
// // //    - Duration: 3.00-60.00 seconds
// // //    - No overlapping segments, if a clip has 6.00 to 10.00, the other clip shouldn't starting time 6.00 to 10.00 !important

// // // 2. CONTENT ACCURACY:
// // //    - Use EXACT quotes from transcripts without modification
// // //    - Never paraphrase or reword the transcript content
// // //    - Retain all verbal nuances from the original
// // //    - Include complete sentences with their full context
// // //    - Maintain perfect accuracy of the spoken content

// // // 3. NARRATIVE STORYTELLING:
// // //    - Build a coherent story with a beginning, middle, and end
// // //    - Select segments that connect logically and thematically
// // //    - Create smooth transitions between different transcript segments
// // //    - Ensure the assembled clips tell a compelling, unified story
// // //    - Identify and highlight key narrative elements across transcripts

// // // 4. SELECTION CRITERIA:
// // //    - Maintain narrative flow and story progression
// // //    - Focus on relevant, meaningful content
// // //    - Remove filler content and digressions
// // //    - Prioritize clarity and articulation
// // //    - Select segments with clear speech and minimal background noise
// // //    - Choose segments that contribute meaningfully to the story arc

// // // Here are the important segments from previous chunks:
// // // ${JSON.stringify(potentialSegments, null, 2)}

// // // Current (final) chunk data:
// // // ${JSON.stringify(chunk, null, 2)}

// // // Remember: Return ONLY a valid JSON array with proper numeric values (no expressions). While creating a compelling narrative is important, transcript accuracy is still the highest priority.`;
// // //             }

// // //             // Calculate token count for this chunk's prompt
// // //             const promptTokens = countTokens(chunkPrompt);
// // //             console.log(`Chunk ${i+1} prompt: ~${promptTokens} tokens`);

// // //             // Add the current chunk prompt to the conversation
// // //             messages.push({
// // //                 role: "user",
// // //                 content: chunkPrompt
// // //             });

// // //             console.log(`Processing chunk ${i+1}/${transcriptChunks.length}...`);
            
// // //             try {
// // //                 // Call OpenAI with retry logic for rate limits
// // //                 const result = await callOpenAIWithRetry(
// // //                     messages, 
// // //                     "gpt-4o-mini-2024-07-18", 
// // //                     0.2
// // //                 );

// // //                 // Get token usage information if available
// // //                 if (result.usage) {
// // //                     console.log(`Chunk ${i+1} token usage:`, {
// // //                         promptTokens: result.usage.prompt_tokens,
// // //                         completionTokens: result.usage.completion_tokens,
// // //                         totalTokens: result.usage.total_tokens
// // //                     });
// // //                 }

// // //                 const responseContent = result.choices[0].message.content;

// // //                 // If this is the last chunk, we have the final result
// // //                 if (isLastChunk) {
// // //                     console.log("Final response received from OpenAI");

// // //                     // Extract the JSON portion from the response
// // //                     let jsonMatch;
// // //                     try {
// // //                         // Try to find JSON array in the response
// // //                         jsonMatch = responseContent.match(/\[\s*\{.*\}\s*\]/s);
// // //                         const jsonContent = jsonMatch ? jsonMatch[0] : responseContent;
                        
// // //                         // Validate the JSON
// // //                         JSON.parse(jsonContent);
                        
// // //                         return res.status(200).json({
// // //                             success: true,
// // //                             data: {
// // //                                 script: jsonContent
// // //                             },
// // //                             message: "Video script generated successfully"
// // //                         });
// // //                     } catch (jsonError) {
// // //                         console.error("Invalid JSON response from OpenAI:", responseContent);
// // //                         return res.status(500).json({
// // //                             success: false,
// // //                             message: "Failed to generate valid JSON response",
// // //                             error: jsonError.message
// // //                         });
// // //                     }
// // //                 } else {
// // //                     // For non-final chunks, extract important segments and add to running list
// // //                     try {
// // //                         // Try to extract JSON from response
// // //                         const jsonMatch = responseContent.match(/\[\s*\{.*\}\s*\]/s);
// // //                         if (jsonMatch) {
// // //                             const segmentsFromChunk = JSON.parse(jsonMatch[0]);
// // //                             // Add to our running list, but limit to keep token count manageable
// // //                             potentialSegments = [...potentialSegments, ...segmentsFromChunk].slice(-30);
// // //                             console.log(`Added ${segmentsFromChunk.length} potential segments from chunk ${i+1}`);
// // //                         } else {
// // //                             console.warn(`No valid JSON segments found in response for chunk ${i+1}`);
// // //                         }
// // //                     } catch (error) {
// // //                         console.warn(`Error parsing segments from chunk ${i+1}: ${error.message}`);
// // //                         // Continue processing even if we can't extract segments
// // //                     }
                    
// // //                     console.log(`Chunk ${i+1} processed successfully`);
// // //                 }
                
// // //             } catch (openaiError) {
// // //                 console.error(`OpenAI API error on chunk ${i+1}:`, openaiError);
                
// // //                 // Handle token limit errors specifically
// // //                 if (openaiError.error && openaiError.error.code === 'context_length_exceeded') {
// // //                     console.error(`Token limit exceeded for chunk ${i+1}. Attempting to divide this chunk further.`);
                    
// // //                     // If this is a large chunk that can't be processed, we could try dividing it further
// // //                     // For simplicity in this example, we'll just return an error
// // //                     return res.status(500).json({
// // //                         success: false,
// // //                         message: `Token limit exceeded for chunk ${i+1}. Please reduce the amount of transcript data.`,
// // //                         error: openaiError.message
// // //                     });
// // //                 }
                
// // //                 // Handle other specific OpenAI errors
// // //                 if (openaiError.status === 401) {
// // //                     return res.status(500).json({
// // //                         success: false,
// // //                         message: "OpenAI API authentication failed. Please check your API key.",
// // //                         error: openaiError.message
// // //                     });
// // //                 } else if (openaiError.status === 429) {
// // //                     return res.status(500).json({
// // //                         success: false,
// // //                         message: "OpenAI API rate limit exceeded. Please try again later.",
// // //                         error: openaiError.message
// // //                     });
// // //                 } else {
// // //                     return res.status(500).json({
// // //                         success: false,
// // //                         message: `OpenAI API error on chunk ${i+1}`,
// // //                         error: openaiError.message
// // //                     });
// // //                 }
// // //             }
// // //         }
// // //     } catch (error) {
// // //         console.error("General error in generateClips:", error);
// // //         return res.status(500).json({
// // //             success: false,
// // //             message: "Failed to generate video script",
// // //             error: error.message
// // //         });
// // //     }
// // // };

// // // module.exports = generateClips;

// // const OpenAI = require("openai");
// // const dotenv = require('dotenv');
// // dotenv.config();

// // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// // const openai = new OpenAI({
// //    apiKey: OPENAI_API_KEY,
// //    dangerouslyAllowBrowser: true
// // });

// // // Helper function to extract JSON from text
// // const extractJSONFromText = (text) => {
// //     // Try to find JSON array pattern
// //     const jsonArrayPattern = /\[[\s\S]*?\]/g;
// //     const matches = text.match(jsonArrayPattern);
    
// //     if (matches) {
// //         // Try each match until we find a valid JSON
// //         for (const match of matches) {
// //             try {
// //                 const parsed = JSON.parse(match);
// //                 if (Array.isArray(parsed) && parsed.length > 0) {
// //                     return parsed;
// //                 }
// //             } catch (e) {
// //                 continue;
// //             }
// //         }
// //     }
    
// //     // Try to find JSON object that might contain an array
// //     const jsonObjectPattern = /\{[\s\S]*?\}/g;
// //     const objectMatches = text.match(jsonObjectPattern);
    
// //     if (objectMatches) {
// //         for (const match of objectMatches) {
// //             try {
// //                 const parsed = JSON.parse(match);
// //                 // Look for array properties
// //                 for (const key in parsed) {
// //                     if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
// //                         return parsed[key];
// //                     }
// //                 }
// //             } catch (e) {
// //                 continue;
// //             }
// //         }
// //     }
    
// //     throw new Error("No valid JSON array found in response");
// // };

// // // Helper function to validate clip structure
// // const validateClipStructure = (clips) => {
// //     if (!Array.isArray(clips)) {
// //         throw new Error("Response is not an array");
// //     }
    
// //     if (clips.length === 0) {
// //         throw new Error("Empty clips array");
// //     }
    
// //     clips.forEach((clip, index) => {
// //         if (!clip.videoId || typeof clip.videoId !== 'string') {
// //             throw new Error(`Invalid videoId at index ${index}`);
// //         }
        
// //         if (!clip.transcriptText || typeof clip.transcriptText !== 'string') {
// //             throw new Error(`Invalid transcriptText at index ${index}`);
// //         }
        
// //         // Convert and validate timestamps
// //         const startTime = parseFloat(clip.startTime);
// //         const endTime = parseFloat(clip.endTime);
        
// //         if (isNaN(startTime) || isNaN(endTime)) {
// //             throw new Error(`Invalid timestamps at index ${index}`);
// //         }
        
// //         if (startTime >= endTime) {
// //             throw new Error(`startTime must be less than endTime at index ${index}`);
// //         }
        
// //         if (endTime - startTime < 3.0) {
// //             throw new Error(`Duration too short at index ${index}, minimum 3 seconds required`);
// //         }
        
// //         if (endTime - startTime > 60.0) {
// //             throw new Error(`Duration too long at index ${index}, maximum 60 seconds allowed`);
// //         }
        
// //         // Ensure proper formatting
// //         clip.startTime = parseFloat(startTime.toFixed(2));
// //         clip.endTime = parseFloat(endTime.toFixed(2));
// //     });
    
// //     return clips;
// // };

// // const generateClips = async (req, res) => {
// //     try {
// //         let Details = req.body.gotDetails;
// //         const customization = req.body.customization;
// //         const customPrompt = req.body.customPrompt;
        
// //         console.log("Details-PC> ", Details);

// //         Details = Object.entries(Details).slice(0, 5).map(([key, value]) => ({ [key]: value }));

// //         const basePrompt = `You are a video clip generator. Your task is to analyze video transcripts and create a cohesive video script by selecting the most relevant segments.

// // USER REQUEST: ${customPrompt}

// // CRITICAL INSTRUCTIONS:
// // 1. You MUST respond with ONLY a valid JSON array - no explanations, no markdown, no extra text
// // 2. The JSON array must contain objects with this exact structure:
// //    {
// //      "videoId": "string",
// //      "transcriptText": "exact quote from transcript", 
// //      "startTime": number,
// //      "endTime": number
// //    }

// // TIMESTAMP RULES:
// // - All timestamps must be numbers with exactly 2 decimal places
// // - startTime must be at least 2.00 seconds less than the original start (for buffer)
// // - endTime must be at least 2.00 seconds more than the original end (for buffer)  
// // - Minimum segment duration: 3.00 seconds
// // - Maximum segment duration: 60.00 seconds
// // - No overlapping segments - maintain 0.50 second gaps between clips
// // - All times must be >= 0.00

// // CONTENT RULES:
// // - Use only exact quotes from the provided transcripts
// // - Select segments that directly relate to: "${customPrompt}"
// // - Ensure logical flow between segments
// // - Include complete sentences/thoughts
// // - Focus on the most engaging and relevant content

// // SOURCE DATA:
// // ${JSON.stringify(Details, null, 2)}

// // EXAMPLE OUTPUT FORMAT:
// // [
// //   {
// //     "videoId": "video1",
// //     "transcriptText": "This is the exact quote from the transcript",
// //     "startTime": 12.50,
// //     "endTime": 18.75
// //   }
// // ]

// // RESPOND WITH ONLY THE JSON ARRAY - NO OTHER TEXT WHATSOEVER.`;

// //         const enhancedPrompt = customization ? 
// //             `${basePrompt}

// // STYLE PREFERENCES:
// // - Tone: ${customization.tone}
// // - Length: ${customization.length}  
// // - Style: ${customization.style}

// // Apply these preferences while maintaining the exact JSON structure above.

// // RESPOND WITH ONLY THE JSON ARRAY.`
// //             : basePrompt;
        
// //         console.log("Making OpenAI API call...");

// //         // Try with JSON mode first, fallback to regular mode if it fails
// //         let result;
// //         let usedJsonMode = false;
        
// //         try {
// //             // Attempt with JSON mode
// //             result = await openai.chat.completions.create({
// //                 messages: [{ role: "user", content: enhancedPrompt }],
// //                 model: "gpt-4o-mini-2024-07-18",
// //                 response_format: { type: "json_object" },
// //                 temperature: 0.1, // Lower temperature for more consistent output
// //                 store: true,
// //             });
// //             usedJsonMode = true;
// //             console.log("Successfully used JSON mode");
// //         } catch (jsonModeError) {
// //             console.log("JSON mode failed, falling back to regular mode:", jsonModeError.message);
            
// //             // Fallback to regular mode with enhanced prompt
// //             const fallbackPrompt = `${enhancedPrompt}

// // IMPORTANT: Since JSON mode is not available, you must be extra careful to return ONLY valid JSON. Start your response with [ and end with ]. Do not include any text before or after the JSON array.`;
            
// //             result = await openai.chat.completions.create({
// //                 messages: [{ role: "user", content: fallbackPrompt }],
// //                 model: "gpt-4o-mini-2024-07-18",
// //                 temperature: 0.1,
// //                 store: true,
// //             });
// //             usedJsonMode = false;
// //         }

// //         console.log("------");
// //         console.log("Used JSON mode:", usedJsonMode);

// //         let scriptContent = result.choices[0].message.content.trim();
// //         console.log("Raw response:", scriptContent);

// //         // Parse and validate the response
// //         let parsedScript;
        
// //         try {
// //             if (usedJsonMode && scriptContent.startsWith('{')) {
// //                 // JSON mode might wrap the array in an object
// //                 const parsed = JSON.parse(scriptContent);
                
// //                 // Look for array properties in the object
// //                 const arrayKeys = Object.keys(parsed).filter(key => Array.isArray(parsed[key]));
// //                 if (arrayKeys.length > 0) {
// //                     parsedScript = parsed[arrayKeys[0]];
// //                 } else if (parsed.clips && Array.isArray(parsed.clips)) {
// //                     parsedScript = parsed.clips;
// //                 } else if (parsed.segments && Array.isArray(parsed.segments)) {
// //                     parsedScript = parsed.segments;
// //                 } else {
// //                     throw new Error("No array found in JSON object");
// //                 }
// //             } else {
// //                 // Try direct parsing first
// //                 parsedScript = JSON.parse(scriptContent);
// //             }
// //         } catch (directParseError) {
// //             console.log("Direct parsing failed, trying extraction:", directParseError.message);
            
// //             try {
// //                 parsedScript = extractJSONFromText(scriptContent);
// //             } catch (extractError) {
// //                 console.error("All parsing methods failed");
// //                 console.error("Direct parse error:", directParseError.message);
// //                 console.error("Extract error:", extractError.message);
                
// //                 return res.status(500).json({
// //                     success: false,
// //                     message: "Failed to parse JSON response from OpenAI",
// //                     error: "Could not extract valid JSON array from response",
// //                     rawResponse: scriptContent,
// //                     usedJsonMode: usedJsonMode
// //                 });
// //             }
// //         }

// //         // Validate the parsed script
// //         try {
// //             parsedScript = validateClipStructure(parsedScript);
// //         } catch (validationError) {
// //             console.error("Validation failed:", validationError.message);
// //             return res.status(500).json({
// //                 success: false,
// //                 message: "Invalid clip structure in generated response",
// //                 error: validationError.message,
// //                 rawResponse: scriptContent,
// //                 parsedData: parsedScript
// //             });
// //         }

// //         console.log("Successfully parsed and validated clips:", parsedScript.length, "segments");

// //         return res.status(200).json({
// //             success: true,
// //             data: {
// //                 script: parsedScript
// //             },
// //             message: `Video script generated successfully with ${parsedScript.length} segments`,
// //             metadata: {
// //                 usedJsonMode: usedJsonMode,
// //                 segmentCount: parsedScript.length
// //             }
// //         });

// //     } catch (error) {
// //         console.error("Error in generateClips:", error);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Failed to generate video script",
// //             error: error.message,
// //             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
// //         });
// //     }
// // };

// // module.exports = generateClips;



// const OpenAI = require("openai");
// const dotenv = require('dotenv');
// dotenv.config();

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// const openai = new OpenAI({
//    apiKey: OPENAI_API_KEY,
//    dangerouslyAllowBrowser: true
// });

// const generateClips = async (req, res) => {
//     try {
//         let Details = req.body.gotDetails;
//         const customization = req.body.customization;
//         const customPrompt = req.body.customPrompt;
        
//         console.log("Details-PC> ", Details);

//         Details = Object.entries(Details).slice(0, 5).map(([key, value]) => ({ [key]: value }));

//         // Simplified, more explicit prompt
//         const prompt = `Create a JSON array of video clips based on this request: "${customPrompt}"

// Use these video transcripts:
// ${JSON.stringify(Details, null, 2)}

// Rules:
// 1. Return ONLY a JSON array - no explanations
// 2. Each object must have: videoId, transcriptText, startTime, endTime
// 3. Use exact quotes from transcripts
// 4. startTime and endTime must be numbers
// 5. Minimum 3 second duration per clip

// Example format:
// [{"videoId":"abc","transcriptText":"hello world","startTime":10.5,"endTime":15.2}]

// Your response must start with [ and end with ]`;

//         console.log("Making API call with simplified prompt...");

//         // Use the most basic API call possible
//         const result = await openai.chat.completions.create({
//             messages: [
//                 {
//                     role: "system", 
//                     content: "You are a JSON generator. You only respond with valid JSON arrays. Never add explanations or text outside the JSON."
//                 },
//                 {
//                     role: "user", 
//                     content: prompt
//                 }
//             ],
//             model: "gpt-4o-mini",  // Try the base model instead of the dated version
//             temperature: 0,
//             max_tokens: 2000
//         });

//         let rawResponse = result.choices[0].message.content;
//         console.log("=== RAW RESPONSE START ===");
//         console.log(rawResponse);
//         console.log("=== RAW RESPONSE END ===");
//         console.log("Response length:", rawResponse.length);
//         console.log("First 50 chars:", rawResponse.substring(0, 50));
//         console.log("Last 50 chars:", rawResponse.substring(rawResponse.length - 50));

//         // Clean the response
//         rawResponse = rawResponse.trim();
        
//         // Remove any markdown formatting
//         if (rawResponse.startsWith('```json')) {
//             rawResponse = rawResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
//         } else if (rawResponse.startsWith('```')) {
//             rawResponse = rawResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
//         }

//         console.log("=== CLEANED RESPONSE START ===");
//         console.log(rawResponse);
//         console.log("=== CLEANED RESPONSE END ===");

//         // Try to parse
//         let parsedData;
//         try {
//             parsedData = JSON.parse(rawResponse);
//             console.log("✅ Direct JSON parse successful");
//         } catch (parseError) {
//             console.log("❌ Direct parse failed:", parseError.message);
            
//             // Try to find JSON array in the text
//             const arrayMatch = rawResponse.match(/\[[\s\S]*\]/);
//             if (arrayMatch) {
//                 console.log("Found array pattern, attempting to parse...");
//                 try {
//                     parsedData = JSON.parse(arrayMatch[0]);
//                     console.log("✅ Regex extraction successful");
//                 } catch (regexError) {
//                     console.log("❌ Regex parse failed:", regexError.message);
                    
//                     // Last resort: try to fix common JSON issues
//                     let fixedJson = arrayMatch[0];
                    
//                     // Fix common issues
//                     fixedJson = fixedJson.replace(/,\s*}/g, '}'); // Remove trailing commas in objects
//                     fixedJson = fixedJson.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
//                     fixedJson = fixedJson.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
                    
//                     try {
//                         parsedData = JSON.parse(fixedJson);
//                         console.log("✅ JSON repair successful");
//                     } catch (repairError) {
//                         console.log("❌ JSON repair failed:", repairError.message);
                        
//                         return res.status(500).json({
//                             success: false,
//                             message: "Failed to parse JSON response",
//                             error: "Could not parse or repair JSON",
//                             rawResponse: rawResponse,
//                             parseError: parseError.message,
//                             regexError: regexError.message,
//                             repairError: repairError.message
//                         });
//                     }
//                 }
//             } else {
//                 console.log("❌ No JSON array pattern found");
//                 return res.status(500).json({
//                     success: false,
//                     message: "No JSON array found in response",
//                     error: "Response does not contain a JSON array",
//                     rawResponse: rawResponse,
//                     parseError: parseError.message
//                 });
//             }
//         }

//         // Validate the result
//         if (!Array.isArray(parsedData)) {
//             console.log("❌ Result is not an array:", typeof parsedData);
//             return res.status(500).json({
//                 success: false,
//                 message: "Response is not an array",
//                 error: `Expected array, got ${typeof parsedData}`,
//                 parsedData: parsedData
//             });
//         }

//         if (parsedData.length === 0) {
//             console.log("❌ Empty array returned");
//             return res.status(500).json({
//                 success: false,
//                 message: "Empty clips array",
//                 error: "No clips were generated",
//                 parsedData: parsedData
//             });
//         }

//         // Basic validation of each clip
//         for (let i = 0; i < parsedData.length; i++) {
//             const clip = parsedData[i];
//             if (!clip.videoId || !clip.transcriptText || 
//                 typeof clip.startTime !== 'number' || typeof clip.endTime !== 'number') {
//                 console.log(`❌ Invalid clip at index ${i}:`, clip);
//                 return res.status(500).json({
//                     success: false,
//                     message: `Invalid clip structure at index ${i}`,
//                     error: "Missing required fields or invalid types",
//                     invalidClip: clip,
//                     parsedData: parsedData
//                 });
//             }
//         }

//         console.log(`✅ Successfully generated ${parsedData.length} clips`);

//         return res.status(200).json({
//             success: true,
//             data: {
//                 script: parsedData
//             },
//             message: `Video script generated successfully with ${parsedData.length} clips`
//         });

//     } catch (error) {
//         console.error("❌ Unexpected error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Unexpected error occurred",
//             error: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };

// module.exports = generateClips;

const OpenAI = require("openai");
const dotenv = require('dotenv');
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
   apiKey: OPENAI_API_KEY,
   dangerouslyAllowBrowser: true
});

const generateClips = async (req, res) => {
    try {
        let Details = req.body.gotDetails;
        const customization = req.body.customization;
        const customPrompt = req.body.customPrompt;
        
        console.log("=== DEBUGGING START ===");
        console.log("Details received:", JSON.stringify(Details, null, 2));
        console.log("Custom prompt:", customPrompt);
        console.log("Customization:", customization);

        // Simplified input processing
        if (!Details || Object.keys(Details).length === 0) {
            console.log("❌ No details provided");
            return res.status(400).json({
                success: false,
                message: "No video details provided",
                error: "Details object is empty or missing"
            });
        }

        Details = Object.entries(Details).slice(0, 3).map(([key, value]) => ({ [key]: value }));
        console.log("Processed details:", JSON.stringify(Details, null, 2));

        // Super simple prompt - just ask for a basic JSON array
        const prompt = `Given these video transcripts, create a JSON array with 2-3 video clips.

Data: ${JSON.stringify(Details)}

Requirements:
- Return only a JSON array
- Each item needs: videoId, transcriptText, startTime, endTime
- Use real data from the transcripts above
- Make startTime and endTime numbers

Format: [{"videoId":"id1","transcriptText":"quote here","startTime":10,"endTime":20}]`;

        console.log("=== MAKING API CALL ===");
        console.log("Prompt length:", prompt.length);

        let result;
        try {
            result = await openai.chat.completions.create({
                messages: [
                    { role: "user", content: prompt }
                ],
                model: "gpt-3.5-turbo", // Try the most stable model
                temperature: 0,
                max_tokens: 1000
            });
            console.log("✅ OpenAI API call successful");
        } catch (apiError) {
            console.log("❌ OpenAI API call failed:", apiError.message);
            return res.status(500).json({
                success: false,
                message: "OpenAI API call failed",
                error: apiError.message
            });
        }

        const rawResponse = result.choices[0].message.content;
        
        console.log("=== RAW RESPONSE DEBUG ===");
        console.log("Type:", typeof rawResponse);
        console.log("Length:", rawResponse ? rawResponse.length : 'null');
        console.log("First 100 chars:", rawResponse ? rawResponse.substring(0, 100) : 'null');
        console.log("Last 100 chars:", rawResponse ? rawResponse.substring(Math.max(0, rawResponse.length - 100)) : 'null');
        console.log("Full response:");
        console.log("'" + rawResponse + "'");
        console.log("=== END RAW RESPONSE ===");

        if (!rawResponse || rawResponse.trim().length === 0) {
            console.log("❌ Empty response from OpenAI");
            return res.status(500).json({
                success: false,
                message: "Empty response from OpenAI",
                error: "OpenAI returned empty response"
            });
        }

        let cleanResponse = rawResponse.trim();
        
        // Remove common markdown formatting
        if (cleanResponse.includes('```')) {
            const codeBlockMatch = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                cleanResponse = codeBlockMatch[1].trim();
                console.log("✅ Extracted from code block");
            }
        }

        console.log("=== CLEAN RESPONSE ===");
        console.log("'" + cleanResponse + "'");
        console.log("=== END CLEAN RESPONSE ===");

        // Try parsing
        let jsonData = null;
        let parseErrors = [];

        // Attempt 1: Direct parse
        try {
            jsonData = JSON.parse(cleanResponse);
            console.log("✅ Direct parse successful");
        } catch (err) {
            parseErrors.push("Direct: " + err.message);
            console.log("❌ Direct parse failed:", err.message);
        }

        // Attempt 2: Find JSON array
        if (!jsonData) {
            const jsonMatch = cleanResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                try {
                    jsonData = JSON.parse(jsonMatch[0]);
                    console.log("✅ Array extraction successful");
                } catch (err) {
                    parseErrors.push("Array: " + err.message);
                    console.log("❌ Array parse failed:", err.message);
                }
            } else {
                parseErrors.push("Array: No array pattern found");
                console.log("❌ No array pattern found");
            }
        }

        // Attempt 3: Character by character analysis
        if (!jsonData) {
            console.log("=== CHARACTER ANALYSIS ===");
            for (let i = 0; i < Math.min(cleanResponse.length, 50); i++) {
                const char = cleanResponse[i];
                const code = cleanResponse.charCodeAt(i);
                console.log(`Char ${i}: '${char}' (${code})`);
            }
            console.log("=== END CHARACTER ANALYSIS ===");
        }

        if (!jsonData) {
            console.log("❌ All parsing attempts failed");
            return res.status(500).json({
                success: false,
                message: "Could not parse JSON response",
                error: "All parsing methods failed",
                rawResponse: rawResponse,
                cleanResponse: cleanResponse,
                parseErrors: parseErrors,
                responseAnalysis: {
                    length: rawResponse.length,
                    trimmedLength: cleanResponse.length,
                    startsWithBracket: cleanResponse.startsWith('['),
                    endsWithBracket: cleanResponse.endsWith(']'),
                    containsBrackets: cleanResponse.includes('[') && cleanResponse.includes(']'),
                    firstChar: cleanResponse.charCodeAt(0),
                    lastChar: cleanResponse.charCodeAt(cleanResponse.length - 1)
                }
            });
        }

        // Validate result
        if (!Array.isArray(jsonData)) {
            console.log("❌ Not an array:", typeof jsonData);
            return res.status(500).json({
                success: false,
                message: "Response is not an array",
                error: `Got ${typeof jsonData}, expected array`,
                data: jsonData
            });
        }

        if (jsonData.length === 0) {
            console.log("❌ Empty array");
            return res.status(500).json({
                success: false,
                message: "Empty array returned",
                error: "No clips generated"
            });
        }

        console.log("✅ Success! Generated", jsonData.length, "clips");
        console.log("Clips:", JSON.stringify(jsonData, null, 2));

        return res.status(200).json({
            success: true,
            data: {
                script: jsonData
            },
            message: `Generated ${jsonData.length} clips successfully`
        });

    } catch (error) {
        console.error("❌ Unexpected error in generateClips:", error);
        return res.status(500).json({
            success: false,
            message: "Unexpected error occurred",
            error: error.message,
            stack: error.stack
        });
    }
};

module.exports = generateClips;