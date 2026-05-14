import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, ExternalLink, GraduationCap, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kenyanUniversities } from "@/data/kenyanUniversities";

const Universities = () => {
  const [universityName, setUniversityName] = useState<string>("");
  const [courseName, setCourseName] = useState<string>("");
  const [query, setQuery] = useState("");

  const selectedUniversity = useMemo(
    () => kenyanUniversities.find((u) => u.name === universityName),
    [universityName]
  );

  const filteredUniversities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return kenyanUniversities;
    return kenyanUniversities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.courses.some((c) => c.toLowerCase().includes(q))
    );
  }, [query]);


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container py-10 flex-1">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="text-center space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Kenyan Universities & Courses
            </h1>
            <p className="text-muted-foreground">
              Pick a university to explore the courses it offers, then visit its official site.
            </p>
          </header>

          <Card className="p-6 space-y-5 rounded-2xl">
            <div className="space-y-2">
              <label className="text-sm font-bold">Search universities</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a university or course name..."
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              {query && (
                <p className="text-xs text-muted-foreground">
                  {filteredUniversities.length} match
                  {filteredUniversities.length === 1 ? "" : "es"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">University</label>
              <Select
                value={universityName}
                onValueChange={(v) => {
                  setUniversityName(v);
                  setCourseName("");
                }}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {filteredUniversities.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No universities found
                    </div>
                  ) : (
                    filteredUniversities.map((u) => (
                      <SelectItem key={u.name} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Course</label>
              <Select
                value={courseName}
                onValueChange={setCourseName}
                disabled={!selectedUniversity}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue
                    placeholder={
                      selectedUniversity
                        ? "Select a course"
                        : "Choose a university first"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {selectedUniversity?.courses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUniversity && (
              <div className="rounded-xl border bg-muted/40 p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                    Selected
                  </p>
                  <p className="font-black text-lg">{selectedUniversity.name}</p>
                  {courseName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Course: <span className="font-semibold text-foreground">{courseName}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="rounded-full font-bold flex-1">
                    <Link
                      to={`/dashboard?view=notes&search=${encodeURIComponent(
                        courseName || selectedUniversity.name
                      )}`}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {courseName ? "Browse course notes" : "Browse university notes"}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-full font-bold flex-1">
                    <Link
                      to={`/dashboard?view=completed&search=${encodeURIComponent(
                        courseName || selectedUniversity.name
                      )}`}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      My progress
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full font-bold">
                    <a
                      href={selectedUniversity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official site
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Notes are matched by title/description. Completion is tracked per PDF as you mark it done.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Universities;
