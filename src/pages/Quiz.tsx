import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { shuffleArray } from "@/lib/shuffle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2, Lightbulb } from "lucide-react";
import { FloatingInput } from "@/components/FloatingInput";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import Leaderboard from "@/components/Leaderboard";
import confetti from "canvas-confetti";

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

const Quiz = () => {
  const { code } = useParams<{ code: string }>();
  const [phase, setPhase] = useState<Phase>("name");
  const [studentName, setStudentName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [studyAnswers, setStudyAnswers] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);

  const [currentStudyIndex, setCurrentStudyIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  const [showTestConfirmation, setShowTestConfirmation] = useState(false);
  const [showStudyReview, setShowStudyReview] = useState(false);

  const shuffledQuestions = useMemo(() => {
    if (phase !== "quiz") return [];
    return [...questions];
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
    if (qs) {
      const sorted = [...qs].sort((a, b) => a.topic.localeCompare(b.topic));
      setQuestions(sorted);
    }
    setLoading(false);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setPhase("study");
  };

  const selectStudyAnswer = (questionId: string, originalKey: string) => {
    if (studyAnswers[questionId]) return;
    setStudyAnswers((prev) => ({ ...prev, [questionId]: originalKey }));
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
      const percentage = (correct / questions.length) * 100;
      if (percentage >= 60) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#000000", "#ffffff", "#888888"]
        });
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center page-bg">
        <div className="flex flex-col items-center gap-6 animate-slide-up-subtle">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-bold uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 page-bg">
        <div className="w-full max-w-sm text-center p-8 border hover:bg-muted transition-all">
          <XCircle className="w-10 h-10 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  /* ─── NAME PHASE ─── */
  if (phase === "name") {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 relative page-bg">
        <div className="absolute top-4 right-4 z-50"><DarkModeToggle /></div>
        
        <div className="w-full max-w-sm animate-slide-up-subtle space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-extrabold font-display uppercase tracking-wider border-b-4 border-foreground pb-2 inline-block">Start</h1>
          </div>

          <div className="p-6 sm:p-8 border-4 border-foreground bg-card shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)]">
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <FloatingInput 
                label="Full Name" 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} 
                autoFocus 
                className="bg-transparent border-b-2 border-foreground focus:border-foreground transition-all px-0 rounded-none text-lg h-14"
              />
              <Button type="submit" className="w-full h-14 btn-primary text-base">
                ENTER
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ─── STUDY PHASE ─── */
  if (phase === "study") {
    if (showTestConfirmation) {
      return (
        <div className="flex min-h-screen items-center justify-center px-5 relative page-bg">
          <div className="absolute top-4 right-4 z-50"><DarkModeToggle /></div>
          
          <div className="w-full max-w-md animate-slide-up-subtle text-center space-y-6">
             <h1 className="text-3xl sm:text-4xl font-extrabold font-display uppercase border-b-4 border-foreground pb-4 border-dashed">Are you sure bro?</h1>
             <p className="text-base sm:text-lg font-bold border-2 p-4 bg-card text-foreground">You are about to start the test. Your performance will be recorded.</p>
             <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 h-14 btn-secondary text-base border-2" onClick={() => setShowTestConfirmation(false)}>Wait, go back</Button>
                <Button className="flex-1 h-14 btn-primary text-base" onClick={() => { setShowTestConfirmation(false); setPhase("quiz"); }}>Yes, begin test</Button>
             </div>
          </div>
        </div>
      );
    }

    if (showStudyReview) {
      const wrongQuestions = questions.filter(q => studyAnswers[q.id] && studyAnswers[q.id] !== q.correct_answer);
      const correctCount = questions.filter(q => studyAnswers[q.id] === q.correct_answer).length;

      return (
        <div className="flex flex-col min-h-screen px-4 sm:px-6 py-8 pb-32 max-w-2xl mx-auto page-bg">
          <div className="fixed top-4 right-4 z-50"><DarkModeToggle /></div>

          <div className="animate-slide-up-subtle space-y-6">
            <div className="border-b-2 border-border pb-4">
              <span className="chip-primary mb-3 inline-flex">
                <BookOpen className="w-4 h-4" /> REVIEW
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display uppercase">Your Results</h1>
              <p className="text-sm font-bold text-primary mt-2 uppercase tracking-wider">
                {correctCount} / {questions.length} correct during practice
              </p>
            </div>

            {wrongQuestions.length === 0 ? (
              <div className="p-6 border-2 border-foreground text-center bg-card">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-xl font-black font-display uppercase">Perfect!</p>
                <p className="text-sm text-muted-foreground mt-2">You got everything right in practice.</p>
              </div>
            ) : (
              <>
                <h3 className="text-base font-black font-display uppercase border-b-2 border-foreground pb-2">
                  What You Got Wrong ({wrongQuestions.length})
                </h3>
                <div className="space-y-4">
                  {wrongQuestions.map((q, idx) => {
                    const studentAnswer = studyAnswers[q.id];
                    return (
                      <div key={q.id} className="border-2 border-foreground p-4 sm:p-6 rounded-lg bg-card">
                        <p className="text-sm sm:text-base font-bold leading-tight mb-1">
                          <span className="mr-2 font-mono">{idx + 1}.</span>{q.question}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">{q.topic}</p>
                        <div className="grid gap-2">
                          {(["A", "B", "C", "D"] as const).map((key) => {
                            const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                            const isCorrect = q.correct_answer === key;
                            const isStudentPick = studentAnswer === key;
                            let cls = "border-border/50 text-muted-foreground opacity-40";
                            if (isCorrect) cls = "border-foreground bg-foreground text-background font-bold";
                            else if (isStudentPick) cls = "border-foreground border-dashed text-foreground";
                            return (
                              <div key={key} className={`rounded-lg p-3 text-sm border-2 ${cls}`}>
                                <span className="mr-2 font-mono font-bold">{key}.</span>{text}
                                {isCorrect && <CheckCircle2 className="w-4 h-4 inline ml-2 -mt-0.5" />}
                                {isStudentPick && !isCorrect && <XCircle className="w-4 h-4 inline ml-2 -mt-0.5 opacity-70" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Fixed bottom buttons */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <div className="flex gap-3 max-w-2xl mx-auto">
              <Button
                size="lg"
                className="flex-1 h-14 btn-secondary text-sm border-2"
                onClick={() => {
                  setShowStudyReview(false);
                  setStudyAnswers({});
                  setCurrentStudyIndex(0);
                }}
              >
                PRACTICE AGAIN
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14 btn-primary text-sm"
                onClick={() => {
                  setShowStudyReview(false);
                  setShowTestConfirmation(true);
                }}
              >
                GO TO TEST
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const q = questions[currentStudyIndex];
    if (!q) return null;
    const opts = shuffledOptions[q.id] || [];
    const hasGuessed = !!studyAnswers[q.id];

    return (
      <div className="flex flex-col min-h-screen px-4 sm:px-6 py-8 pb-28 max-w-2xl mx-auto page-bg">
        <div className="fixed top-4 right-4 z-50"><DarkModeToggle /></div>

        <div className="text-left mb-6 animate-slide-up-subtle border-b-2 border-border pb-3">
          <span className="chip-primary mb-3 inline-flex">
            <BookOpen className="w-4 h-4" /> MEMORIZE
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display">Guess the Answer</h1>
          <p className="text-xs sm:text-sm font-bold text-primary mt-1 uppercase tracking-wider">{q.topic}</p>
        </div>

        <div className="flex-1">
          <div key={q.id} className="animate-slide-up-subtle bg-card rounded-lg border-2 border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="question-counter flex-shrink-0">
                {currentStudyIndex + 1} / {questions.length}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold leading-relaxed mb-1">{q.question}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{q.topic}</p>
              </div>
            </div>
            <div className="grid gap-2.5">
              {opts.map((opt) => {
                const isCorrect = q.correct_answer === opt.originalKey;
                const isGuessed = studyAnswers[q.id] === opt.originalKey;
                
                let cls = "border-border hover:border-foreground hover:bg-muted";
                if (hasGuessed) {
                  if (isCorrect) {
                     cls = "border-foreground bg-foreground text-background font-bold shadow-md";
                  } else if (isGuessed) {
                     cls = "border-foreground border-dashed text-foreground opacity-60";
                  } else {
                     cls = "border-border/50 text-muted-foreground opacity-30";
                  }
                }

                return (
                  <button
                    key={opt.originalKey}
                    onClick={() => selectStudyAnswer(q.id, opt.originalKey)}
                    disabled={hasGuessed}
                    className={`group relative flex items-center gap-3 w-full text-left rounded-lg p-4 border-2 transition-all duration-200 min-h-[48px] ${cls}`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-mono font-bold text-sm transition-all border-2
                      ${hasGuessed && isCorrect ? "bg-background text-foreground border-transparent" : "bg-muted text-muted-foreground border-border"}
                    `}>
                      {opt.label}
                    </div>
                    <span className="text-sm font-medium transition-colors flex-1">
                      {opt.text}
                    </span>
                    {hasGuessed && isCorrect && <CheckCircle2 className="w-5 h-5 ml-auto text-background shrink-0" />}
                    {hasGuessed && isGuessed && !isCorrect && <XCircle className="w-5 h-5 ml-auto text-foreground opacity-60 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="flex gap-3 max-w-2xl mx-auto">
            <Button
              size="lg"
              className="flex-1 h-14 btn-secondary text-sm border-2 border-border"
              onClick={() => setCurrentStudyIndex(p => Math.max(0, p - 1))}
              disabled={currentStudyIndex === 0}
            >
              PREV
            </Button>

            {currentStudyIndex < questions.length - 1 ? (
               <Button
                  size="lg"
                  className="flex-1 h-14 btn-primary text-sm"
                  onClick={() => setCurrentStudyIndex(p => Math.min(questions.length - 1, p + 1))}
                  disabled={!hasGuessed}
               >
                  NEXT
               </Button>
            ) : (
               <Button
                 size="lg"
                 className="flex-1 h-14 btn-primary text-sm"
                 onClick={() => setShowStudyReview(true)}
                 disabled={!hasGuessed}
               >
                 REVIEW
               </Button>
             )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── QUIZ PHASE ─── */
  if (phase === "quiz") {
    const q = shuffledQuestions[currentQuizIndex];
    if (!q) return null;
    const opts = shuffledOptions[q.id] || [];
    const isAnswered = !!answers[q.id];

    return (
      <div className="flex flex-col min-h-screen px-4 sm:px-6 py-6 pb-36 max-w-2xl mx-auto page-bg">
        <div className="fixed top-4 right-4 z-50"><DarkModeToggle /></div>

        <header className="mb-6 border-b-2 border-border pb-3">
          <div className="flex items-center justify-between">
             <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight uppercase">Quiz</h1>
                <p className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">{q.topic}</p>
             </div>
             <div className="question-counter">
                {currentQuizIndex + 1} / {questions.length}
             </div>
          </div>
        </header>

        <div className="flex-1">
          <div key={q.id} className="animate-slide-up-subtle bg-card rounded-lg border-2 border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
              <p className="text-base sm:text-lg font-bold leading-snug flex-1">{q.question}</p>
            </div>
            <div className="grid gap-3">
              {opts.map((opt) => {
                const selected = answers[q.id] === opt.originalKey;
                return (
                  <button
                    key={opt.originalKey}
                    onClick={() => selectAnswer(q.id, opt.originalKey)}
                    className={`group relative flex items-center gap-3 w-full text-left rounded-lg p-4 border-2 transition-all duration-200 min-h-[48px] ${
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground hover:bg-muted"
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-mono font-bold text-sm transition-all border-2 ${
                      selected ? "bg-background text-foreground border-transparent" : "bg-muted text-muted-foreground border-border group-hover:border-foreground"
                    }`}>
                      {opt.label}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${selected ? "font-bold" : ""}`}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 btn-secondary text-sm border-2"
                onClick={() => setCurrentQuizIndex(p => Math.max(0, p - 1))}
                disabled={currentQuizIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> PREV
              </Button>
              {currentQuizIndex < questions.length - 1 && (
                <Button
                  size="lg"
                  className="flex-1 h-12 btn-secondary text-sm border-2"
                  onClick={() => setCurrentQuizIndex(p => Math.min(questions.length - 1, p + 1))}
                >
                  NEXT <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            <Button
              size="lg"
              className="w-full h-14 btn-primary text-sm"
              onClick={submitQuiz}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-3" /> ...</>
              ) : (
                <>SUBMIT ({Object.keys(answers).length}/{questions.length})</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── RESULTS ─── */
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 pb-24 max-w-2xl mx-auto page-bg">
      <div className="fixed top-4 right-4 z-50"><DarkModeToggle /></div>

      <div className="space-y-6 animate-slide-up-subtle">
        <header className="border-b-4 border-foreground pb-4">
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight uppercase">Outcome</h1>
            <p className="text-sm font-mono tracking-widest uppercase mt-2">ID: {studentName}</p>
        </header>

        <div className="p-6 sm:p-8 border-4 border-foreground text-center">
            <div className="text-6xl sm:text-8xl font-black font-mono mb-4">{percentage}%</div>
            <div className="text-lg sm:text-xl font-bold uppercase mb-4">{score} / {questions.length} CORRECT</div>
        </div>

        <div>
          <Leaderboard sessionId={sessionId} />
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-black font-display mb-5 border-b-2 border-foreground pb-2 uppercase">Analysis</h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const studentAnswer = answers[q.id];
              const isCorrect = studentAnswer === q.correct_answer;
              return (
                <div
                  key={q.id}
                  className={`border-2 p-4 sm:p-6 rounded-lg ${isCorrect ? "border-muted-foreground" : "border-foreground"}`}
                >
                  <div className="flex flex-col gap-2 mb-3">
                    <p className="text-sm sm:text-base font-bold leading-tight"><span className="mr-2 font-mono">{idx + 1}.</span> {q.question}</p>
                    <div className="font-mono text-xs uppercase font-bold text-muted-foreground">
                        [{isCorrect ? "PASS" : "FAIL"}]
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                      const isThisCorrect = q.correct_answer === key;
                      const isStudentPick = studentAnswer === key;
                      
                      let cls = "border-border text-muted-foreground";
                      if (isThisCorrect) cls = "border-foreground bg-foreground text-background font-bold";
                      else if (isStudentPick && !isThisCorrect) cls = "border-foreground text-foreground border-dashed";
                      
                      return (
                        <div key={key} className={`rounded p-3 text-sm transition-all border-2 ${cls}`}>
                          <span className="mr-2 font-mono font-bold">{key}</span> {text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
           <Button className="w-full h-14 btn-primary text-sm" onClick={() => window.location.reload()}>
              RESTART
           </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
