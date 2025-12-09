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
    requested?: boolean;
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
    <Card className="overflow-hidden group">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={musician.imageUrl} alt={musician.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg truncate pr-2">{musician.name}</h3>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {Math.round(musician.distance)} mi
              </Badge>
            </div>
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
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.(musician.id);
            }}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              musician.requested ? null : onRequestChat?.(musician.id);
            }}
            disabled={musician.requested}
            variant={musician.requested ? 'outline' : 'default'}
          >
            {musician.requested ? 'Requested' : 'Request to Chat'}
          </Button>``
        </div>
      </div>
    </Card>
  );
};

export default MusicianCard;
