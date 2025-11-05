import { useState, useEffect } from "react";
import { Camera, Music2, Upload, Trash2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { geocodingService } from "@/services/geocodingService";
import { UserProfile } from "@/types/user";
import { GeoPoint } from "firebase/firestore";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { LocationData } from "@/types/user";

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const instruments = ["Guitar", "Bass", "Drums", "Piano", "Vocals", "Saxophone", "Violin"];
  const skillLevels = ["Beginner", "Intermediate", "Advanced"];
  const genres = ["Rock", "Jazz", "Blues", "Pop", "Metal", "Classical", "Electronic", "Hip Hop"];

  const [profile, setProfile] = useState({
    name: user?.displayName || "",
    instrument: "Guitar",
    skillLevel: "Intermediate" as "Beginner" | "Intermediate" | "Advanced",
    bio: "",
    location: "New York, NY",
    selectedGenres: [] as string[],
    imageUrl: user?.photoURL || "",
    imageGallery: [] as string[],
    videoClips: [] as string[],
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await userService.uploadProfileImage(user.uid, file);
      await userService.createOrUpdateProfile(user.uid, { image_url: url });
      toast({ title: "Profile photo updated" });
      setProfile(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error('Image upload failed', error);
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await userService.uploadVideoClip(user.uid, file);
      // Append to video_clips array
      const existing = await userService.getUserProfile(user.uid);
      const nextList = [...(existing?.video_clips || []), url];
      await userService.createOrUpdateProfile(user.uid, { video_clips: nextList });
      setProfile(prev => ({ ...prev, videoClips: nextList }));
      toast({ title: "Video uploaded" });
    } catch (error) {
      console.error('Video upload failed', error);
      toast({ title: "Video upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await userService.uploadGalleryImage(user.uid, file);
      // Append to image_gallery array
      const existing = await userService.getUserProfile(user.uid);
      const nextList = [...(existing?.image_gallery || []), url];
      await userService.createOrUpdateProfile(user.uid, { image_gallery: nextList });
      toast({ title: "Image added to gallery" });
    } catch (error) {
      console.error('Gallery image upload failed', error);
      toast({ title: "Gallery image upload failed", description: (error as any)?.message || 'Unknown error', variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteGalleryImage = async (url: string) => {
    if (!user) return;
    try {
      setUploading(true);
      await userService.removeGalleryImage(user.uid, url);
      setProfile(prev => ({ ...prev, imageGallery: prev.imageGallery.filter(u => u !== url) }));
      toast({ title: "Image removed" });
    } catch (error) {
      console.error('Failed to remove image', error);
      toast({ title: "Failed to remove image", description: (error as any)?.message || 'Unknown error', variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (url: string) => {
    if (!user) return;
    try {
      setUploading(true);
      await userService.removeVideoClip(user.uid, url);
      setProfile(prev => ({ ...prev, videoClips: prev.videoClips.filter(u => u !== url) }));
      toast({ title: "Video removed" });
    } catch (error) {
      console.error('Failed to remove video', error);
      toast({ title: "Failed to remove video", description: (error as any)?.message || 'Unknown error', variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleLocationSelect = (locationData: LocationData) => {
    setSelectedLocation(locationData);
    setProfile(prev => ({ ...prev, location: locationData.location }));
  };

  // Load user profile from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const userProfile = await userService.getUserProfile(user.uid);
        if (userProfile) {
          // Handle new location format
          if (typeof userProfile.location === 'object' && 'location' in userProfile.location) {
            // New format: { location: string, coords: {lat, lng}, place_id: string }
            const locationData = userProfile.location as LocationData;
            setProfile({
              name: userProfile.name,
              instrument: userProfile.instrument,
              skillLevel: userProfile.skill_level,
              bio: userProfile.bio,
              location: locationData.location,
              selectedGenres: userProfile.genres,
              imageUrl: userProfile.image_url || user?.photoURL || "",
              imageGallery: userProfile.image_gallery || [],
              videoClips: userProfile.video_clips || [],
            });
            setSelectedLocation(locationData);
          } else if (userProfile.location && typeof userProfile.location === 'object' && 'latitude' in userProfile.location) {
            // Old format: GeoPoint - convert to new format
            const geoPoint = userProfile.location as GeoPoint;
            setLocationLoading(true);
            try {
              const placeName = await geocodingService.getPlaceNameFromCoordinates(
                geoPoint.latitude,
                geoPoint.longitude
              );
              
              const locationData: LocationData = {
                location: placeName,
                coords: {
                  lat: geoPoint.latitude,
                  lng: geoPoint.longitude,
                },
                place_id: geocodingService.generatePlaceId(),
              };
              
              setProfile({
                name: userProfile.name,
                instrument: userProfile.instrument,
                skillLevel: userProfile.skill_level,
                bio: userProfile.bio,
                location: placeName,
                selectedGenres: userProfile.genres,
                imageUrl: userProfile.image_url || user?.photoURL || "",
                imageGallery: userProfile.image_gallery || [],
                videoClips: userProfile.video_clips || [],
              });
              setSelectedLocation(locationData);
            } catch (error) {
              console.error('Error converting coordinates to place name:', error);
              // Fallback to coordinates if geocoding fails
              const locationData: LocationData = {
                location: `${geoPoint.latitude.toFixed(2)}, ${geoPoint.longitude.toFixed(2)}`,
                coords: {
                  lat: geoPoint.latitude,
                  lng: geoPoint.longitude,
                },
                place_id: geocodingService.generatePlaceId(),
              };
              
              setProfile({
                name: userProfile.name,
                instrument: userProfile.instrument,
                skillLevel: userProfile.skill_level,
                bio: userProfile.bio,
                location: locationData.location,
                selectedGenres: userProfile.genres,
                imageUrl: userProfile.image_url || user?.photoURL || "",
                imageGallery: userProfile.image_gallery || [],
                videoClips: userProfile.video_clips || [],
              });
              setSelectedLocation(locationData);
            } finally {
              setLocationLoading(false);
            }
          } else {
            // No location data
            setProfile({
              name: userProfile.name,
              instrument: userProfile.instrument,
              skillLevel: userProfile.skill_level,
              bio: userProfile.bio,
              location: "",
              selectedGenres: userProfile.genres,
              imageUrl: userProfile.image_url || user?.photoURL || "",
              imageGallery: userProfile.image_gallery || [],
              videoClips: userProfile.video_clips || [],
            });
            setSelectedLocation(null);
          }
        } else {
          // Set default values from Firebase Auth
          setProfile(prev => ({
            ...prev,
            name: user.displayName || user.email?.split('@')[0] || "",
            imageUrl: user.photoURL || prev.imageUrl,
            imageGallery: [],
            videoClips: [],
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error loading profile",
          description: "Could not load your profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;
    
    if (!selectedLocation) {
      toast({
        title: "Location required",
        description: "Please select a location from the suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const profileData: Partial<UserProfile> = {
        name: profile.name,
        instrument: profile.instrument,
        skill_level: profile.skillLevel,
        bio: profile.bio,
        location: selectedLocation,
        genres: profile.selectedGenres,
        visibility: true,
        audio_clips: [],
        ...(user.photoURL && { image_url: user.photoURL }), // Only include if photoURL exists
      };

      await userService.createOrUpdateProfile(user.uid, profileData);
      
      setIsEditing(false);
      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        user: user?.uid,
        profileData: {
          name: profile.name,
          instrument: profile.instrument,
          skillLevel: profile.skillLevel,
        }
      });
      
      toast({
        title: "Error saving profile",
        description: `Could not save your profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-4xl">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">My Profile</h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>

          {!isEditing ? (
            // Read-only view - what others see
            <div className="space-y-6">
              {/* Hero section */}
              <div className="relative h-48 rounded-t-lg bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/waveform-bg.jpg')] bg-cover bg-center opacity-20" />
              </div>

              <Card className="p-8 -mt-24 relative z-10">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={profile.imageUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-3xl">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-1">{profile.name}</h2>
                    <p className="text-muted-foreground flex items-center gap-2 justify-center">
                      <Music2 className="h-4 w-4" />
                      {profile.instrument} • {profile.skillLevel}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locationLoading ? "Loading location..." : profile.location}
                    </p>
                  </div>
                </div>

                {/* Genres */}
                {profile.selectedGenres.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">GENRES</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.selectedGenres.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">ABOUT</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}

                {/* Image Gallery */}
                {profile.imageGallery.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">GALLERY</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {profile.imageGallery.map((src, idx) => (
                        <div key={idx} className="aspect-square overflow-hidden rounded-md border">
                          <img src={src} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Clips */}
                {profile.videoClips.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">VIDEO CLIPS</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {profile.videoClips.map((src, idx) => (
                        <div key={idx} className="aspect-video overflow-hidden rounded-md border">
                          <video
                            src={src}
                            className="h-full w-full object-cover"
                            controls
                            preload="metadata"
                            playsInline
                            muted
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            // Edit mode - original form
            <Card className="p-8">
              <div className="space-y-8">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarImage src={profile.imageUrl} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-3xl">
                        {profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full shadow-lg"
                      asChild
                    >
                      <label className="cursor-pointer">
                        <Camera className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={uploading} />
                      </label>
                    </Button>
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
                    />
                  </div>

                  <LocationAutocomplete
                    value={profile.location}
                    onChange={(value) => setProfile({ ...profile, location: value })}
                    onLocationSelect={handleLocationSelect}
                    placeholder="Enter your city, state, country"
                    label="Location"
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="instrument">Primary Instrument</Label>
                    <Select
                      value={profile.instrument}
                      onValueChange={(value) => setProfile({ ...profile, instrument: value })}
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
                      onValueChange={(value) => setProfile({ ...profile, skillLevel: value as "Beginner" | "Intermediate" | "Advanced" })}
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
                    rows={4}
                    placeholder="Tell other musicians about yourself, your experience, and what you're looking for..."
                  />
                </div>

                {/* Genres */}
                <div className="space-y-3">
                  <Label>Genres (click to toggle)</Label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant={profile.selectedGenres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setProfile({
                            ...profile,
                            selectedGenres: profile.selectedGenres.includes(genre)
                              ? profile.selectedGenres.filter((g) => g !== genre)
                              : [...profile.selectedGenres, genre],
                          });
                        }}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Media Uploads */}
                <div className="space-y-3">
                  <Label>Media</Label>
                  <Card className="p-8 text-center border-dashed">
                    <Music2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload audio or video clips to showcase your skills
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <Button asChild variant="outline" disabled={uploading}>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                          <input type="file" accept="image/*" className="hidden" onChange={handleGalleryImageUpload} />
                        </label>
                      </Button>
                      <Button asChild variant="outline" disabled={uploading}>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Video
                          <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                        </label>
                      </Button>
                    </div>
                  </Card>
                  {profile.imageGallery.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {profile.imageGallery.map((src, idx) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-md border">
                          <img src={src} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryImage(src)}
                            className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-8 w-8 rounded bg-destructive text-white shadow"
                            aria-label="Delete image"
                            disabled={uploading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {profile.videoClips.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {profile.videoClips.map((src, idx) => (
                        <div key={idx} className="group relative aspect-video overflow-hidden rounded-md border">
                          <video
                            src={src}
                            className="h-full w-full object-cover"
                            controls
                            preload="metadata"
                            playsInline
                            muted
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(src)}
                            className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center h-8 w-8 rounded bg-destructive text-white shadow"
                            aria-label="Delete video"
                            disabled={uploading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
