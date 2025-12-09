import { useEffect, useMemo, useState } from "react";
import MusicianCard from "@/components/MusicianCard";
import FilterBar from "@/components/FilterBar";
import MatchesDialog from "@/components/MatchesDialog";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { geocodingService } from "@/services/geocodingService";
import { GeoPoint } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Discover = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [musicians, setMusicians] = useState<any[]>([]);
  const [filteredMusicians, setFilteredMusicians] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);
  const [center, setCenter] = useState<GeoPoint | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [filtersMenuOpen, setFiltersMenuOpen] = useState(false);
  // Get current user's location
  useEffect(() => {
    const getCurrentUserLocation = async () => {
      if (!user) return;

      try {
        const userProfile = await userService.getUserProfile(user.uid);
        if (userProfile?.location) {
          const userLocation = userService.convertToGeoPoint(userProfile.location);
          setCenter(userLocation);
        } else {
          // Fallback to NYC if user has no location set
          setCenter(new GeoPoint(40.7128, -74.0060));
        }
      } catch (error) {
        console.error('Failed to get user location:', error);
        // Fallback to NYC on error
        setCenter(new GeoPoint(40.7128, -74.0060));
      }
    };

    getCurrentUserLocation();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!user || !center) return;
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

        // Convert coordinates to place names for all musicians
        const musiciansWithLocations = await Promise.all(
          visible.map(async (p: any) => {
            let locationName = "";
            const loc = p.location;

            if (loc && typeof loc === 'object' && 'location' in loc) {
              // New LocationData format - use the stored string directly
              locationName = loc.location;
            } else if (loc && typeof loc === 'object' && 'latitude' in loc) {
              // Old GeoPoint format - reverse geocode
              try {
                locationName = await geocodingService.getPlaceNameFromCoordinates(
                  loc.latitude,
                  loc.longitude
                );
              } catch (error) {
                console.error('Error converting coordinates to place name:', error);
                // Fallback to coordinates if geocoding fails
                locationName = `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`;
              }
            } else {
              locationName = "Unknown Location";
            }
            
            return {
              id: p.user_id,
              name: p.name,
              instrument: p.instrument,
              genres: p.genres,
              skillLevel: p.skill_level,
              location: locationName,
              distance: (p as any).distance,
              imageUrl: p.image_url,
              bio: p.bio,
              requested: requestedUserIds.has(p.user_id),
              created_at: p.created_at,
            };
          })
        );
        
        setMusicians(musiciansWithLocations);
      } catch (e) {
        console.error('Failed to load musicians', e);
        console.error('Error details:', e);
        toast({
          title: 'Could not load musicians',
          description: `Error: ${(e as Error).message}`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [center, filters, toast, user?.uid]);

  // Filter musicians based on search query and other filters
  useEffect(() => {
    if (!musicians.length) {
      setFilteredMusicians([]);
      return;
    }

    let filtered = [...musicians];

    // Apply search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((musician) => {
        return (
          musician.name.toLowerCase().includes(query) ||
          musician.instrument.toLowerCase().includes(query) ||
          musician.bio.toLowerCase().includes(query) ||
          musician.genres.some((genre: string) => genre.toLowerCase().includes(query)) ||
          musician.location.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          filtered.sort((a, b) => {
            const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 0;
            const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 0;
            return dateB - dateA;
          });
          break;
        case 'match':
          // Sort by number of matching genres if genres filter is active
          if (filters.genres && filters.genres.length > 0) {
            filtered.sort((a, b) => {
              const aMatches = a.genres.filter((g: string) => filters.genres.includes(g)).length;
              const bMatches = b.genres.filter((g: string) => filters.genres.includes(g)).length;
              if (aMatches !== bMatches) return bMatches - aMatches;
              return a.distance - b.distance;
            });
          } else {
            // Default to distance if no specific criteria for match
            filtered.sort((a, b) => a.distance - b.distance);
          }
          break;
        case 'distance':
        default:
          filtered.sort((a, b) => a.distance - b.distance);
          break;
      }
    } else {
      filtered.sort((a, b) => a.distance - b.distance);
    }

    setFilteredMusicians(filtered);
  }, [musicians, filters.searchQuery, filters.sortBy, filters.genres]);

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
    navigate(`/profile/${id}`);
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

        <FilterBar onFilterChange={setFilters} open={filtersMenuOpen} onOpenChange={setFiltersMenuOpen} />
        
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
              {filteredMusicians.map((musician, index) => (
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

            {filteredMusicians.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">
                  {filters.searchQuery ? 'No musicians found matching your search' : 'No musicians found matching your filters'}
                </p>
                <div style={{ height: 16 }} />
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, distance: 99999 }))}
                >
                  Browse out of range
                </Button>
                <p className="text-muted-foreground">or</p>
                <Button
                  variant="default"
                  onClick={() => setFiltersMenuOpen(true)}
                >
                  Adjust range
                </Button>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};

export default Discover;
