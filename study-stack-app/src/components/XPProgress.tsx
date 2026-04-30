import { Progress } from "@/components/ui/progress";
import { Trophy, Loader2 } from "lucide-react";
import { useXP } from "@/hooks/useXP";

export default function XPProgress() {
  const { level, progress, nextLevelXP, loading } = useXP();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Level</p>
            <h3 className="text-xl font-black">{level}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total XP</p>
          <p className="text-xs font-bold">{progress} / {nextLevelXP}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-2 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          <Progress value={(progress / nextLevelXP) * 100} className="h-2" />
          <p className="text-[10px] text-center text-muted-foreground font-medium italic">
            {nextLevelXP - progress} XP until next level
          </p>
        </div>
      )}
    </div>
  );
}
