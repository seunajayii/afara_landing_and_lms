import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, Send, Plus, Loader2, CheckCircle, XCircle, Clock, Trash2, Image as ImageIcon, Type, MousePointer2, Minus, Eye, FlaskConical, UserCheck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NewsletterCampaign } from "@shared/schema";
import {
  DEFAULT_NEWSLETTER_AUDIENCE,
  DEFAULT_NEWSLETTER_BLOCKS,
  renderNewsletterHtml,
  type NewsletterAudience,
  type NewsletterBlock,
  type NewsletterSegment,
} from "@shared/newsletter";
import { format } from "date-fns";

type RecipientOptions = {
  groups: Array<{ key: NewsletterSegment["type"]; label: string; description: string; count: number }>;
  cohorts: Array<{ id: string; name: string; count: number }>;
  applicantStatuses: string[];
  users: Array<{ id: string; email: string; firstName: string; lastName: string; role: string }>;
};
type RecipientPreview = {
  count: number;
  recipients: Array<{ id?: string; email: string; firstName?: string; lastName?: string; sources: string[] }>;
};

const FIXED_GROUPS: Array<{ key: "newsletter_subscribers" | "community_members" | "team_members" | "all_users"; label: string; description: string }> = [
  { key: "newsletter_subscribers", label: "Newsletter subscribers", description: "People who opted into the public newsletter." },
  { key: "community_members", label: "Community members", description: "Active users with the community member role." },
  { key: "team_members", label: "Team members", description: "Mentors, facilitators, admins, and super admins." },
  { key: "all_users", label: "All active users", description: "Every active platform account." },
];

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function BlockEditor({ block, onChange, onRemove }: { block: NewsletterBlock; onChange: (block: NewsletterBlock) => void; onRemove: () => void }) {
  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {block.type === "text" && <Type className="h-4 w-4 text-primary" />}
          {block.type === "image" && <ImageIcon className="h-4 w-4 text-primary" />}
          {block.type === "button" && <MousePointer2 className="h-4 w-4 text-primary" />}
          {block.type === "divider" && <Minus className="h-4 w-4 text-primary" />}
          {block.type === "text" ? "Text block" : block.type === "image" ? "Image block" : block.type === "button" ? "Button block" : "Divider"}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove block"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
      </div>
      {block.type === "text" && (
        <Textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} placeholder="Write your English message here…" className="min-h-[130px]" />
      )}
      {block.type === "image" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Image URL</Label><Input value={block.url} onChange={(event) => onChange({ ...block, url: event.target.value })} placeholder="https://…" /></div>
          <div className="space-y-2"><Label>Alt text</Label><Input value={block.alt} onChange={(event) => onChange({ ...block, alt: event.target.value })} placeholder="Describe the image" /></div>
        </div>
      )}
      {block.type === "button" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Button label</Label><Input value={block.label} onChange={(event) => onChange({ ...block, label: event.target.value })} placeholder="Read more" /></div>
          <div className="space-y-2"><Label>Button link</Label><Input type="url" value={block.url} onChange={(event) => onChange({ ...block, url: event.target.value })} placeholder="https://…" /></div>
        </div>
      )}
    </div>
  );
}

