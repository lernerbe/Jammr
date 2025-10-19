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
import { UserProfile, FilterOptions } from '@/types/user';

const USERS_COLLECTION = 'users';
const MATCH_REQUESTS_COLLECTION = 'match_requests';
const CHATS_COLLECTION = 'chats';

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

  // Send a match/chat request
  async sendMatchRequest(requesterId: string, receiverId: string): Promise<string> {
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
      // Check if chat already exists first
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        console.log('Chat already exists:', chatId);
        return chatId;
      }

      // Create new chat
      console.log('Creating new chat:', chatId);
      await setDoc(chatRef, {
        participants: [u1, u2],
        created_at: Timestamp.now(),
        last_message: '',
        last_message_at: null
      }, { merge: false });
      console.log('Chat created successfully:', chatId);
    } catch (e) {
      console.log('Error creating chat (may already exist):', e);
      // If the doc already exists or update is restricted by rules, proceed with chatId
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
};
