import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { UserProfile, FilterOptions, LocationData } from '@/types/user';

const USERS_COLLECTION = 'users';
const MATCH_REQUESTS_COLLECTION = 'match_requests';
const CHATS_COLLECTION = 'chats';

export const userService = {
  // Create or update user profile
  async createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Check if profile already exists
    const existingDoc = await getDoc(userRef);
    const updateData: any = {
      ...profileData,
      user_id: userId,
    };

    // Only set created_at for new profiles
    if (!existingDoc.exists()) {
      updateData.created_at = Timestamp.now();
    }

    await setDoc(userRef, updateData, { merge: true });
  },

  // Send a match/chat request
  async sendMatchRequest(requesterId: string, receiverId: string): Promise<string> {
    // Check if request already exists to prevent duplicates
    const existingRequest = await this.hasExistingRequest(requesterId, receiverId);
    if (existingRequest) {
      throw new Error('You have already sent a request to this user');
    }

    const requestsRef = collection(db, MATCH_REQUESTS_COLLECTION);
    const docRef = await addDoc(requestsRef, {
      requester_id: requesterId,
      receiver_id: receiverId,
      status: 'pending',
      created_at: Timestamp.now(),
    });
    return docRef.id;
  },

  // Accept a match request and create chat
  async acceptMatchRequest(requestId: string): Promise<string> {
    const reqRef = doc(db, MATCH_REQUESTS_COLLECTION, requestId);
    await updateDoc(reqRef, { status: 'accepted' });

    // Get the request data to create chat
    const reqSnap = await getDoc(reqRef);
    if (reqSnap.exists()) {
      const reqData = reqSnap.data();
      const chatId = await this.createOrGetChat(reqData.requester_id, reqData.receiver_id);
      return chatId;
    }
    throw new Error('Request not found');
  },

  // Decline a match request
  async declineMatchRequest(requestId: string): Promise<void> {
    const reqRef = doc(db, MATCH_REQUESTS_COLLECTION, requestId);
    await updateDoc(reqRef, { status: 'declined' });
  },

  // Get inbound (received) pending requests for a user
  async getInboundRequests(userId: string): Promise<any[]> {
    const requestsRef = collection(db, MATCH_REQUESTS_COLLECTION);
    // Avoid Firestore composite index requirement by sorting client-side
    const q = query(
      requestsRef,
      where('receiver_id', '==', userId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    const results: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({ id: docSnap.id, ...data });
    });
    // Sort newest first if created_at exists
    return results.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)).slice(0, 50);
  },

  // Get accepted matches for a user (either requester or receiver)
  async getAcceptedMatches(userId: string): Promise<any[]> {
    const requestsRef = collection(db, MATCH_REQUESTS_COLLECTION);
    const q1 = query(requestsRef, where('receiver_id', '==', userId), where('status', '==', 'accepted'));
    const q2 = query(requestsRef, where('requester_id', '==', userId), where('status', '==', 'accepted'));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const entries: any[] = [];
    s1.forEach((d) => entries.push({ id: d.id, ...d.data() }));
    s2.forEach((d) => entries.push({ id: d.id, ...d.data() }));
    // De-dupe and sort
    const map: Record<string, any> = {};
    entries.forEach((e) => (map[e.id] = e));
    return Object.values(map).sort((a: any, b: any) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  },

  // Get outbound pending requests for current user
  async getOutboundPending(userId: string): Promise<any[]> {
    const requestsRef = collection(db, MATCH_REQUESTS_COLLECTION);
    const q = query(requestsRef, where('requester_id', '==', userId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const res: any[] = [];
    snapshot.forEach(d => res.push({ id: d.id, ...d.data() }));
    return res;
  },

  // Get all requests (pending and accepted) for current user to check if already requested
  async getAllRequestsForUser(userId: string): Promise<any[]> {
    const requestsRef = collection(db, MATCH_REQUESTS_COLLECTION);
    const q1 = query(requestsRef, where('requester_id', '==', userId));
    const q2 = query(requestsRef, where('receiver_id', '==', userId));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const entries: any[] = [];
    s1.forEach((d) => entries.push({ id: d.id, ...d.data() }));
    s2.forEach((d) => entries.push({ id: d.id, ...d.data() }));
    return entries;
  },

  // Check if user has already sent a request to specific receiver
  async hasExistingRequest(requesterId: string, receiverId: string): Promise<boolean> {
    const requestsRef = collection(db, MATCH_REQUESTS_COLLECTION);
    const q = query(
      requestsRef,
      where('requester_id', '==', requesterId),
      where('receiver_id', '==', receiverId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  // Chats -------------------------------------------------
  async createOrGetChat(userA: string, userB: string): Promise<string> {
    const [u1, u2] = [userA, userB].sort();
    const chatId = `${u1}_${u2}`;
    const chatRef = doc(db, CHATS_COLLECTION, chatId);

    try {
      // Create/update the chat with merge: true to handle existing chats
      await setDoc(chatRef, {
        participants: [u1, u2],
        created_at: Timestamp.now(),
        last_message: '',
        last_message_at: null
      }, { merge: true });

    } catch (e) {
      console.error('Error in createOrGetChat:', e);
      throw e;
    }
    return chatId;
  },

  async getUserChats(userId: string): Promise<any[]> {
    console.log('getUserChats called for userId:', userId);
    const chatsRef = collection(db, CHATS_COLLECTION);
    const q = query(chatsRef, where('participants', 'array-contains', userId));
    const snapshot = await getDocs(q);
    const chats: any[] = [];
    snapshot.forEach(d => {
      const chatData = { id: d.id, ...d.data() };
      console.log('Found chat:', chatData);
      chats.push(chatData);
    });
    console.log('Total chats found:', chats.length);
    return chats.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  },

  async getChatById(chatId: string): Promise<any | null> {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as any;
  },

  async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    console.log('userService.sendMessage called with:', { chatId, senderId, text });

    if (!db) {
      console.error('Firestore database not initialized');
      throw new Error('Database not available');
    }

    try {
      const messagesRef = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`);
      console.log('Messages collection path:', `${CHATS_COLLECTION}/${chatId}/messages`);

      const messageData = {
        sender_id: senderId,
        text,
        created_at: Timestamp.now(),
      };
      console.log('Sending message data:', messageData);

      const docRef = await addDoc(messagesRef, messageData);
      console.log('Message sent successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Error in userService.sendMessage:', error);
      throw error;
    }
  },

  subscribeToMessages(chatId: string, callback: (messages: any[]) => void): () => void {
    const messagesRef = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`);
    const q = query(messagesRef, orderBy('created_at', 'asc'), limit(200));
    return onSnapshot(q, (snap) => {
      const msgs: any[] = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      callback(msgs);
    });
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
    console.log('getNearbyUsers called with:', { userLocation, filters, maxDistance });

    const usersRef = collection(db, USERS_COLLECTION);
    let q = query(
      usersRef,
      where('visibility', '==', true),
      limit(50) // Firestore limit
    );

    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];

    console.log(`Found ${querySnapshot.size} users with visibility=true`);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const userProfile: UserProfile = {
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(),
      } as UserProfile;

      console.log(`Processing user ${userProfile.user_id}:`, {
        name: userProfile.name,
        location: userProfile.location,
        visibility: data.visibility,
        created_at: userProfile.created_at
      });

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
      const profileLocation = this.convertToGeoPoint(userProfile.location);
      const distance = this.calculateDistance(userLocation, profileLocation);

      console.log(`User ${userProfile.user_id} distance: ${distance} miles (max: ${maxDistance})`);

      if (distance <= maxDistance) {
        users.push({
          ...userProfile,
          // Add distance as a computed property
          distance: distance,
        } as UserProfile & { distance: number });
      }
    });

    // Sort by distance
    const sortedUsers = users.sort((a, b) => (a as any).distance - (b as any).distance);
    console.log(`Returning ${sortedUsers.length} users within ${maxDistance} miles`);
    return sortedUsers;
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

  // Upload gallery image
  async uploadGalleryImage(userId: string, file: File): Promise<string> {
    const imageRef = ref(storage, `gallery-images/${userId}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  // Upload video clip
  async uploadVideoClip(userId: string, file: File): Promise<string> {
    const videoRef = ref(storage, `video-clips/${userId}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(videoRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  // Delete a storage file by its download URL
  async deleteFileByUrl(url: string): Promise<void> {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  },

  // Remove gallery image (delete from storage and update Firestore array)
  async removeGalleryImage(userId: string, url: string): Promise<void> {
    try {
      await this.deleteFileByUrl(url);
    } finally {
      const existing = await this.getUserProfile(userId);
      const nextList = (existing?.image_gallery || []).filter((u: string) => u !== url);
      await this.createOrUpdateProfile(userId, { image_gallery: nextList });
    }
  },

  // Remove video clip (delete from storage and update Firestore array)
  async removeVideoClip(userId: string, url: string): Promise<void> {
    try {
      await this.deleteFileByUrl(url);
    } finally {
      const existing = await this.getUserProfile(userId);
      const nextList = (existing?.video_clips || []).filter((u: string) => u !== url);
      await this.createOrUpdateProfile(userId, { video_clips: nextList });
    }
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

  // Convert LocationData or GeoPoint to GeoPoint for distance calculation
  convertToGeoPoint(location: LocationData | GeoPoint): GeoPoint {
    if (location instanceof GeoPoint) {
      return location;
    }

    // Handle LocationData format
    if (location && typeof location === 'object' && 'coords' in location) {
      return new GeoPoint(location.coords.lat, location.coords.lng);
    }

    // Fallback - treat as GeoPoint-like object with latitude/longitude
    if (location && typeof location === 'object' && 'latitude' in location && 'longitude' in location) {
      return new GeoPoint((location as any).latitude, (location as any).longitude);
    }

    // Default fallback to NYC coordinates if location format is unrecognized
    console.warn('Unrecognized location format, using default coordinates');
    return new GeoPoint(40.7128, -74.0060);
  },

  // Debug function to check all users in database
  async debugAllUsers(): Promise<void> {
    console.log('=== DEBUG: Checking all users in database ===');
    const usersRef = collection(db, USERS_COLLECTION);
    const allUsersQuery = query(usersRef, limit(100));
    const snapshot = await getDocs(allUsersQuery);

    console.log(`Total users in database: ${snapshot.size}`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`User ID: ${doc.id}`, {
        name: data.name,
        visibility: data.visibility,
        created_at: data.created_at,
        location: data.location,
        hasLocationCoords: !!(data.location && data.location.coords)
      });
    });
    console.log('=== END DEBUG ===');
  },
};
