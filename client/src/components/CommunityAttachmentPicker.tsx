import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { Link2, FileText, CalendarDays, X, Check, ChevronsUpDown } from "lucide-react";
import type { PostAttachment, Resource, Event } from "@shared/schema";

export { type PostAttachment };

type AttachmentPickerMode = "none" | "link" | "resource" | "event";

function AttachmentTypeIcon({ type }: { type: PostAttachment["type"] }) {
  if (type === "resource") return <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  if (type === "event") return <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  return <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
}

export function AttachmentCard({
  attachment,
  onRemove,
}: {
  attachment: PostAttachment;
  onRemove?: () => void;
}) {
  if (attachment.type === "event") {
    const date = attachment.startTime ? new Date(attachment.startTime) : null;
    return (
      <div className="flex items-start gap-3 rounded-md border px-3 py-2.5 bg-muted/40 text-sm">
        <div className="flex-shrink-0 mt-0.5">
          <CalendarDays className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Event
          </div>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline leading-tight block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {attachment.title}
          </a>
          {date && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
            aria-label="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (attachment.type === "resource") {
    return (
      <div className="flex items-center gap-3 rounded-md border px-3 py-2.5 bg-muted/40 text-sm">
        <div className="flex-shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
            Resource{attachment.resourceType ? ` · ${attachment.resourceType}` : ""}
          </div>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {attachment.title}
          </a>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // link type
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/40 text-sm">
      <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 text-primary hover:underline truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {attachment.title}
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Remove attachment"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SearchableResourcePicker({
  onSelect,
  onCancel,
}: {
  onSelect: (attachment: PostAttachment) => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
      <Label className="text-xs">Search Resources</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            data-testid="button-open-resource-picker"
          >
            <span className="text-muted-foreground">Search resources…</span>
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Filter resources…" data-testid="input-resource-search" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading…" : "No resources found."}
              </CommandEmpty>
              <CommandGroup>
                {(resources || []).map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.title}
                    onSelect={() => {
                      onSelect({
                        type: "resource",
                        resourceId: r.id,
                        url: r.fileUrl || `/lms/resources/${r.id}`,
                        title: r.title,
                        resourceType: r.resourceType,
                      });
                      setOpen(false);
                    }}
                    data-testid={`resource-option-${r.id}`}
                  >
                    <FileText className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    {r.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="ghost" onClick={onCancel} type="button">
        Cancel
      </Button>
    </div>
  );
}

function SearchableEventPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (attachment: PostAttachment) => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", "upcoming"],
    queryFn: async () => {
      const res = await fetch("/api/events?upcoming=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
  });

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
      <Label className="text-xs">Search Upcoming Events</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            data-testid="button-open-event-picker"
          >
            <span className="text-muted-foreground">Search events…</span>
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Filter events…" data-testid="input-event-search" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading…" : "No upcoming events found."}
              </CommandEmpty>
              <CommandGroup>
                {(events || []).map((e) => (
                  <CommandItem
                    key={e.id}
                    value={e.title}
                    onSelect={() => {
                      onSelect({
                        type: "event",
                        eventId: e.id,
                        url: e.meetingLink || `/lms/events/${e.id}`,
                        title: e.title,
                        startTime: e.startTime ? new Date(e.startTime).toISOString() : undefined,
                      });
                      setOpen(false);
                    }}
                    data-testid={`event-option-${e.id}`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{e.title}</span>
                    {e.startTime && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(e.startTime).toLocaleDateString()}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="ghost" onClick={onCancel} type="button">
        Cancel
      </Button>
    </div>
  );
}

function LinkPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (attachment: PostAttachment) => void;
  onCancel: () => void;
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
      <div className="space-y-1.5">
        <Label className="text-xs">URL</Label>
        <Input
          placeholder="https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          data-testid="input-attach-url"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Title (optional)</Label>
        <Input
          placeholder="Descriptive title"
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
          data-testid="input-attach-title"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          type="button"
          disabled={!linkUrl.trim()}
          onClick={() => {
            onSelect({ type: "link", url: linkUrl.trim(), title: linkTitle.trim() || linkUrl.trim() });
          }}
        >
          Attach
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} type="button">
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Renders either:
 *  - The currently chosen attachment (with a remove button), OR
 *  - Attachment type chooser buttons (link / resource / event)
 *
 * @param isAdmin - when false, the "Event" attach button is hidden
 */
export function AttachmentPicker({
  attachment,
  onChange,
  isAdmin = false,
}: {
  attachment: PostAttachment | null;
  onChange: (a: PostAttachment | null) => void;
  isAdmin?: boolean;
}) {
  const [mode, setMode] = useState<AttachmentPickerMode>("none");

  if (attachment) {
    return <AttachmentCard attachment={attachment} onRemove={() => onChange(null)} />;
  }

  if (mode === "link") {
    return (
      <LinkPicker
        onSelect={(a) => { onChange(a); setMode("none"); }}
        onCancel={() => setMode("none")}
      />
    );
  }

  if (mode === "resource") {
    return (
      <SearchableResourcePicker
        onSelect={(a) => { onChange(a); setMode("none"); }}
        onCancel={() => setMode("none")}
      />
    );
  }

  if (mode === "event") {
    return (
      <SearchableEventPicker
        onSelect={(a) => { onChange(a); setMode("none"); }}
        onCancel={() => setMode("none")}
      />
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMode("link")}
        data-testid="button-attach-link"
      >
        <Link2 className="w-3.5 h-3.5 mr-1.5" />
        Link
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMode("resource")}
        data-testid="button-attach-resource"
      >
        <FileText className="w-3.5 h-3.5 mr-1.5" />
        Resource
      </Button>
      {isAdmin && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode("event")}
          data-testid="button-attach-event"
        >
          <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
          Event
        </Button>
      )}
    </div>
  );
}

