import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSessionCode } from "@/lib/shuffle";
import { toast } from "sonner";
import { Plus, Copy, Eye, ArrowLeft, Lock, Loader2, Users, Calendar, BarChart3, Download, Trophy, RefreshCw, Filter, Leaf } from "lucide-react";
import StudentDetail from "@/components/StudentDetail";
import Leaderboard from "@/components/Leaderboard";
import { FloatingInput } from "@/components/FloatingInput";
import { EmptyState } from "@/components/EmptyState";

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
    if (authenticated) { fetchSessions(); fetchTopics(); }
  }, [authenticated]);

  useEffect(() => {
    if (selectedSession) fetchAttempts(selectedSession.id);
  }, [selectedSession]);

  const fetchSessions = async () => {
    const { data } = await supabase.from("quiz_sessions").select("*").order("created_at", { ascending: false });
    if (data) setSessions(data);
  };

  const fetchTopics = async () => {
    const { data } = await supabase.from("quiz_questions").select("topic");
    if (data) {
      const map = new Map<string, number>();
      data.forEach((q) => map.set(q.topic, (map.get(q.topic) || 0) + 1));
      setTopics(Array.from(map.entries()).map(([topic, count]) => ({ topic, count })).sort((a, b) => a.topic.localeCompare(b.topic)));
    }
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
    if (!questions || questions.length < size) { toast.error(`Not enough questions (need ${size}, have ${questions?.length || 0})`); return; }
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
      if (error) { toast.error("Failed to create quiz"); } else {
        toast.success(`Quiz created with ${previewQuestions.length} questions!`);
        setShowPreview(false); setPreviewQuestions([]); fetchSessions();
      }
    } finally { setCreating(false); }
  };

  const createQuizDirect = async () => {
    setCreating(true);
    try {
      const size = parseInt(quizSize);
      const { data: questions } = await supabase.from("quiz_questions").select("id");
      if (!questions || questions.length < size) { toast.error(`Not enough questions`); return; }
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const code = generateSessionCode();
      const { error } = await supabase.from("quiz_sessions").insert({ session_code: code, question_ids: shuffled.slice(0, size).map((q) => q.id) });
      if (error) { toast.error("Failed to create quiz"); } else { toast.success(`Quiz created!`); fetchSessions(); }
    } finally { setCreating(false); }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/quiz/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
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
      if (error) { toast.error("Failed to regenerate quiz"); } else {
        setSelectedSession({ ...selectedSession, question_ids: newIds });
        toast.success("Quiz regenerated with new questions!");
        fetchSessions();
      }
    } finally { setCreating(false); }
  };

  const handlePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) setAuthenticated(true);
    else toast.error("Incorrect passcode");
  };

  // --- AUTH GATE ---
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm surface-card animate-fade-up">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg mx-auto mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl font-display">Tutor Access</CardTitle>
            <CardDescription>Enter the passcode to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasscode} className="space-y-4">
              <FloatingInput type="password" label="Enter passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
              <Button type="submit" className="w-full h-11 font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- STUDENT DETAIL ---
  if (selectedStudent && selectedSession) {
    return <StudentDetail attempt={selectedStudent} questionIds={selectedSession.question_ids} onBack={() => setSelectedStudent(null)} />;
  }

  // --- SESSION DETAIL ---
  if (selectedSession) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSession(null); setAttempts([]); }} className="mb-4 gap-1.5 text-foreground-muted hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-display font-bold">{selectedSession.session_code}</h2>
            <p className="text-xs text-foreground-muted flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(selectedSession.created_at).toLocaleDateString()} · {selectedSession.question_ids.length} Qs
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={regenerateQuiz} disabled={creating} className="gap-1.5 text-xs h-8 rounded-xl">
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5 text-xs h-8 rounded-xl">
              <Download className="w-3 h-3" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyLink(selectedSession.session_code)} className="gap-1.5 text-xs h-8 rounded-xl">
              <Copy className="w-3 h-3" /> Link
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <Leaderboard sessionId={selectedSession.id} />
        </div>

        {attempts.length === 0 ? (
          <Card className="surface-card">
            <CardContent className="py-0">
              <EmptyState icon="students" title="No responses yet" description="Share the quiz link with students to see their results here" />
            </CardContent>
          </Card>
        ) : (
          <Card className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-surface-raised">
                  <TableHead className="text-2xs uppercase tracking-wide font-semibold text-foreground-muted">Student</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wide font-semibold text-foreground-muted text-center">Score</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wide font-semibold text-foreground-muted text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a, i) => {
                  const pct = Math.round((a.score / a.total_questions) * 100);
                  const scoreColor = pct >= 70 ? "bg-success/10 text-success" : pct >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
                  return (
                    <TableRow key={a.id} className={`cursor-pointer hover:bg-surface-raised transition-colors ${i % 2 === 1 ? "bg-surface-overlay/30" : ""}`} onClick={() => setSelectedStudent(a)}>
                      <TableCell>
                        <p className="text-sm font-medium">{a.student_name}</p>
                        <p className="text-2xs text-foreground-subtle">{new Date(a.created_at).toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreColor}`}>
                          {a.score}/{a.total_questions} · {pct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4 text-foreground-muted" /></Button>
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

  // --- DASHBOARD ---
  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-2xl">Good morning, Tutor 👋</h2>
        <p className="text-sm text-foreground-muted mt-1">Here's your quiz dashboard</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Quizzes", value: sessions.length, icon: BarChart3, color: "bg-primary/10 text-primary" },
          { label: "Question Bank", value: `${topics.reduce((s, t) => s + t.count, 0)}`, icon: Leaf, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <Card key={label} className="surface-card animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
            <CardContent className="py-4 px-4">
              <div className={`${color} rounded-xl p-2 w-fit mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-display font-bold">{value}</p>
              <p className="text-2xs text-foreground-muted uppercase tracking-wide">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Quiz */}
      <Card className="surface-card mb-5">
        <CardContent className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-display font-semibold">Create New Quiz</p>
            <div className="flex gap-1">
              <Button variant={quizMode === "random" ? "default" : "ghost"} size="sm" className="text-2xs h-7 px-2.5 rounded-lg" onClick={() => setQuizMode("random")}>Random</Button>
              <Button variant={quizMode === "topic" ? "default" : "ghost"} size="sm" className="text-2xs h-7 px-2.5 rounded-lg" onClick={() => setQuizMode("topic")}>
                <Filter className="w-3 h-3 mr-1" /> By Topic
              </Button>
            </div>
          </div>

          {quizMode === "topic" && (
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-full h-10 text-xs mb-3 rounded-xl">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.topic} value={t.topic}>{t.topic} ({t.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2">
            <Select value={quizSize} onValueChange={setQuizSize}>
              <SelectTrigger className="w-28 h-10 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 25, 30, 40, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generatePreview} disabled={creating} size="sm" className="gap-1.5 font-semibold flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600">
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
        <Card className="surface-card mb-5 border-primary/30 animate-scale-in">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-display font-semibold">Preview ({previewQuestions.length} questions)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs h-7 rounded-lg" onClick={() => setShowPreview(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-7 font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500" onClick={publishQuiz} disabled={creating}>
                  {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Publish Quiz
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {previewQuestions.map((q, idx) => (
                <div key={q.id} className="flex items-start justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate"><span className="text-foreground-muted mr-1">{idx + 1}.</span>{q.question}</p>
                    <p className="text-2xs text-foreground-subtle">{q.topic}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-2xs h-6 px-2 shrink-0" onClick={() => swapQuestion(idx)}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Sessions */}
      <h3 className="text-sm font-display font-semibold mb-3">Recent Quizzes</h3>
      {sessions.length === 0 ? (
        <Card className="surface-card">
          <CardContent className="py-0">
            <EmptyState icon="quiz" title="No quizzes yet" description="Create your first quiz to get started" actionLabel="Create Quiz" onAction={createQuizDirect} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((s, i) => (
            <Card
              key={s.id}
              className="surface-card cursor-pointer hover:border-primary/30 active:scale-[0.99] animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setSelectedSession(s)}
            >
              <CardContent className="flex items-center justify-between py-3.5 px-4">
                <div>
                  <p className="font-display font-bold text-base tracking-wide">{s.session_code}</p>
                  <p className="text-2xs text-foreground-muted flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString()} · {s.question_ids.length} Qs
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); copyLink(s.session_code); }}
                  className="gap-1.5 text-xs h-8 rounded-xl"
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
