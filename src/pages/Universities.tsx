import { useMemo, useState } from "react";
import { ExternalLink, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const selectedUniversity = useMemo(
    () => kenyanUniversities.find((u) => u.name === universityName),
    [universityName]
  );

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
                  {kenyanUniversities.map((u) => (
                    <SelectItem key={u.name} value={u.name}>
                      {u.name}
                    </SelectItem>
                  ))}
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
              <div className="rounded-xl border bg-muted/40 p-5 space-y-3">
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
                <Button asChild className="w-full sm:w-auto rounded-full font-bold">
                  <a
                    href={selectedUniversity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit {selectedUniversity.name}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
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
