import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { UserProfile, FilterOptions } from '@/types/user';

const USERS_COLLECTION = 'users';

export const userService = {
  // Create or update user profile
  async createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      ...profileData,
      user_id: userId,
      created_at: Timestamp.now(),
    }, { merge: true });
  },

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        created_at: data.created_at.toDate(),
      } as UserProfile;
    }
    return null;
  },

  // Get nearby users with filters
  async getNearbyUsers(
    userLocation: GeoPoint,
    filters: FilterOptions = {},
    maxDistance: number = 25
  ): Promise<UserProfile[]> {
    const usersRef = collection(db, USERS_COLLECTION);
    let q = query(
      usersRef,
      where('visibility', '==', true),
      limit(50) // Firestore limit
    );

    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const userProfile: UserProfile = {
        ...data,
        created_at: data.created_at.toDate(),
      } as UserProfile;

      // Apply filters
      if (filters.instrument && userProfile.instrument !== filters.instrument) {
        return;
      }

      if (filters.genres && filters.genres.length > 0) {
        const hasMatchingGenre = userProfile.genres.some(genre => 
          filters.genres!.includes(genre)
        );
        if (!hasMatchingGenre) return;
      }

      if (filters.skillLevel && userProfile.skill_level !== filters.skillLevel) {
        return;
      }

      // Calculate distance (simplified - in production, use proper geospatial queries)
      const distance = this.calculateDistance(userLocation, userProfile.location);
      if (distance <= maxDistance) {
        users.push({
          ...userProfile,
          // Add distance as a computed property
          distance: distance,
        } as UserProfile & { distance: number });
      }
    });

    // Sort by distance
    return users.sort((a, b) => (a as any).distance - (b as any).distance);
  },

  // Upload audio clip
  async uploadAudioClip(userId: string, file: File): Promise<string> {
    const audioRef = ref(storage, `audio-clips/${userId}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(audioRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  // Upload profile image
  async uploadProfileImage(userId: string, file: File): Promise<string> {
    const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  // Calculate distance between two GeoPoints (Haversine formula)
  calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },
};
