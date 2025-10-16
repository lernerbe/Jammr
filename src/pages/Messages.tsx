import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const loadChats = async () => {
      if (!user) return;
      const cs = await userService.getUserChats(user.uid);
      setChats(cs);
      // If a chatId is provided in the URL, open it; otherwise open first
      const params = new URLSearchParams(location.search);
      const qChatId = params.get('chatId');
      if (qChatId && cs.some(c => c.id === qChatId)) {
        setActiveChatId(qChatId);
      } else if (cs.length > 0) {
        setActiveChatId(cs[0].id);
      }
    };
    loadChats();
  }, [user, location.search]);

  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = userService.subscribeToMessages(activeChatId, setMessages);
    return unsubscribe;
  }, [activeChatId]);

  const send = async () => {
    if (!user || !activeChatId || !text.trim()) return;
    await userService.sendMessage(activeChatId, user.uid, text.trim());
    setText("");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 md:col-span-1 space-y-2">
            <h2 className="font-semibold">Conversations</h2>
            <div className="divide-y">
              {chats.map((c) => (
                <button
                  key={c.id}
                  className={`w-full text-left py-3 ${activeChatId === c.id ? 'text-primary font-medium' : ''}`}
                  onClick={() => setActiveChatId(c.id)}
                >
                  Chat with {c.participants.filter((p: string) => p !== user?.uid)[0] || 'Unknown'}
                </button>
              ))}
              {chats.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <MessageCircle className="h-6 w-6 mx-auto mb-2" />
                  No conversations yet
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 md:col-span-2 flex flex-col h-[70vh]">
            <div className="flex-1 overflow-auto space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="flex">
                  <div className={`px-3 py-2 rounded-lg ${m.sender_id === user?.uid ? 'ml-auto bg-primary text-white' : 'mr-auto bg-muted'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
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
