import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BookOpen, Code, Database, Brain, Shield, FolderOpen, BarChart3,
  ArrowRight, GraduationCap, FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = {
  "Data Structures": Code,
  "Algorithms": Code,
  "Web Development": BookOpen,
  "Databases": Database,
  "Machine Learning": Brain,
  "AI": Brain,
  "Operating Systems": FileText,
  "Networks": GraduationCap,
  "Computer Science": GraduationCap,
};

const defaultIcon = BookOpen;

const features = [
  { title: "Secure Access", description: "Your notes are protected with authentication and role-based access control.", icon: Shield },
  { title: "Organized Notes", description: "Browse notes by category, subject, and topic for easy discovery.", icon: FolderOpen },
  { title: "Progress Tracking", description: "Track your reading progress and mark notes as completed.", icon: BarChart3 },
];

const Index = () => {
  const [realCategories, setRealCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("categories(name)")
        .eq("is_published", true);

      if (!error && data) {
        const counts: Record<string, number> = {};
        (data as unknown as { categories: { name: string } | null }[]).forEach((item) => {
          const name = item.categories?.name;
          if (name) counts[name] = (counts[name] || 0) + 1;
        });
        const formatted = Object.entries(counts).map(([name, count]) => ({ name, count }));
        setRealCategories(formatted);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
  <div className="min-h-screen flex flex-col">
    <Navbar />

    {/* Hero */}
    <section className="gradient-hero-subtle py-20 md:py-32">
      <div className="container text-center max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-4 bg-accent text-accent-foreground">
          📚 500+ Notes Available
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
          Access Quality Learning Notes{" "}
          <span className="text-primary">Anytime</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Curated PDF notes for students. Study smarter with organized, high-quality materials across all major CS subjects.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/dashboard">Browse Notes</Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Categories */}
    <section className="container py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Browse by Category</h2>
        <p className="text-muted-foreground">Find notes organized by subject area</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))
        ) : realCategories.length > 0 ? (
          realCategories.map((cat) => {
            const Icon = iconMap[cat.name] || iconMap[Object.keys(iconMap).find(k => cat.name.includes(k)) || ""] || defaultIcon;
            return (
              <Link 
                key={cat.name} 
                to={`/dashboard?category=${encodeURIComponent(cat.name)}`}
                className="block"
              >
                <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group h-full">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5 text-accent-foreground group-hover:text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat.count} notes</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No categories available yet.
          </div>
        )}
      </div>
    </section>

    {/* Features */}
    <section className="bg-muted/30 py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Why NoteHub?</h2>
          <p className="text-muted-foreground">Built for focused, distraction-free learning</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="shadow-card border-0">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
  );
};

export default Index;
