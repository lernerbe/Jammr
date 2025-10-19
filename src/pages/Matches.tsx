import { useEffect, useState } from "react";
import { Check, X, Clock, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Matches = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [acceptedMatches, setAcceptedMatches] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        // Fetch inbound requests and enrich with requester profile info
        const inbound = await userService.getInboundRequests(user.uid);
        const inboundWithProfiles = await Promise.all(
          inbound.map(async (req: any) => {
            const profile = await userService.getUserProfile(req.requester_id);
            return {
              id: req.id,
              name: profile?.name || req.requester_id,
              instrument: profile?.instrument || "",
              location: "",
              status: req.status,
              timestamp: "",
              imageUrl: profile?.image_url,
              requester_id: req.requester_id,
            };
          })
        );
        setPendingRequests(inboundWithProfiles);

        // Fetch accepted requests and enrich with the other user's profile
        const accepted = await userService.getAcceptedMatches(user.uid);
        const acceptedWithProfiles = await Promise.all(
          accepted.map(async (req: any) => {
            const otherId = req.requester_id === user.uid ? req.receiver_id : req.requester_id;
            const profile = await userService.getUserProfile(otherId);
            return {
              id: req.id,
              requester_id: req.requester_id,
              receiver_id: req.receiver_id,
              name: profile?.name || otherId,
              instrument: profile?.instrument || "",
              location: "",
              lastMessage: "",
              timestamp: "",
              unread: false,
              imageUrl: profile?.image_url,
            };
          })
        );
        setAcceptedMatches(acceptedWithProfiles);
      } catch (e) {
        console.error('Failed to load matches', e);
        toast({ title: 'Could not load matches', variant: 'destructive' });
      }
    };
    load();
  }, [user, toast]);

  const handleAccept = async (id: string, name: string) => {
    try {
      const chatId = await userService.acceptMatchRequest(id);
      toast({
        title: "Match Accepted!",
        description: `You can now message ${name}. Opening chat...`
      });
      setPendingRequests(prev => prev.filter(r => r.id !== id));

      // Automatically open the chat
      setTimeout(() => {
        navigate(`/messages?chatId=${encodeURIComponent(chatId)}`);
      }, 1000);
    } catch (e) {
      console.error('Failed to accept match request:', e);
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  };
  const handleOpenChat = async (otherUserId: string) => {
    if (!user) return;
    try {
      const chatId = await userService.createOrGetChat(user.uid, otherUserId);
      navigate(`/messages?chatId=${encodeURIComponent(chatId)}`);
    } catch (e: any) {
      toast({ title: "Failed to open chat", description: e?.message || e?.code || 'Unknown', variant: "destructive" });
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await userService.declineMatchRequest(id);
      toast({ title: "Request Declined", variant: "destructive" });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      toast({ title: "Failed to decline", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-4xl">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Your Matches</h1>
          <p className="text-muted-foreground text-lg">
            Manage your connection requests and active matches
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              <Check className="h-4 w-4" />
              Accepted ({acceptedMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No pending requests</p>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {request.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{request.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.instrument} • {request.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sent {request.timestamp}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDecline(request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => handleAccept(request.id, request.name)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedMatches.length === 0 ? (
              <Card className="p-12 text-center">
                <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No accepted matches yet</p>
              </Card>
            ) : (
              acceptedMatches.map((match) => (
                <Card
                  key={match.id}
                  className="p-6 hover-lift"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {match.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {match.unread && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{match.name}</h3>
                        {match.unread && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {match.instrument} • {match.location}
                      </p>
                      <p className="text-sm text-foreground/80 truncate">
                        {match.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{match.timestamp}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleOpenChat(match.requester_id === user?.uid ? match.receiver_id : match.requester_id)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Matches;
