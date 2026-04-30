import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send, ThumbsUp, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  helpful_count: number;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  noteId: string;
}

export default function CommentSection({ noteId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id, content, created_at, user_id, helpful_count,
        profiles:user_id (full_name, avatar_url)
      `)
      .eq("note_id", noteId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data as unknown as Comment[]);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchComments();
  }, [noteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      note_id: noteId,
      user_id: user.id,
      content: newComment.trim()
    });

    if (error) {
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    } else {
      setNewComment("");
      fetchComments();
      toast({ title: "Comment posted!" });
    }
    setLoading(false);
  };

  const handleVote = async (commentId: string) => {
    if (!user) return;
    // Logic for voting would go here (update helpful_count and comment_votes table)
    toast({ title: "Thanks for the feedback!" });
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-black uppercase tracking-tight">Discussion ({comments.length})</h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border shadow-sm">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Join the discussion... What did you learn?"
              className="flex-1 min-h-[100px] rounded-2xl border-none bg-secondary/50 focus-visible:ring-primary p-4"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!newComment.trim() || loading} className="rounded-full px-8 font-black shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Post Comment</>}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-primary/5 p-8 rounded-3xl text-center space-y-4 border border-dashed border-primary/20">
          <p className="font-bold">Sign in to join the conversation!</p>
          <Button variant="outline" className="rounded-full border-primary/20" onClick={() => window.location.href = "/login"}>Login to Comment</Button>
        </div>
      )}

      <div className="space-y-6">
        {fetching ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-sm font-medium">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/10">
                <AvatarImage src={comment.profiles?.avatar_url || ""} />
                <AvatarFallback className="bg-secondary text-muted-foreground font-bold">
                  {comment.profiles?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="bg-secondary/30 p-5 rounded-3xl rounded-tl-none">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm">{comment.profiles?.full_name || "Anonymous Member"}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-4 px-2">
                  <button 
                    onClick={() => handleVote(comment.id)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="h-3 w-3" /> {comment.helpful_count || "Helpful?"}
                  </button>
                  {user?.id === comment.user_id && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-destructive hover:opacity-80 transition-opacity ml-auto opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
