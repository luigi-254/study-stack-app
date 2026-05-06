import { supabase } from "@/integrations/supabase/client";

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

async function callAI(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("ai-study", { body });
  if (error) throw new Error(error.message || "AI request failed");
  if (data?.error) throw new Error(data.error);
  return data?.result;
}

export const AIService = {
  async generateQuiz(noteTitle: string, noteDescription: string, count = 5): Promise<QuizQuestion[]> {
    return (await callAI({ action: "quiz", noteTitle, noteDescription, count })) as QuizQuestion[];
  },
  async generateFlashcards(noteTitle: string, noteDescription: string, count = 8): Promise<Flashcard[]> {
    return (await callAI({ action: "flashcards", noteTitle, noteDescription, count })) as Flashcard[];
  },
  async generateSummary(noteTitle: string, noteDescription: string): Promise<string> {
    return (await callAI({ action: "summary", noteTitle, noteDescription })) as string;
  },
  async askAI(question: string, context: string): Promise<string> {
    return (await callAI({ action: "ask", question, context })) as string;
  },
};
