import { Link, useLocation } from "react-router-dom";
import { Music, Search, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Music className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Jammr
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/discover"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/discover") ? "text-primary" : "text-foreground/80"
            }`}
          >
            Discover
          </Link>
          <Link
            to="/matches"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/matches") ? "text-primary" : "text-foreground/80"
            }`}
          >
            Matches
          </Link>
          <Link
            to="/messages"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/messages") ? "text-primary" : "text-foreground/80"
            }`}
          >
            Messages
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link to="/login">Log In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
        <div className="flex items-center justify-around h-16 px-4">
          <Link
            to="/discover"
            className={`flex flex-col items-center gap-1 ${
              isActive("/discover") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs">Discover</span>
          </Link>
          <Link
            to="/matches"
            className={`flex flex-col items-center gap-1 ${
              isActive("/matches") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="text-xs">Matches</span>
          </Link>
          <Link
            to="/messages"
            className={`flex flex-col items-center gap-1 ${
              isActive("/messages") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Messages</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 ${
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
