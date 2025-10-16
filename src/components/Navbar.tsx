import { Link, useLocation } from "react-router-dom";
import { Music, Search, MessageCircle, User } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <nav className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Jammr
          </span>
        </Link>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-4">
          <Link
            to="/discover"
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
              isActive("/discover") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs font-medium">Discover</span>
          </Link>
          <Link
            to="/matches"
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
              isActive("/matches") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="text-xs font-medium">Matches</span>
          </Link>
          <Link
            to="/messages"
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
              isActive("/messages") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Messages</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
