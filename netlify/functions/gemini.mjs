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
    const { currentContent, instruction, mode, image } = body;

    const ai = new GoogleGenAI({ apiKey });
    let contents = [];

    if (mode === 'chat') {
       // General Assistant Mode
       let textPrompt = `
         Role: Professional & Helpful Career Assistant.
         User Query: "${instruction || ""}"
         Task: Provide a clear, professional, and helpful answer related to resumes, job interviews, career advice, or general queries. Keep it concise.
         Output: Plain text with simple formatting if needed.
       `;
       
       if (!instruction && !image) {
          return new Response(JSON.stringify({ error: "Missing user query or image." }), { status: 400 });
       }

       if (image) {
           // Multimodal Input
           // Image is expected to be a Data URI: data:image/png;base64,.....
           const matches = image.match(/^data:(.+);base64,(.+)$/);
           if (matches) {
               const mimeType = matches[1];
               const data = matches[2];
               contents = [
                   {
                       role: 'user',
                       parts: [
                           { text: textPrompt || "Analyze this image." },
                           { inlineData: { mimeType, data } }
                       ]
                   }
               ];
           } else {
               // Fallback or error if image format is invalid, but proceed with text if available
               contents = [{ role: 'user', parts: [{ text: textPrompt }] }];
           }
       } else {
           contents = [{ role: 'user', parts: [{ text: textPrompt }] }];
       }

    } else {
       // Resume Improver Mode (Default)
       if (!instruction) {
          return new Response(JSON.stringify({ error: "Missing instruction." }), { status: 400 });
       }
       // Note: currentContent can be empty if generating new content
       let prompt = `
         Role: Professional Resume Editor.
         Task: Rewrite or Generate resume content based on this instruction: "${instruction}".
         ${currentContent ? `Content to Rewrite: "${currentContent}"` : ''}
         Constraint: Return ONLY the improved HTML code suitable for insertion into a <div> or <ul>. Do not add markdown blocks like \`\`\`html. Keep formatting simple.
       `;
       contents = [{ role: 'user', parts: [{ text: prompt }] }];
    }

    // 5. Call the model
    // gemini-3-flash-preview supports both text and multimodal
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
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
    return new Response(JSON.stringify({ error: "Failed to generate content. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};