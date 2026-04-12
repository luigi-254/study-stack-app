import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen, Search, LayoutDashboard, FileText, FolderOpen,
  CheckCircle2, User, LogOut, Download, Eye, Menu, X, HelpCircle, MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const sidebarItems = [
  { id: "notes", label: "My Notes", icon: FileText },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "support", label: "Support", icon: HelpCircle },
];

interface NoteWithCategory {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  is_published: boolean;
  category_id: string | null;
  categories: { name: string } | null;
}

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, description, file_url, is_published, category_id, categories(name)")
        .eq("is_published", true);
      if (!error && data) setNotes(data as unknown as NoteWithCategory[]);
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

    fetchNotes();
    fetchProgress();
  }, [user]);

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      setSelectedCategory(catParam);
      setCurrentView("notes");
    }
  }, [searchParams]);

  const toggleComplete = async (noteId: string) => {
    if (!user) return;
    const current = progress[noteId] ?? false;
    const newVal = !current;
    setProgress((prev) => ({ ...prev, [noteId]: newVal }));

    const { error } = await supabase
      .from("user_note_progress")
      .upsert({ user_id: user.id, note_id: noteId, completed: newVal }, { onConflict: "user_id,note_id" });

    if (error) {
      setProgress((prev) => ({ ...prev, [noteId]: current }));
      toast({ title: "Error", description: "Could not update progress", variant: "destructive" });
    }
  };

  const handleGuestAction = (action: string) => {
    toast({ 
      title: "Login Required", 
      description: `Please sign in to ${action}.`,
      action: <Button variant="default" size="sm" onClick={() => navigate("/login")}>Login</Button>
    });
  };

  const handleDownload = (fileUrl: string, title: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${title}.pdf`;
    link.target = "_blank";
    link.click();
  };

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
  
  const filteredCategories = uniqueCategories.filter(cat => 
    cat.toLowerCase().includes(search.toLowerCase())
  );

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen flex bg-muted/20">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r bg-background flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b font-bold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>NoteHub</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.filter(item => user || ["notes", "categories", "support"].includes(item.id)).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setSelectedCategory(null);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                (currentView === item.id || (item.id === "categories" && selectedCategory))
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <User className="h-4 w-4" />
              Sign In
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-md flex items-center px-4 md:px-6 gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentView === "profile" ? (
            <div className="max-w-2xl mx-auto py-8">
              <h1 className="text-3xl font-bold mb-8">My Profile</h1>
              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {initials}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{profile?.full_name || "User"}</h2>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                     <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                       <LogOut className="h-4 w-4 mr-2" /> Sign Out
                     </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentView === "categories" ? (
            <div className="space-y-6">
               <h1 className="text-2xl font-bold">Categories</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                      <Card 
                        key={cat} 
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors shadow-card"
                        onClick={() => {
                           setSelectedCategory(cat);
                           setCurrentView("notes");
                        }}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                           <FolderOpen className="h-5 w-5 text-primary" />
                           <span className="font-medium">{cat}</span>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-10 text-muted-foreground bg-background/50 rounded-xl border-2 border-dashed">
                      <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No categories match your search.</p>
                    </div>
                  )}
                </div>
            </div>
          ) : currentView === "support" ? (
             <div className="max-w-2xl mx-auto py-8 text-center">
               <div className="mb-8">
                 <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                   <MessageSquare className="h-10 w-10" />
                 </div>
                 <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
                 <p className="text-muted-foreground">Have questions or need assistance? We're here to help you 24/7.</p>
               </div>

               <Card className="shadow-card border-2 border-primary/10">
                 <CardContent className="pt-8 pb-8 space-y-6">
                   <div className="space-y-2">
                     <h3 className="text-xl font-semibold">Chat with us on WhatsApp</h3>
                     <p className="text-sm text-muted-foreground px-4">Get instant support for technical issues, account help, or general inquiries.</p>
                   </div>
                   
                   <Button 
                     size="lg" 
                     className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 px-8 rounded-full shadow-lg transition-all hover:scale-105"
                     onClick={() => window.open('https://wa.me/254795396214', '_blank')}
                   >
                     <MessageSquare className="mr-2 h-5 w-5" />
                     Message on WhatsApp
                   </Button>

                   <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                     <div className="p-4 rounded-lg bg-muted/50 border">
                       <h4 className="font-medium text-sm mb-1">Response Time</h4>
                       <p className="text-xs text-muted-foreground">Usually responds within 5-10 minutes.</p>
                     </div>
                     <div className="p-4 rounded-lg bg-muted/50 border">
                       <h4 className="font-medium text-sm mb-1">Operating Hours</h4>
                       <p className="text-xs text-muted-foreground">Active 7 days a week, 8am - 10pm.</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {currentView === "completed" ? "Completed Notes" : selectedCategory ? `Notes: ${selectedCategory}` : "My Notes"}
                  </h1>
                  <p className="text-sm text-muted-foreground">{filtered.length} notes available</p>
                </div>
                {selectedCategory && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                    Clear Filter
                  </Button>
                )}
              </div>

              {loadingNotes ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-background/50 rounded-xl border-2 border-dashed">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No notes found for this view.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((note) => (
                    <Card key={note.id} className="shadow-card hover:shadow-card-hover transition-shadow group flex flex-col">
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className="bg-accent text-accent-foreground" variant="secondary">
                            {note.categories?.name || "Uncategorized"}
                          </Badge>
                          <Checkbox
                            checked={progress[note.id] ?? false}
                            onCheckedChange={() => user ? toggleComplete(note.id) : handleGuestAction("track progress")}
                          />
                        </div>
                        <h3 className="font-semibold text-sm mb-1.5 leading-snug line-clamp-2">{note.title}</h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-3 flex-1">{note.description}</p>
                        <div className="flex gap-2 mt-auto">
                          <Button size="sm" variant="default" className="flex-1" asChild>
                            <Link to={`/viewer/${note.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> Read
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(note.file_url, note.title)}>
                            <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
