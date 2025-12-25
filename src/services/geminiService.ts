// This service now delegates the AI generation to a secure serverless function.
// This prevents the API Key from being exposed in the browser's network tab or source code.

import { ResumeData } from '../types';

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
  image?: string,
  resumeContext?: ResumeData
): Promise<string> => {
  return callGemini({ instruction, image, resumeContext, mode: 'chat' });
};

export const generateCoverLetter = async (
  jobDetails: { title: string; company: string; description: string },
  resumeContext: ResumeData
): Promise<string> => {
  return callGemini({ jobDetails, resumeContext, mode: 'cover-letter' });
};

export const chatInterview = async (
  instruction: string,
  history: {role: string, text: string}[],
  resumeContext: ResumeData
): Promise<string> => {
  return callGemini({ instruction, history, resumeContext, mode: 'interview' });
};
