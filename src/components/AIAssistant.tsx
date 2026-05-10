import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, X, Send, Sparkles, 
  Loader2, Brain, BookOpen, Minimize2, Maximize2 
} from "lucide-react";
import { AIService } from "@/lib/AIService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface AIAssistantProps {
  noteId?: string;
  context?: string;
}

export default function AIAssistant({ noteId, context = "" }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hi! I'm your AI Study Assistant. Ask me anything about your notes or any academic topic!" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await AIService.askAI(userMessage, context);
      setMessages((prev) => [...prev, { role: "ai", content: response }]);
      
      // Save conversation if logged in
      if (user) {
        // Logic to update ai_conversations table could go here
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-11 w-11 rounded-full shadow-2xl shadow-primary/40 p-0"
      >
        <Sparkles className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white border shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? "h-12 w-52" : "h-[420px] w-[280px] sm:w-80"}`}>
      {/* Header */}
      <div className="bg-primary px-3 py-2 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-white/20 rounded-md flex items-center justify-center">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="font-black text-xs uppercase tracking-widest">Study AI</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-secondary/10">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-2.5 py-2 rounded-xl text-xs font-medium leading-relaxed shadow-sm ${
                  m.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-foreground rounded-tl-none border"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border px-2.5 py-2 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground italic">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {[
                { icon: BookOpen, text: "Explain this topic" },
                { icon: Brain, text: "Summarize key points" },
                { icon: Sparkles, text: "Generate quiz" }
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p.text); }}
                  className="flex items-center gap-1 px-2 py-1 bg-white border rounded-full text-[9px] font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  <p.icon className="h-2.5 w-2.5" /> {p.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 border-t bg-white flex items-center gap-1.5">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-full bg-secondary/50 border-none h-9 text-xs focus-visible:ring-primary"
            />
            <Button type="submit" disabled={!input.trim() || loading} className="h-9 w-9 rounded-full p-0 shrink-0 shadow-md shadow-primary/20">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
