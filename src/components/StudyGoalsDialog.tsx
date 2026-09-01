import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DAYS, DEFAULT_GOALS, StudyGoals } from "@/hooks/useStudyGoals";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: StudyGoals | null;
  onSave: (g: StudyGoals) => Promise<{ error: unknown }>;
}

export default function StudyGoalsDialog({ open, onOpenChange, goals, onSave }: Props) {
  const [form, setForm] = useState<StudyGoals>(goals ?? DEFAULT_GOALS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(goals ?? DEFAULT_GOALS);
  }, [open, goals]);

  const toggleDay = (day: string) =>
    setForm((f) => ({
      ...f,
      preferred_days: f.preferred_days.includes(day)
        ? f.preferred_days.filter((d) => d !== day)
        : [...f.preferred_days, day],
    }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await onSave({
      ...form,
      weekly_notes_target: Math.max(1, Number(form.weekly_notes_target) || 1),
      weekly_minutes_target: Math.max(15, Number(form.weekly_minutes_target) || 15),
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save your goals");
      return;
    }
    toast.success("Study goals updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Weekly study goals</DialogTitle>
          <DialogDescription>
            Set your targets and preferred session times. They show up on your Study Command Center.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes-target">Notes per week</Label>
              <Input
                id="notes-target"
                type="number"
                min={1}
                value={form.weekly_notes_target}
                onChange={(e) =>
                  setForm({ ...form, weekly_notes_target: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes-target">Minutes per week</Label>
              <Input
                id="minutes-target"
                type="number"
                min={15}
                step={15}
                value={form.weekly_minutes_target}
                onChange={(e) =>
                  setForm({ ...form, weekly_minutes_target: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred study days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "h-9 px-3 rounded-full text-xs font-bold border transition-colors",
                    form.preferred_days.includes(day)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Session starts</Label>
              <Input
                id="start"
                type="time"
                value={form.session_start?.slice(0, 5)}
                onChange={(e) => setForm({ ...form, session_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Session ends</Label>
              <Input
                id="end"
                type="time"
                value={form.session_end?.slice(0, 5)}
                onChange={(e) => setForm({ ...form, session_end: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="rounded-full font-black">
            {saving ? "Saving..." : "Save goals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
