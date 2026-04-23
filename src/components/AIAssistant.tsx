import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Sparkles, X, MessageSquare, ChevronRight, 
  Search, BookOpen, Library, LogOut, Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hiddenRoutes = ["/", "/login", "/register"];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const nicknames = ["Knowledge Seeker", "Scholar", "Bookworm", "Inquisitive Mind", "Academic Explorer", "Lifelong Learner"];
  const randomNickname = nicknames[Math.floor(Math.random() * nicknames.length)];

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = profile?.full_name 
        ? `Welcome back, ${profile.full_name.split(' ')[0]}! It's wonderful to see such a dedicated ${randomNickname.toLowerCase()} today. How can I assist you with your studies?`
        : `Hello there, fellow ${randomNickname.toLowerCase()}! I'm your NoteHub companion. Looking for something specific to read?`;

      setMessages([
        { 
          role: 'ai', 
          text: greeting
        }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAction = (action: string, path?: string) => {
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput("");

    // Simple keyword based responses for navigation
    setTimeout(() => {
      let response = "That's an interesting question! While I'm still learning, I can certainly help you find your way around. Try asking about 'notes', 'my library', or 'searching'.";
      
      if (userMessage.includes("notes") || userMessage.includes("browse")) {
        response = "Of course! You can explore our extensive collection of curated notes in the Dashboard. Would you like me to take you there now, dear scholar?";
      } else if (userMessage.includes("library") || userMessage.includes("saved") || userMessage.includes("read")) {
        response = "Your personal library is the perfect place to track your progress. You can find all your saved and completed notes under 'My Library' in the Dashboard section.";
      } else if (userMessage.includes("search")) {
        response = "Finding specific knowledge is easy! You can use the search bar at the very top of the page in the Navbar or within the Dashboard.";
      } else if (userMessage.includes("hello") || userMessage.includes("hi")) {
        response = `Greetings! I'm here to ensure your journey through NoteHub is as smooth as possible. What knowledge are we seeking today?`;
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-card border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-primary p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">NoteHub AI</h3>
                <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest leading-none">Online Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-secondary text-foreground rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-muted/30 border-t space-y-3">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleAction("browse", "/dashboard")}
                className="px-3 py-1.5 bg-background border rounded-full text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-1.5"
              >
                <BookOpen className="h-3 w-3" /> Browse Notes
              </button>
              <button 
                onClick={() => handleAction("library", "/dashboard?view=completed")}
                className="px-3 py-1.5 bg-background border rounded-full text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center gap-1.5"
              >
                <Library className="h-3 w-3" /> My Library
              </button>
            </div>
            
            <form onSubmit={handleSend} className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..." 
                className="w-full h-12 bg-background border rounded-2xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-16 w-16 rounded-3xl shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-background border rotate-90 text-foreground' : 'bg-primary text-white'
        }`}
      >
        {isOpen ? <X className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
      </button>
    </div>
  );
};

export default AIAssistant;
