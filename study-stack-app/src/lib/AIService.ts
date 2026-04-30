import { supabase } from "@/integrations/supabase/client";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export const AIService = {
  async generateQuiz(noteTitle: string, noteDescription: string, count: number = 5): Promise<QuizQuestion[]> {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key missing");
      throw new Error("AI features are currently unavailable. Please contact the administrator.");
    }

    const prompt = `
      You are an expert academic tutor. Generate a high-quality multiple choice quiz based on the following study material:
      Title: ${noteTitle}
      Description: ${noteDescription}
      
      Requirements:
      1. Generate exactly ${count} questions.
      2. Each question must have exactly 4 options.
      3. Provide a clear explanation for the correct answer.
      4. Format the output as a JSON array of objects with the following keys: "question", "options" (array of strings), "correct_answer" (string matching one of the options), and "explanation".
      5. Return ONLY the JSON array, no markdown formatting.
    `;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      throw new Error("Failed to generate quiz with AI.");
    }
  },

  async generateFlashcards(noteTitle: string, noteDescription: string, count: number = 8): Promise<Flashcard[]> {
    if (!GEMINI_API_KEY) throw new Error("Gemini API key missing");

    const prompt = `
      Create exactly ${count} flashcards for active recall based on:
      Title: ${noteTitle}
      Description: ${noteDescription}
      
      Requirements:
      1. Format as a JSON array of objects with "front" and "back" keys.
      2. Front should be a question or concept.
      3. Back should be a concise answer or definition.
      4. Return ONLY the JSON array.
    `;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text);
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      throw new Error("Failed to generate flashcards with AI.");
    }
  },

  async generateSummary(noteTitle: string, noteDescription: string): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error("Gemini API key missing");

    const prompt = `
      Summarize the following study material into a concise, exam-focused revision note. 
      Use bullet points for key concepts.
      Title: ${noteTitle}
      Description: ${noteDescription}
      
      Format the summary in Markdown.
    `;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Failed to generate summary:", error);
      throw new Error("Failed to generate summary with AI.");
    }
  },

  async askAI(question: string, context: string): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error("Gemini API key missing");

    const prompt = `
      You are an AI study assistant. Answer the student's question based on the provided context.
      Context: ${context}
      Student's Question: ${question}
      
      Provide a clear, educational, and helpful response.
    `;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("AI Assistant error:", error);
      throw new Error("AI Assistant failed to respond.");
    }
  }
};
