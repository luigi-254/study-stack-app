import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NextStepNote {
  id: string;
  title: string;
  category: string;
}

export interface NextSteps {
  continueNote: NextStepNote | null;
  nextNote: NextStepNote | null;
  quizNote: NextStepNote | null;
  completedCount: number;
  totalCount: number;
  percent: number;
  loading: boolean;
}

interface NoteRow {
  id: string;
  title: string;
  created_at: string;
  categories: { name: string } | null;
}

const toStep = (n: NoteRow): NextStepNote => ({
  id: n.id,
  title: n.title,
  category: n.categories?.name ?? "Uncategorized",
});

export const useNextSteps = (): NextSteps => {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<NextSteps, "loading">>({
    continueNote: null,
    nextNote: null,
    quizNote: null,
    completedCount: 0,
    totalCount: 0,
    percent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [{ data: notes }, { data: progress }] = await Promise.all([
          supabase
            .from("notes")
            .select("id, title, created_at, categories(name)")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("user_note_progress")
            .select("note_id, completed, updated_at")
            .eq("user_id", user.id),
        ]);

        const allNotes = (notes ?? []) as unknown as NoteRow[];
        const rows = progress ?? [];
        const byId = new Map(allNotes.map((n) => [n.id, n]));

        const completedIds = new Set(
          rows.filter((r) => r.completed).map((r) => r.note_id),
        );

        // Most recently touched but not finished => continue reading
        const inProgress = rows
          .filter((r) => !r.completed && byId.has(r.note_id))
          .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];

        const continueNote = inProgress ? toStep(byId.get(inProgress.note_id)!) : null;

        // Untouched note, preferring the same category as what they're reading
        const touched = new Set(rows.map((r) => r.note_id));
        const untouched = allNotes.filter((n) => !touched.has(n.id));
        const nextNote =
          untouched.find(
            (n) => continueNote && n.categories?.name === continueNote.category,
          ) ?? untouched[0] ?? null;

        // Quiz suggestion: most recently completed note (best recall target)
        const lastCompleted = rows
          .filter((r) => r.completed && byId.has(r.note_id))
          .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];

        if (!cancelled) {
          setState({
            continueNote,
            nextNote: nextNote ? toStep(nextNote) : null,
            quizNote: lastCompleted ? toStep(byId.get(lastCompleted.note_id)!) : null,
            completedCount: completedIds.size,
            totalCount: allNotes.length,
            percent: allNotes.length
              ? Math.round((completedIds.size / allNotes.length) * 100)
              : 0,
          });
        }
      } catch (e) {
        console.error("Next steps fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { ...state, loading };
};
