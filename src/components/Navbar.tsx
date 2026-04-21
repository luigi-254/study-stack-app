import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, Menu, X, LogOut, ChevronDown, 
  Search, PlusCircle, User, BookMarked, Settings, LayoutDashboard 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const Logo = () => (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="bg-primary p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
        <BookOpen className="h-6 w-6 text-white" />
      </div>
      <span className="font-extrabold text-2xl tracking-tight hidden sm:block">
        Note<span className="text-primary">Hub</span>
      </span>
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md h-18">
      <div className="container flex h-full items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors">
                Browse <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-effect p-2">
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="font-medium">All Notes</Link>
              </DropdownMenuItem>
              {categories.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link to={`/dashboard?category=${encodeURIComponent(cat.name)}`}>
                    {cat.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for notes, subjects, or skills..." 
            className="pl-10 w-full bg-secondary/50 border-none focus-visible:ring-primary h-11 rounded-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <Button variant="ghost" className="hidden lg:flex items-center gap-2 font-bold hover:text-primary" asChild>
                <Link to="/admin">
                  <LayoutDashboard className="h-4 w-4" /> Control Center
                </Link>
              </Button>
              <Button variant="default" className="hidden sm:flex items-center gap-2 font-black px-6 rounded-full shadow-lg hover:scale-105 transition-all" asChild>
                 <Link to="/admin">
                   <PlusCircle className="h-5 w-5" /> Publish
                 </Link>
              </Button>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border-2 border-primary/20">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 glass-effect p-2 shadow-2xl border-none">
                <div className="px-4 py-3 mb-2 border-b">
                  <p className="text-sm font-black truncate">{profile?.full_name || "NoteHub Member"}</p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-widest">{user.email}</p>
                </div>
                <DropdownMenuItem asChild className="rounded-lg py-2.5 font-bold cursor-pointer transition-colors">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg py-2.5 font-bold cursor-pointer transition-colors">
                  <Link to="/dashboard?view=completed" className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" /> My Library
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg py-2.5 font-bold cursor-pointer transition-colors">
                  <Link to="/admin" className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" /> Admin Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg py-2.5 font-bold cursor-pointer text-destructive focus:text-destructive flex items-center gap-2">
                  <LogOut className="h-4 w-4 font-bold" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="font-bold text-sm hidden sm:inline-flex">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="font-black text-sm px-8 bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                <Link to="/register">Join NoteHub</Link>
              </Button>
            </div>
          )}

          <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-6 space-y-6 animate-fade-in absolute top-full left-0 w-full shadow-xl">
           <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 bg-secondary/50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Categories</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 6).map(cat => (
                <Link key={cat.id} to={`/dashboard?category=${encodeURIComponent(cat.name)}`} className="text-sm font-medium p-2 bg-muted rounded-md text-center">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
             {user ? (
               <Button variant="destructive" className="w-full" onClick={handleSignOut}>Logout</Button>
             ) : (
               <Button asChild className="w-full">
                 <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
               </Button>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

