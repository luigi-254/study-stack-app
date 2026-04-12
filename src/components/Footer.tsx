import { BookOpen, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t bg-muted/30 mt-20">
    <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 font-bold text-lg mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>NoteHub</span>
        </div>
        <p className="text-sm text-muted-foreground">Quality learning notes for students. Access structured study materials anytime, anywhere.</p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
        <div className="space-y-2">
          <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Courses</Link>
          <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Categories</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Data Structures</p>
          <p>Web Development</p>
          <p>Databases</p>
          <p>Machine Learning</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Contact</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Mail className="h-4 w-4" />jkemboi744@gmail.com</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +254795396214</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Nairobi, Kenya</p>
        </div>
      </div>
    </div>
    <div className="border-t py-4">
      <p className="text-center text-xs text-muted-foreground">© 2026 NoteHub. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
