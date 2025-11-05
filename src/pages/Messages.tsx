import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { UserProfile } from "@/types/user";

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const fetchedChatsRef = useRef<Set<string>>(new Set());

  // Load chats and user profiles - only depends on user, not URL params
  useEffect(() => {
    const loadChats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        console.log('Loading chats for user:', user.uid);
        const cs = await userService.getUserChats(user.uid);
        console.log('Loaded chats:', cs.length, cs);
        setChats(cs);

        // Load user profiles for all participants
        const allParticipantIds = new Set<string>();
        cs.forEach(chat => {
          chat.participants?.forEach((participantId: string) => {
            if (participantId !== user.uid) {
              allParticipantIds.add(participantId);
            }
          });
        });

        const profilePromises = Array.from(allParticipantIds).map(async (userId) => {
          const profile = await userService.getUserProfile(userId);
          return { userId, profile };
        });

        const profileResults = await Promise.all(profilePromises);
        const profilesMap: Record<string, UserProfile> = {};
        profileResults.forEach(({ userId, profile }) => {
          if (profile) {
            profilesMap[userId] = profile;
          }
        });

        setUserProfiles(profilesMap);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [user]);

  // Handle URL chatId parameter separately
  useEffect(() => {
    if (!chats.length) return; // Wait for chats to load first

    const params = new URLSearchParams(location.search);
    const qChatId = params.get('chatId');

    console.log('URL chatId:', qChatId, 'Available chats:', chats.map(c => c.id));

    if (qChatId && chats.some(c => c.id === qChatId)) {
      console.log('Setting active chat from URL:', qChatId);
      setActiveChatId(qChatId);
    } else if (!activeChatId && chats.length > 0) {
      // Only set first chat as active if no chat is currently active
      console.log('Setting first chat as active:', chats[0].id);
      setActiveChatId(chats[0].id);
    }
  }, [chats, location.search, activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = userService.subscribeToMessages(activeChatId, setMessages);
    return unsubscribe;
  }, [activeChatId]);

  // If chatId is present but not in the cached list yet (e.g., just created), fetch it and add to list
  useEffect(() => {
    const syncActive = async () => {
      if (!user) return;
      const params = new URLSearchParams(location.search);
      const qChatId = params.get('chatId');
      if (!qChatId) return;

      // Check if we've already fetched this chat or if it's already in the list
      if (fetchedChatsRef.current.has(qChatId) || chats.some(c => c.id === qChatId)) {
        return;
      }

      console.log('Chat not found in list, fetching:', qChatId);
      fetchedChatsRef.current.add(qChatId); // Mark as being fetched

      try {
        const chat = await userService.getChatById(qChatId);
        if (chat && Array.isArray(chat.participants) && chat.participants.includes(user.uid)) {
          console.log('Adding new chat to list:', chat);
          setChats(prev => {
            // Final check to prevent duplicates
            if (prev.some(c => c.id === qChatId)) {
              return prev;
            }
            return [{ id: chat.id, ...chat }, ...prev];
          });
          setActiveChatId(qChatId);

          // Load profiles for new chat participants
          const newParticipantIds = chat.participants.filter((id: string) => id !== user.uid && !userProfiles[id]);
          if (newParticipantIds.length > 0) {
            const newProfilePromises = newParticipantIds.map(async (userId: string) => {
              const profile = await userService.getUserProfile(userId);
              return { userId, profile };
            });

            const newProfileResults = await Promise.all(newProfilePromises);
            const newProfilesMap: Record<string, UserProfile> = {};
            newProfileResults.forEach(({ userId, profile }) => {
              if (profile) {
                newProfilesMap[userId] = profile;
              }
            });

            setUserProfiles(prev => ({ ...prev, ...newProfilesMap }));
          }
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
        fetchedChatsRef.current.delete(qChatId); // Remove from fetched set on error
      }
    };
    syncActive();
  }, [location.search, user, chats, userProfiles]); // Added back dependencies but with better duplicate prevention

  const send = async () => {
    if (!user || !activeChatId || !text.trim()) {
      console.log('Send cancelled - missing requirements:', { user: !!user, activeChatId, text: text.trim() });
      return;
    }

    console.log('Attempting to send message:', { activeChatId, userId: user.uid, text: text.trim() });

    try {
      await userService.sendMessage(activeChatId, user.uid, text.trim());
      console.log('Message sent successfully');
      setText("");
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could add a toast notification here to show the error to the user
    }
  };

  const getOtherParticipant = (chat: any) => {
    const otherParticipantId = chat.participants?.filter((p: string) => p !== user?.uid)[0];
    return otherParticipantId ? userProfiles[otherParticipantId] : null;
  };

  const getDisplayName = (userId: string) => {
    if (userId === user?.uid) return 'You';
    const profile = userProfiles[userId];
    return profile?.name || 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 md:col-span-1 space-y-2">
            <h2 className="font-semibold">Conversations</h2>
            <div className="divide-y">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading conversations...
                </div>
              ) : (
                <>
                  {chats.map((c) => {
                    const otherParticipant = getOtherParticipant(c);
                    return (
                      <button
                        key={c.id}
                        className={`w-full text-left py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors ${
                          activeChatId === c.id ? 'bg-muted text-primary font-medium' : ''
                        }`}
                        onClick={() => setActiveChatId(c.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherParticipant?.image_url} />
                            <AvatarFallback className="text-sm">
                              {otherParticipant?.name ? getInitials(otherParticipant.name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {otherParticipant?.name || 'Unknown User'}
                            </p>
                            {otherParticipant?.instrument && (
                              <p className="text-sm text-muted-foreground truncate">
                                {otherParticipant.instrument}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {chats.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <MessageCircle className="h-6 w-6 mx-auto mb-2" />
                      No conversations yet
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card className="p-4 md:col-span-2 flex flex-col h-[70vh]">
            {activeChatId ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b mb-4">
                  {(() => {
                    const activeChat = chats.find(c => c.id === activeChatId);
                    const otherParticipant = activeChat ? getOtherParticipant(activeChat) : null;
                    return (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParticipant?.image_url} />
                          <AvatarFallback>
                            {otherParticipant?.name ? getInitials(otherParticipant.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{otherParticipant?.name || 'Unknown User'}</h3>
                          {otherParticipant?.instrument && (
                            <p className="text-sm text-muted-foreground">{otherParticipant.instrument}</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex-1 overflow-auto space-y-4 mb-4">
                  {messages.map((m) => {
                    const isFromCurrentUser = m.sender_id === user?.uid;
                    const senderProfile = userProfiles[m.sender_id];
                    return (
                      <div key={m.id} className={`flex gap-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {!isFromCurrentUser && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={senderProfile?.image_url} />
                            <AvatarFallback className="text-xs">
                              {senderProfile?.name ? getInitials(senderProfile.name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${isFromCurrentUser ? 'order-first' : ''}`}>
                          {!isFromCurrentUser && (
                            <p className="text-xs text-muted-foreground mb-1 px-1">
                              {getDisplayName(m.sender_id)}
                            </p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isFromCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="break-words">{m.text}</p>
                          </div>
                        </div>
                        {isFromCurrentUser && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={userProfiles[user.uid]?.image_url} />
                            <AvatarFallback className="text-xs">
                              {user?.displayName ? getInitials(user.displayName) : user?.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      No messages yet. Say hi!
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Input placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
              <Button onClick={send} disabled={!text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
