/**
 * Calls the Google Gemini API directly from the frontend with streaming.
 * @param {Array<Object>} messages - The conversation history.
 * @returns {Promise<ReadableStreamDefaultReader>} A promise that resolves to a reader for the response stream.
 */
export async function streamOpenAIResponse(messages) {
  // WARNING: Exposing an API key on the client-side is a security risk.
  // This key should be treated as public and have strict usage limits and monitoring.
  // The recommended approach is to use a server-side proxy (like a Supabase Edge Function).
  const apiKey = "AIzaSyAUkhCwkfPIEV16m5RAbnfLM5f-RN2A-GI";
  const model = "gemini-1.5-flash";
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;
  
  // Gemini requires a specific content structure, alternating between 'user' and 'model' roles.
  // We'll filter out system prompts and ensure the structure is valid.
  const contents = messages
    .filter(msg => msg.role !== 'system') // Gemini doesn't use a 'system' role in the same way.
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user', // Convert 'assistant' to 'model'
      parts: [{ text: msg.content }],
    }));

  const response = await fetch(geminiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      // Optional: Add safety settings and generation config if needed
      // safetySettings: [...],
      // generationConfig: {...},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error calling Gemini API:", errorData);
    throw new Error(`Failed to call Gemini: ${errorData.error.message}`);
  }

  // Return the reader from the response body's stream
  return response.body.getReader();
}