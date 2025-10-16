import { useState, useEffect } from "react";
import { Download, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Install = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Install from Browser",
        description:
          "On iPhone: Tap Share → Add to Home Screen. On Android: Tap Menu → Install App",
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast({
        title: "App Installed!",
        description: "Jammr has been added to your home screen.",
      });
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">App Already Installed!</h1>
            <p className="text-muted-foreground">
              Jammr is installed on your device. You can access it from your home screen anytime.
            </p>
          </div>
          <Button className="w-full" onClick={() => (window.location.href = "/discover")}>
            Open App
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Install Jammr</h1>
          <p className="text-muted-foreground">
            Install the app on your device for the best experience
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h3 className="font-semibold text-sm">✨ Works Offline</h3>
            <p className="text-xs text-muted-foreground">
              Access your matches and messages even without internet
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h3 className="font-semibold text-sm">🚀 Fast & Smooth</h3>
            <p className="text-xs text-muted-foreground">
              Native app experience with instant loading
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h3 className="font-semibold text-sm">📱 Home Screen Access</h3>
            <p className="text-xs text-muted-foreground">
              Launch Jammr directly from your phone's home screen
            </p>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleInstall}>
          <Download className="mr-2 h-5 w-5" />
          Install App
        </Button>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>iPhone:</strong> Tap Share → Add to Home Screen
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Android:</strong> Tap Menu → Install App
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Install;
