import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Brain, PlusCircle, Loader2, LayoutDashboard, Target, Clock, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNextSteps } from "@/hooks/useNextSteps";
import { useStudyGoals, DEFAULT_GOALS } from "@/hooks/useStudyGoals";
import StudyGoalsDialog from "@/components/StudyGoalsDialog";


const StepRow = ({
  icon: Icon,
  label,
  title,
  meta,
  to,
  cta,
}: {
  icon: typeof BookOpen;
  label: string;
  title: string;
  meta?: string;
  to: string;
  cta: string;
}) => (
  <Link
    to={to}
    className="flex items-center gap-4 rounded-2xl bg-white/5 hover:bg-white/15 transition-colors p-4"
  >
    <div className="h-10 w-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</p>
      <p className="text-sm font-bold truncate">{title}</p>
      {meta && <p className="text-xs text-white/60 truncate">{meta}</p>}
    </div>
    <span className="text-xs font-black uppercase tracking-widest text-white/70 shrink-0">
      {cta}
    </span>
  </Link>
);

export default function NextSteps() {
  const { user } = useAuth();
  const { continueNote, nextNote, quizNote, completedCount, totalCount, percent, loading } =
    useNextSteps();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-widest text-white/80">Your next steps</p>
        </div>
        <div className="bg-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-white/70" />
            <p className="text-sm font-bold">Sign in to see your plan</p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Once you start reading, this panel shows the exact PDF to continue and the next quiz to take.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-white text-primary font-black text-sm px-6 h-11"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    );
  }

  const hasSteps = continueNote || nextNote || quizNote;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-widest text-white/80">Your next steps</p>
        <p className="text-sm font-bold text-white/60">
          {completedCount}/{totalCount} done
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-white/15">
          <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-white/60">{percent}% of the library completed</p>
      </div>

      <div className="space-y-3">
        {continueNote && (
          <StepRow
            icon={BookOpen}
            label="Continue reading"
            title={continueNote.title}
            meta={continueNote.category}
            to={`/viewer/${continueNote.id}`}
            cta="Open"
          />
        )}
        {quizNote && (
          <StepRow
            icon={Brain}
            label="Take the next quiz"
            title={quizNote.title}
            meta={`Recall check · ${quizNote.category}`}
            to={`/viewer/${quizNote.id}`}
            cta="Quiz"
          />
        )}
        {nextNote && (
          <StepRow
            icon={PlusCircle}
            label="Start something new"
            title={nextNote.title}
            meta={nextNote.category}
            to={`/viewer/${nextNote.id}`}
            cta="Start"
          />
        )}
        {!hasSteps && (
          <div className="rounded-2xl bg-white/5 p-6 space-y-3">
            <p className="text-sm font-bold">You're all caught up.</p>
            <p className="text-sm text-white/70">New notes will show up here as they're published.</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-white text-primary font-black text-sm px-6 h-11"
            >
              Browse library
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
