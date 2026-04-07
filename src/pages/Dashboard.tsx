import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen, Search, LayoutDashboard, FileText, FolderOpen,
  CheckCircle2, User, LogOut, Download, Eye, Menu, X
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "My Notes", icon: FileText },
  { label: "Categories", icon: FolderOpen },
  { label: "Completed", icon: CheckCircle2 },
  { label: "Profile", icon: User },
  { label: "Logout", icon: LogOut },
];

const notes = [
  { id: 1, title: "Introduction to Arrays & Linked Lists", category: "DSA", description: "Fundamentals of linear data structures with examples.", completed: true },
  { id: 2, title: "React Hooks Deep Dive", category: "Web Dev", description: "Understanding useState, useEffect, and custom hooks.", completed: false },
  { id: 3, title: "SQL Joins Explained", category: "Databases", description: "Inner, outer, left, and right joins with practical queries.", completed: false },
  { id: 4, title: "Neural Networks Basics", category: "ML", description: "Introduction to perceptrons, activation functions, and backpropagation.", completed: true },
  { id: 5, title: "Binary Search Trees", category: "DSA", description: "BST operations: insert, delete, search, and traversal.", completed: false },
  { id: 6, title: "CSS Grid & Flexbox", category: "Web Dev", description: "Modern layout techniques for responsive web design.", completed: false },
];

const categoryColors: Record<string, string> = {
  DSA: "bg-accent text-accent-foreground",
  "Web Dev": "bg-accent text-accent-foreground",
  Databases: "bg-accent text-accent-foreground",
  ML: "bg-accent text-accent-foreground",
};

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r bg-background flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b font-bold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>NoteHub</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-md flex items-center px-4 md:px-6 gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              JS
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">My Notes</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} notes available</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((note) => (
              <Card key={note.id} className="shadow-card hover:shadow-card-hover transition-shadow group">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={categoryColors[note.category] || "bg-accent text-accent-foreground"} variant="secondary">
                      {note.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={note.completed} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5 leading-snug">{note.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 flex-1">{note.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1" asChild>
                      <Link to={`/viewer/${note.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Read
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
