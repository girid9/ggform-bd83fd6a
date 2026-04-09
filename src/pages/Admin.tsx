import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSessionCode } from "@/lib/shuffle";
import { toast } from "sonner";
import { Plus, Copy, Eye, ArrowLeft, Lock, Loader2, Users, Calendar, BarChart3, Download, Trophy, RefreshCw, BookOpen, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import StudentDetail from "@/components/StudentDetail";
import Leaderboard from "@/components/Leaderboard";
import { FloatingInput } from "@/components/FloatingInput";
import { EmptyState } from "@/components/EmptyState";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const ADMIN_PASSCODE = "ictsm2025";

interface QuizSession {
  id: string;
  session_code: string;
  created_at: string;
  question_ids: string[];
}

interface QuizAttempt {
  id: string;
  student_name: string;
  score: number;
  total_questions: number;
  created_at: string;
  answers: Record<string, string>;
}

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuizSession | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<QuizAttempt | null>(null);
  const [creating, setCreating] = useState(false);
  const [quizSize, setQuizSize] = useState("20");
  const [quizMode, setQuizMode] = useState<"random" | "topic">("random");
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [previewQuestions, setPreviewQuestions] = useState<{ id: string; question: string; topic: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (authenticated) fetchSessions();
  }, [authenticated]);

  useEffect(() => {
    if (selectedSession) fetchAttempts(selectedSession.id);
  }, [selectedSession]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("quiz_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSessions(data);
  };

  const fetchAttempts = async (sessionId: string) => {
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (data) setAttempts(data as QuizAttempt[]);
  };

  const createQuiz = async () => {
    setCreating(true);
    try {
      const size = parseInt(quizSize);
      const { data: questions } = await supabase.from("quiz_questions").select("id");
      if (!questions || questions.length < size) {
        toast.error(`Not enough questions (need ${size}, have ${questions?.length || 0})`);
        return;
      }
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, size).map((q) => q.id);
      const code = generateSessionCode();
      const { error } = await supabase.from("quiz_sessions").insert({
        session_code: code,
        question_ids: selected,
      });
      if (error) {
        toast.error("Failed to create quiz");
        console.error(error);
      } else {
        toast.success(`Quiz created with ${size} questions!`);
        fetchSessions();
      }
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/quiz/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const exportToCSV = () => {
    if (attempts.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Student Name", "Score", "Total Questions", "Percentage", "Date"];
    const rows = attempts.map((a) => [
      a.student_name,
      a.score,
      a.total_questions,
      `${Math.round((a.score / a.total_questions) * 100)}%`,
      new Date(a.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-results-${selectedSession?.session_code || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported!");
  };
  const regenerateQuiz = async () => {
    if (!selectedSession) return;
    setCreating(true);
    try {
      const size = selectedSession.question_ids.length;
      const { data: questions } = await supabase.from("quiz_questions").select("id");
      if (!questions || questions.length < size) {
        toast.error("Not enough questions");
        return;
      }
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const newIds = shuffled.slice(0, size).map((q) => q.id);
      const { error } = await supabase
        .from("quiz_sessions")
        .update({ question_ids: newIds })
        .eq("id", selectedSession.id);
      if (error) {
        toast.error("Failed to regenerate quiz");
        console.error(error);
      } else {
        setSelectedSession({ ...selectedSession, question_ids: newIds });
        toast.success("Quiz regenerated with new questions! Same link works.");
        fetchSessions();
      }
    } finally {
      setCreating(false);
    }
  };

  const handlePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setAuthenticated(true);
    } else {
      toast.error("Incorrect passcode");
    }
  };

  if (!authenticated) {
    return (
       <div className="flex min-h-screen items-center justify-center px-5 relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-background">
         <div className="absolute top-4 right-4"><DarkModeToggle /></div>
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
         <Card className="w-full max-w-sm glass-card animate-fade-up">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 mx-auto mb-3">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Tutor Access</CardTitle>
            <CardDescription>Enter the passcode to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasscode} className="space-y-4">
              <FloatingInput type="password" label="Enter passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
              <Button type="submit" className="w-full h-11 font-semibold">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedStudent && selectedSession) {
    return (
      <StudentDetail
        attempt={selectedStudent}
        questionIds={selectedSession.question_ids}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  if (selectedSession) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSession(null); setAttempts([]); }} className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold">{selectedSession.session_code}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(selectedSession.created_at).toLocaleDateString()} · {selectedSession.question_ids.length} Qs
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={regenerateQuiz} disabled={creating} className="gap-1.5 text-xs h-8">
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5 text-xs h-8">
              <Download className="w-3 h-3" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyLink(selectedSession.session_code)} className="gap-1.5 text-xs h-8">
              <Copy className="w-3 h-3" /> Link
            </Button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-4">
          <Leaderboard sessionId={selectedSession.id} />
        </div>

        {attempts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-0">
              <EmptyState icon="students" title="No responses yet" description="Share the quiz link with students to see their results here" />
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs text-center">Score</TableHead>
                  <TableHead className="text-xs text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => {
                  const pct = Math.round((a.score / a.total_questions) * 100);
                  const passed = pct >= 60;
                  return (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelectedStudent(a)}>
                      <TableCell>
                        <p className="text-sm font-medium">{a.student_name}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                          {a.score}/{a.total_questions} · {pct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
          <h1 className="text-xl font-bold mt-1">Tutor Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Link to="/analytics">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Create Quiz */}
      <Card className="glass-card mb-5">
        <CardContent className="py-4 px-4">
          <p className="text-sm font-semibold mb-3">Create New Quiz</p>
          <div className="flex items-center gap-3">
            <Select value={quizSize} onValueChange={setQuizSize}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 25, 30, 40, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={createQuiz} disabled={creating} size="sm" className="gap-1.5 font-semibold flex-1">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {sessions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-0">
            <EmptyState icon="quiz" title="No quizzes yet" description="Create your first quiz to get started" actionLabel="Create Quiz" onAction={createQuiz} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className="glass-card cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]"
              onClick={() => setSelectedSession(s)}
            >
              <CardContent className="flex items-center justify-between py-3.5 px-4">
                <div>
                  <p className="font-bold text-base tracking-wide">{s.session_code}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString()} · {s.question_ids.length} Qs
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); copyLink(s.session_code); }}
                  className="gap-1.5 text-xs h-8"
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
