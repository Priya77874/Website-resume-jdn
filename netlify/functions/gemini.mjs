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
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("Missing API_KEY in environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error: API Key missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Parse the incoming request body
    const body = await req.json();
    const { currentContent, instruction, mode, image, resumeContext, jobDetails, history } = body;

    const ai = new GoogleGenAI({ apiKey });
    let contents = [];
    let systemInstruction = "";

    if (mode === 'chat') {
       // General Assistant Mode (Friendly Friend Persona)
       systemInstruction = `
         Role: You are a friendly, helpful, and super intelligent career bestie! 🤖✨
         Tone: Talk like a friend. Be casual, encouraging, and use simple language.
         Formatting: Use bullet points 🟢 for lists. Use emojis 😊 generously to keep it light.
         Context (User's Current Resume Data): ${resumeContext ? JSON.stringify(resumeContext) : "No resume context."}
         Task: Answer the user's question.
       `;
       
       const textPart = instruction || "Hello!";
       
       if (image) {
           const matches = image.match(/^data:(.+);base64,(.+)$/);
           if (matches) {
               contents = [{
                   role: 'user',
                   parts: [
                       { text: textPart },
                       { inlineData: { mimeType: matches[1], data: matches[2] } }
                   ]
               }];
           } else {
               contents = [{ role: 'user', parts: [{ text: textPart }] }];
           }
       } else {
           contents = [{ role: 'user', parts: [{ text: textPart }] }];
       }

    } else if (mode === 'interview') {
       // Interview Prep Mode (Strict Interviewer Persona)
       systemInstruction = `
         Role: You are a professional, slightly strict, but constructive Job Interviewer.
         Goal: Conduct a mock interview with the user based on their resume.
         
         Context (Resume): ${resumeContext ? JSON.stringify(resumeContext) : "No resume provided."}
         
         Rules:
         1. Ask ONE relevant question at a time.
         2. If the user provides an answer, briefly critique it (mentioning STAR method if applicable) then ask the NEXT question.
         3. Stay in character. Do not break the "Interviewer" persona unless explicitly asked for feedback.
         4. Keep responses concise.
       `;

       // Construct history for context if provided
       if (history && Array.isArray(history)) {
           // Map simplified history to Gemini format (limit last 10 turns to save tokens)
           contents = history.slice(-10).map(msg => ({
               role: msg.role === 'user' ? 'user' : 'model',
               parts: [{ text: msg.text }]
           }));
       }
       
       // Add the new user message
       contents.push({ role: 'user', parts: [{ text: instruction }] });

    } else if (mode === 'cover-letter') {
        // Cover Letter Generator
        const { title, company, description } = jobDetails || {};
        
        systemInstruction = "You are an expert professional resume and cover letter writer.";
        
        let prompt = `
          Write a compelling, professional cover letter for the position of "${title}" at "${company}".
          
          Job Description:
          ${description}
          
          My Resume Data (Use this to highlight relevant skills/experience):
          ${resumeContext ? JSON.stringify(resumeContext) : "No resume data."}
          
          Guidelines:
          - Format: HTML (use <p>, <br>, <strong>). No markdown code blocks.
          - Tone: Professional, enthusiastic, confident.
          - Structure: Header (placeholders), Introduction, Body Paragraphs (matching skills to JD), Conclusion.
        `;
        
        contents = [{ role: 'user', parts: [{ text: prompt }] }];

    } else {
       // Resume Improver Mode (Default)
       systemInstruction = "Role: Expert Executive Resume Writer.";
       
       let prompt = `
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    // 6. Clean and return the result
    let result = response.text || '';
    
    // Cleanup markdown if present (for HTML outputs)
    if (mode === 'cover-letter' || mode === 'rewrite') {
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