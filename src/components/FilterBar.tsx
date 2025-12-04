import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const instruments = [
  "All Instruments",
  "Guitar",
  "Bass",
  "Drums",
  "Piano",
  "Vocals",
  "Saxophone",
  "Violin",
  "Other",
];

const genres = ["Rock", "Jazz", "Blues", "Pop", "Metal", "Classical", "Electronic", "Hip Hop"];
const skillLevels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

interface FilterBarProps {
  onFilterChange?: (filters: any) => void;
}

const FilterBar = ({ onFilterChange }: FilterBarProps) => {
  const [distance, setDistance] = React.useState([25]);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [instrument, setInstrument] = React.useState<string | undefined>(undefined);
  const [skillLevel, setSkillLevel] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Apply filters whenever any filter changes, including search
  React.useEffect(() => {
    onFilterChange?.({
      searchQuery: searchQuery.trim(),
      instrument: instrument && instrument !== 'all instruments' ? instrument.charAt(0).toUpperCase() + instrument.slice(1) : undefined,
      skillLevel,
      genres: selectedGenres,
      distance: distance[0] === 100 ? 999999 : distance[0],
    });
  }, [searchQuery, instrument, skillLevel, selectedGenres, distance, onFilterChange]);

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search musicians..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your search to find the perfect musical match
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label htmlFor="instrument">Instrument</Label>
                <Select value={instrument} onValueChange={(v) => setInstrument(v === 'all instruments' ? undefined : v)}>
                  <SelectTrigger id="instrument">
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((instrument) => (
                      <SelectItem key={instrument} value={instrument.toLowerCase()}>
                        {instrument}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="skill">Skill Level</Label>
                <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v === 'all levels' ? undefined : v.charAt(0).toUpperCase() + v.slice(1))}>
                  <SelectTrigger id="skill">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillLevels.map((level) => (
                      <SelectItem key={level} value={level.toLowerCase()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Distance</Label>
                  <span className="text-sm text-muted-foreground">
                    {distance[0] === 100 ? 'unlimited' : `${distance[0]} miles`}
                  </span>
                </div>
                <Slider
                  value={distance}
                  onValueChange={setDistance}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <Label className="text-sm font-medium text-muted-foreground">Sort by:</Label>
        <Select defaultValue="distance">
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Nearest First</SelectItem>
            <SelectItem value="match">Best Match</SelectItem>
            <SelectItem value="recent">Recently Active</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Add React import
import * as React from "react";

export default FilterBar;
