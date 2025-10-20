import { useEffect, useMemo, useState } from "react";
import MusicianCard from "@/components/MusicianCard";
import FilterBar from "@/components/FilterBar";
import MatchesDialog from "@/components/MatchesDialog";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { GeoPoint } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const Discover = () => {
  const { toast } = useToast();

  const { user } = useAuth();
  const [musicians, setMusicians] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);

  // Temporarily use a default center (NYC). Later: geolocation/user's own location.
  const center = useMemo(() => new GeoPoint(40.7128, -74.0060), []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Load musicians
        const list = await userService.getNearbyUsers(center, {
          instrument: filters.instrument,
          genres: filters.genres,
          skillLevel: filters.skillLevel,
        }, filters.distance || 25);
        // Exclude current user
        const visible = list.filter((p: any) => p.user_id !== user?.uid);

        // Load all existing requests to check which users have already been requested
        const allRequests = await userService.getAllRequestsForUser(user.uid);
        const requestedUserIds = new Set<string>();

        allRequests.forEach((req: any) => {
          if (req.requester_id === user.uid) {
            requestedUserIds.add(req.receiver_id);
          }
        });

        setRequestedUsers(requestedUserIds);

        setMusicians(visible.map((p: any) => ({
          id: p.user_id,
          name: p.name,
          instrument: p.instrument,
          genres: p.genres,
          skillLevel: p.skill_level,
          location: "",
          distance: (p as any).distance,
          imageUrl: p.image_url,
          bio: p.bio,
          requested: requestedUserIds.has(p.user_id),
        })));
      } catch (e) {
        console.error('Failed to load musicians', e);
        toast({ title: 'Could not load musicians', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [center, filters, toast, user?.uid]);

  const handleRequestChat = async (receiverId: string) => {
    if (!user) return;

    // Check if already requested
    if (requestedUsers.has(receiverId)) {
      toast({ title: 'Already Requested', description: 'You have already sent a request to this user.' });
      return;
    }

    try {
      await userService.sendMatchRequest(user.uid, receiverId);

      // Update local state to mark as requested
      setRequestedUsers(prev => new Set([...prev, receiverId]));
      setMusicians(prev => prev.map(m => m.id === receiverId ? { ...m, requested: true } : m));

      toast({ title: 'Chat Request Sent!', description: 'They will see it in Matches.' });
    } catch (e) {
      console.error('Failed to send match request', e);
      toast({ title: 'Failed to send request', variant: 'destructive' });
    }
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Discover Musicians</h1>
            <p className="text-muted-foreground text-lg">
              Find talented musicians near you to collaborate and create music together
            </p>
          </div>
          <Button 
            onClick={() => setMatchesDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Music className="h-5 w-5" />
            Matches
          </Button>
        </div>

        <FilterBar onFilterChange={setFilters} />
        
        <MatchesDialog open={matchesDialogOpen} onOpenChange={setMatchesDialogOpen} />

        {loading ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              Loading musicians...
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
