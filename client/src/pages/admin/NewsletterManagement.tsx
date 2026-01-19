import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, Send, Plus, Loader2, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NewsletterSubscriber, NewsletterCampaign } from "@shared/schema";
import { format } from "date-fns";

export default function NewsletterManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("subscribers");
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");

  const { data: subscribers = [], isLoading: loadingSubscribers } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["/api/newsletter/subscribers"],
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<NewsletterCampaign[]>({
    queryKey: ["/api/newsletter/campaigns"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      const response = await apiRequest("POST", "/api/newsletter/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
      setNewCampaignOpen(false);
      setCampaignSubject("");
      setCampaignContent("");
      toast({
        title: "Campaign created",
        description: "Your newsletter campaign has been created as a draft.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create campaign",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/newsletter/campaigns/${campaignId}/send`);
      return response.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
      toast({
        title: "Newsletter sent!",
        description: "Your newsletter has been sent to all active subscribers.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send newsletter",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const activeSubscribers = subscribers.filter(s => s.isActive);
  const inactiveSubscribers = subscribers.filter(s => !s.isActive);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignContent) return;
    createCampaignMutation.mutate({ subject: campaignSubject, content: campaignContent });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>;
      case "draft":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Newsletter Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage subscribers and send newsletters to your community
              </p>
            </div>
            <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-campaign">
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Newsletter Campaign</DialogTitle>
                  <DialogDescription>
                    Compose a new newsletter to send to your subscribers.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject Line</label>
                    <Input
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      required
                      data-testid="input-campaign-subject"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Content (HTML)</label>
                    <Textarea
                      value={campaignContent}
                      onChange={(e) => setCampaignContent(e.target.value)}
                      placeholder="Write your newsletter content here... HTML is supported."
                      className="min-h-[200px]"
                      required
                      data-testid="input-campaign-content"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setNewCampaignOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCampaignMutation.isPending}>
                      {createCampaignMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Draft"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeSubscribers.length}</p>
                    <p className="text-sm text-muted-foreground">Active Subscribers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inactiveSubscribers.length}</p>
                    <p className="text-sm text-muted-foreground">Unsubscribed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Send className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaigns.filter(c => c.status === "sent").length}</p>
                    <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="subscribers" data-testid="tab-subscribers">
                <Users className="w-4 h-4 mr-2" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger value="campaigns" data-testid="tab-campaigns">
                <Mail className="w-4 h-4 mr-2" />
                Campaigns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscribers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Newsletter Subscribers</CardTitle>
                  <CardDescription>
                    People who have signed up to receive your newsletter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSubscribers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : subscribers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No subscribers yet</p>
                      <p className="text-sm">Add the newsletter signup form to your website to start collecting subscribers.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Email</th>
                            <th className="text-left py-3 px-2 font-medium">Name</th>
                            <th className="text-left py-3 px-2 font-medium">Status</th>
                            <th className="text-left py-3 px-2 font-medium">Subscribed</th>
                            <th className="text-left py-3 px-2 font-medium">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscribers.map((subscriber) => (
                            <tr key={subscriber.id} className="border-b last:border-0">
                              <td className="py-3 px-2">{subscriber.email}</td>
                              <td className="py-3 px-2">
                                {subscriber.firstName || subscriber.lastName 
                                  ? `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim()
                                  : "-"}
                              </td>
                              <td className="py-3 px-2">
                                {subscriber.isActive ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Unsubscribed</Badge>
                                )}
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {subscriber.subscribedAt ? format(new Date(subscriber.subscribedAt), "MMM d, yyyy") : "-"}
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {subscriber.source || "website"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Newsletter Campaigns</CardTitle>
                  <CardDescription>
                    View and manage your newsletter campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCampaigns ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No campaigns yet</p>
                      <p className="text-sm">Create your first newsletter campaign to reach your subscribers.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{campaign.subject}</h4>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created {campaign.createdAt ? format(new Date(campaign.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                              {campaign.status === "sent" && campaign.recipientCount && (
                                <> &bull; Sent to {campaign.recipientCount} recipients</>
                              )}
                            </p>
                          </div>
                          {campaign.status === "draft" && (
                            <Button
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              disabled={sendCampaignMutation.isPending || activeSubscribers.length === 0}
                              data-testid={`button-send-campaign-${campaign.id}`}
                            >
                              {sendCampaignMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              Send to {activeSubscribers.length} subscribers
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
