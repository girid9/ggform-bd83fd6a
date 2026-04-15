import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSessionCode } from "@/lib/shuffle";
import { toast } from "sonner";
import { Plus, Copy, Eye, ArrowLeft, Lock, Loader2, Users, Calendar, BarChart3, Download, Trophy, RefreshCw, BookOpen, Filter, Upload, Trash2 } from "lucide-react";
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
    if (authenticated) {
      fetchSessions();
      fetchTopics();
    }
  }, [authenticated]);

  useEffect(() => {
    if (selectedSession) fetchAttempts(selectedSession.id);
  }, [selectedSession]);

  const fetchTopics = async () => {
    const { data } = await supabase.from("quiz_questions").select("topic");
    if (data) {
      const map = new Map<string, number>();
      data.forEach((q) => map.set(q.topic, (map.get(q.topic) || 0) + 1));
      setTopics(Array.from(map.entries()).map(([topic, count]) => ({ topic, count })).sort((a, b) => a.topic.localeCompare(b.topic)));
    }
  };

  const fetchSessions = async () => {
    const { data } = await supabase.from("quiz_sessions").select("*").order("created_at", { ascending: false });
    if (data) setSessions(data);
  };

  const fetchAttempts = async (sessionId: string) => {
    const { data } = await supabase.from("quiz_attempts").select("*").eq("session_id", sessionId).order("created_at", { ascending: false });
    if (data) setAttempts(data as QuizAttempt[]);
  };

  const generatePreview = async () => {
    const size = parseInt(quizSize);
    const query = supabase.from("quiz_questions").select("id, question, topic");
    if (quizMode === "topic" && selectedTopic !== "all") query.eq("topic", selectedTopic);
    const { data: questions } = await query;
    if (!questions || questions.length < size) {
      toast.error(`Not enough questions (need ${size}, have ${questions?.length || 0})`);
      return;
    }
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setPreviewQuestions(shuffled.slice(0, size));
    setShowPreview(true);
  };

  const swapQuestion = async (index: number) => {
    const currentIds = new Set(previewQuestions.map((q) => q.id));
    const query = supabase.from("quiz_questions").select("id, question, topic");
    if (quizMode === "topic" && selectedTopic !== "all") query.eq("topic", selectedTopic);
    const { data: all } = await query;
    if (!all) return;
    const available = all.filter((q) => !currentIds.has(q.id));
    if (available.length === 0) { toast.error("No more questions available to swap"); return; }
    const replacement = available[Math.floor(Math.random() * available.length)];
    setPreviewQuestions((prev) => prev.map((q, i) => (i === index ? replacement : q)));
    toast.success("Question swapped!");
  };

  const publishQuiz = async () => {
    if (previewQuestions.length === 0) return;
    setCreating(true);
    try {
      const code = generateSessionCode();
      const { error } = await supabase.from("quiz_sessions").insert({ session_code: code, question_ids: previewQuestions.map((q) => q.id) });
      if (error) { toast.error("Failed to create quiz"); console.error(error); }
      else { toast.success(`Quiz created with ${previewQuestions.length} questions!`); setShowPreview(false); setPreviewQuestions([]); fetchSessions(); }
    } finally { setCreating(false); }
  };

  const createQuizDirect = async () => {
    setCreating(true);
    try {
      const size = parseInt(quizSize);
      const { data: questions } = await supabase.from("quiz_questions").select("id");
      if (!questions || questions.length < size) { toast.error(`Not enough questions (need ${size}, have ${questions?.length || 0})`); return; }
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, size).map((q) => q.id);
      const code = generateSessionCode();
      const { error } = await supabase.from("quiz_sessions").insert({ session_code: code, question_ids: selected });
      if (error) { toast.error("Failed to create quiz"); console.error(error); }
      else { toast.success(`Quiz created with ${size} questions!`); fetchSessions(); }
    } finally { setCreating(false); }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/quiz/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this quiz and all its responses?")) return;
    await supabase.from("quiz_attempts").delete().eq("session_id", sessionId);
    const { error } = await supabase.from("quiz_sessions").delete().eq("id", sessionId);
    if (error) { toast.error("Failed to delete quiz"); }
    else { toast.success("Quiz deleted!"); setSessions((prev) => prev.filter((s) => s.id !== sessionId)); }
  };

  const exportToCSV = () => {
    if (attempts.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Student Name", "Score", "Total Questions", "Percentage", "Date"];
    const rows = attempts.map((a) => [a.student_name, a.score, a.total_questions, `${Math.round((a.score / a.total_questions) * 100)}%`, new Date(a.created_at).toLocaleString()]);
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
      if (!questions || questions.length < size) { toast.error("Not enough questions"); return; }
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const newIds = shuffled.slice(0, size).map((q) => q.id);
      const { error } = await supabase.from("quiz_sessions").update({ question_ids: newIds }).eq("id", selectedSession.id);
      if (error) { toast.error("Failed to regenerate quiz"); console.error(error); }
      else { setSelectedSession({ ...selectedSession, question_ids: newIds }); toast.success("Quiz regenerated with new questions!"); fetchSessions(); }
    } finally { setCreating(false); }
  };

  const handlePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) setAuthenticated(true);
    else toast.error("Incorrect passcode");
  };

  /* ─── LOGIN ─── */
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 relative overflow-hidden page-bg">
        <div className="absolute top-4 right-4"><DarkModeToggle /></div>
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] -z-10 blur-3xl" />

        <Card className="w-full max-w-sm animate-fade-up rounded-3xl border-0 shadow-xl shadow-black/[0.06] dark:shadow-black/20">
          <CardHeader className="text-center pb-2 pt-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg shadow-primary/20 mx-auto mb-5">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl font-display">Tutor Access</CardTitle>
            <CardDescription className="text-sm mt-1">Enter the passcode to continue</CardDescription>
          </CardHeader>
          <CardContent className="pb-8 pt-4">
            <form onSubmit={handlePasscode} className="space-y-5">
              <FloatingInput type="password" label="Enter passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
              <Button type="submit" className="w-full h-13 btn-primary text-sm">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedStudent && selectedSession) {
    return <StudentDetail attempt={selectedStudent} questionIds={selectedSession.question_ids} onBack={() => setSelectedStudent(null)} />;
  }

  /* ─── SESSION DETAIL ─── */
  if (selectedSession) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-lg mx-auto page-bg">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSession(null); setAttempts([]); }} className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground -ml-2 rounded-full">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex items-start justify-between gap-3 mb-5 animate-fade-up">
          <div>
            <h2 className="text-lg font-bold font-display tracking-wide">{selectedSession.session_code}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date(selectedSession.created_at).toLocaleDateString()} · {selectedSession.question_ids.length} Qs
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Button variant="outline" size="sm" onClick={regenerateQuiz} disabled={creating} className="gap-1.5 text-xs h-9 rounded-xl flex-1">
            {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5 text-xs h-9 rounded-xl flex-1">
            <Download className="w-3 h-3" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyLink(selectedSession.session_code)} className="gap-1.5 text-xs h-9 rounded-xl flex-1">
            <Copy className="w-3 h-3" /> Link
          </Button>
        </div>

        <div className="mb-5"><Leaderboard sessionId={selectedSession.id} /></div>

        {attempts.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="py-0"><EmptyState icon="students" title="No responses yet" description="Share the quiz link with students" /></CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs text-center">Score</TableHead>
                  <TableHead className="text-xs text-right w-14">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => {
                  const pct = Math.round((a.score / a.total_questions) * 100);
                  const passed = pct >= 60;
                  return (
                    <TableRow key={a.id} className="cursor-pointer active:bg-accent/50" onClick={() => setSelectedStudent(a)}>
                      <TableCell>
                        <p className="text-sm font-medium">{a.student_name}</p>
                        <p className="text-[10px] text-muted-foreground/60">{new Date(a.created_at).toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${passed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {a.score}/{a.total_questions} · {pct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Eye className="w-4 h-4 text-muted-foreground" /></Button>
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

  /* ─── DASHBOARD ─── */
  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto page-bg">
      <div className="flex items-start justify-between gap-3 mb-6 animate-fade-up">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
          <h1 className="text-xl font-bold mt-1.5 font-display">Tutor Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Link to="/analytics">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 rounded-xl h-9">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Create Quiz */}
      <Card className="mb-5 rounded-2xl border-0 shadow-sm">
        <CardContent className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold font-display">Create Quiz</p>
            <div className="flex gap-1 bg-secondary rounded-xl p-0.5">
              <button
                className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all ${quizMode === "random" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setQuizMode("random")}
              >
                Random
              </button>
              <button
                className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${quizMode === "topic" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setQuizMode("topic")}
              >
                <Filter className="w-3 h-3" /> Topic
              </button>
            </div>
          </div>

          {quizMode === "topic" && (
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-full h-10 text-xs mb-3 rounded-xl">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topics.map((t) => (<SelectItem key={t.topic} value={t.topic}>{t.topic} ({t.count})</SelectItem>))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2">
            <Select value={quizSize} onValueChange={setQuizSize}>
              <SelectTrigger className="w-28 h-10 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 25, 30, 40, 50].map((n) => (<SelectItem key={n} value={String(n)}>{n} questions</SelectItem>))}
              </SelectContent>
            </Select>
            <Button onClick={generatePreview} disabled={creating} size="sm" className="gap-1.5 font-semibold flex-1 btn-primary h-10 text-xs">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              Preview & Create
            </Button>
            <Button onClick={createQuizDirect} disabled={creating} variant="outline" size="sm" className="gap-1 text-xs h-10 rounded-xl">
              <Plus className="w-3.5 h-3.5" /> Quick
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && previewQuestions.length > 0 && (
        <Card className="mb-5 rounded-2xl animate-scale-in shadow-sm border-0 ring-1 ring-primary/15">
          <CardContent className="py-5 px-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold font-display">Preview ({previewQuestions.length})</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs h-8 rounded-xl" onClick={() => setShowPreview(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-8 font-semibold btn-primary" onClick={publishQuiz} disabled={creating}>
                  {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Publish Quiz
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {previewQuestions.map((q, idx) => (
                <div key={q.id} className="flex items-start justify-between gap-2 rounded-xl bg-secondary/80 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate"><span className="text-muted-foreground/60 mr-1.5">{idx + 1}.</span>{q.question}</p>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5 uppercase tracking-wider">{q.topic}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 shrink-0 rounded-lg" onClick={() => swapQuestion(idx)}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex gap-2 mb-5">
        <Link to="/questions" className="flex-1">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full rounded-xl h-11">
            <BookOpen className="w-3.5 h-3.5" /> Question Bank
          </Button>
        </Link>
        <Link to="/import" className="flex-1">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full rounded-xl h-11">
            <Upload className="w-3.5 h-3.5" /> Import Questions
          </Button>
        </Link>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-0"><EmptyState icon="quiz" title="No quizzes yet" description="Create your first quiz to get started" actionLabel="Create Quiz" onAction={createQuizDirect} /></CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Recent Quizzes</p>
          {sessions.map((s, i) => (
            <Card
              key={s.id}
              className="card-interactive rounded-2xl animate-fade-up border-0 shadow-sm"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              onClick={() => setSelectedSession(s)}
            >
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div>
                  <p className="font-bold text-base tracking-wide font-display">{s.session_code}</p>
                  <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString()} · {s.question_ids.length} Qs
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyLink(s.session_code); }} className="gap-1.5 text-xs h-9 rounded-xl">
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => deleteSession(s.id, e)} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
