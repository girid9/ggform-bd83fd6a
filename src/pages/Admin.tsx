import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateSessionCode } from "@/lib/shuffle";
import { toast } from "sonner";
import { Plus, Copy, Eye, ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import StudentDetail from "@/components/StudentDetail";

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
      // Fetch all question IDs
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("id");

      if (!questions || questions.length < 20) {
        toast.error("Not enough questions in the database");
        return;
      }

      // Randomly pick 20
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 20).map((q) => q.id);

      const code = generateSessionCode();
      const { error } = await supabase.from("quiz_sessions").insert({
        session_code: code,
        question_ids: selected,
      });

      if (error) {
        toast.error("Failed to create quiz");
        console.error(error);
      } else {
        toast.success("Quiz created!");
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
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mx-auto mb-2">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <CardTitle>Tutor Access</CardTitle>
            <CardDescription>Enter the passcode to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasscode} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Unlock
              </Button>
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
      <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedSession(null)} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to quizzes
        </Button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Quiz: {selectedSession.session_code}</h2>
            <p className="text-sm text-muted-foreground">
              Created {new Date(selectedSession.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => copyLink(selectedSession.session_code)} className="gap-1">
            <Copy className="w-3 h-3" /> Copy Link
          </Button>
        </div>

        {attempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No students have taken this quiz yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.student_name}</TableCell>
                    <TableCell className="text-center">
                      {a.score}/{a.total_questions}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          (a.score / a.total_questions) * 100 >= 60
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {Math.round((a.score / a.total_questions) * 100)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(a)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold mt-1">Tutor Dashboard</h1>
        </div>
        <Button onClick={createQuiz} disabled={creating} className="gap-2">
          <Plus className="w-4 h-4" /> New Quiz
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quizzes created yet. Click "New Quiz" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setSelectedSession(s)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-lg">{s.session_code}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()} · {s.question_ids.length} questions
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLink(s.session_code);
                    }}
                    className="gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
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
