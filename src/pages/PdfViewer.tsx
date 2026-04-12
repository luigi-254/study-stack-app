import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle2, FileText, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface NoteDetail {
  id: string;
  title: string;
  file_url: string;
  categories: { name: string } | null;
}

const PdfViewer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [allNotes, setAllNotes] = useState<{ id: string; title: string }[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from("notes").select("id, title").eq("is_published", true);
      if (data) setAllNotes(data);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchNote = async () => {
      const { data } = await supabase
        .from("notes")
        .select("id, title, file_url, categories(name)")
        .eq("id", id)
        .single();
      if (data) setNote(data as unknown as NoteDetail);
    };
    const fetchProgress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_note_progress")
        .select("completed")
        .eq("user_id", user.id)
        .eq("note_id", id)
        .maybeSingle();
      setCompleted(data?.completed ?? false);
    };
    fetchNote();
    fetchProgress();
  }, [id, user]);

  const handleMarkComplete = async () => {
    if (!user) {
      toast({ 
        title: "Login Required", 
        description: "Please sign in to track your reading progress.",
        action: <Button variant="default" size="sm" onClick={() => navigate("/login")}>Login</Button>
      });
      return;
    }
    if (!id) return;
    const newVal = !completed;
    setCompleted(newVal);
    await supabase
      .from("user_note_progress")
      .upsert({ user_id: user.id, note_id: id, completed: newVal }, { onConflict: "user_id,note_id" });
    toast({ title: newVal ? "Marked as complete!" : "Unmarked" });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-muted/20">
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r bg-background">
        <div className="flex items-center gap-2 px-5 h-14 border-b">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Notes</p>
          <nav className="space-y-0.5">
            {allNotes.map((n) => (
              <Link
                key={n.id}
                to={`/viewer/${n.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  n.id === id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{n.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-background flex items-center px-4 md:px-6 gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-sm truncate flex-1">{note?.title || "Note Viewer"}</h1>
          {note?.categories?.name && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground hidden sm:inline-flex">
              {note.categories.name}
            </Badge>
          )}
          <div className="flex gap-2">
            {note?.file_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </a>
              </Button>
            )}
            <Button size="sm" variant={completed ? "secondary" : "default"} onClick={handleMarkComplete}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {completed ? "Completed" : "Mark Complete"}
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          {note?.file_url ? (
            <iframe
              src={note.file_url}
              className="w-full max-w-4xl aspect-[3/4] rounded-xl border bg-background shadow-card"
              title={note.title}
            />
          ) : (
            <div className="w-full max-w-4xl aspect-[3/4] rounded-xl border bg-background shadow-card flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Loading...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PdfViewer;
