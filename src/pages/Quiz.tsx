import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { shuffleArray } from "@/lib/shuffle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

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
  label: string; // A, B, C, D (display label)
  originalKey: string; // A, B, C, D (original key)
  text: string;
}

const Quiz = () => {
  const { code } = useParams<{ code: string }>();
  const [phase, setPhase] = useState<Phase>("name");
  const [studentName, setStudentName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  // Shuffled versions for quiz mode
  const shuffledQuestions = useMemo(() => {
    if (phase !== "quiz") return [];
    return shuffleArray(questions);
  }, [questions, phase]);

  // For each question, shuffle options (memoized per quiz start)
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

    // Fetch the specific questions
    const { data: qs } = await supabase
      .from("quiz_questions")
      .select("*")
      .in("id", session.question_ids);

    if (qs) setQuestions(qs);
    setLoading(false);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error("Please enter your name");
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-12">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // NAME ENTRY
  if (phase === "name") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mx-auto mb-2">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <CardTitle>ICTSM Quiz</CardTitle>
            <CardDescription>Enter your name to start</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <Input
                placeholder="Your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STUDY MODE
  if (phase === "study") {
    return (
      <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">📖 Study Mode</h1>
          <p className="text-muted-foreground">
            Review these {questions.length} questions with correct answers highlighted. When you're ready, start the quiz.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="pt-5 pb-4">
                <p className="font-medium mb-3">
                  <span className="text-primary font-bold">Q{idx + 1}.</span>{" "}
                  {q.question}
                </p>
                <p className="text-xs text-muted-foreground mb-2">Topic: {q.topic}</p>
                <div className="grid gap-2">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                    const isCorrect = q.correct_answer === key;
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          isCorrect
                            ? "border-success bg-success/10 text-success font-semibold"
                            : "border-border"
                        }`}
                      >
                        <span className="font-semibold mr-2">({key})</span>
                        {text}
                        {isCorrect && " ✓"}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-4">
          <Button
            size="lg"
            className="w-full gap-2 shadow-lg"
            onClick={() => setPhase("quiz")}
          >
            I'm Ready — Start Quiz <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // QUIZ MODE
  if (phase === "quiz") {
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">📝 Quiz Time</h1>
          <p className="text-muted-foreground text-sm">
            {answeredCount}/{questions.length} answered
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {shuffledQuestions.map((q, idx) => {
            const opts = shuffledOptions[q.id] || [];
            return (
              <Card key={q.id} className={answers[q.id] ? "border-primary/30" : ""}>
                <CardContent className="pt-5 pb-4">
                  <p className="font-medium mb-3">
                    <span className="text-primary font-bold">Q{idx + 1}.</span>{" "}
                    {q.question}
                  </p>
                  <div className="grid gap-2">
                    {opts.map((opt) => {
                      const selected = answers[q.id] === opt.originalKey;
                      return (
                        <button
                          key={opt.originalKey}
                          onClick={() => selectAnswer(q.id, opt.originalKey)}
                          className={`rounded-lg border px-3 py-2.5 text-sm text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/10 font-semibold"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <span className="font-semibold mr-2">({opt.label})</span>
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

        <div className="sticky bottom-4">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={submitQuiz}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    );
  }

  // RESULTS
  const percentage = Math.round((score / questions.length) * 100);
  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <Card className="mb-6 text-center">
        <CardContent className="py-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              percentage >= 60 ? "bg-success/10" : "bg-destructive/10"
            }`}
          >
            <span className={`text-3xl font-bold ${percentage >= 60 ? "text-success" : "text-destructive"}`}>
              {percentage}%
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {percentage >= 60 ? "Well Done! 🎉" : "Keep Studying! 📚"}
          </h1>
          <p className="text-muted-foreground">
            {studentName} — You scored {score} out of {questions.length}
          </p>
        </CardContent>
      </Card>

      <h2 className="text-lg font-bold mb-4">Review Answers</h2>
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const studentAnswer = answers[q.id];
          const isCorrect = studentAnswer === q.correct_answer;
          return (
            <Card key={q.id} className={isCorrect ? "border-success/30" : "border-destructive/30"}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium">
                    <span className="text-primary font-bold">Q{idx + 1}.</span> {q.question}
                  </p>
                </div>
                <div className="grid gap-1.5 ml-7">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                    const isThisCorrect = q.correct_answer === key;
                    const isStudentPick = studentAnswer === key;
                    let cls = "border-border";
                    if (isThisCorrect) cls = "border-success bg-success/10 text-success font-semibold";
                    else if (isStudentPick) cls = "border-destructive bg-destructive/10 text-destructive";
                    return (
                      <div key={key} className={`rounded-lg border px-3 py-1.5 text-sm ${cls}`}>
                        <span className="font-semibold mr-1">({key})</span> {text}
                        {isThisCorrect && " ✓"}
                        {isStudentPick && !isThisCorrect && " ✗"}
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
