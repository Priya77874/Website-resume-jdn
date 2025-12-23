import { GoogleGenAI } from "@google/genai";

// Netlify Function handler (V2 standard syntax or V1 default export)
// This file must be in netlify/functions/gemini.mjs
export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 1. Get the API Key securely from Netlify Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error: API Key missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Parse the incoming request body
    const body = await req.json();
    const { currentContent, instruction, mode } = body;

    const ai = new GoogleGenAI({ apiKey });
    let prompt;

    if (mode === 'chat') {
       // General Assistant Mode
       if (!instruction) {
          return new Response(JSON.stringify({ error: "Missing user query." }), { status: 400 });
       }
       prompt = `
         Role: Professional & Helpful Career Assistant.
         User Query: "${instruction}"
         Task: Provide a clear, professional, and helpful answer related to resumes, job interviews, career advice, or general queries. Keep it concise.
         Output: Plain text with simple formatting if needed.
       `;
    } else {
       // Resume Improver Mode (Default)
       if (!instruction) {
          return new Response(JSON.stringify({ error: "Missing instruction." }), { status: 400 });
       }
       // Note: currentContent can be empty if generating new content
       prompt = `
         Role: Professional Resume Editor.
         Task: Rewrite or Generate resume content based on this instruction: "${instruction}".
         ${currentContent ? `Content to Rewrite: "${currentContent}"` : ''}
         Constraint: Return ONLY the improved HTML code suitable for insertion into a <div> or <ul>. Do not add markdown blocks like \`\`\`html. Keep formatting simple.
       `;
    }

    // 5. Call the model
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // 6. Clean and return the result
    let result = response.text || '';
    if (mode !== 'chat') {
        result = result.replace(/```html/g, '').replace(/```/g, '').trim();
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Gemini Function Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate content." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};