import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  topic: string;
}

interface Props {
  attempt: {
    student_name: string;
    score: number;
    total_questions: number;
    answers: Record<string, string>;
    created_at: string;
  };
  questionIds: string[];
  onBack: () => void;
}

const StudentDetail = ({ attempt, questionIds, onBack }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("quiz_questions")
        .select("*")
        .in("id", questionIds);
      if (data) setQuestions(data);
    };
    load();
  }, [questionIds]);

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const passed = percentage >= 60;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto page-bg">
      <div className="fixed top-4 right-4 z-20"><DarkModeToggle /></div>

      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground -ml-2 rounded-full">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <Card className="mb-6 text-center overflow-hidden rounded-3xl border-0 shadow-lg animate-scale-in">
        <div className={`h-1 w-full ${passed ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-gradient-to-r from-destructive to-red-400"}`} />
        <CardContent className="py-8">
          <h2 className="text-lg font-bold font-display mb-0.5">{attempt.student_name}</h2>
          <p className="text-muted-foreground text-xs mb-4">
            {new Date(attempt.created_at).toLocaleString()}
          </p>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${passed ? "bg-primary/10" : "bg-destructive/10"}`}>
            <span className={`text-2xl font-extrabold font-display ${passed ? "text-primary" : "text-destructive"}`}>
              {percentage}%
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold">
            {attempt.score}/{attempt.total_questions} correct
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const studentAnswer = attempt.answers[q.id];
          const isCorrect = studentAnswer === q.correct_answer;
          return (
            <Card key={q.id} className={`rounded-2xl border-0 shadow-sm animate-fade-up ${isCorrect ? "ring-1 ring-primary/15" : "ring-1 ring-destructive/15"}`} style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold mt-0.5 ${isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-relaxed">
                      <span className="text-muted-foreground mr-1">Q{idx + 1}.</span> {q.question}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-wider font-medium">{q.topic}</p>
                  </div>
                </div>
                <div className="grid gap-2 ml-10">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                    const isThisCorrect = q.correct_answer === key;
                    const isStudentPick = studentAnswer === key;
                    let cls = "border-border/50 text-muted-foreground";
                    if (isThisCorrect) cls = "border-primary/30 bg-primary/[0.06] text-primary font-semibold";
                    else if (isStudentPick) cls = "border-destructive/30 bg-destructive/[0.06] text-destructive";
                    return (
                      <div key={key} className={`rounded-xl border px-3.5 py-2 text-xs ${cls}`}>
                        <span className="font-bold mr-1.5 opacity-60">{key}.</span> {text}
                        {isThisCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1.5 -mt-0.5 opacity-70" />}
                        {isStudentPick && !isThisCorrect && <XCircle className="w-3 h-3 inline ml-1.5 -mt-0.5 opacity-70" />}
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

export default StudentDetail;
