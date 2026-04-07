import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle2, FileText, BookOpen } from "lucide-react";

const lessons = [
  { id: 1, title: "Introduction to Arrays & Linked Lists", active: true },
  { id: 2, title: "React Hooks Deep Dive", active: false },
  { id: 3, title: "SQL Joins Explained", active: false },
  { id: 4, title: "Neural Networks Basics", active: false },
  { id: 5, title: "Binary Search Trees", active: false },
];

const PdfViewer = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-muted/20">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r bg-background">
        <div className="flex items-center gap-2 px-5 h-14 border-b">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Lessons</p>
          <nav className="space-y-0.5">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/viewer/${lesson.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  String(lesson.id) === id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{lesson.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-background flex items-center px-4 md:px-6 gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-sm truncate flex-1">
            {lessons.find((l) => String(l.id) === id)?.title || "Note Viewer"}
          </h1>
          <Badge variant="secondary" className="bg-accent text-accent-foreground hidden sm:inline-flex">DSA</Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download
            </Button>
            <Button size="sm">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark Complete
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl aspect-[3/4] rounded-xl border bg-background shadow-card flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">PDF Viewer</p>
              <p className="text-sm">Note #{id} will be displayed here</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PdfViewer;
