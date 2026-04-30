import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AIService, QuizQuestion } from "@/lib/AIService";
import { Brain, CheckCircle2, XCircle, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QuizGeneratorProps {
  noteId: string;
  noteTitle: string;
  noteDescription: string;
}

export default function QuizGenerator({ noteId, noteTitle, noteDescription }: QuizGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState<"start" | "quiz" | "result">("start");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const startQuiz = async () => {
    setLoading(true);
    try {
      const generated = await AIService.generateQuiz(noteTitle, noteDescription);
      setQuestions(generated);
      setCurrentStep("quiz");
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setIsAnswered(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].correct_answer) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      saveResult();
      setCurrentStep("result");
    }
  };

  const saveResult = async () => {
    if (!user) return;
    const finalScore = score + (selectedOption === questions[currentIndex].correct_answer ? 1 : 0);
    const { error } = await supabase.from("quizzes").insert({
      note_id: noteId,
      user_id: user.id,
      title: `Quiz: ${noteTitle}`,
      score: finalScore,
      total_questions: questions.length,
      completed: true,
    });
    if (error) console.error("Failed to save quiz result:", error);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full font-bold gap-2 border-primary/20 hover:bg-primary/5">
          <Brain className="h-4 w-4 text-primary" /> Generate Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl overflow-hidden p-0 gap-0 border-none shadow-2xl">
        <div className="bg-primary p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Brain className="h-6 w-6" /> AI Study Quiz
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-medium">
              Test your knowledge on "{noteTitle}"
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          {currentStep === "start" && (
            <div className="text-center space-y-6 py-4">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Brain className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Ready to master this topic?</h3>
                <p className="text-muted-foreground text-sm">
                  Our AI will generate a customized quiz based on your notes to help you identify weak areas.
                </p>
              </div>
              <Button 
                onClick={startQuiz} 
                disabled={loading}
                className="w-full h-12 rounded-full font-black text-lg shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  "Start AI Quiz"
                )}
              </Button>
            </div>
          )}

          {currentStep === "quiz" && questions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />
              
              <h3 className="text-lg font-bold leading-tight">
                {questions[currentIndex].question}
              </h3>

              <div className="space-y-3">
                {questions[currentIndex].options.map((option, idx) => {
                  const isCorrect = option === questions[currentIndex].correct_answer;
                  const isSelected = option === selectedOption;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-2xl text-left text-sm font-bold transition-all border-2 flex items-center justify-between group
                        ${!isAnswered 
                          ? "border-border hover:border-primary hover:bg-primary/5" 
                          : isSelected && isCorrect 
                            ? "border-green-500 bg-green-50 text-green-700"
                            : isSelected && !isCorrect
                              ? "border-destructive bg-destructive/5 text-destructive"
                              : isCorrect 
                                ? "border-green-500 bg-green-50/50 text-green-700"
                                : "border-border opacity-50"
                        }
                      `}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="space-y-4 animate-fade-in">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${selectedOption === questions[currentIndex].correct_answer ? "bg-green-50 text-green-800" : "bg-muted text-muted-foreground"}`}>
                    <p className="font-black uppercase text-[10px] tracking-widest mb-1">Explanation</p>
                    {questions[currentIndex].explanation}
                  </div>
                  <Button 
                    onClick={nextQuestion} 
                    className="w-full h-12 rounded-full font-black text-lg"
                  >
                    {currentIndex < questions.length - 1 ? "Next Question" : "See Results"} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === "result" && (
            <div className="text-center space-y-6 py-4">
              <div className="relative h-24 w-24 mx-auto">
                <svg className="h-24 w-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - score / questions.length)}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-black">{score}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">/{questions.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black">
                  {score === questions.length ? "Perfect Score! 🎉" : score >= questions.length / 2 ? "Great Job! 👍" : "Keep Learning! 📚"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  You answered {score} out of {questions.length} questions correctly. 
                  Keep studying to master all concepts!
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={startQuiz}
                  variant="outline"
                  className="h-12 rounded-full font-bold gap-2"
                >
                  <RefreshCcw className="h-4 w-4" /> Retake Quiz
                </Button>
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="h-12 rounded-full font-black"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
