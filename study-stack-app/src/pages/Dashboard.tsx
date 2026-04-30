import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, FileText, FolderOpen, 
  CheckCircle2, User, LogOut, MessageSquare, 
  Filter, Grid, List as ListIcon, X, PlusCircle,
  LayoutDashboard, Zap, Brain, Sparkles, Clock, History
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";
import StudyStreak from "@/components/StudyStreak";
import XPProgress from "@/components/XPProgress";

interface NoteWithCategory {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  is_published: boolean;
  category_id: string | null;
  views_count: number;
  categories: { name: string } | null;
  thumbnail_url?: string | null;
}

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<NoteWithCategory[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [currentView, setCurrentView] = useState<"today" | "notes" | "completed">("today");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoadingNotes(true);
      try {
        const { data, error } = await supabase
          .from("notes")
          .select(`
            id, title, description, file_url, is_published, category_id,
            thumbnail_url, views_count,
            categories(name)
          `)
          .eq("is_published", true);
        
        if (!error && data) setNotes(data as unknown as NoteWithCategory[]);
      } catch (err) {
        console.error("Dashboard notes fetch failed:", err);
      }
      setLoadingNotes(false);
    };

    const fetchProgress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_note_progress")
        .select("note_id, completed")
        .eq("user_id", user.id);
      if (data) {
        const map: Record<string, boolean> = {};
        data.forEach((p) => { map[p.note_id] = p.completed; });
        setProgress(map);
      }
    };

    fetchData();
    fetchProgress();
  }, [user]);

  useEffect(() => {
    const catParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const viewParam = searchParams.get("view");
    
    if (catParam) {
      setSelectedCategory(catParam);
      setCurrentView("notes");
    }
    if (searchParam) {
      setSearch(searchParam);
      setCurrentView("notes");
    }
    if (viewParam === "completed") {
      setCurrentView("completed");
    } else if (viewParam === "notes") {
      setCurrentView("notes");
    }
  }, [searchParams]);

  const filtered = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                         (n.categories?.name || "").toLowerCase().includes(search.toLowerCase());
    
    if (currentView === "completed") {
      return matchesSearch && (progress[n.id] ?? false);
    }
    
    if (selectedCategory && currentView === "notes") {
       return matchesSearch && n.categories?.name === selectedCategory;
    }

    return matchesSearch;
  });

  const uniqueCategories = Array.from(new Set(notes.map(n => n.categories?.name).filter(Boolean))) as string[];
  const recentNotes = notes.slice(0, 3); // Mocking recent for now

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Learning Hub</h3>
               <nav className="flex flex-col gap-1">
                  <button 
                    onClick={() => { setCurrentView("today"); setSelectedCategory(null); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === "today" ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >
                    <LayoutDashboard className="h-4 w-4" /> Today's View
                  </button>
                  <button 
                    onClick={() => { setCurrentView("notes"); setSelectedCategory(null); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === "notes" && !selectedCategory ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >
                    <FileText className="h-4 w-4" /> Browse Library
                  </button>
                  <button 
                    onClick={() => { setCurrentView("completed"); setSelectedCategory(null); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === "completed" ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> My Finished Notes
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => navigate("/admin")}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <PlusCircle className="h-4 w-4" /> Admin Panel
                    </button>
                  )}
               </nav>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Subjects</h3>
               <div className="flex flex-wrap lg:flex-col gap-2">
                  {uniqueCategories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setCurrentView("notes"); }}
                      className={`px-4 py-2 rounded-full lg:rounded-xl text-xs font-bold border transition-all ${selectedCategory === cat && currentView === "notes" ? "bg-primary/10 border-primary text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
               <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                 <Sparkles className="h-5 w-5 text-primary" />
               </div>
               <h4 className="font-bold text-sm">AI Study Partner</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 Need a quick summary or a practice quiz? Our AI is ready to help you master any topic in seconds.
               </p>
               <Button variant="outline" className="w-full text-xs font-bold rounded-full border-primary/20 hover:bg-primary/5">
                 Ask AI Anything
               </Button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 space-y-8">
            {currentView === "today" ? (
              <div className="space-y-10 animate-fade-in">
                <header>
                  <h1 className="text-4xl font-black mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || "Scholar"}! 👋</h1>
                  <p className="text-muted-foreground font-medium">Here's what's happening on your academic journey today.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StudyStreak />
                  <XPProgress />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      <History className="h-6 w-6 text-primary" /> Pick up where you left off
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentView("notes")} className="font-bold text-primary">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {recentNotes.map((note) => (
                      <NoteCard 
                        key={note.id}
                        id={note.id}
                        title={note.title}
                        description={note.description}
                        category={note.categories?.name || "Uncategorized"}
                        author={"NoteHub Author"}
                        views={note.views_count}
                        thumbnail={note.thumbnail_url}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-secondary/30 rounded-3xl p-8 border-2 border-dashed border-primary/20 flex flex-col items-center text-center space-y-4 group hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setCurrentView("notes")}>
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Brain className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Practice Quiz</h3>
                    <p className="text-sm text-muted-foreground">Generate an AI quiz from your notes to test your knowledge.</p>
                    <Button variant="outline" className="rounded-full font-bold">Start Learning</Button>
                  </div>

                  <div className="bg-secondary/30 rounded-3xl p-8 border-2 border-dashed border-primary/20 flex flex-col items-center text-center space-y-4 group hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setCurrentView("notes")}>
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Zap className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">Active Recall</h3>
                    <p className="text-sm text-muted-foreground">Use AI flashcards to move concepts to long-term memory.</p>
                    <Button variant="outline" className="rounded-full font-bold">Open Flashcards</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <div>
                      <h1 className="text-3xl font-black capitalize">
                        {currentView === "completed" ? "My Finished Notes" : selectedCategory ? `${selectedCategory}` : "Academic Library"}
                      </h1>
                      <p className="text-muted-foreground font-medium">
                        Showing {filtered.length} high-impact study materials
                      </p>
                   </div>

                   <div className="flex items-center gap-2">
                     <div className="relative group flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="Search title or subject..." 
                          className="pl-10 h-11 bg-secondary/50 border-none rounded-full w-full focus-visible:ring-primary"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                     </div>
                   </div>
                </header>

                {selectedCategory && (
                  <div className="flex items-center gap-2">
                     <Badge variant="secondary" className="pl-3 pr-1 py-1 h-8 rounded-full bg-primary/10 text-primary border-none font-bold text-xs">
                       Subject: {selectedCategory}
                       <button onClick={() => setSelectedCategory(null)} className="ml-2 p-1 hover:bg-primary/20 rounded-full">
                         <X className="h-3 w-3" />
                       </button>
                     </Badge>
                  </div>
                )}

                {loadingNotes ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                     <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="h-10 w-10 text-muted-foreground/30" />
                     </div>
                     <h3 className="text-xl font-bold">No matches found</h3>
                     <p className="text-muted-foreground">Try a different search term or subject filter.</p>
                     <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory(null); }} className="rounded-full">
                       Reset Filters
                     </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((note) => (
                      <NoteCard 
                        key={note.id}
                        id={note.id}
                        title={note.title}
                        description={note.description}
                        category={note.categories?.name || "Uncategorized"}
                        author={"NoteHub Author"}
                        views={note.views_count}
                        thumbnail={note.thumbnail_url}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default Dashboard;

