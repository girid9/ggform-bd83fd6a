import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { shuffleArray } from "@/lib/shuffle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, XCircle, ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { FloatingInput } from "@/components/FloatingInput";
import { StepProgress } from "@/components/StepProgress";
import { SuccessScreen } from "@/components/SuccessScreen";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface Question {
  id: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

type Phase = "name" | "study" | "quiz" | "results";

interface ShuffledOption {
  label: string;
  originalKey: string;
  text: string;
}

const STEP_LABELS = ["Enter Name", "Study", "Quiz"];

const Quiz = () => {
  const { code } = useParams<{ code: string }>();
  const [phase, setPhase] = useState<Phase>("name");
  const [studentName, setStudentName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  const currentStep = phase === "name" ? 1 : phase === "study" ? 2 : 3;

  const shuffledQuestions = useMemo(() => {
    if (phase !== "quiz") return [];
    return shuffleArray(questions);
  }, [questions, phase]);

  const shuffledOptions = useMemo(() => {
    const map: Record<string, ShuffledOption[]> = {};
    const qs = phase === "quiz" ? shuffledQuestions : questions;
    qs.forEach((q) => {
      const opts: ShuffledOption[] = [
        { label: "", originalKey: "A", text: q.option_a },
        { label: "", originalKey: "B", text: q.option_b },
        { label: "", originalKey: "C", text: q.option_c },
        { label: "", originalKey: "D", text: q.option_d },
      ];
      const shuffled = phase === "quiz" ? shuffleArray(opts) : opts;
      shuffled.forEach((o, i) => {
        o.label = ["A", "B", "C", "D"][i];
      });
      map[q.id] = shuffled;
    });
    return map;
  }, [questions, shuffledQuestions, phase]);

  useEffect(() => {
    loadSession();
  }, [code]);

  const loadSession = async () => {
    if (!code) return;
    setLoading(true);
    const { data: session } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("session_code", code)
      .single();

    if (!session) {
      setError("Quiz not found. Please check the link.");
      setLoading(false);
      return;
    }
    setSessionId(session.id);
    const { data: qs } = await supabase
      .from("quiz_questions")
      .select("*")
      .in("id", session.question_ids);
    if (qs) setQuestions(qs);
    setLoading(false);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    const { data: existing } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("session_id", sessionId)
      .ilike("student_name", studentName.trim())
      .limit(1);
    if (existing && existing.length > 0) {
      toast.error("You have already taken this quiz!");
      return;
    }
    setPhase("study");
  };

  const selectAnswer = (questionId: string, originalKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: originalKey }));
  };

  const submitQuiz = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    setSubmitting(true);
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    const { error } = await supabase.from("quiz_attempts").insert({
      session_id: sessionId,
      student_name: studentName.trim(),
      answers: answers,
      score: correct,
      total_questions: questions.length,
    });
    if (error) {
      toast.error("Failed to submit. Please try again.");
      console.error(error);
    } else {
      setScore(correct);
      setPhase("results");
    }
    setSubmitting(false);
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading quiz…</p>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Card className="w-full max-w-sm text-center glass-card">
          <CardContent className="py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-4">
              <XCircle className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-base font-semibold mb-1">Quiz Not Found</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- NAME ENTRY ---
  if (phase === "name") {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-background">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
        <Card className="w-full max-w-sm glass-card animate-fade-up">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 mx-auto mb-3">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">ICTSM Quiz</CardTitle>
            <CardDescription className="text-sm">Enter your name to begin</CardDescription>
          </CardHeader>
          <CardContent>
            <StepProgress currentStep={1} totalSteps={3} labels={STEP_LABELS} />
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <FloatingInput
                label="Your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full h-11 font-semibold">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- STUDY MODE ---
  if (phase === "study") {
    return (
      <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
        <div className="absolute top-4 right-4 fixed z-20">
          <DarkModeToggle />
        </div>
        {/* Header */}
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" /> Study Mode
          </span>
          <h1 className="text-xl font-bold">Review & Learn</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Read through all {questions.length} questions with correct answers shown
          </p>
        </div>

        <StepProgress currentStep={2} totalSteps={3} labels={STEP_LABELS} />

        <div className="space-y-3 mb-24">
          {questions.map((q, idx) => (
            <Card key={q.id} className="glass-card">
              <CardContent className="pt-4 pb-3.5">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium leading-snug">{q.question}</p>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mb-2.5 ml-[34px] uppercase tracking-wide">{q.topic}</p>
                <div className="grid gap-1.5 ml-[34px]">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                    const isCorrect = q.correct_answer === key;
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                          isCorrect
                            ? "border-success/40 bg-success/8 text-success font-semibold"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        <span className="font-semibold mr-1.5">{key}.</span>
                        {text}
                        {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1.5 -mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-xl mx-auto">
            <Button
              size="lg"
              className="w-full h-12 gap-2 font-semibold shadow-lg shadow-primary/15"
              onClick={() => setPhase("quiz")}
            >
              I'm Ready — Start Quiz <ArrowRight className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUIZ MODE ---
  if (phase === "quiz") {
    const answeredCount = Object.keys(answers).length;
    const progressPct = (answeredCount / questions.length) * 100;

    return (
      <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
        <div className="absolute top-4 right-4 fixed z-20">
          <DarkModeToggle />
        </div>
        {/* Sticky header with progress */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md pb-4 -mx-4 px-4 pt-2">
          <StepProgress currentStep={3} totalSteps={3} labels={STEP_LABELS} />
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">Quiz</h1>
            <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <div className="space-y-3 mb-24">
          {shuffledQuestions.map((q, idx) => {
            const opts = shuffledOptions[q.id] || [];
            const isAnswered = !!answers[q.id];
            return (
              <Card key={q.id} className={`transition-all ${isAnswered ? "border-primary/25 glass-card" : "glass-card"}`}>
                <CardContent className="pt-4 pb-3.5">
                  <div className="flex items-start gap-2.5 mb-3">
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${isAnswered ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium leading-snug">{q.question}</p>
                  </div>
                  <div className="grid gap-1.5 ml-[34px]">
                    {opts.map((opt) => {
                      const selected = answers[q.id] === opt.originalKey;
                      return (
                        <button
                          key={opt.originalKey}
                          onClick={() => selectAnswer(q.id, opt.originalKey)}
                          className={`rounded-lg border px-3 py-2.5 text-xs text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/10 font-semibold text-primary"
                              : "border-border/60 text-foreground hover:border-primary/30 hover:bg-primary/5"
                          }`}
                        >
                          <span className="font-semibold mr-1.5">{opt.label}.</span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-xl mx-auto">
            <Button
              size="lg"
              className="w-full h-12 font-semibold shadow-lg shadow-primary/15"
              onClick={submitQuiz}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  const percentage = Math.round((score / questions.length) * 100);
  const passed = percentage >= 60;

  return (
    <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
      <div className="fixed top-4 right-4 z-20">
        <DarkModeToggle />
      </div>
      
      {/* Success header card */}
      <Card className="mb-6 text-center glass-card overflow-hidden animate-scale-in">
        <div className={`h-1.5 w-full ${passed ? "bg-success" : "bg-destructive"}`} />
        <CardContent className="py-8">
          {/* Animated checkmark or X */}
          <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 64 64" fill="none">
            <circle
              cx="32" cy="32" r="28"
              stroke={passed ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ strokeDasharray: 176, strokeDashoffset: 0, animation: "draw-circle 0.6s ease-out" }}
            />
            {passed ? (
              <path d="M20 34 L28 42 L44 24" stroke="hsl(var(--success))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: "draw-check 0.4s ease-out 0.4s both" }} />
            ) : (
              <>
                <path d="M22 22 L42 42" stroke="hsl(var(--destructive))" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: 28, strokeDashoffset: 0, animation: "draw-check 0.3s ease-out 0.4s both" }} />
                <path d="M42 22 L22 42" stroke="hsl(var(--destructive))" strokeWidth="3" strokeLinecap="round" style={{ strokeDasharray: 28, strokeDashoffset: 0, animation: "draw-check 0.3s ease-out 0.5s both" }} />
              </>
            )}
          </svg>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? "bg-success/10" : "bg-destructive/10"}`}>
            <span className={`text-3xl font-extrabold ${passed ? "text-success" : "text-destructive"}`}>{percentage}%</span>
          </div>
          <h1 className="text-xl font-bold mb-1">
            {passed ? "Well Done! 🎉" : "Keep Studying! 📚"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {studentName} — <span className="font-semibold">{score}/{questions.length}</span> correct
          </p>
        </CardContent>
      </Card>

      <h2 className="text-base font-bold mb-3">Answer Review</h2>
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const studentAnswer = answers[q.id];
          const isCorrect = studentAnswer === q.correct_answer;
          return (
            <Card key={q.id} className={`glass-card ${isCorrect ? "border-success/25" : "border-destructive/25"}`}>
              <CardContent className="pt-4 pb-3.5">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-sm font-medium leading-snug">
                    <span className="text-muted-foreground mr-1">Q{idx + 1}.</span>
                    {q.question}
                  </p>
                </div>
                <div className="grid gap-1.5 ml-[34px]">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                    const isThisCorrect = q.correct_answer === key;
                    const isStudentPick = studentAnswer === key;
                    let cls = "border-border/60 text-muted-foreground";
                    if (isThisCorrect) cls = "border-success/40 bg-success/8 text-success font-semibold";
                    else if (isStudentPick) cls = "border-destructive/40 bg-destructive/8 text-destructive";
                    return (
                      <div key={key} className={`rounded-lg border px-3 py-1.5 text-xs ${cls}`}>
                        <span className="font-semibold mr-1">{key}.</span> {text}
                        {isThisCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1 -mt-0.5" />}
                        {isStudentPick && !isThisCorrect && <XCircle className="w-3 h-3 inline ml-1 -mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Quiz;
