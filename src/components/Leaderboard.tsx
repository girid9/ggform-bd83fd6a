import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";

interface LeaderEntry {
  student_name: string;
  bestScore: number;
  totalQuestions: number;
  attempts: number;
}

interface Props {
  sessionId?: string;
}

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

  const medalColors = ["text-amber-400", "text-gray-400", "text-amber-700"];

  return (
    <Card className="surface-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.slice(0, 10).map((e, i) => {
            const scoreColor = e.bestScore >= 70 ? "text-success" : e.bestScore >= 50 ? "text-warning" : "text-destructive";
            return (
              <div key={e.student_name} className={`flex items-center gap-3 text-sm rounded-xl px-3 py-2 ${i % 2 === 1 ? "bg-surface-overlay/50" : ""}`}>
                <span className="w-6 text-center">
                  {i < 3 ? <Medal className={`w-4 h-4 inline ${medalColors[i]}`} /> : <span className="text-xs text-foreground-muted font-semibold">{i + 1}</span>}
                </span>
                <span className="flex-1 font-medium truncate">{e.student_name}</span>
                <span className={`text-xs font-bold ${scoreColor}`}>{e.bestScore}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
