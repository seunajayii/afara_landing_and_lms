import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExtraQuestion } from "@shared/schema";

// Renders a cohort's custom extra questions (short text, long text, single
// select, yes/no). The read-only mode is used by admins to preview the same
// controls applicants will see without allowing edits.
export function ExtraQuestionsSection({
  questions,
  answers = {},
  onChange,
  readOnly = false,
}: {
  questions: ExtraQuestion[];
  answers?: Record<string, string | boolean>;
  onChange?: (id: string, value: string | boolean) => void;
  readOnly?: boolean;
}) {
  if (questions.length === 0) return null;
  const updateAnswer = onChange ?? (() => {});

  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <Label htmlFor={`extra-${q.id}`}>
            {q.label}
            {q.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {q.type === "short_text" && (
            <Input
              id={`extra-${q.id}`}
              value={(answers[q.id] as string) || ""}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              readOnly={readOnly}
              data-testid={`input-extra-${q.id}`}
            />
          )}
          {q.type === "long_text" && (
            <Textarea
              id={`extra-${q.id}`}
              className="min-h-[120px]"
              value={(answers[q.id] as string) || ""}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              readOnly={readOnly}
              data-testid={`input-extra-${q.id}`}
            />
          )}
          {q.type === "single_select" && (
            <Select
              value={(answers[q.id] as string) || undefined}
              onValueChange={(v) => updateAnswer(q.id, v)}
              disabled={readOnly}
            >
              <SelectTrigger id={`extra-${q.id}`} data-testid={`select-extra-${q.id}`}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {(q.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {q.type === "yes_no" && (
            <RadioGroup
              value={answers[q.id] === true ? "yes" : answers[q.id] === false ? "no" : ""}
              onValueChange={(v) => updateAnswer(q.id, v === "yes")}
              className="flex gap-6"
              disabled={readOnly}
              data-testid={`radiogroup-extra-${q.id}`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id={`extra-${q.id}-yes`} />
                <Label htmlFor={`extra-${q.id}-yes`} className="font-normal">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id={`extra-${q.id}-no`} />
                <Label htmlFor={`extra-${q.id}-no`} className="font-normal">No</Label>
              </div>
            </RadioGroup>
          )}
        </div>
      ))}
    </div>
  );
}