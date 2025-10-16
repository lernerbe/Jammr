import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const Messages = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container px-4 max-w-4xl">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-lg">
            Chat with your matched musicians
          </p>
        </div>

        <Card className="p-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MessageCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">No Messages Yet</h2>
            <p className="text-muted-foreground">
              Once you accept match requests, you'll be able to chat with other musicians here.
              Start by discovering new musicians!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
