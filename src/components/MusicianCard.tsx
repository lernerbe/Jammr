import { Music2, MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MusicianCardProps {
  musician: {
    id: string;
    name: string;
    instrument: string;
    genres: string[];
    skillLevel: string;
    location: string;
    distance: number;
    imageUrl?: string;
    bio: string;
  };
  onRequestChat?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

const MusicianCard = ({ musician, onRequestChat, onViewProfile }: MusicianCardProps) => {
  const initials = musician.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const getSkillColor = (skill: string) => {
    switch (skill.toLowerCase()) {
      case "beginner":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "intermediate":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "advanced":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="overflow-hidden hover-lift cursor-pointer group">
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {musician.imageUrl ? (
          <img
            src={musician.imageUrl}
            alt={musician.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="h-20 w-20 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {musician.distance} mi
          </Badge>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={musician.imageUrl} alt={musician.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{musician.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {musician.location}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{musician.instrument}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-secondary" />
            <Badge variant="outline" className={getSkillColor(musician.skillLevel)}>
              {musician.skillLevel}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {musician.genres.slice(0, 3).map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{musician.bio}</p>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewProfile?.(musician.id)}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onRequestChat?.(musician.id)}
          >
            Request to Chat
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MusicianCard;
