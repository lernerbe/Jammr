import { useState } from "react";
import MusicianCard from "@/components/MusicianCard";
import FilterBar from "@/components/FilterBar";
import { useToast } from "@/hooks/use-toast";

const Discover = () => {
  const { toast } = useToast();

  // Mock data for musicians
  const [musicians] = useState([
    {
      id: "1",
      name: "Sarah Johnson",
      instrument: "Guitar",
      genres: ["Rock", "Blues", "Jazz"],
      skillLevel: "Advanced",
      location: "Brooklyn, NY",
      distance: 2.3,
      imageUrl: undefined,
      bio: "Been playing guitar for 15 years. Looking to form a blues-rock band or collaborate on original projects.",
    },
    {
      id: "2",
      name: "Marcus Chen",
      instrument: "Drums",
      genres: ["Jazz", "Fusion", "Pop"],
      skillLevel: "Intermediate",
      location: "Manhattan, NY",
      distance: 5.7,
      imageUrl: undefined,
      bio: "Passionate drummer seeking jazz fusion projects. Love experimenting with different rhythms and styles.",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      instrument: "Bass",
      genres: ["Funk", "R&B", "Soul"],
      skillLevel: "Advanced",
      location: "Queens, NY",
      distance: 8.2,
      imageUrl: undefined,
      bio: "Groove-oriented bassist with 10+ years experience. Looking for serious musicians to jam and gig with.",
    },
    {
      id: "4",
      name: "Alex Kim",
      instrument: "Piano",
      genres: ["Classical", "Jazz", "Electronic"],
      skillLevel: "Intermediate",
      location: "Brooklyn, NY",
      distance: 3.1,
      imageUrl: undefined,
      bio: "Classically trained pianist exploring jazz and electronic fusion. Open to all creative collaborations.",
    },
    {
      id: "5",
      name: "Taylor Swift",
      instrument: "Vocals",
      genres: ["Pop", "Rock", "Country"],
      skillLevel: "Advanced",
      location: "Manhattan, NY",
      distance: 6.4,
      imageUrl: undefined,
      bio: "Singer-songwriter looking for a band to perform original material. Influenced by pop-rock and country.",
    },
    {
      id: "6",
      name: "Jordan Lee",
      instrument: "Saxophone",
      genres: ["Jazz", "Blues", "Funk"],
      skillLevel: "Beginner",
      location: "Bronx, NY",
      distance: 12.5,
      imageUrl: undefined,
      bio: "New to jazz sax but very dedicated. Looking for patient musicians to learn and grow with.",
    },
  ]);

  const handleRequestChat = (id: string) => {
    toast({
      title: "Chat Request Sent!",
      description: "You'll be notified when they respond.",
    });
  };

  const handleViewProfile = (id: string) => {
    toast({
      title: "Profile View",
      description: "Full profile details coming soon!",
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Discover Musicians</h1>
          <p className="text-muted-foreground text-lg">
            Find talented musicians near you to collaborate and create music together
          </p>
        </div>

        <FilterBar />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {musicians.map((musician, index) => (
            <div
              key={musician.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MusicianCard
                musician={musician}
                onRequestChat={handleRequestChat}
                onViewProfile={handleViewProfile}
              />
            </div>
          ))}
        </div>

        {musicians.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              No musicians found matching your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
