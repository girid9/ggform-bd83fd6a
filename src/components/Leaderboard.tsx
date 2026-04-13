import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";

interface LeaderEntry { student_name: string; bestScore: number; totalQuestions: number; attempts: number; }
interface Props { sessionId?: string; }

const Leaderboard = ({ sessionId }: Props) => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("quiz_attempts").select("*");
      if (sessionId) query = query.eq("session_id", sessionId);
      const { data } = await query;
      if (!data) return;

      const map: Record<string, LeaderEntry> = {};
      data.forEach((a: any) => {
        const key = a.student_name.toLowerCase();
        if (!map[key]) map[key] = { student_name: a.student_name, bestScore: 0, totalQuestions: a.total_questions, attempts: 0 };
        map[key].attempts++;
        const pct = Math.round((a.score / a.total_questions) * 100);
        if (pct > map[key].bestScore) { map[key].bestScore = pct; map[key].student_name = a.student_name; map[key].totalQuestions = a.total_questions; }
      });
      setEntries(Object.values(map).sort((a, b) => b.bestScore - a.bestScore));
    };
    load();
  }, [sessionId]);

  if (entries.length === 0) return null;

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3 px-5">
        <CardTitle className="text-sm flex items-center gap-2 font-display">
          <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        <div className="space-y-2.5">
          {entries.slice(0, 10).map((e, i) => (
            <div key={e.student_name} className="flex items-center gap-3 text-sm">
              <span className="w-7 text-center">
                {i < 3 ? (
                  <Medal className={`w-4.5 h-4.5 inline ${medalColors[i]}`} />
                ) : (
                  <span className="text-xs text-muted-foreground font-semibold">{i + 1}</span>
                )}
              </span>
              <span className="flex-1 font-medium truncate">{e.student_name}</span>
              <span className={`chip text-xs font-bold ${e.bestScore >= 60 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {e.bestScore}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
