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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-primary/40 p-0 animate-bounce"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-white border shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? "h-16 w-64" : "h-[500px] w-80 md:w-96"}`}>
      {/* Header */}
      <div className="bg-primary p-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-black text-sm uppercase tracking-widest">Study AI</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
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
                <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-bold text-muted-foreground italic">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {[
                { icon: BookOpen, text: "Explain this topic" },
                { icon: Brain, text: "Summarize key points" },
                { icon: Sparkles, text: "Generate quiz" }
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p.text); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-[10px] font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  <p.icon className="h-3 w-3" /> {p.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t bg-white flex items-center gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-full bg-secondary/50 border-none h-11 focus-visible:ring-primary"
            />
            <Button type="submit" disabled={!input.trim() || loading} className="h-11 w-11 rounded-full p-0 shrink-0 shadow-lg shadow-primary/20">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
