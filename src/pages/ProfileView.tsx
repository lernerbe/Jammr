import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Music2, Heart, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { geocodingService } from "@/services/geocodingService";
import { UserProfile } from "@/types/user";

const ProfileView = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [locationName, setLocationName] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const userProfile = await userService.getUserProfile(userId);
        setProfile(userProfile);

        // Convert coordinates to place name
        if (userProfile) {
          setLocationLoading(true);
          try {
            const placeName = await geocodingService.getPlaceNameFromCoordinates(
              userProfile.location.latitude,
              userProfile.location.longitude
            );
            setLocationName(placeName);
          } catch (error) {
            console.error('Error converting coordinates to place name:', error);
            // Fallback to coordinates if geocoding fails
            setLocationName(`${userProfile.location.latitude.toFixed(2)}, ${userProfile.location.longitude.toFixed(2)}`);
          } finally {
            setLocationLoading(false);
          }
        }

        // Check if we've already sent a request
        if (user) {
          const outbound = await userService.getOutboundPending(user.uid);
          const alreadySent = outbound.some(req => req.receiver_id === userId);
          setHasSentRequest(alreadySent);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error loading profile",
          description: "Could not load profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, user, toast]);

  const handleConnect = async () => {
    if (!user || !userId) return;
    
    setSending(true);
    try {
      await userService.sendMatchRequest(user.uid, userId);
      setHasSentRequest(true);
      toast({
        title: "Connection Request Sent!",
        description: `You've sent a connection request to ${profile?.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send request",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">Profile not found</p>
          <Button onClick={() => navigate("/discover")}>Back to Discover</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header with background gradient */}
      <div className="gradient-hero h-48 relative">
        <div className="absolute inset-0 bg-black/20" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-white hover:bg-white/20"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Content */}
      <div className="container px-4 max-w-4xl">
        <div className="relative -mt-20">
          <Card className="p-6 md:p-8 space-y-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.image_url} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-3xl">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{profile.name}</h1>
                  <div className="flex flex-wrap gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Music2 className="h-4 w-4" />
                      <span>{profile.instrument}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{locationLoading ? "Loading location..." : locationName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {profile.skill_level}
                  </Badge>
                  {profile.genres.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-sm">
                      {genre}
                    </Badge>
                  ))}
                </div>

                {userId !== user?.uid && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConnect}
                      disabled={sending || hasSentRequest}
                      className="gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      {hasSentRequest ? "Request Sent" : "Connect"}
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Bio */}
            {profile.bio && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">About</h2>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Image Gallery */}
            {profile.image_gallery && profile.image_gallery.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.image_gallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden border hover-lift cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Clips */}
            {profile.video_clips && profile.video_clips.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Videos</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.video_clips.map((video, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-lg overflow-hidden border hover-lift relative group cursor-pointer"
                    >
                      <video
                        src={video}
                        className="w-full h-full object-cover"
                        controls
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors pointer-events-none">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Clips */}
            {profile.audio_clips && profile.audio_clips.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Audio Clips</h2>
                <div className="space-y-3">
                  {profile.audio_clips.map((audio, idx) => (
                    <Card key={idx} className="p-4">
                      <audio src={audio} controls className="w-full" />
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
