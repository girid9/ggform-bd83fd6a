import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, TrendingUp, AlertTriangle, Trophy, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface AttemptRow { id: string; student_name: string; score: number; total_questions: number; created_at: string; session_id: string; answers: Record<string, string>; }
interface QuestionRow { id: string; question: string; correct_answer: string; topic: string; }

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
      <div className="flex min-h-screen items-center justify-center page-bg">
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
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
    .map(([qId, stats]) => ({ question: questions.find((q) => q.id === qId), accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0, totalAttempts: stats.total }))
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
  const dailyBreakdown = Object.entries(dailyStats).map(([date, stats]) => ({ date, attempts: stats.attempts, avgScore: Math.round(stats.totalPct / stats.attempts) })).slice(0, 14);

  const statCards = [
    { icon: Users, label: "Students", value: totalStudents, color: "bg-primary/10 text-primary" },
    { icon: BarChart3, label: "Attempts", value: totalAttempts, color: "bg-accent text-foreground" },
    { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%`, color: "bg-primary/10 text-primary" },
    { icon: Trophy, label: "Pass Rate", value: `${passRate}%`, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto page-bg">
      <div className="fixed top-5 right-5 z-20"><DarkModeToggle /></div>

      <div className="flex items-center gap-3 mb-6 animate-fade-up">
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 rounded-full">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-display">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map(({ icon: Icon, label, value, color }, i) => (
          <Card key={label} className="rounded-2xl animate-fade-up border-0 shadow-sm" style={{ animationDelay: `${i * 75}ms`, animationFillMode: "both" }}>
            <CardContent className="py-5 px-5 flex items-center gap-3">
              <div className={`${color} rounded-2xl p-3`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-xl font-bold font-display">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dailyBreakdown.length > 0 && (
        <Card className="mb-6 rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 font-display">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyBreakdown.map((d) => (
                <div key={d.date} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground w-24">{d.date}</span>
                  <div className="flex-1 mx-3"><Progress value={d.avgScore} className="h-2" /></div>
                  <span className="font-semibold w-20 text-right">{d.avgScore}% · {d.attempts}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {topicBreakdown.length > 0 && (
        <Card className="mb-6 rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 font-display">
              <BarChart3 className="w-4 h-4 text-primary" /> Topic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topicBreakdown.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate max-w-[60%]">{t.topic}</span>
                    <span className={`font-semibold ${t.accuracy >= 60 ? "text-primary" : "text-destructive"}`}>{t.accuracy}%</span>
                  </div>
                  <Progress value={t.accuracy} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hardestQuestions.length > 0 && (
        <Card className="mb-6 rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 font-display">
              <AlertTriangle className="w-4 h-4 text-warning" /> Most Difficult Questions
            </CardTitle>
            <CardDescription className="text-xs">Sorted by lowest accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hardestQuestions.map((hq, i) => (
                <div key={hq.question!.id} className="flex items-start gap-3 text-xs">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-xl text-[10px] font-bold ${hq.accuracy < 40 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug line-clamp-2">{hq.question!.question}</p>
                    <p className="text-muted-foreground/60 text-[10px] mt-0.5">{hq.question!.topic} · {hq.totalAttempts} attempts · <span className={hq.accuracy < 40 ? "text-destructive" : "text-warning"}>{hq.accuracy}%</span></p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalAttempts === 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No quiz data yet. Analytics will appear after students take quizzes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
