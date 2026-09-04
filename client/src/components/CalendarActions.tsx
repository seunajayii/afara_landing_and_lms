import { CalendarPlus, Download, ExternalLink, Globe2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildGoogleCalendarUrl, buildOutlookCalendarUrl, downloadIcsInvite, type CalendarEventData } from "@/lib/calendar";

export function CalendarActions({
  event,
  eventPageUrl,
  testId = "button-add-to-calendar",
}: {
  event: CalendarEventData;
  eventPageUrl: string;
  testId?: string;
}) {
  const googleUrl = buildGoogleCalendarUrl(event, eventPageUrl);
  const outlookUrl = buildOutlookCalendarUrl(event, eventPageUrl);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="gap-2" data-testid={testId}>
          <CalendarPlus className="h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Choose a calendar</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" data-testid="link-google-calendar">
            <Globe2 className="h-4 w-4" />
            Google Calendar
            <ExternalLink className="ml-auto h-3.5 w-3.5" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={outlookUrl} target="_blank" rel="noopener noreferrer" data-testid="link-outlook-calendar">
            <Mail className="h-4 w-4" />
            Microsoft Outlook Calendar
            <ExternalLink className="ml-auto h-3.5 w-3.5" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => downloadIcsInvite(event, eventPageUrl)} data-testid="button-download-calendar-invite">
          <Download className="h-4 w-4" />
          Download .ics file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}