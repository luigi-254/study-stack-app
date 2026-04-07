import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen, Search, LayoutDashboard, FileText, FolderOpen,
  CheckCircle2, User, LogOut, Download, Eye, Menu, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "My Notes", icon: FileText },
  { label: "Categories", icon: FolderOpen },
  { label: "Completed", icon: CheckCircle2 },
  { label: "Profile", icon: User },
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
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
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

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.categories?.name || "").toLowerCase().includes(search.toLowerCase())
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
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
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

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">My Notes</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} notes available</p>
          </div>

          {loadingNotes ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No notes found. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((note) => (
                <Card key={note.id} className="shadow-card hover:shadow-card-hover transition-shadow group">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-accent text-accent-foreground" variant="secondary">
                        {note.categories?.name || "Uncategorized"}
                      </Badge>
                      <Checkbox
                        checked={progress[note.id] ?? false}
                        onCheckedChange={() => toggleComplete(note.id)}
                      />
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5 leading-snug">{note.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4 flex-1">{note.description}</p>
                    <div className="flex gap-2">
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
