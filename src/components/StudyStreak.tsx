import { Flame, Loader2 } from "lucide-react";
import { useStudyStreak } from "@/hooks/useStudyStreak";

export default function StudyStreak() {
  const { streak, loading } = useStudyStreak();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border flex items-center gap-4 transition-all hover:shadow-md group">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${streak > 0 ? "bg-orange-100 text-orange-500 scale-110 shadow-orange-100/50 shadow-lg" : "bg-muted text-muted-foreground"}`}>
        <Flame className={`h-6 w-6 ${streak > 0 ? "animate-pulse" : ""}`} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Study Streak</p>
        <div className="flex items-baseline gap-1">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <h3 className="text-2xl font-black">{streak}</h3>
              <span className="text-sm font-bold text-muted-foreground">days</span>
            </>
          )}
        </div>
      </div>
      {streak > 0 && (
        <div className="ml-auto bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter animate-bounce">
          On Fire!
        </div>
      )}
    </div>
  );
}