export default function NewsletterManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [composerOpen, setComposerOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(DEFAULT_NEWSLETTER_BLOCKS.map((block) => ({ ...block })));
  const [selectedGroups, setSelectedGroups] = useState<string[]>([DEFAULT_NEWSLETTER_AUDIENCE.segments[0].type]);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [applicantStatuses, setApplicantStatuses] = useState<string[]>([]);
  const [applicantCohortId, setApplicantCohortId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("");

  const { data: subscribers = [], isLoading: loadingSubscribers } = useQuery<any[]>({ queryKey: ["/api/newsletter/subscribers"] });
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<NewsletterCampaign[]>({ queryKey: ["/api/newsletter/campaigns"] });
  const { data: options, isLoading: loadingOptions } = useQuery<RecipientOptions>({ queryKey: ["/api/newsletter/recipient-options"] });

  const audience = useMemo<NewsletterAudience>(() => ({
    segments: [
      ...selectedGroups.map((type) => ({ type } as NewsletterSegment)),
      ...selectedCohorts.map((cohortId) => ({ type: "cohort_members" as const, cohortId })),
      ...applicantStatuses.map((status) => ({ type: "applicants" as const, status, ...(applicantCohortId ? { cohortId: applicantCohortId } : {}) })),
    ],
    selectedUserIds,
  }), [selectedGroups, selectedCohorts, applicantStatuses, applicantCohortId, selectedUserIds]);

  const previewHtml = useMemo(() => renderNewsletterHtml(campaignSubject || "Your AFÁRÁ update", blocks), [campaignSubject, blocks]);
  const recipientPreview = useQuery<RecipientPreview>({
    queryKey: ["/api/newsletter/recipient-preview", JSON.stringify(audience)],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/newsletter/recipient-preview", { audience });
      return response.json();
    },
    enabled: composerOpen && (audience.segments.length > 0 || audience.selectedUserIds.length > 0),
  });

  const resetComposer = () => {
    setCampaignSubject("");
    setBlocks(DEFAULT_NEWSLETTER_BLOCKS.map((block) => ({ ...block })));
    setSelectedGroups(["newsletter_subscribers"]);
    setSelectedCohorts([]);
    setApplicantStatuses([]);
    setApplicantCohortId("");
    setSelectedUserIds([]);
    setTestEmail("");
  };

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/newsletter/campaigns", {
        subject: campaignSubject,
        blocks,
        audience,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
      setComposerOpen(false);
      resetComposer();
      toast({ title: "Draft saved", description: "Your English email and recipient groups are ready for review." });
    },
    onError: (error) => toast({ title: "Failed to save draft", description: getErrorMessage(error, "Please try again."), variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/newsletter/test", { subject: campaignSubject, blocks, audience, recipientEmail: testEmail });
      return response.json();
    },
    onSuccess: () => toast({ title: "Test email sent", description: `Check ${testEmail} before sending the blast.` }),
    onError: (error) => toast({ title: "Test email failed", description: getErrorMessage(error, "Please check the address and try again."), variant: "destructive" }),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/newsletter/campaigns/${campaignId}/send`);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter/campaigns"] });
      toast({ title: "Email blast sent", description: `Delivered to ${result.recipientCount} deduplicated recipients.` });
    },
    onError: (error) => toast({ title: "Blast failed", description: getErrorMessage(error, "Please try again."), variant: "destructive" }),
  });

  const activeSubscribers = subscribers.filter((subscriber) => subscriber.isActive);
  const inactiveSubscribers = subscribers.filter((subscriber) => !subscriber.isActive);
  const toggleGroup = (group: string) => setSelectedGroups((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group]);
  const toggleCohort = (cohortId: string) => setSelectedCohorts((current) => current.includes(cohortId) ? current.filter((id) => id !== cohortId) : [...current, cohortId]);
  const toggleApplicantStatus = (status: string) => setApplicantStatuses((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status]);
  const addBlock = (type: NewsletterBlock["type"]) => {
    if (type === "text") setBlocks((current) => [...current, { id: makeId(), type, text: "" }]);
    if (type === "image") setBlocks((current) => [...current, { id: makeId(), type, url: "", alt: "" }]);
    if (type === "button") setBlocks((current) => [...current, { id: makeId(), type, label: "Learn more", url: "" }]);
    if (type === "divider") setBlocks((current) => [...current, { id: makeId(), type }]);
  };

  const handleSend = (campaign: NewsletterCampaign) => {
    if (!window.confirm(`Send “${campaign.subject}” to the selected recipient groups now? This cannot be undone.`)) return;
    sendCampaignMutation.mutate(campaign.id);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary mb-2">Audience communication</p>
              <h1 className="text-3xl font-bold">Email Blasts</h1>
              <p className="text-muted-foreground mt-1">Build an English email, choose exactly who receives it, preview it, test it, and send it when ready.</p>
            </div>
            <Button onClick={() => { setComposerOpen(true); setActiveTab("campaigns"); }} data-testid="button-new-campaign"><Plus className="w-4 h-4 mr-2" /> New Email Blast</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-full"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{activeSubscribers.length}</p><p className="text-sm text-muted-foreground">Active Subscribers</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-muted rounded-full"><XCircle className="w-5 h-5 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{inactiveSubscribers.length}</p><p className="text-sm text-muted-foreground">Unsubscribed</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-full"><Send className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{campaigns.filter((campaign) => campaign.status === "sent").length}</p><p className="text-sm text-muted-foreground">Campaigns Sent</p></div></div></CardContent></Card>
          </div>

          {composerOpen && (
            <Card className="border-primary/30 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Compose English email</CardTitle><CardDescription>Use content blocks instead of raw HTML. The preview below is generated from the same blocks that will be sent.</CardDescription></div>
                  <Button variant="ghost" onClick={() => { setComposerOpen(false); resetComposer(); }}>Close</Button>
                </div>
              </CardHeader>
              <CardContent className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-8">
                <div className="space-y-6">
                  <div className="space-y-2"><Label htmlFor="campaign-subject">Subject line</Label><Input id="campaign-subject" value={campaignSubject} onChange={(event) => setCampaignSubject(event.target.value)} placeholder="Your next AFÁRÁ update" data-testid="input-campaign-subject" /></div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3"><div><Label>Email content</Label><p className="text-xs text-muted-foreground mt-1">Add text, images, buttons, or dividers in the order they should appear.</p></div><Badge variant="outline">English</Badge></div>
                    {blocks.map((block) => <BlockEditor key={block.id} block={block} onChange={(updated) => setBlocks((current) => current.map((item) => item.id === updated.id ? updated : item))} onRemove={() => setBlocks((current) => current.filter((item) => item.id !== block.id))} />)}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => addBlock("text")}><Type className="h-4 w-4 mr-2" /> Add text</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addBlock("image")}><ImageIcon className="h-4 w-4 mr-2" /> Add image</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addBlock("button")}><MousePointer2 className="h-4 w-4 mr-2" /> Add button</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addBlock("divider")}><Minus className="h-4 w-4 mr-2" /> Add divider</Button>
                    </div>
                  </div>

                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" /> Choose recipients</CardTitle><CardDescription>Select any combination of database groups. Recipients are deduplicated before sending.</CardDescription></CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-3">
                        {FIXED_GROUPS.map((group) => {
                          const selected = selectedGroups.includes(group.key);
                          const count = options?.groups.find((item) => item.key === group.key)?.count;
                          return <label key={group.key} className={`flex gap-3 rounded-lg border p-3 cursor-pointer ${selected ? "border-primary bg-primary/5" : "bg-background"}`}><input type="checkbox" checked={selected} onChange={() => toggleGroup(group.key)} className="mt-1" /><span><span className="block text-sm font-medium">{group.label}{count !== undefined && <span className="text-muted-foreground font-normal"> · {count}</span>}</span><span className="block text-xs text-muted-foreground mt-1">{group.description}</span></span></label>;
                        })}
                      </div>
                      <div className="space-y-3"><Label>Cohort members</Label><p className="text-xs text-muted-foreground">Accepted participants in any selected cohort.</p><div className="grid sm:grid-cols-2 gap-2">{options?.cohorts.map((cohort) => <label key={cohort.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedCohorts.includes(cohort.id)} onChange={() => toggleCohort(cohort.id)} />{cohort.name} <span className="text-muted-foreground">({cohort.count})</span></label>)}</div>{loadingOptions && <p className="text-xs text-muted-foreground">Loading cohorts…</p>}</div>
                      <div className="space-y-3"><Label>Applicants by status</Label><div className="grid sm:grid-cols-3 gap-2">{(options?.applicantStatuses || []).map((status) => <label key={status} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={applicantStatuses.includes(status)} onChange={() => toggleApplicantStatus(status)} />{status.replace("_", " ")}</label>)}</div><select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={applicantCohortId} onChange={(event) => setApplicantCohortId(event.target.value)}><option value="">Applicants from all cohorts</option>{options?.cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select></div>
                      <div className="space-y-3"><Label>Specific people <span className="font-normal text-muted-foreground">(optional)</span></Label><select multiple size={4} className="w-full rounded-md border bg-background p-2 text-sm" value={selectedUserIds} onChange={(event) => setSelectedUserIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{options?.users.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} — {user.email} ({user.role.replace("_", " ")})</option>)}</select></div>
                      <div className="rounded-lg border bg-background p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Selected recipients</p><p className="text-sm text-muted-foreground">{recipientPreview.isLoading ? "Calculating…" : `${recipientPreview.data?.count || 0} unique recipient${recipientPreview.data?.count === 1 ? "" : "s"}`}</p></div><Eye className="h-5 w-5 text-primary" /></div>{recipientPreview.data && recipientPreview.data.recipients.length > 0 && <div className="mt-3 space-y-1 text-xs text-muted-foreground">{recipientPreview.data.recipients.slice(0, 6).map((recipient) => <p key={recipient.email}>{recipient.firstName || recipient.email} <span className="opacity-70">· {recipient.email}</span></p>)}{recipientPreview.data.count > 6 && <p>+ {recipientPreview.data.count - 6} more</p>}</div>}</div>
                    </CardContent>
                  </Card>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" disabled={!campaignSubject.trim() || !testEmail.trim() || testMutation.isPending} onClick={() => testMutation.mutate()}><FlaskConical className="h-4 w-4 mr-2" />{testMutation.isPending ? "Sending test…" : "Send test email"}</Button>
                    <Input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="test recipient@example.com" className="sm:max-w-xs order-first sm:order-none" />
                    <Button disabled={!campaignSubject.trim() || !blocks.length || !recipientPreview.data?.count || createCampaignMutation.isPending} onClick={() => createCampaignMutation.mutate()}>{createCampaignMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />} Save draft</Button>
                  </div>
                  {!testEmail && <p className="text-xs text-muted-foreground">Enter a test email address before using “Send test email”.</p>}
                </div>
                <div className="space-y-3 xl:sticky xl:top-4 self-start">
                  <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Live preview</h3><p className="text-xs text-muted-foreground">Email-style preview</p></div><Eye className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="rounded-lg border overflow-hidden bg-muted/30"><iframe title="Email preview" srcDoc={previewHtml} className="w-full h-[620px] bg-white" sandbox="" /></div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList><TabsTrigger value="campaigns"><Mail className="w-4 h-4 mr-2" /> Campaigns</TabsTrigger><TabsTrigger value="subscribers"><Users className="w-4 h-4 mr-2" /> Subscribers</TabsTrigger></TabsList>
            <TabsContent value="campaigns" className="mt-6">
              <Card><CardHeader><CardTitle>Campaigns</CardTitle><CardDescription>Draft, test, review, and send targeted email blasts.</CardDescription></CardHeader><CardContent>
                {loadingCampaigns ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : campaigns.length === 0 ? <div className="text-center py-10 text-muted-foreground"><Send className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No campaigns yet</p><p className="text-sm">Create your first targeted email blast above.</p></div> : <div className="space-y-4">{campaigns.map((campaign) => <div key={campaign.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"><div className="flex-1"><div className="flex items-center gap-2 mb-1 flex-wrap"><h4 className="font-medium">{campaign.subject}</h4>{campaign.status === "sent" ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge> : <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>}</div><p className="text-sm text-muted-foreground">Created {campaign.createdAt ? format(new Date(campaign.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}{campaign.status === "sent" && campaign.recipientCount ? <> · Sent to {campaign.recipientCount} recipients</> : ""}</p></div>{campaign.status === "draft" && <Button onClick={() => handleSend(campaign)} disabled={sendCampaignMutation.isPending}><Send className="w-4 h-4 mr-2" /> Send blast</Button>}</div>)}</div>}
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="subscribers" className="mt-6">
              <Card><CardHeader><CardTitle>Newsletter Subscribers</CardTitle><CardDescription>Public opt-in subscribers remain available as one of the selectable recipient groups.</CardDescription></CardHeader><CardContent>{loadingSubscribers ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : subscribers.length === 0 ? <div className="text-center py-8 text-muted-foreground">No newsletter subscribers yet.</div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left py-3 px-2 font-medium">Email</th><th className="text-left py-3 px-2 font-medium">Name</th><th className="text-left py-3 px-2 font-medium">Status</th><th className="text-left py-3 px-2 font-medium">Subscribed</th></tr></thead><tbody>{subscribers.map((subscriber) => <tr key={subscriber.id} className="border-b last:border-0"><td className="py-3 px-2">{subscriber.email}</td><td className="py-3 px-2">{`${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim() || "-"}</td><td className="py-3 px-2">{subscriber.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Unsubscribed</Badge>}</td><td className="py-3 px-2 text-sm text-muted-foreground">{subscriber.subscribedAt ? format(new Date(subscriber.subscribedAt), "MMM d, yyyy") : "-"}</td></tr>)}</tbody></table></div>}</CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}