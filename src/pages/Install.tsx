import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Share, Plus, Smartphone, Apple, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Install Study Stack</h1>
          <p className="text-muted-foreground font-medium">
            Add Study Stack to your home screen for a fast, app-like experience — works offline-ready and feels native.
          </p>
        </div>

        {isStandalone || installed ? (
          <Card className="p-8 text-center space-y-3 rounded-3xl border-2 border-green-500/30 bg-green-50">
            <Check className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-black">You're all set!</h2>
            <p className="text-sm text-muted-foreground">
              Study Stack is installed. Launch it from your home screen anytime.
            </p>
          </Card>
        ) : deferredPrompt ? (
          <Card className="p-8 text-center space-y-4 rounded-3xl">
            <h2 className="text-xl font-black">One-click install</h2>
            <p className="text-sm text-muted-foreground">
              Tap below and confirm in your browser to install Study Stack.
            </p>
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full h-14 rounded-full font-black text-lg shadow-lg shadow-primary/20"
            >
              <Download className="mr-2 h-5 w-5" /> Install App
            </Button>
          </Card>
        ) : isIOS ? (
          <Card className="p-8 space-y-6 rounded-3xl">
            <div className="flex items-center gap-3">
              <Apple className="h-7 w-7" />
              <h2 className="text-xl font-black">Install on iPhone / iPad</h2>
            </div>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">
                  1
                </span>
                <span>
                  Tap the <Share className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button at the bottom of Safari.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">
                  2
                </span>
                <span>
                  Scroll down and tap <Plus className="inline h-4 w-4 mx-1" /> <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top-right corner. Study Stack will appear on your home screen.
                </span>
              </li>
            </ol>
          </Card>
        ) : (
          <Card className="p-8 space-y-6 rounded-3xl">
            <div className="flex items-center gap-3">
              <Smartphone className="h-7 w-7" />
              <h2 className="text-xl font-black">Install on Android / Desktop</h2>
            </div>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">
                  1
                </span>
                <span>Open the browser menu (⋮ in Chrome).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">
                  2
                </span>
                <span>
                  Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white font-black text-xs">
                  3
                </span>
                <span>Confirm and launch from your home screen.</span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              If you don't see the install option, open this page in Chrome, Edge, or another supported browser.
            </p>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
