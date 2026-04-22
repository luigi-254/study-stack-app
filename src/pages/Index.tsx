import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NoteCard from "@/components/NoteCard";
import { 
  Sparkles, ChevronRight, BookOpen, GraduationCap, PlusCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NoteWithStats {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url?: string | null;
  categories: { name: string } | null;
  profiles?: { full_name: string | null } | null;
  views_count?: number;
}

const Index = () => {
  const [topPicks, setTopPicks] = useState<NoteWithStats[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteWithStats[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch Admin Curated Top Picks
        const { data: picks } = await supabase
          .from("notes")
          .select(`
            id, title, description, thumbnail_url,
            categories(name)
          `)
          .eq("is_published", true)
          .eq("is_top_pick", true)
          .limit(4);
        
        if (picks) setTopPicks(picks as any);
      } catch (e) {
        console.error("Top Picks fetch failed:", e);
      }
      
      try {
        // Fetch Recent
        const { data: recent } = await supabase
          .from("notes")
          .select(`
            id, title, description, thumbnail_url,
            categories(name)
          `)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (recent) setRecentNotes(recent as any);
      } catch (e) {
        console.error("Recent fetch failed:", e);
      }

      try {
        // Fetch Categories with counts
        const { data: catData } = await supabase
          .from("notes")
          .select("categories(name)")
          .eq("is_published", true);

        if (catData) {
          const counts: Record<string, number> = {};
          catData.forEach((item: any) => {
            const name = item.categories?.name;
            if (name) counts[name] = (counts[name] || 0) + 1;
          });
          setCategories(Object.entries(counts).map(([name, count]) => ({ name, count })));
        }
      } catch (e) {
        console.error("Categories fetch failed:", e);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section - Wattpad style 2-col */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="container relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              {/* Left: Headline */}
              <div className="space-y-8 animate-fade-in">
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-foreground">
                  Your Academic Journey, Perfectly Simplified.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Skip the noise. Explore hand-picked, high-impact notes to help you master your subjects faster.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Button size="lg" asChild className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto">
                    <Link to="/register">Join the Community</Link>
                  </Button>
                  <Link to="/dashboard" className="text-base font-bold text-foreground hover:text-primary transition-colors text-center sm:text-left underline-offset-4 hover:underline">
                    Browse Full Library →
                  </Link>
                </div>
              </div>

              {/* Right: NoteHub illustrated visual */}
              <div className="relative aspect-square max-w-md md:max-w-none mx-auto w-full animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <img
                  src={heroNotehub}
                  alt="NoteHub bookshelf illustration shaped as the letters n and h, filled with books and study supplies"
                  width={1024}
                  height={1024}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Top Picks Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">Top Picks</h2>
                  <p className="text-muted-foreground font-medium">Editor-approved notes for maximum learning</p>
                </div>
              </div>
              <Button variant="ghost" className="hidden sm:flex items-center gap-1 font-bold group" asChild>
                <Link to="/dashboard">Explore All <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
                ))
              ) : topPicks.length > 0 ? (
                topPicks.map((note) => (
                  <NoteCard 
                    key={note.id}
                    id={note.id}
                    title={note.title}
                    description={note.description}
                    category={note.categories?.name || "Uncategorized"}
                    author={note.profiles?.full_name || "NoteHub Admin"}
                    thumbnail={note.thumbnail_url}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground italic font-medium">
                  Currently curating new masterpieces. Check back soon!
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Categories Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4">Discover Your Subject</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Explore curated collections across all major academic and professional fields.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Link 
                  key={cat.name} 
                  to={`/dashboard?category=${encodeURIComponent(cat.name)}`}
                  className="group relative h-40 overflow-hidden rounded-2xl bg-secondary flex flex-col items-center justify-center transition-all hover:-translate-y-2 hover:bg-primary/5"
                >
                  <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                     <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-center px-4 group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">{cat.count} Notes</p>
                </Link>
              ))}
              <Link 
                to="/dashboard"
                className="group relative h-40 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                   <PlusCircle className="h-6 w-6" />
                </div>
                <h3 className="font-bold">Browse All</h3>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonial/Trust Section */}
        <section className="py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
               <div className="space-y-4">
                 <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                   <GraduationCap className="h-8 w-8" />
                 </div>
                 <h3 className="text-xl font-bold">Student-Verified</h3>
                 <p className="text-muted-foreground">Every note is reviewed for accuracy and clarity by our community of high-achievers.</p>
               </div>
               <div className="space-y-4">
                 <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                   <Sparkles className="h-8 w-8" />
                 </div>
                 <h3 className="text-xl font-bold">Hyper-Focused</h3>
                 <p className="text-muted-foreground">We skip the fluff. Get straight to the concepts you need to know for your exams.</p>
               </div>
               <div className="space-y-4">
                 <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                   <BookOpen className="h-8 w-8" />
                 </div>
                 <h3 className="text-xl font-bold">Access Anywhere</h3>
                 <p className="text-muted-foreground">Read on your laptop, tablet, or phone with our responsive, immersive reader.</p>
               </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

