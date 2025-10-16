import { useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const Matches = () => {
  const { toast } = useToast();

  const [pendingRequests] = useState([
    {
      id: "1",
      name: "David Miller",
      instrument: "Guitar",
      location: "Brooklyn, NY",
      status: "pending",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      name: "Lisa Park",
      instrument: "Vocals",
      location: "Manhattan, NY",
      status: "pending",
      timestamp: "1 day ago",
    },
  ]);

  const [acceptedMatches] = useState([
    {
      id: "3",
      name: "Sarah Johnson",
      instrument: "Guitar",
      location: "Brooklyn, NY",
      lastMessage: "Let's meet up this weekend!",
      timestamp: "3 hours ago",
      unread: true,
    },
    {
      id: "4",
      name: "Marcus Chen",
      instrument: "Drums",
      location: "Manhattan, NY",
      lastMessage: "Thanks for connecting!",
      timestamp: "Yesterday",
      unread: false,
    },
  ]);

  const handleAccept = (id: string, name: string) => {
    toast({
      title: "Match Accepted!",
      description: `You can now message ${name}`,
    });
  };

  const handleDecline = (id: string) => {
    toast({
      title: "Request Declined",
      description: "The match request has been removed.",
      variant: "destructive",
    });
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
                  className="p-6 cursor-pointer hover-lift"
                  onClick={() =>
                    toast({
                      title: "Opening chat...",
                      description: "Chat feature coming soon!",
                    })
                  }
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
