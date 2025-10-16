import { useState } from "react";
import { Camera, Music2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const instruments = ["Guitar", "Bass", "Drums", "Piano", "Vocals", "Saxophone", "Violin"];
  const skillLevels = ["Beginner", "Intermediate", "Advanced"];
  const genres = ["Rock", "Jazz", "Blues", "Pop", "Metal", "Classical", "Electronic", "Hip Hop"];

  const [profile, setProfile] = useState({
    name: "John Doe",
    instrument: "Guitar",
    skillLevel: "Intermediate",
    bio: "Passionate guitarist looking to collaborate on rock and blues projects.",
    location: "Brooklyn, NY",
    selectedGenres: ["Rock", "Blues"],
  });

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated!",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-4xl">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">My Profile</h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </div>

          <Card className="p-8">
            <div className="space-y-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-3xl">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrument">Primary Instrument</Label>
                  <Select
                    value={profile.instrument}
                    onValueChange={(value) => setProfile({ ...profile, instrument: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="instrument">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((instrument) => (
                        <SelectItem key={instrument} value={instrument}>
                          {instrument}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill">Skill Level</Label>
                  <Select
                    value={profile.skillLevel}
                    onValueChange={(value) => setProfile({ ...profile, skillLevel: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="skill">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell other musicians about yourself, your experience, and what you're looking for..."
                />
              </div>

              {/* Genres */}
              <div className="space-y-3">
                <Label>Genres {isEditing && "(click to toggle)"}</Label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={profile.selectedGenres.includes(genre) ? "default" : "outline"}
                      className={isEditing ? "cursor-pointer" : ""}
                      onClick={() => {
                        if (isEditing) {
                          setProfile({
                            ...profile,
                            selectedGenres: profile.selectedGenres.includes(genre)
                              ? profile.selectedGenres.filter((g) => g !== genre)
                              : [...profile.selectedGenres, genre],
                          });
                        }
                      }}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Audio Clips */}
              <div className="space-y-3">
                <Label>Audio Clips</Label>
                <Card className="p-8 text-center border-dashed">
                  <Music2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload audio clips to showcase your skills
                  </p>
                  {isEditing && (
                    <Button variant="outline" disabled>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Audio (Coming Soon)
                    </Button>
                  )}
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
