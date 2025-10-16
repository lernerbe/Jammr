import { Link } from "react-router-dom";
import { Music, ArrowRight, Users, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        {/* App Logo & Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
              <Music className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Jammr
          </h1>
          <p className="text-xl text-muted-foreground">
            Find musicians to collaborate, jam, and form bands
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">10K+</div>
            <div className="text-xs text-muted-foreground">Musicians</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">5K+</div>
            <div className="text-xs text-muted-foreground">Matches</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">50+</div>
            <div className="text-xs text-muted-foreground">Cities</div>
          </Card>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Smart Matching</h3>
              <p className="text-xs text-muted-foreground">Find your perfect musical match</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Music className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Share Your Sound</h3>
              <p className="text-xs text-muted-foreground">Upload audio clips & showcase skills</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Instant Chat</h3>
              <p className="text-xs text-muted-foreground">Connect and plan jam sessions</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button size="lg" className="w-full shadow-glow" asChild>
            <Link to="/signup">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <Button size="lg" variant="outline" className="w-full" asChild>
            <Link to="/login">
              Sign In
            </Link>
          </Button>

          <div className="text-center">
            <Button variant="link" size="sm" asChild>
              <Link to="/discover" className="text-muted-foreground">
                Browse musicians as guest
              </Link>
            </Button>
          </div>
        </div>

        {/* Badge */}
        <div className="flex justify-center pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              Connect with musicians near you
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
