import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Download, CheckCircle2, FileText, 
  Heart, MessageCircle, Bookmark, Share2, 
  Eye, User, Clock, ChevronRight, Printer, Link as LinkIcon,
  ChevronDown, Brain, Zap, Sparkles, Wand2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getNoteCoverImage } from "@/lib/imageUtils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuizGenerator from "@/components/QuizGenerator";
import FlashcardViewer from "@/components/FlashcardViewer";
import AISummary from "@/components/AISummary";
import CommentSection from "@/components/CommentSection";
import { useStudyStreak } from "@/hooks/useStudyStreak";
import { useXP } from "@/hooks/useXP";

interface NoteDetail {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  views_count: number;
  category_id: string | null;
  categories: { name: string } | null;
}

const PdfViewer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [recommendations, setRecommendations] = useState<{ id: string; title: string; categories: { name: string } | null }[]>([]);
  const [completed, setCompleted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { recordActivity } = useStudyStreak();
  const { addXP } = useXP();

  useEffect(() => {
    if (!id) return;

    const fetchNoteData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*, categories(name)")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast({ title: "Error", description: "Note not found", variant: "destructive" });
          navigate("/dashboard");
          return;
        }

        setNote(data as unknown as NoteDetail);
        
        // Increment view count
        supabase.from("notes").update({ views_count: (data.views_count || 0) + 1 }).eq("id", id).then();

        // Record Study Activity & Add XP
        if (user) {
          recordActivity('note_view');
          addXP(5); // 5 XP for reading a note
        }

        // Fetch recommendations (same category)
        if (data.category_id) {
          const { data: recs } = await supabase
            .from("notes")
            .select("id, title, categories(name)")
            .eq("is_published", true)
            .eq("category_id", data.category_id)
            .neq("id", id)
            .limit(5);
          if (recs) setRecommendations(recs);
        }
      } catch (err) {
        console.error("PdfViewer fetch failed:", err);
        toast({ title: "Reader Error", description: "Could not load note content.", variant: "destructive" });
      }

      setLoading(false);
    };

    const fetchUserInteractions = async () => {
      if (!user) return;
      
      const [prog, like, bmark] = await Promise.all([
        supabase.from("user_note_progress").select("completed").eq("user_id", user.id).eq("note_id", id).maybeSingle(),
        supabase.from("likes").select("id").eq("user_id", user.id).eq("note_id", id).maybeSingle(),
        supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("note_id", id).maybeSingle()
      ]);

      setCompleted(prog.data?.completed ?? false);
      setLiked(!!like.data);
      setBookmarked(!!bmark.data);
    };

    fetchNoteData();
    fetchUserInteractions();
  }, [id, user, navigate, toast]);

  const toggleLike = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Sign in to like this note." });
      return;
    }
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("note_id", id);
      setLiked(false);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, note_id: id });
      setLiked(true);
      toast({ title: "Added to your likes!" });
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Sign in to bookmark this note." });
      return;
    }
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("note_id", id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, note_id: id });
      setBookmarked(true);
      toast({ title: "Saved to your library!" });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share this note with your friends." });
  };

  const coverImage = getNoteCoverImage(note?.categories?.name);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Opening your study materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <Link to="/dashboard" className="inline-flex items-center text-sm font-black text-muted-foreground hover:text-primary transition-colors mb-4 group uppercase tracking-widest">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Library
            </Link>

            {/* Note Header Info */}
            <div className="space-y-6">
               <div className="flex flex-wrap gap-2">
                 <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-widest text-[10px] px-3 py-1">
                   {note?.categories?.name || "Note"}
                 </Badge>
                 {completed && (
                   <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-black uppercase tracking-widest text-[10px] px-3 py-1">
                     <CheckCircle2 className="h-3 w-3 mr-1" /> Mastered
                   </Badge>
                 )}
               </div>

               <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-foreground">
                 {note?.title}
               </h1>

               <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-y border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                      {note?.title.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-foreground">{"NoteHub Scholar"}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Premium Study Material</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black">{note?.views_count || 0}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Readers</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black">128</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">XP Value</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black">4.9</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rating</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Smart Learning Tools */}
            <div className="bg-secondary/30 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 border-2 border-dashed border-primary/20">
              <div className="space-y-1">
                <h4 className="font-black flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Learning Suite
                </h4>
                <p className="text-xs text-muted-foreground font-medium">Use AI to master this topic 10x faster</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <QuizGenerator 
                  noteId={id!} 
                  noteTitle={note?.title || ""} 
                  noteDescription={note?.description || ""} 
                />
                <FlashcardViewer 
                  noteId={id!} 
                  noteTitle={note?.title || ""} 
                  noteDescription={note?.description || ""} 
                />
              </div>
            </div>

            {/* Reader Actions */}
            <div className="flex flex-wrap gap-3">
              <Button 
                variant={liked ? "default" : "outline"} 
                className={`rounded-full px-8 font-black transition-all ${liked ? "shadow-lg shadow-primary/20" : "border-primary/20 text-primary hover:bg-primary/5"}`}
                onClick={toggleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-white" : ""}`} /> 
                {liked ? "Liked" : "Like"}
              </Button>
              <Button 
                variant={bookmarked ? "default" : "outline"} 
                className={`rounded-full px-8 font-black transition-all ${bookmarked ? "shadow-lg shadow-primary/20" : "border-primary/20 text-primary hover:bg-primary/5"}`}
                onClick={toggleBookmark}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? "fill-white" : ""}`} /> 
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button variant="ghost" className="rounded-full px-6 font-bold hover:bg-secondary" onClick={copyToClipboard}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              
              <div className="ml-auto flex items-center gap-3">
                <Button 
                  asChild 
                  className="rounded-full px-8 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all bg-primary"
                >
                  <a href={`${note?.file_url}`} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </a>
                </Button>
              </div>
            </div>

            {/* The Reader Container */}
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-2xl blur-xl opacity-50"></div>
               <div className="relative bg-white dark:bg-card rounded-2xl border shadow-2xl overflow-hidden w-full" style={{ minHeight: '600px', height: '85vh', maxHeight: '1200px' }}>
                  {note?.file_url ? (
                    <iframe
                      src={`${note.file_url}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-none"
                      title={note.title}
                      allow="fullscreen"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-12">
                       <FileText className="h-20 w-20 mb-6 opacity-10" />
                       <p className="text-xl font-bold">No Reading Content Found</p>
                       <p className="text-sm">This note might be missing its PDF attachment.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Comments Section */}
            <div className="pt-12">
               <CommentSection noteId={id!} />
            </div>
          </div>

          {/* Sidebar / Info Area */}
          <div className="lg:col-span-4 space-y-10">
            <AISummary 
              noteTitle={note?.title || ""} 
              noteDescription={note?.description || ""} 
            />

            {/* Recommended Notes */}
            <div className="bg-card rounded-3xl border shadow-xl overflow-hidden">
               <div className="p-6 border-b bg-secondary/30">
                 <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                   <Wand2 className="h-4 w-4 text-primary" /> Personalized for you
                 </h4>
               </div>
               
               <div className="p-6 space-y-6">
                 <div className="space-y-4">
                    {recommendations.map(rec => (
                      <Link key={rec.id} to={`/viewer/${rec.id}`} className="flex gap-4 group">
                        <div className="h-20 w-16 rounded-xl bg-secondary flex-shrink-0 overflow-hidden border shadow-sm group-hover:border-primary transition-colors">
                           <img src={getNoteCoverImage(rec.categories?.name)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-xs font-black line-clamp-2 group-hover:text-primary transition-colors leading-tight">{rec.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5 uppercase font-black tracking-widest">{rec.categories?.name}</p>
                        </div>
                      </Link>
                    ))}
                    {recommendations.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No related notes found in this category.</p>
                    )}
                    <Link to="/dashboard?view=notes" className="flex items-center justify-center gap-2 text-xs font-black text-primary hover:underline pt-4 group">
                       Explore Library <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
               </div>
            </div>

            {/* Pro Study Tip Card */}
            <div className="bg-primary p-8 rounded-3xl text-white space-y-4 shadow-2xl shadow-primary/30 relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
               <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                 <Brain className="h-5 w-5" />
               </div>
               <h4 className="text-lg font-black leading-tight italic">"The best way to learn is to teach someone else."</h4>
               <p className="text-xs text-primary-foreground font-medium leading-relaxed">
                 Try summarizing this note in the comments! It helps reinforce what you've learned and assists fellow students.
               </p>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PdfViewer;
