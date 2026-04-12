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
  Pencil, Trash2, Menu, X, CheckCircle, Clock, BookMarked, Plus, FolderOpen
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const adminNav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "upload", label: "Upload Note", icon: Upload },
  { id: "manage", label: "Manage Notes", icon: FileText },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

interface NoteRow {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  categories: { name: string } | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adminView, setAdminView] = useState("overview");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [catRes, notesRes, profilesRes] = await Promise.all([
      supabase.from("categories").select("id, name"),
      supabase.from("notes").select("id, title, description, is_published, created_at, categories(name)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (notesRes.data) setNotes(notesRes.data as unknown as NoteRow[]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    setLoading(false);
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: newCategoryName.trim() })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCategories(prev => [...prev, data]);
      setNewCategoryName("");
      setShowQuickAdd(false);
      setCategoryId(data.id);
      toast({ title: "Category added!" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
     const { error } = await supabase.from("categories").delete().eq("id", id);
     if (error) {
       toast({ title: "Error", description: "Cannot delete category with existing notes.", variant: "destructive" });
     } else {
       setCategories(prev => prev.filter(c => c.id !== id));
       toast({ title: "Category removed" });
     }
  };

  // Analytics helper functions
  const notesByCategory = categories.map(cat => ({
    name: cat.name,
    count: notes.filter(n => n.categories?.name === cat.name).length
  })).filter(c => c.count > 0);

  const stats = [
    { label: "Total Users", value: profiles.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Notes", value: notes.length, icon: BookMarked, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Published", value: notes.filter(n => n.is_published).length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { label: "Categories", value: categories.length, icon: FileText, color: "text-orange-600", bg: "bg-orange-100" },
  ];

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
              key={item.id}
              onClick={() => {
                setAdminView(item.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                adminView === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : adminView === "overview" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.label} className="shadow-card">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader><CardTitle className="text-lg">Notes per Category</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={notesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                   <CardHeader><CardTitle className="text-lg">Recent Users</CardTitle></CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                         {profiles.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                     {p.full_name?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                     <p className="text-sm font-medium">{p.full_name || "Anonymous User"}</p>
                                     <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                                  </div>
                               </div>
                               <Badge variant="outline" className="text-[10px]">User</Badge>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
              </div>
            </>
          ) : adminView === "upload" ? (
            <Card className="shadow-card max-w-3xl mx-auto">
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
                    <div className="flex items-center justify-between">
                      <Label>Category</Label>
                      <button 
                        type="button" 
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                      >
                        <Plus className="h-3 w-3" /> {showQuickAdd ? "Cancel" : "New Category"}
                      </button>
                    </div>
                    {showQuickAdd ? (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Category name" 
                          value={newCategoryName} 
                          onChange={(e) => setNewCategoryName(e.target.value)} 
                          className="h-10"
                        />
                        <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
                      </div>
                    ) : (
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Brief description of the note..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>PDF File</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      {file ? file.name : "Select a file from your device to upload"}
                    </p>
                    <Button type="button" variant="default" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">Accepts files up to 250MB</p>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Publish Note"}
                </Button>
              </CardContent>
            </Card>
          ) : adminView === "manage" ? (
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
                          <TableCell className="font-medium focus-visible:outline-none">{note.title}</TableCell>
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
                            <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleDelete(note.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : adminView === "categories" ? (
             <div className="space-y-6 max-w-4xl">
               <div className="flex items-center justify-between">
                 <h1 className="text-2xl font-bold">Category Management</h1>
               </div>
               
               <Card className="shadow-card">
                 <CardHeader><CardTitle className="text-lg">Add New Category</CardTitle></CardHeader>
                 <CardContent className="flex gap-4">
                   <Input 
                     placeholder="e.g. Computer Science" 
                     value={newCategoryName} 
                     onChange={(e) => setNewCategoryName(e.target.value)}
                   />
                   <Button onClick={handleAddCategory}>Add Category</Button>
                 </CardContent>
               </Card>

               <Card className="shadow-card">
                 <CardHeader><CardTitle className="text-lg">Existing Categories</CardTitle></CardHeader>
                 <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map(cat => (
                          <TableRow key={cat.id}>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell className="text-right">
                               <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => handleDeleteCategory(cat.id)}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
               </Card>
             </div>
          ) : adminView === "users" ? (
             <Card className="shadow-card">
               <CardHeader><CardTitle className="text-lg">User Management</CardTitle></CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>User</TableHead>
                       <TableHead>Join Date</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Role</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {profiles.map(p => (
                       <TableRow key={p.id}>
                         <TableCell>
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                                  {p.full_name?.charAt(0) || "U"}
                               </div>
                               <span className="font-medium">{p.full_name || "Anonymous User"}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                         <TableCell><Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Active</Badge></TableCell>
                         <TableCell className="text-right font-medium">User</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
               <Card className="shadow-card">
                  <CardHeader><CardTitle className="text-lg">Content Growth</CardTitle></CardHeader>
                  <CardContent className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={notes.slice().reverse().map((n, i) => ({ name: i, value: i + 1 }))}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis hide />
                           <YAxis fontSize={12} />
                           <Tooltip />
                           <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
               <Card className="shadow-card">
                  <CardHeader><CardTitle className="text-lg">Category Distribution</CardTitle></CardHeader>
                  <CardContent className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie 
                             data={notesByCategory} 
                             dataKey="count" 
                             nameKey="name" 
                             cx="50%" 
                             cy="50%" 
                             innerRadius={60} 
                             outerRadius={80} 
                             paddingAngle={5}
                           >
                              {notesByCategory.map((_, index) => (
                                <Cell key={index} fill={`hsl(var(--primary) / ${1 - index/notesByCategory.length})`} />
                              ))}
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
