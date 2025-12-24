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
    const { currentContent, instruction, mode, image, resumeContext } = body;

    const ai = new GoogleGenAI({ apiKey });
    let contents = [];

    if (mode === 'chat') {
       // General Assistant Mode (Friendly Friend Persona)
       let textPrompt = `
         Role: You are a friendly, helpful, and super intelligent career bestie! 🤖✨
         Tone: Talk like a friend. Be casual, encouraging, and use simple language.
         Formatting: Use bullet points 🟢 for lists. Use emojis 😊 generously to keep it light.
         Task: Answer the user's question: "${instruction || ""}"
         
         Context (User's Current Resume Data): 
         ${resumeContext ? JSON.stringify(resumeContext) : "No resume context provided."}
         
         Instructions:
         - If the user asks about their resume, use the provided JSON context to give specific advice.
         - If the user asks general career questions, give practical, easy-to-understand advice.
         - Use HTML tags for formatting (<b>, <ul>, <li>, <br>).
         - Keep it concise but warm!
       `;
       
       if (!instruction && !image) {
          return new Response(JSON.stringify({ error: "Missing user query or image." }), { status: 400 });
       }

       if (image) {
           // Multimodal Input (Supports Image & PDF)
           const matches = image.match(/^data:(.+);base64,(.+)$/);
           if (matches) {
               const mimeType = matches[1];
               const data = matches[2];
               contents = [
                   {
                       role: 'user',
                       parts: [
                           { text: textPrompt || "Analyze this file." },
                           { inlineData: { mimeType, data } }
                       ]
                   }
               ];
           } else {
               contents = [{ role: 'user', parts: [{ text: textPrompt }] }];
           }
       } else {
           contents = [{ role: 'user', parts: [{ text: textPrompt }] }];
       }

    } else {
       // Resume Improver Mode (Formal, Human-like Persona)
       if (!instruction) {
          return new Response(JSON.stringify({ error: "Missing instruction." }), { status: 400 });
       }
       
       let prompt = `
         Role: Expert Executive Resume Writer.
         Task: Rewrite or Generate content based on this instruction: "${instruction}".
         ${currentContent ? `Content to Rewrite: "${currentContent}"` : ''}
         
         Style Guidelines:
         - Tone: Formal, professional, sophisticated, and impactful.
         - Authenticity: Write in a humanized way so it is undetectable as AI-generated. Avoid generic AI buzzwords.
         - Structure: Use strong action verbs and quantifiable results.
         
         Output Constraint: Return ONLY the HTML code suitable for insertion into a <div> or <ul>. Do not add markdown blocks.
       `;
       contents = [{ role: 'user', parts: [{ text: prompt }] }];
    }

    // 5. Call the model
    // gemini-3-flash-preview supports text, image, and pdf
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