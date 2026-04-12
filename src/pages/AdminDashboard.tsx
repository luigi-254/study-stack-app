import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  BookOpen, LayoutDashboard, Upload, FileText, Users, BarChart3,
  Trash2, Menu, X, CheckCircle, Clock, BookMarked, Plus, FolderOpen,
  Star, Image as ImageIcon, Sparkles
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
  is_top_pick: boolean;
  thumbnail_url: string | null;
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
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isTopPick, setIsTopPick] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [catRes, notesRes, profilesRes] = await Promise.all([
      supabase.from("categories").select("id, name"),
      supabase.from("notes").select("*, categories(name)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (notesRes.data) setNotes(notesRes.data as any);
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

    try {
      // 1. Upload PDF
      const pdfPath = `${user.id}/pdfs/${Date.now()}_${file.name}`;
      const { error: pdfError } = await supabase.storage.from("notes-pdfs").upload(pdfPath, file);
      if (pdfError) throw pdfError;
      const { data: pdfUrlData } = supabase.storage.from("notes-pdfs").getPublicUrl(pdfPath);

      // 2. Upload Thumbnail (Optional)
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbPath = `${user.id}/thumbnails/${Date.now()}_${thumbnailFile.name}`;
        const { error: thumbError } = await supabase.storage.from("note-thumbnails").upload(thumbPath, thumbnailFile);
        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage.from("note-thumbnails").getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      // 3. Insert into Database
      const { error: insertError } = await supabase.from("notes").insert({
        user_id: user.id,
        title,
        description,
        category_id: categoryId,
        file_url: pdfUrlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        is_published: true,
        is_top_pick: isTopPick,
      });

      if (insertError) throw insertError;

      toast({ title: "Note published successfully!" });
      setTitle(""); setDescription(""); setCategoryId(""); setIsTopPick(false);
      setFile(null); setThumbnailFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      fetchData();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Note removed from system" });
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("notes").update({ is_published: !current }).eq("id", id);
    if (!error) {
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, is_published: !current } : n));
    }
  };

  const toggleTopPick = async (id: string, current: boolean) => {
    const { error } = await supabase.from("notes").update({ is_top_pick: !current }).eq("id", id);
    if (!error) {
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, is_top_pick: !current } : n));
      toast({ title: current ? "Removed from Top Picks" : "Added to Top Picks" });
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
       toast({ title: "Error", description: "This category contains active notes.", variant: "destructive" });
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
    { label: "Community", value: profiles.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Library Size", value: notes.length, icon: BookMarked, color: "text-primary", bg: "bg-primary/10" },
    { label: "Top Picks", value: notes.filter(n => n.is_top_pick).length, icon: Star, color: "text-yellow-600", bg: "bg-yellow-100" },
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
          <span>NoteHub Admin</span>
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
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                adminView === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <h1 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Control Center</h1>
          <div className="ml-auto h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
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
                  <Card key={stat.label} className="shadow-card border-none hover:translate-y-[-2px] transition-transform">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                        <h3 className="text-2xl font-black">{stat.value}</h3>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card border-none">
                  <CardHeader><CardTitle className="text-lg font-black">Subject Distribution</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={notesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} fontBold />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-none text-card-foreground">
                   <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle className="text-lg font-black">Recent Activity</CardTitle>
                     <Sparkles className="h-5 w-5 text-primary" />
                   </CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                         {profiles.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                               <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-black">
                                     {p.full_name?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold">{p.full_name || "New Explorer"}</p>
                                     <p className="text-xs text-muted-foreground flex items-center gap-1">
                                       <Clock className="h-3 w-3" /> {new Date(p.created_at).toLocaleDateString()}
                                     </p>
                                  </div>
                               </div>
                               <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase">Member</Badge>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
              </div>
            </>
          ) : adminView === "upload" ? (
            <Card className="shadow-card max-w-3xl mx-auto border-none">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Curate New Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Entry Title</Label>
                    <Input placeholder="Mastering React Hooks" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Subject Area</Label>
                      <button 
                        type="button" 
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        {showQuickAdd ? "Cancel" : "+ New"}
                      </button>
                    </div>
                    {showQuickAdd ? (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Cybersecurity..." 
                          value={newCategoryName} 
                          onChange={(e) => setNewCategoryName(e.target.value)} 
                          className="h-10"
                        />
                        <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
                      </div>
                    ) : (
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
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
                  <Label className="font-bold">Short Description</Label>
                  <Textarea placeholder="Brief summary for the preview card..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <Label className="font-bold">Full PDF Content</Label>
                      <div className="border-2 border-dashed rounded-2xl p-6 text-center bg-muted/5 hover:bg-muted/10 transition-colors">
                        <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-4">
                          {file ? file.name : "Drop PDF file here"}
                        </p>
                        <Button type="button" variant="outline" size="sm" className="rounded-full px-4" onClick={() => fileInputRef.current?.click()}>
                          Select PDF
                        </Button>
                        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Label className="font-bold">Thumbnail Cover (Optional)</Label>
                      <div className="border-2 border-dashed rounded-2xl p-6 text-center bg-muted/5 hover:bg-muted/10 transition-colors">
                        <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground mb-4 font-medium">
                          {thumbnailFile ? thumbnailFile.name : "Custom cover image"}
                        </p>
                        <Button type="button" variant="outline" size="sm" className="rounded-full px-4" onClick={() => thumbnailInputRef.current?.click()}>
                           Upload Cover
                        </Button>
                        <input ref={thumbnailInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                   <div className="space-y-0.5">
                     <p className="font-bold text-sm">Feature in Top Picks</p>
                     <p className="text-xs text-muted-foreground">Highlight this as a premium curated note on the homepage.</p>
                   </div>
                   <Switch checked={isTopPick} onCheckedChange={setIsTopPick} />
                </div>

                <Button className="w-full h-12 rounded-full font-black text-lg shadow-lg shadow-primary/20" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Publishing to NoteHub..." : "Publish to Library"}
                </Button>
              </CardContent>
            </Card>
          ) : adminView === "manage" ? (
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Library Curation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Title</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Subject</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Curation</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notes.map((note) => (
                        <TableRow key={note.id} className="border-border/50 group">
                          <TableCell className="font-bold py-4 text-foreground">{note.title}</TableCell>
                          <TableCell><Badge variant="secondary" className="bg-secondary/50 text-foreground border-none font-bold uppercase tracking-tighter text-[10px]">{note.categories?.name || "—"}</Badge></TableCell>
                          <TableCell>
                            <button onClick={() => togglePublish(note.id, note.is_published)}>
                              <Badge
                                variant={note.is_published ? "default" : "secondary"}
                                className={`cursor-pointer font-bold ${note.is_published ? "shadow-sm shadow-primary/20" : ""}`}
                              >
                                {note.is_published ? "Live" : "Draft"}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell>
                             <button 
                               onClick={() => toggleTopPick(note.id, note.is_top_pick)}
                               className={`transition-colors p-2 rounded-full ${note.is_top_pick ? "bg-yellow-50 text-yellow-500" : "hover:bg-muted text-muted-foreground"}`}
                             >
                               <Star className={`h-5 w-5 ${note.is_top_pick ? "fill-yellow-500" : ""}`} />
                             </button>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-1">
                               <Button size="icon" variant="ghost" className="text-destructive h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(note.id)}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
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
               <h1 className="text-3xl font-black">Subject Management</h1>
                
               <Card className="shadow-card border-none">
                 <CardHeader><CardTitle className="text-lg font-black">New Subject Area</CardTitle></CardHeader>
                 <CardContent className="flex gap-4">
                   <Input 
                     placeholder="e.g. Distributed Systems" 
                     className="h-12 rounded-xl"
                     value={newCategoryName} 
                     onChange={(e) => setNewCategoryName(e.target.value)}
                   />
                   <Button className="h-12 px-8 rounded-xl font-bold" onClick={handleAddCategory}>Add Area</Button>
                 </CardContent>
               </Card>
 
               <Card className="shadow-card border-none">
                 <CardHeader><CardTitle className="text-lg font-black">Current Subjects</CardTitle></CardHeader>
                 <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Subject Name</TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map(cat => (
                          <TableRow key={cat.id} className="border-border/50">
                            <TableCell className="font-bold py-4">{cat.name}</TableCell>
                            <TableCell className="text-right">
                               <Button size="icon" variant="ghost" className="text-destructive h-9 w-9" onClick={() => handleDeleteCategory(cat.id)}>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
               <Card className="shadow-card border-none">
                  <CardHeader><CardTitle className="text-lg font-black">Content Growth</CardTitle></CardHeader>
                  <CardContent className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={notes.slice().reverse().map((n, i) => ({ name: i, value: i + 1 }))}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis hide />
                           <YAxis fontSize={10} />
                           <Tooltip />
                           <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={4} dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
               <Card className="shadow-card border-none">
                  <CardHeader><CardTitle className="text-lg font-black">Category Mix</CardTitle></CardHeader>
                  <CardContent className="h-64">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie 
                             data={notesByCategory} 
                             dataKey="count" 
                             nameKey="name" 
                             cx="50%" 
                             cy="50%" 
                             innerRadius={50} 
                             outerRadius={80} 
                             paddingAngle={8}
                           >
                              {notesByCategory.map((_, index) => (
                                <Cell key={index} fill={`hsl(var(--primary) / ${1 - index/notesByCategory.length})`} stroke="none" />
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
