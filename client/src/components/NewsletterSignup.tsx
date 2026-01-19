import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NewsletterSignupProps {
  variant?: "inline" | "card";
  className?: string;
}

export function NewsletterSignup({ variant = "card", className = "" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (data: { email: string; firstName?: string }) => {
      const response = await apiRequest("POST", "/api/newsletter/subscribe", data);
      return response.json();
    },
    onSuccess: () => {
      setSubscribed(true);
      setEmail("");
      setFirstName("");
      toast({
        title: "Successfully subscribed!",
        description: "Welcome to the AFÁRÁ community. Check your inbox for a confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeMutation.mutate({ email, firstName: firstName || undefined });
  };

  if (subscribed) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-primary/10 rounded-lg ${className}`} data-testid="newsletter-subscribed-message">
        <CheckCircle className="w-6 h-6 text-primary" />
        <div>
          <p className="font-medium text-primary" data-testid="text-subscribed-title">You're subscribed!</p>
          <p className="text-sm text-muted-foreground" data-testid="text-subscribed-description">Thank you for joining our community.</p>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="input-newsletter-email"
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={subscribeMutation.isPending}
          data-testid="button-newsletter-subscribe"
        >
          {subscribeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className={`bg-card border rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Stay Connected</h3>
          <p className="text-sm text-muted-foreground">Get updates from the AFÁRÁ community</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="First name (optional)"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          data-testid="input-newsletter-firstname"
        />
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="input-newsletter-email-card"
        />
        <Button 
          type="submit" 
          className="w-full"
          disabled={subscribeMutation.isPending}
          data-testid="button-newsletter-subscribe-card"
        >
          {subscribeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Subscribe to Newsletter
            </>
          )}
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground mt-3 text-center">
        By subscribing, you agree to receive emails from AFÁRÁ. You can unsubscribe at any time.
      </p>
    </div>
  );
}
