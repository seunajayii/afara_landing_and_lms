import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  LockOpen,
  LockKeyhole,
  Loader2,
  FolderOpen,
  Mail,
} from "lucide-react";
import type { Cohort, ExtraQuestion } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  open: { label: "Open", variant: "default" },
  closed: { label: "Closed", variant: "secondary" },
  archived: { label: "Archived", variant: "destructive" },
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// Client-side form schema: everything as strings/optional; coerced before sending to the server.
const cohortFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  displayName: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  cohortType: z.enum(["core", "sponsored"]),
  status: z.enum(["draft", "open", "closed", "archived"]),
  year: z.string().optional(),
  version: z.string().optional(),
  sponsor: z.string().optional(),
  geography: z.string().optional(),
  sector: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  partnershipNote: z.string().optional(),
  eligibilityCriteria: z.string().optional(),
  logoUrl: z.string().optional(),
  heroImageUrl: z.string().optional(),
  applicationOpenAt: z.string().optional(),
  applicationCloseAt: z.string().optional(),
  programStartAt: z.string().optional(),
  programEndAt: z.string().optional(),
  extraQuestions: z
    .array(
      z
        .object({
          id: z.string().min(1),
          label: z.string().trim().min(1, "Question text is required"),
          type: z.enum(["short_text", "long_text", "single_select", "yes_no"]),
          required: z.boolean(),
          options: z.array(z.string()).optional(),
        })
        .superRefine((q, ctx) => {
          if (q.type === "single_select" && (q.options ?? []).filter((o) => o.trim()).length < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["options"],
              message: "Add at least 2 options for a single-select question",
            });
          }
        }),
    )
    .default([]),
});

type CohortFormValues = z.infer<typeof cohortFormSchema>;

function newExtraQuestionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function defaultFormValues(cohort?: Cohort): CohortFormValues {
  return {
    name: cohort?.name ?? "",
    displayName: cohort?.displayName ?? "",
    slug: cohort?.slug ?? "",
    cohortType: (cohort?.cohortType as "core" | "sponsored") ?? "core",
    status: (cohort?.status as CohortFormValues["status"]) ?? "draft",
    year: cohort?.year ? String(cohort.year) : "",
    version: cohort?.version ?? "",
    sponsor: cohort?.sponsor ?? "",
    geography: cohort?.geography ?? "",
    sector: cohort?.sector ?? "",
    tagline: cohort?.tagline ?? "",
    description: cohort?.description ?? "",
    partnershipNote: cohort?.partnershipNote ?? "",
    eligibilityCriteria: cohort?.eligibilityCriteria ?? "",
    logoUrl: cohort?.logoUrl ?? "",
    heroImageUrl: cohort?.heroImageUrl ?? "",
    applicationOpenAt: toDateInputValue(cohort?.applicationOpenAt as any),
    applicationCloseAt: toDateInputValue(cohort?.applicationCloseAt as any),
    programStartAt: toDateInputValue(cohort?.programStartAt as any),
    programEndAt: toDateInputValue(cohort?.programEndAt as any),
    extraQuestions: (cohort?.extraQuestions as ExtraQuestion[] | undefined) ?? [],
  };
}

function buildPayload(values: CohortFormValues): Record<string, unknown> {
  return {
    ...values,
    displayName: values.displayName || undefined,
    year: values.year ? Number(values.year) : undefined,
    version: values.version || undefined,
    sponsor: values.sponsor || undefined,
    geography: values.geography || undefined,
    sector: values.sector || undefined,
    tagline: values.tagline || undefined,
    description: values.description || undefined,
    partnershipNote: values.partnershipNote || undefined,
    eligibilityCriteria: values.eligibilityCriteria || undefined,
    logoUrl: values.logoUrl || undefined,
    heroImageUrl: values.heroImageUrl || undefined,
    applicationOpenAt: values.applicationOpenAt || null,
    applicationCloseAt: values.applicationCloseAt || null,
    programStartAt: values.programStartAt || null,
    programEndAt: values.programEndAt || null,
    extraQuestions: (values.extraQuestions || []).map((q) => ({
      ...q,
      options: q.type === "single_select" ? (q.options || []).filter(Boolean) : undefined,
    })),
  };
}

