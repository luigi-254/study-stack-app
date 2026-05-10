import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, X, Send, Sparkles, 
  Loader2, Brain, BookOpen, Minimize2, Maximize2, GripVertical
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

const STORAGE_KEY = "ai-assistant-position";

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

  // Draggable position (top-left in px). null = use default bottom-center.
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef<{ offsetX: number; offsetY: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Pointer drag handlers
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      if (!dragState.current) return;
      const el = (isOpen ? containerRef.current : buttonRef.current);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      let x = e.clientX - dragState.current.offsetX;
      let y = e.clientY - dragState.current.offsetY;
      // clamp to viewport
      x = Math.max(4, Math.min(window.innerWidth - w - 4, x));
      y = Math.max(4, Math.min(window.innerHeight - h - 4, y));
      dragState.current.moved = true;
      setPosition({ x, y });
    };
    const handleUp = () => {
      setDragging(false);
      if (position) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(position)); } catch {}
      }
      dragState.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, isOpen, position]);

  const startDrag = (e: React.PointerEvent) => {
    const el = (isOpen ? containerRef.current : buttonRef.current);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    };
    // Initialize position from current rect so it doesn't jump
    setPosition({ x: rect.left, y: rect.top });
    setDragging(true);
  };

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
      if (user) {
        // Logic to update ai_conversations table could go here
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Position style: custom px if dragged, otherwise bottom-center default
  const positionStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y, bottom: "auto", right: "auto", transform: "none" }
    : {};
  const defaultPosClass = position ? "" : "bottom-4 left-1/2 -translate-x-1/2";

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onPointerDown={(e) => {
          startDrag(e);
        }}
        onClick={(e) => {
          if (dragState.current?.moved) {
            e.preventDefault();
            return;
          }
          setIsOpen(true);
        }}
        style={positionStyle}
        className={`fixed ${defaultPosClass} h-11 w-11 rounded-full shadow-2xl shadow-primary/40 p-0 z-50 bg-primary text-primary-foreground flex items-center justify-center touch-none cursor-grab active:cursor-grabbing`}
        aria-label="Open AI assistant (drag to move)"
      >
        <Sparkles className="h-4 w-4 pointer-events-none" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      style={positionStyle}
      className={`fixed ${defaultPosClass} z-50 bg-white border shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-[height,width] duration-300 ${isMinimized ? "h-12 w-52" : "h-[420px] w-[280px] sm:w-80"}`}
    >
      {/* Header (drag handle) */}
      <div
        onPointerDown={startDrag}
        className="bg-primary px-3 py-2 flex items-center justify-between text-white shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 opacity-70" />
          <div className="h-6 w-6 bg-white/20 rounded-md flex items-center justify-center">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="font-black text-xs uppercase tracking-widest">Study AI</span>
        </div>
        <div className="flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
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
