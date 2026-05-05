import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NoteCard from "@/components/NoteCard";
import { 
  ArrowRight, Sparkles, TrendingUp, Clock, 
  ChevronRight, BookOpen, GraduationCap, PlusCircle,
  Brain, Zap, Trophy, MessageSquare, LayoutDashboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NoteWithStats {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url?: string | null;
  categories: { name: string } | null;
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
        const { data: picks } = await supabase
          .from("notes")
          .select(`
            id, title, description, thumbnail_url,
            categories(name)
          `)
          .eq("is_published", true)
          .eq("is_top_pick", true)
          .limit(4);
        
        if (picks) setTopPicks(picks as unknown as NoteWithStats[]);
      } catch (e) {
        console.error("Top Picks fetch failed:", e);
      }
      
      try {
        const { data: recent } = await supabase
          .from("notes")
          .select(`
            id, title, description, thumbnail_url, views_count,
            categories(name)
          `)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (recent) setRecentNotes(recent as unknown as NoteWithStats[]);
      } catch (e) {
        console.error("Recent fetch failed:", e);
      }

      try {
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
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent)]" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Badge variant="outline" className="px-4 py-2 border-primary/20 text-primary bg-primary/5 rounded-full animate-fade-in shadow-sm">
                <Sparkles className="h-4 w-4 mr-2 fill-primary" />
                The Future of Learning is Here
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.0] animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Your All-in-One <br/>
                <span className="text-primary italic">AI Study Engine.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in font-medium" style={{ animationDelay: '0.2s' }}>
                Transform static notes into interactive learning experiences. Generate AI quizzes, 
                flashcards, and master summaries in seconds. Stop storing content—start passing exams.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button size="lg" asChild className="h-16 px-10 rounded-full text-lg font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                  <Link to="/register">Start Learning Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-16 px-10 rounded-full text-lg font-bold hover:bg-secondary border-2">
                  <Link to="/dashboard">Explore Library</Link>
                </Button>
              </div>
              
              <div className="pt-12 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2 font-black italic">AI-POWERED</div>
                <div className="flex items-center gap-2 font-black italic">EXAM-READY</div>
                <div className="flex items-center gap-2 font-black italic">COMMUNITY-DRIVEN</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="py-24 bg-secondary/30 relative">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight">Learn 10x faster with <span className="text-primary">StudyStack AI</span></h2>
               <p className="text-muted-foreground font-medium text-lg">We've combined elite study materials with cutting-edge AI to build the ultimate preparation platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-[40px] shadow-sm border space-y-6 hover:shadow-xl transition-all group">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Brain className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black">AI Quiz Engine</h3>
                  <p className="text-muted-foreground font-medium">Turn any note into a personalized MCQ quiz. Identify weak areas and master topics before the exam.</p>
                  <ul className="space-y-2 text-sm font-bold text-muted-foreground">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-primary rounded-full"/> Instant MCQs</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-primary rounded-full"/> Detailed Explanations</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-primary rounded-full"/> Score Tracking</li>
                  </ul>
               </div>

               <div className="bg-white p-8 rounded-[40px] shadow-sm border space-y-6 hover:shadow-xl transition-all group">
                  <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black">Active Recall</h3>
                  <p className="text-muted-foreground font-medium">AI-generated flashcards with spaced repetition logic. Move information to long-term memory effortlessly.</p>
                  <ul className="space-y-2 text-sm font-bold text-muted-foreground">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-orange-500 rounded-full"/> Key Term Extraction</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-orange-500 rounded-full"/> 3D Flip Cards</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-orange-500 rounded-full"/> Review Scheduling</li>
                  </ul>
               </div>

               <div className="bg-white p-8 rounded-[40px] shadow-sm border space-y-6 hover:shadow-xl transition-all group">
                  <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black">Gamified Progress</h3>
                  <p className="text-muted-foreground font-medium">Stay motivated with study streaks, XP, and level-ups. Turn your academic preparation into a winnable game.</p>
                  <ul className="space-y-2 text-sm font-bold text-muted-foreground">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-blue-500 rounded-full"/> Daily Streaks</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-blue-500 rounded-full"/> XP Leaderboards</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-blue-500 rounded-full"/> Achievement Badges</li>
                  </ul>
               </div>
            </div>
          </div>
        </section>

        {/* Top Picks Section */}
        <section className="py-24">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-4xl font-black mb-2">Editor's Choice</h2>
                <p className="text-muted-foreground font-medium text-lg">The most comprehensive notes as rated by our academic team.</p>
              </div>
              <Button variant="ghost" className="items-center gap-1 font-black group text-primary" asChild>
                <Link to="/dashboard">Explore Library <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-3xl bg-muted animate-pulse" />
                ))
              ) : topPicks.map((note) => (
                <NoteCard 
                  key={note.id}
                  id={note.id}
                  title={note.title}
                  description={note.description}
                  category={note.categories?.name || "Uncategorized"}
                  author={"NoteHub Admin"}
                  thumbnail={note.thumbnail_url}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Study Dashboard Preview */}
        <section className="py-24 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-20" />
          <div className="container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 rounded-full">Coming Soon: Community Hub</Badge>
                <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">Your Personal <br/>Study Command Center.</h2>
                <p className="text-xl text-primary-foreground font-medium leading-relaxed">
                  Get a birds-eye view of your academic progress. Our smart dashboard surfaces "weak topics," 
                  upcoming reviews, and daily goals to keep you on track.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-3xl font-black">10k+</p>
                    <p className="text-sm font-bold text-primary-foreground/70 uppercase tracking-widest">Study Notes</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-black">250k+</p>
                    <p className="text-sm font-bold text-primary-foreground/70 uppercase tracking-widest">Quizzes Taken</p>
                  </div>
                </div>
                <Button size="lg" className="bg-white text-primary hover:bg-secondary h-16 px-10 rounded-full text-lg font-black shadow-2xl">
                  Sign Up & Get Started
                </Button>
              </div>
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700">
                   {/* Mock UI elements */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-white/20 rounded-full" />
                        <div className="h-4 w-12 bg-white/20 rounded-full" />
                      </div>
                      <div className="h-40 bg-white/5 rounded-3xl flex items-center justify-center">
                        <LayoutDashboard className="h-16 w-16 text-white/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-white/5 rounded-2xl" />
                        <div className="h-20 bg-white/5 rounded-2xl" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Ready to ace your next exam?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Join thousands of students who are already using StudyStack to simplify their academic life.</p>
            <div className="flex items-center justify-center gap-4">
               <Button size="lg" className="h-16 px-12 rounded-full text-lg font-black">Get Started for Free</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

