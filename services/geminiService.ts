// This service now delegates the AI generation to a secure serverless function.
// This prevents the API Key from being exposed in the browser's network tab or source code.

const callGemini = async (payload: any): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("AI Assistant is unavailable. Please check your network connection.");
  }
};

export const rewriteContent = async (
  currentContent: string,
  instruction: string
): Promise<string> => {
  return callGemini({ currentContent, instruction, mode: 'rewrite' });
};

export const chatWithAi = async (
  instruction: string,
  image?: string
): Promise<string> => {
  return callGemini({ instruction, image, mode: 'chat' });
};
