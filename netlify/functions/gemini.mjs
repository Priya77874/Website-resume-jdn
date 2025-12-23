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
    const { currentContent, instruction } = body;

    if (!currentContent || !instruction) {
      return new Response(JSON.stringify({ error: "Missing content or instruction." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Initialize the Gemini API securely on the server side
    const ai = new GoogleGenAI({ apiKey });

    // 4. Construct the prompt
    const prompt = `
      Role: Professional Resume Editor.
      Task: Rewrite the following resume content based on this instruction: "${instruction}".
      
      Content to Rewrite:
      "${currentContent}"
      
      Constraint: Return ONLY the improved HTML code suitable for insertion into a <div> or <ul>. Do not add markdown blocks like \`\`\`html. Keep formatting simple.
    `;

    // 5. Call the model
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Or 'gemini-2.5-flash-latest'
      contents: prompt,
    });

    // 6. Clean and return the result
    let result = response.text || '';
    result = result.replace(/```html/g, '').replace(/```/g, '').trim();

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