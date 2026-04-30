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
import { AIService, Flashcard } from "@/lib/AIService";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, RefreshCcw, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FlashcardViewerProps {
  noteId: string;
  noteTitle: string;
  noteDescription: string;
}

export default function FlashcardViewer({ noteId, noteTitle, noteDescription }: FlashcardViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateCards = async () => {
    setLoading(true);
    try {
      const generated = await AIService.generateFlashcards(noteTitle, noteDescription);
      setCards(generated);
      setCurrentIndex(0);
      setIsFlipped(false);
      
      // Save deck to Supabase if logged in
      if (user) {
        const { data: deck, error: deckError } = await supabase
          .from("flashcard_decks")
          .insert({
            note_id: noteId,
            user_id: user.id,
            title: `Flashcards: ${noteTitle}`,
            card_count: generated.length
          })
          .select()
          .single();

        if (deck && !deckError) {
          const cardInserts = generated.map(c => ({
            deck_id: deck.id,
            front: c.front,
            back: c.back
          }));
          await supabase.from("flashcard_cards").insert(cardInserts);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full font-bold gap-2 border-primary/20 hover:bg-primary/5">
          <Zap className="h-4 w-4 text-primary" /> AI Flashcards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Zap className="h-6 w-6" /> Active Recall
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-medium">
              Study smarter with AI-generated flashcards
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          {cards.length === 0 ? (
            <div className="text-center space-y-6 py-4">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Zap className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Boost your memory!</h3>
                <p className="text-muted-foreground text-sm">
                  We'll extract the most important concepts and turn them into flashcards for effective studying.
                </p>
              </div>
              <Button 
                onClick={generateCards} 
                disabled={loading}
                className="w-full h-12 rounded-full font-black text-lg shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Cards...
                  </>
                ) : (
                  "Generate AI Flashcards"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <button 
                  onClick={generateCards} 
                  disabled={loading}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <RefreshCcw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Regenerate
                </button>
              </div>

              {/* Flashcard Container */}
              <div 
                className="perspective-1000 h-64 w-full cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`relative h-full w-full transition-all duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                  {/* Front */}
                  <div className="absolute inset-0 bg-secondary rounded-3xl border-2 border-primary/20 flex flex-col items-center justify-center p-8 text-center backface-hidden">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Question</p>
                    <h3 className="text-xl font-bold leading-tight">
                      {cards[currentIndex].front}
                    </h3>
                    <p className="absolute bottom-4 text-[10px] text-muted-foreground font-bold">Tap to reveal answer</p>
                  </div>
                  
                  {/* Back */}
                  <div className="absolute inset-0 bg-primary text-white rounded-3xl flex flex-col items-center justify-center p-8 text-center backface-hidden rotate-y-180">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Answer</p>
                    <h3 className="text-xl font-bold leading-tight">
                      {cards[currentIndex].back}
                    </h3>
                    <p className="absolute bottom-4 text-[10px] text-white/60 font-bold">Tap to flip back</p>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="rounded-full flex-1 font-bold border-2"
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" /> Back
                </Button>
                <Button 
                  size="lg"
                  className="rounded-full flex-1 font-black"
                  onClick={currentIndex === cards.length - 1 ? () => setIsOpen(false) : nextCard}
                >
                  {currentIndex === cards.length - 1 ? "Finish" : "Next"} <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              <div className="p-4 bg-muted/50 rounded-2xl flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">Pro Tip:</span> Active recall and spaced repetition are the most effective ways to move information from short-term to long-term memory.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
