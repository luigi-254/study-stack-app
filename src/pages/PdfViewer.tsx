import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Download, CheckCircle2, FileText, 
  Heart, MessageCircle, Bookmark, Share2, 
  Eye, User, Clock, ChevronRight, Printer, Link as LinkIcon,
  ChevronDown
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

interface NoteDetail {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  views_count: number;
  categories: { name: string } | null;
  profiles?: { full_name: string | null } | null;
}

const PdfViewer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchNoteData = async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
          .from("notes")
          .select("*, categories(name)")
          .eq("id", id)
          .single();

        if (error || !data) {
           // Fallback if profiles join fails
           const fallback = await supabase
            .from("notes")
            .select("title, description, file_url")
            .eq("id", id)
            .single();
           data = fallback.data;
           error = fallback.error;
        }

        if (error) {
          toast({ title: "Error", description: "Note not found", variant: "destructive" });
          navigate("/dashboard");
          return;
        }

        if (data) {
          setNote(data as any);
          // Gently try to increment view count, ignore failures
          supabase.from("notes").update({ views_count: ((data as any).views_count || 0) + 1 }).eq("id", id).then();
        }

        // Fetch recommendations (same category)
        const { data: recs } = await supabase
          .from("notes")
          .select("id, title, categories(name)")
          .eq("category_id", (data as any).category_id)
          .neq("id", id)
          .limit(5);
        if (recs) setRecommendations(recs);
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

  const handlePrint = () => {
    window.print();
  };

  const coverImage = getNoteCoverImage(note?.categories?.name);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
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
            <Link to="/dashboard" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Library
            </Link>

            {/* Note Header Info */}
            <div className="space-y-6">
               <div className="flex flex-wrap gap-2">
                 <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest text-[10px]">
                   {note?.categories?.name || "Note"}
                 </Badge>
                 {completed && (
                   <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold">
                     <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                   </Badge>
                 )}
               </div>

               <h1 className="text-4xl md:text-5xl font-black leading-tight text-foreground">
                 {note?.title}
               </h1>

               <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg">
                      {note?.profiles?.full_name?.charAt(0) || "N"}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{note?.profiles?.full_name || "NoteHub Author"}</p>
                      <p className="text-xs text-muted-foreground">Published on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black">{note?.views_count || 0}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Views</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black">12</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Likes</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black">4</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Parts</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Reading Actions */}
            <div className="flex flex-wrap gap-3">
              <Button 
                variant={liked ? "default" : "secondary"} 
                className="rounded-full px-6 font-bold"
                onClick={toggleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-white" : ""}`} /> 
                {liked ? "Liked" : "Like"}
              </Button>
              <Button 
                variant={bookmarked ? "default" : "secondary"} 
                className="rounded-full px-6 font-bold"
                onClick={toggleBookmark}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? "fill-white" : ""}`} /> 
                {bookmarked ? "Saved" : "Save"}
              </Button>
              <Button variant="secondary" className="rounded-full px-6 font-bold" onClick={copyToClipboard}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full px-6 font-bold flex items-center gap-2 border-primary/20 hover:bg-primary/5">
                      <Download className="h-4 w-4" /> 
                      Download Options
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-none p-2 space-y-1">
                    <DropdownMenuItem className="rounded-lg py-3 cursor-pointer font-bold focus:bg-primary/5 focus:text-primary transition-colors" asChild>
                       <a href={note?.file_url} target="_blank" rel="noopener noreferrer">
                         <Download className="h-4 w-4 mr-2 text-primary" /> Download PDF
                       </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg py-3 cursor-pointer font-bold focus:bg-primary/5 focus:text-primary transition-colors" onClick={handlePrint}>
                       <Printer className="h-4 w-4 mr-2 text-primary" /> Print Note
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg py-3 cursor-pointer font-bold focus:bg-primary/5 focus:text-primary transition-colors" onClick={copyToClipboard}>
                       <LinkIcon className="h-4 w-4 mr-2 text-primary" /> Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* The Reader Container */}
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
               <div className="relative bg-white rounded-2xl border shadow-2xl overflow-hidden aspect-[3/4] md:aspect-[4/3] w-full">
                  {note?.file_url ? (
                    <iframe
                      src={note.file_url}
                      className="w-full h-full border-none"
                      title={note.title}
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

            {/* Comments Section (Placeholder) */}
            <div className="pt-12 space-y-8">
               <div className="flex items-center justify-between border-b pb-4">
                 <h3 className="text-2xl font-black">Comments <span className="text-primary font-normal text-lg ml-2">12</span></h3>
                 <Button variant="ghost" className="font-bold text-primary">Write a comment</Button>
               </div>
               
               <div className="space-y-6">
                 {[1, 2].map(i => (
                   <div key={i} className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">Top Reader {i}</p>
                          <span className="text-[10px] text-muted-foreground">2 days ago</span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          This note was incredibly helpful for my exam preparation! The way you explained 
                          the concepts was so much clearer than my professor. Thanks for sharing!
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <button className="text-[10px] font-bold text-muted-foreground hover:text-primary">Helpful (4)</button>
                          <button className="text-[10px] font-bold text-muted-foreground hover:text-primary">Reply</button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
               <Button variant="ghost" className="w-full font-bold text-muted-foreground h-12">View all 12 comments</Button>
            </div>
          </div>

          {/* Sidebar / Info Area */}
          <div className="lg:col-span-4 space-y-10">
            {/* Cover Image Card */}
            <div className="bg-card rounded-2xl border overflow-hidden shadow-lg sticky top-28">
               <div className="relative aspect-[3/4] sm:aspect-video lg:aspect-[3/4]">
                  <img 
                    src={coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                     <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Currently Reading</p>
                     <p className="text-white text-xl font-black leading-tight line-clamp-2">{note?.title}</p>
                  </div>
               </div>
               
               <div className="p-6 space-y-6">
                 <div className="space-y-2">
                   <h4 className="font-bold text-sm">Description</h4>
                   <p className="text-sm text-muted-foreground leading-relaxed">
                     {note?.description || "Explore this comprehensive set of notes designed to help you master the core concepts of this subject."}
                   </p>
                 </div>

                 <div className="pt-6 border-t border-border/50">
                   <h4 className="font-bold text-sm mb-4">You might also like</h4>
                   <div className="space-y-4">
                      {recommendations.map(rec => (
                        <Link key={rec.id} to={`/viewer/${rec.id}`} className="flex gap-3 group">
                          <div className="h-16 w-12 rounded bg-secondary flex-shrink-0 overflow-hidden">
                             <img src={getNoteCoverImage(rec.categories?.name)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors">{rec.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">{rec.categories?.name}</p>
                          </div>
                        </Link>
                      ))}
                      <Link to="/dashboard" className="flex items-center justify-center gap-2 text-xs font-bold text-primary hover:underline pt-2">
                         Browse more <ChevronRight className="h-3 w-3" />
                      </Link>
                   </div>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PdfViewer;

