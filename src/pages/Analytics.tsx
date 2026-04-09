import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, AlertTriangle, Trophy, BarChart3 } from "lucide-react";

interface AttemptRow {
  id: string;
  student_name: string;
  score: number;
  total_questions: number;
  created_at: string;
  session_id: string;
  answers: Record<string, string>;
}

interface QuestionRow {
  id: string;
  question: string;
  correct_answer: string;
  topic: string;
}

const Analytics = () => {
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: att }, { data: qs }] = await Promise.all([
        supabase.from("quiz_attempts").select("*").order("created_at", { ascending: false }),
        supabase.from("quiz_questions").select("id, question, correct_answer, topic"),
      ]);
      if (att) setAttempts(att as AttemptRow[]);
      if (qs) setQuestions(qs);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--surface-raised)) 50%, hsl(var(--muted)) 75%)', backgroundSize: '200% 100%' }} />
        ))}
      </div>
    );
  }

  const totalStudents = new Set(attempts.map((a) => a.student_name.toLowerCase())).size;
  const totalAttempts = attempts.length;
  const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total_questions) * 100, 0) / totalAttempts) : 0;
  const passRate = totalAttempts > 0 ? Math.round((attempts.filter((a) => (a.score / a.total_questions) * 100 >= 60).length / totalAttempts) * 100) : 0;

  const questionStats: Record<string, { total: number; correct: number }> = {};
  attempts.forEach((a) => {
    const answers = a.answers as Record<string, string>;
    Object.entries(answers).forEach(([qId, ans]) => {
      if (!questionStats[qId]) questionStats[qId] = { total: 0, correct: 0 };
      questionStats[qId].total++;
      const q = questions.find((qq) => qq.id === qId);
      if (q && ans === q.correct_answer) questionStats[qId].correct++;
    });
  });

  const hardestQuestions = Object.entries(questionStats)
    .map(([qId, stats]) => ({
      question: questions.find((q) => q.id === qId),
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      totalAttempts: stats.total,
    }))
    .filter((x) => x.question && x.totalAttempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 15);

  const topicStats: Record<string, { total: number; correct: number }> = {};
  attempts.forEach((a) => {
    const answers = a.answers as Record<string, string>;
    Object.entries(answers).forEach(([qId, ans]) => {
      const q = questions.find((qq) => qq.id === qId);
      if (!q) return;
      if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0 };
      topicStats[q.topic].total++;
      if (ans === q.correct_answer) topicStats[q.topic].correct++;
    });
  });

  const topicBreakdown = Object.entries(topicStats)
    .map(([topic, stats]) => ({ topic, accuracy: Math.round((stats.correct / stats.total) * 100), total: stats.total }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const dailyStats: Record<string, { attempts: number; totalPct: number }> = {};
  attempts.forEach((a) => {
    const day = new Date(a.created_at).toLocaleDateString();
    if (!dailyStats[day]) dailyStats[day] = { attempts: 0, totalPct: 0 };
    dailyStats[day].attempts++;
    dailyStats[day].totalPct += (a.score / a.total_questions) * 100;
  });

  const dailyBreakdown = Object.entries(dailyStats)
    .map(([date, stats]) => ({ date, attempts: stats.attempts, avgScore: Math.round(stats.totalPct / stats.attempts) }))
    .slice(0, 14);

  const statCards = [
    { icon: Users, label: "Students", value: totalStudents, color: "bg-primary/10 text-primary" },
    { icon: BarChart3, label: "Attempts", value: totalAttempts, color: "bg-info/10 text-info" },
    { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%`, color: "bg-success/10 text-success" },
    { icon: Trophy, label: "Pass Rate", value: `${passRate}%`, color: "bg-warning/10 text-warning" },
  ];

  if (totalAttempts === 0) {
    return (
      <Card className="surface-card">
        <CardContent className="py-16 text-center">
          <svg className="w-16 h-16 text-foreground-subtle/30 mx-auto mb-4" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="36" width="10" height="20" rx="2" /><rect x="22" y="24" width="10" height="32" rx="2" /><rect x="36" y="16" width="10" height="40" rx="2" /><rect x="50" y="8" width="10" height="48" rx="2" /></svg>
          <p className="text-sm font-semibold mb-1">No data yet</p>
          <p className="text-xs text-foreground-muted">Analytics will appear after students take quizzes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value, color }, i) => (
          <Card key={label} className="surface-card" style={{ animationDelay: `${i * 75}ms` }}>
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`${color} rounded-xl p-2.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xs text-foreground-muted uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-display font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Breakdown */}
      {dailyBreakdown.length > 0 && (
        <Card className="surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {dailyBreakdown.map((d) => (
                <div key={d.date} className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted w-24">{d.date}</span>
                  <div className="flex-1 mx-3"><Progress value={d.avgScore} className="h-2" /></div>
                  <span className="font-semibold w-24 text-right">{d.avgScore}% · {d.attempts} att</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Breakdown */}
      {topicBreakdown.length > 0 && (
        <Card className="surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Topic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topicBreakdown.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground-muted truncate max-w-[60%]">{t.topic}</span>
                    <span className={`font-semibold ${t.accuracy >= 60 ? "text-success" : "text-destructive"}`}>{t.accuracy}%</span>
                  </div>
                  <Progress value={t.accuracy} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hardest Questions */}
      {hardestQuestions.length > 0 && (
        <Card className="surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Most Difficult Questions
            </CardTitle>
            <CardDescription className="text-xs">Sorted by lowest accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hardestQuestions.map((hq, i) => {
                const difficulty = hq.accuracy < 30 ? "Hard" : hq.accuracy < 60 ? "Medium" : "Easy";
                const diffColor = difficulty === "Hard" ? "bg-destructive/10 text-destructive" : difficulty === "Medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success";
                return (
                  <div key={hq.question!.id} className="flex items-start gap-2.5 text-xs">
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-lg text-2xs font-bold ${hq.accuracy < 40 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="leading-snug line-clamp-2">{hq.question!.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-foreground-subtle text-2xs">{hq.question!.topic}</span>
                        <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded-full ${diffColor}`}>{difficulty}</span>
                        <span className="text-foreground-subtle text-2xs">{hq.accuracy}% accuracy</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
