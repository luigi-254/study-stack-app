import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, MessageCircle, User } from "lucide-react";
import { getNoteCoverImage } from "@/lib/imageUtils";

interface NoteCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string;
  author?: string;
  views?: number;
  likes?: number;
  comments?: number;
  thumbnail?: string | null;
}

const NoteCard = ({ 
  id, title, description, category, author = "Anonymous", 
  views = 0, likes = 0, comments = 0, thumbnail
}: NoteCardProps) => {
  const coverImage = thumbnail || getNoteCoverImage(category);

  return (
    <Link to={`/viewer/${id}`} className="block group">
      <Card className="overflow-hidden border-none shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col bg-card">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={coverImage} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
             <Badge className="bg-primary text-white border-none">
               Read Now
             </Badge>
          </div>
          <Badge className="absolute top-3 left-3 bg-white/90 text-black backdrop-blur-md border-none font-bold text-[10px] uppercase tracking-wider">
            {category}
          </Badge>
        </div>
        
        <CardContent className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {description || "No description available."}
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{author}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{views}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{likes}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{comments}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default NoteCard;
