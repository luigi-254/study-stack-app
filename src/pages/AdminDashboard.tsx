import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  BookOpen, LayoutDashboard, Upload, FileText, Users, BarChart3,
  Pencil, Trash2, Menu, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Upload Note", icon: Upload },
  { label: "Manage Notes", icon: FileText },
  { label: "Users", icon: Users },
  { label: "Analytics", icon: BarChart3 },
];

interface NoteRow {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  categories: { name: string } | null;
}

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    const [catRes, notesRes] = await Promise.all([
      supabase.from("categories").select("id, name"),
      supabase.from("notes").select("id, title, description, is_published, created_at, categories(name)").order("created_at", { ascending: false }),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (notesRes.data) setNotes(notesRes.data as unknown as NoteRow[]);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async () => {
    if (!user || !file || !title || !categoryId) {
      toast({ title: "Missing fields", description: "Please fill all fields and select a PDF.", variant: "destructive" });
      return;
    }
    setUploading(true);

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("notes-pdfs").upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("notes-pdfs").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("notes").insert({
      user_id: user.id,
      title,
      description,
      category_id: categoryId,
      file_url: urlData.publicUrl,
      is_published: true,
    });

    setUploading(false);
    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Note published!" });
      setTitle(""); setDescription(""); setCategoryId(""); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Note deleted" });
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("notes").update({ is_published: !current }).eq("id", id);
    if (!error) {
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, is_published: !current } : n));
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/20">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r bg-background flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b font-bold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Admin Panel</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-md flex items-center px-4 md:px-6 gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          <div className="ml-auto h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            AD
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Upload form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Upload New Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Brief description of the note..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PDF File</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF up to 20MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Publish Note"}
              </Button>
            </CardContent>
          </Card>

          {/* Notes table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Manage Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="bg-accent text-accent-foreground">{note.categories?.name || "—"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(note.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={note.is_published ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => togglePublish(note.id, note.is_published)}
                          >
                            {note.is_published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(note.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {notes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No notes yet. Upload your first note above.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