function CohortFormFields({ form, isEdit }: { form: ReturnType<typeof useForm<CohortFormValues>>; isEdit: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input
                {...field}
                data-testid="input-cohort-name"
                onChange={(e) => {
                  field.onChange(e);
                  if (!isEdit && !form.formState.dirtyFields.slug) {
                    form.setValue("slug", slugify(e.target.value));
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="displayName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display name</FormLabel>
            <FormControl><Input {...field} placeholder="Shown publicly, defaults to Name" data-testid="input-cohort-display-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug *</FormLabel>
            <FormControl><Input {...field} placeholder="core" data-testid="input-cohort-slug" /></FormControl>
            <FormDescription>Used in URLs, e.g. /apply/{field.value || "slug"}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="cohortType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cohort type</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger data-testid="select-cohort-type"><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger data-testid="select-cohort-status"><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open for applications</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="year"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Year</FormLabel>
            <FormControl><Input {...field} type="number" data-testid="input-cohort-year" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="version"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Version / edition</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. 2.0" data-testid="input-cohort-version" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="sponsor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sponsor</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. Kingdom of the Netherlands" data-testid="input-cohort-sponsor" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="geography"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Geography</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. Nigeria" data-testid="input-cohort-geography" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="sector"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sector focus</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. Agriculture + Renewable Energy" data-testid="input-cohort-sector" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tagline"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Tagline</FormLabel>
            <FormControl><Input {...field} data-testid="input-cohort-tagline" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="logoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logo URL</FormLabel>
            <FormControl><Input {...field} placeholder="https://…" data-testid="input-cohort-logo" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="heroImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hero image URL</FormLabel>
            <FormControl><Input {...field} placeholder="https://…" data-testid="input-cohort-hero-image" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea {...field} rows={2} data-testid="input-cohort-description" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="partnershipNote"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Partnership note</FormLabel>
            <FormControl><Textarea {...field} rows={2} placeholder="e.g. An AFARA Africa Accelerator Cohort, in collaboration with…" data-testid="input-cohort-partnership-note" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="eligibilityCriteria"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Eligibility criteria</FormLabel>
            <FormControl><Textarea {...field} rows={3} data-testid="input-cohort-eligibility" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="applicationOpenAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Application opens</FormLabel>
            <FormControl><Input {...field} type="date" data-testid="input-cohort-app-open" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="applicationCloseAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Application closes</FormLabel>
            <FormControl><Input {...field} type="date" data-testid="input-cohort-app-close" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="programStartAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Program starts</FormLabel>
            <FormControl><Input {...field} type="date" data-testid="input-cohort-program-start" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="programEndAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Program ends</FormLabel>
            <FormControl><Input {...field} type="date" data-testid="input-cohort-program-end" /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <ExtraQuestionsEditor form={form} />
    </div>
  );
}

// Repeatable list editor for a cohort's custom application questions. These
// render as an extra step near the end of this cohort's public application
// form; a cohort with no questions leaves the form completely unchanged.
function ExtraQuestionsEditor({ form }: { form: ReturnType<typeof useForm<CohortFormValues>> }) {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "extraQuestions" });

  return (
    <div className="sm:col-span-2 space-y-3 border-t pt-4 mt-1">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base">Custom application questions</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ id: newExtraQuestionId(), label: "", type: "short_text", required: false, options: [] })
          }
          data-testid="button-add-extra-question"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add question
        </Button>
      </div>
      <FormDescription>
        Optional, cohort-specific questions shown as an extra step near the end of this cohort's application
        form. Leave empty to keep the standard AFÁRA application form unchanged.
      </FormDescription>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No custom questions added.</p>
      )}
      <div className="space-y-3">
        {fields.map((field, index) => {
          const type = form.watch(`extraQuestions.${index}.type`);
          return (
            <Card key={field.id} className="p-3 bg-muted/30">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2 min-w-0">
                  <FormField
                    control={form.control}
                    name={`extraQuestions.${index}.label`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Question text" data-testid={`input-extra-question-label-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-wrap gap-3 items-center">
                    <FormField
                      control={form.control}
                      name={`extraQuestions.${index}.type`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-40" data-testid={`select-extra-question-type-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short_text">Short text</SelectItem>
                            <SelectItem value="long_text">Long text</SelectItem>
                            <SelectItem value="single_select">Single select</SelectItem>
                            <SelectItem value="yes_no">Yes / No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`extraQuestions.${index}.required`}
                      render={({ field }) => (
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid={`checkbox-extra-question-required-${index}`}
                          />
                          Required
                        </label>
                      )}
                    />
                  </div>
                  {type === "single_select" && (
                    <FormField
                      control={form.control}
                      name={`extraQuestions.${index}.options`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Option A, Option B, Option C"
                              value={(field.value || []).join(", ")}
                              onChange={(e) =>
                                field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                              }
                              data-testid={`input-extra-question-options-${index}`}
                            />
                          </FormControl>
                          <FormDescription>Comma-separated list of options</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    data-testid={`button-move-up-extra-question-${index}`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    data-testid={`button-move-down-extra-question-${index}`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    data-testid={`button-remove-extra-question-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CreateCohortDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const form = useForm<CohortFormValues>({
    resolver: zodResolver(cohortFormSchema),
    defaultValues: defaultFormValues(),
  });

  const createMutation = useMutation({
    mutationFn: async (values: CohortFormValues) => {
      const res = await apiRequest("POST", "/api/admin/cohorts", buildPayload(values));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create cohort");
      }
      return res.json() as Promise<Cohort>;
    },
    onSuccess: (cohort) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({ title: `Cohort "${cohort.name}" created` });
      onOpenChange(false);
      form.reset(defaultFormValues());
    },
    onError: (err: Error) => toast({ title: "Failed to create cohort", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) form.reset(defaultFormValues()); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New cohort</DialogTitle>
          <DialogDescription>Create a new AFARA cohort. Cohorts share the same application engine and design system.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <CohortFormFields form={form} isEdit={false} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-cohort">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create cohort"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditCohortDialog({ cohort, onOpenChange }: { cohort: Cohort | null; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const form = useForm<CohortFormValues>({
    resolver: zodResolver(cohortFormSchema),
    values: cohort ? defaultFormValues(cohort) : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: CohortFormValues) => {
      if (!cohort) throw new Error("No cohort selected");
      const res = await apiRequest("PATCH", `/api/admin/cohorts/${cohort.id}`, buildPayload(values));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update cohort");
      }
      return res.json() as Promise<Cohort>;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({ title: `Cohort "${updated.name}" updated` });
      onOpenChange(false);
    },
    onError: (err: Error) => toast({ title: "Failed to update cohort", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={!!cohort} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit cohort</DialogTitle>
          <DialogDescription>Update this cohort's branding, eligibility, and dates.</DialogDescription>
        </DialogHeader>
        {cohort && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
              <CohortFormFields form={form} isEdit={true} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-cohort">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DuplicateCohortDialog({ cohort, onOpenChange }: { cohort: Cohort | null; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!cohort) throw new Error("No cohort selected");
      const res = await apiRequest("POST", `/api/admin/cohorts/${cohort.id}/duplicate`, { name, slug });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to duplicate cohort");
      }
      return res.json() as Promise<Cohort>;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      toast({ title: `Cohort "${created.name}" created from ${cohort?.name}` });
      onOpenChange(false);
      setName("");
      setSlug("");
      setSlugDirty(false);
    },
    onError: (err: Error) => toast({ title: "Failed to duplicate cohort", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog
      open={!!cohort}
      onOpenChange={(v) => { onOpenChange(v); if (!v) { setName(""); setSlug(""); setSlugDirty(false); } }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate "{cohort?.displayName || cohort?.name}"</DialogTitle>
          <DialogDescription>
            Creates a new cohort with the same branding, sponsor, geography, sector, and eligibility criteria — useful for a recurring edition (e.g. "DOREWA 2.0").
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <FormLabel>New cohort name *</FormLabel>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugDirty) setSlug(slugify(e.target.value));
              }}
              placeholder={`${cohort?.name ?? ""} 2.0`}
              data-testid="input-duplicate-name"
              className="mt-1.5"
            />
          </div>
          <div>
            <FormLabel>New slug *</FormLabel>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }}
              data-testid="input-duplicate-slug"
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || !slug.trim() || duplicateMutation.isPending}
            onClick={() => duplicateMutation.mutate()}
            data-testid="button-submit-duplicate-cohort"
          >
            {duplicateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Duplicate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EmailPreviewType = "confirmation" | "draft-save";

const EMAIL_PREVIEW_LABELS: Record<EmailPreviewType, string> = {
  confirmation: "Application received",
  "draft-save": "Progress saved",
};

function EmailPreviewDialog({ cohort, onOpenChange }: { cohort: Cohort | null; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [type, setType] = useState<EmailPreviewType>("confirmation");
  const [testEmail, setTestEmail] = useState("");

  const { data, isLoading, isError, error } = useQuery<{ subject: string; html: string }>({
    queryKey: ["/api/admin/cohorts", cohort?.id, "email-preview", type],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/cohorts/${cohort!.id}/email-preview?type=${type}`);
      return res.json();
    },
    enabled: !!cohort,
  });

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!cohort) throw new Error("No cohort selected");
      const res = await apiRequest("POST", "/api/admin/test-email", {
        type,
        email: testEmail.trim(),
        firstName: "Jane",
        cohortId: cohort.id,
      });
      return res.json() as Promise<{ success: boolean; error?: string }>;
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast({ title: "Failed to send test email", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: `Test email sent to ${testEmail.trim()}` });
    },
    onError: (err: Error) => toast({ title: "Failed to send test email", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog
      open={!!cohort}
      onOpenChange={(v) => { onOpenChange(v); if (!v) { setType("confirmation"); setTestEmail(""); } }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview applicant emails — {cohort?.displayName || cohort?.name}</DialogTitle>
          <DialogDescription>
            See exactly what applicants will receive — branded with this cohort's current sponsor and partnership note — before anyone actually gets one.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as EmailPreviewType)}>
          <TabsList>
            <TabsTrigger value="confirmation" data-testid="tab-preview-confirmation">
              {EMAIL_PREVIEW_LABELS.confirmation}
            </TabsTrigger>
            <TabsTrigger value="draft-save" data-testid="tab-preview-draft-save">
              {EMAIL_PREVIEW_LABELS["draft-save"]}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {isLoading ? (
            <Skeleton className="flex-1 min-h-[420px]" />
          ) : isError ? (
            <div className="text-sm text-destructive py-8 text-center" data-testid="text-preview-error">
              {(error as Error)?.message || "Failed to load preview."}
            </div>
          ) : data ? (
            <>
              <div className="text-sm">
                <span className="text-muted-foreground">Subject: </span>
                <span className="font-medium" data-testid="text-preview-subject">{data.subject}</span>
              </div>
              <iframe
                title={`${EMAIL_PREVIEW_LABELS[type]} email preview`}
                srcDoc={data.html}
                className="flex-1 w-full border rounded-md bg-white min-h-[420px]"
                sandbox=""
                data-testid="iframe-email-preview"
              />
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Input
            type="email"
            placeholder="Send a live test to…"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-xs"
            data-testid="input-test-email-recipient"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!testEmail.trim() || sendTestMutation.isPending}
            onClick={() => sendTestMutation.mutate()}
            data-testid="button-send-test-email"
          >
            {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Send test email
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CohortManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCohort, setEditCohort] = useState<Cohort | null>(null);
  const [duplicateCohort, setDuplicateCohort] = useState<Cohort | null>(null);
  const [deleteCohort, setDeleteCohort] = useState<Cohort | null>(null);
  const [previewCohort, setPreviewCohort] = useState<Cohort | null>(null);

  const { data: cohorts = [], isLoading } = useQuery<Cohort[]>({
    queryKey: ["/api/admin/cohorts"],
  });

  const toggleOpenMutation = useMutation({
    mutationFn: async ({ id, open }: { id: string; open: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/cohorts/${id}/set-open`, { open });
      if (!res.ok) throw new Error("Failed to update cohort");
      return res.json() as Promise<Cohort>;
    },
    onSuccess: (cohort) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/cohort-analytics"] });
      toast({ title: cohort.isOpen ? `Applications opened — ${cohort.name}` : `Applications closed — ${cohort.name}` });
    },
    onError: () => toast({ title: "Failed to update cohort status", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/cohorts/${id}`);
      if (!res.ok) throw new Error("Failed to delete cohort");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      toast({ title: "Cohort deleted" });
      setDeleteCohort(null);
    },
    onError: () => toast({ title: "Failed to delete cohort", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href="/admin/cohort-analytics">
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-1" data-testid="link-back-to-analytics">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Cohort Analytics
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Cohort Management</h1>
              <p className="text-muted-foreground mt-1">
                Create and configure AFARA's recurring cohorts — each with its own branding, sponsor, eligibility, and dates.
              </p>
            </div>
            <Button className="gap-1.5" onClick={() => setCreateOpen(true)} data-testid="button-new-cohort">
              <Plus className="h-4 w-4" />
              New Cohort
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : cohorts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
                No cohorts yet. Create AFARA's recurring cohorts (e.g. AFARA CORE, DOREWA) to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cohorts.map((c) => (
                <Card key={c.id} data-testid={`card-cohort-${c.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                          {c.displayName || c.name}
                          {c.year && <span className="text-muted-foreground font-normal text-sm">{c.year}</span>}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge variant={STATUS_CONFIG[c.status]?.variant ?? "outline"} data-testid={`badge-status-${c.id}`}>
                            {STATUS_CONFIG[c.status]?.label ?? c.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{c.cohortType}</Badge>
                          <span className="text-xs text-muted-foreground">/apply/{c.slug}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {c.tagline && <p className="text-sm italic text-muted-foreground">{c.tagline}</p>}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      {c.sponsor && <div><span className="text-muted-foreground">Sponsor:</span> {c.sponsor}</div>}
                      {c.geography && <div><span className="text-muted-foreground">Geography:</span> {c.geography}</div>}
                      {c.sector && <div className="col-span-2"><span className="text-muted-foreground">Sector:</span> {c.sector}</div>}
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={toggleOpenMutation.isPending}
                        onClick={() => toggleOpenMutation.mutate({ id: c.id, open: !c.isOpen })}
                        data-testid={`button-toggle-open-${c.id}`}
                      >
                        {c.isOpen ? <LockKeyhole className="h-3.5 w-3.5 text-amber-600" /> : <LockOpen className="h-3.5 w-3.5 text-green-600" />}
                        {c.isOpen ? "Close" : "Open"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditCohort(c)} data-testid={`button-edit-cohort-${c.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDuplicateCohort(c)} data-testid={`button-duplicate-cohort-${c.id}`}>
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewCohort(c)} data-testid={`button-preview-emails-${c.id}`}>
                        <Mail className="h-3.5 w-3.5" />
                        Preview emails
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive ml-auto"
                        onClick={() => setDeleteCohort(c)}
                        data-testid={`button-delete-cohort-${c.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateCohortDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditCohortDialog cohort={editCohort} onOpenChange={(v) => !v && setEditCohort(null)} />
      <DuplicateCohortDialog cohort={duplicateCohort} onOpenChange={(v) => !v && setDuplicateCohort(null)} />
      <EmailPreviewDialog cohort={previewCohort} onOpenChange={(v) => !v && setPreviewCohort(null)} />

      <AlertDialog open={!!deleteCohort} onOpenChange={(v) => !v && setDeleteCohort(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteCohort?.displayName || deleteCohort?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Applications currently assigned to this cohort will become unassigned. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCohort && deleteMutation.mutate(deleteCohort.id)}
              data-testid="button-confirm-delete-cohort"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
