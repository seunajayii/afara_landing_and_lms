import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ZoomConnectionStatus = {
  connected: boolean;
  accountEmail: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
};

export function ZoomConnectionPanel() {
  const { data, isLoading } = useQuery<ZoomConnectionStatus>({
    queryKey: ["/api/admin/integrations/zoom/status"],
  });

  const connectZoom = () => {
    window.location.assign("/api/admin/integrations/zoom/connect");
  };

  return (
    <Card className="mb-6 border-primary/20 bg-primary/[0.03]">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">Zoom meeting automation</p>
              {isLoading ? (
                <Badge variant="outline">Checking connection…</Badge>
              ) : data?.connected ? (
                <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-amber-700">
                  <AlertCircle className="h-3 w-3" />
                  Not connected
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.connected
                ? `Leave a Zoom event's meeting link blank to create and update it automatically${data.accountEmail ? ` for ${data.accountEmail}` : ""}.`
                : "Connect the AFÁRÁ Zoom account to create meeting links automatically."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={data?.connected ? "outline" : "default"}
          onClick={connectZoom}
          disabled={isLoading}
          className="shrink-0"
          data-testid="button-connect-zoom"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
          {data?.connected ? "Reconnect Zoom" : "Connect Zoom"}
        </Button>
      </CardContent>
    </Card>
  );
}