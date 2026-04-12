import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, FileText, FolderOpen, 
  CheckCircle2, User, LogOut, MessageSquare, 
  Filter, Grid, List as ListIcon, X, PlusCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";

interface NoteWithCategory {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  is_published: boolean;
  category_id: string | null;
  views_count: number;
  categories: { name: string } | null;
  profiles?: { full_name: string | null } | null;
  thumbnail_url?: string | null;
}

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<NoteWithCategory[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [currentView, setCurrentView] = useState("notes");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, profile, signOut } = useAuth();
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
            thumbnail_url,
            categories(name),
            profiles(full_name)
          `)
          .eq("is_published", true);
        
        if (!error && data) setNotes(data as any);
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
    }
    if (viewParam === "completed") {
      setCurrentView("completed");
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Filters</h3>
               <nav className="flex flex-col gap-1">
                  <button 
                    onClick={() => { setCurrentView("notes"); setSelectedCategory(null); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === "notes" && !selectedCategory ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >
                    <FileText className="h-4 w-4" /> All Notes
                  </button>
                  <button 
                    onClick={() => { setCurrentView("completed"); setSelectedCategory(null); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentView === "completed" ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> My Library
                  </button>
                  <button 
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    <PlusCircle className="h-4 w-4" /> Write Note
                  </button>
               </nav>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Categories</h3>
               <div className="flex flex-wrap lg:flex-col gap-2">
                  {uniqueCategories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setCurrentView("notes"); }}
                      className={`px-4 py-2 rounded-full lg:rounded-xl text-xs font-bold border transition-all ${selectedCategory === cat ? "bg-primary/10 border-primary text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
               <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                 <MessageSquare className="h-5 w-5 text-primary" />
               </div>
               <h4 className="font-bold text-sm">Need Help?</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 Having trouble finding a specific note or want to request a new subject? Our community is here to help!
               </p>
               <Button variant="outline" className="w-full text-xs font-bold rounded-full border-primary/20 hover:bg-primary/5">
                 Join Support Chat
               </Button>
            </div>
          </aside>

          {/* Main Dashboard Area */}
          <main className="lg:col-span-3 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
               <div>
                  <h1 className="text-3xl font-black">
                    {currentView === "completed" ? "My Library" : selectedCategory ? `${selectedCategory}` : "All Notes"}
                  </h1>
                  <p className="text-muted-foreground font-medium">
                    Discovering {filtered.length} notes matched for you
                  </p>
               </div>

               <div className="flex items-center gap-2">
                 <div className="relative group flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Search within these..." 
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
                   Category: {selectedCategory}
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
                 <h3 className="text-xl font-bold">No notes found</h3>
                 <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
                 <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory(null); }} className="rounded-full">
                   Clear all filters
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
                    author={note.profiles?.full_name || "NoteHub Author"}
                    views={note.views_count}
                    thumbnail={note.thumbnail_url}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

