import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FolderOpen, FileText, CheckCircle2, ArrowRight, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
}

interface NoteRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  views_count: number;
  category_id: string | null;
  categories: { name: string } | null;
}

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: cats }, { data: ns }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase
          .from("notes")
          .select("id, title, description, thumbnail_url, views_count, category_id, categories(name)")
          .eq("is_published", true),
      ]);
      if (cats) setCategories(cats);
      if (ns) setNotes(ns as unknown as NoteRow[]);

      if (user) {
        const { data: prog } = await supabase
          .from("user_note_progress")
          .select("note_id, completed")
          .eq("user_id", user.id);
        if (prog) {
          const map: Record<string, boolean> = {};
          prog.forEach((p) => { map[p.note_id] = p.completed; });
          setProgress(map);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    notes.forEach((n) => {
      if (!n.category_id) return;
      const s = map.get(n.category_id) ?? { total: 0, done: 0 };
      s.total += 1;
      if (progress[n.id]) s.done += 1;
      map.set(n.category_id, s);
    });
    return map;
  }, [notes, progress]);

  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCategory = categories.find((c) => c.id === activeId) ?? null;
  const activeNotes = activeCategory
    ? notes.filter((n) => n.category_id === activeCategory.id)
    : [];

  const totalNotes = notes.length;
  const totalDone = notes.filter((n) => progress[n.id]).length;
  const overallPct = totalNotes ? Math.round((totalDone / totalNotes) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-8 md:py-12 px-4 md:px-6 space-y-10">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
            <FolderOpen className="h-3.5 w-3.5" /> Categories
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">Browse by subject</h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            Filter notes by category and track how much of each subject you've completed.
          </p>
        </header>

        {user && totalNotes > 0 && (
          <section className="rounded-3xl border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-black">Your overall progress</h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {totalDone} of {totalNotes} notes completed
                </p>
              </div>
              <span className="text-2xl font-black text-primary">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-2" />
          </section>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="pl-10 h-11 bg-secondary/50 border-none rounded-full"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredCats.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-bold">No categories found</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCats.map((cat) => {
              const s = stats.get(cat.id) ?? { total: 0, done: 0 };
              const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
              const isActive = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(isActive ? null : cat.id)}
                  className={`group text-left rounded-2xl border bg-card p-6 space-y-4 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <ArrowRight
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isActive ? "rotate-90 text-primary" : "group-hover:translate-x-1"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{cat.name}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {s.total} notes
                      </span>
                      {user && (
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {s.done} done
                        </span>
                      )}
                    </div>
                  </div>
                  {user && s.total > 0 && (
                    <div className="space-y-1.5">
                      <Progress value={pct} className="h-1.5" />
                      <div className="text-[11px] font-bold text-muted-foreground text-right">
                        {pct}% complete
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </section>
        )}

        {activeCategory && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-black">
                {activeCategory.name}{" "}
                <span className="text-muted-foreground font-bold text-base">
                  · {activeNotes.length} notes
                </span>
              </h2>
              <Button asChild variant="outline" className="rounded-full font-bold">
                <Link to={`/dashboard?category=${encodeURIComponent(activeCategory.name)}&view=notes`}>
                  Open in library <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {activeNotes.length === 0 ? (
              <p className="text-muted-foreground font-medium">No published notes yet in this category.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    id={n.id}
                    title={n.title}
                    description={n.description}
                    category={n.categories?.name || activeCategory.name}
                    author="NoteHub Author"
                    views={n.views_count}
                    thumbnail={n.thumbnail_url}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Categories;
