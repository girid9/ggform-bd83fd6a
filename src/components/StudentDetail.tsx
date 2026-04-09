import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

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
      const { data } = await supabase.from("quiz_questions").select("*").in("id", questionIds);
      if (data) setQuestions(data);
    };
    load();
  }, [questionIds]);

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const scoreColor = percentage >= 70 ? "text-success" : percentage >= 50 ? "text-warning" : "text-destructive";
  const scoreBg = percentage >= 70 ? "bg-success/10" : percentage >= 50 ? "bg-warning/10" : "bg-destructive/10";
  const strokeColor = percentage >= 70 ? "hsl(var(--success))" : percentage >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-foreground-muted hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <Card className="mb-6 text-center surface-card overflow-hidden animate-scale-in">
        <div className={`h-1.5 w-full ${percentage >= 60 ? "bg-success" : "bg-destructive"}`} />
        <CardContent className="py-6">
          <h2 className="text-lg font-display font-bold mb-0.5">{attempt.student_name}</h2>
          <p className="text-foreground-muted text-xs mb-4">{new Date(attempt.created_at).toLocaleString()}</p>

          <svg className="w-20 h-20 mx-auto mb-3" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle cx="40" cy="40" r="36" stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
              style={{ strokeDasharray: 226, strokeDashoffset: 226 - (226 * percentage / 100) }}
              transform="rotate(-90 40 40)" />
            <text x="40" y="38" textAnchor="middle" dominantBaseline="central" className="text-lg font-display font-bold" fill={strokeColor}>{percentage}%</text>
            <text x="40" y="52" textAnchor="middle" className="text-2xs" fill="hsl(var(--foreground-muted))">score</text>
          </svg>

          <p className="text-sm font-semibold">{attempt.score}/{attempt.total_questions} correct</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const studentAnswer = attempt.answers[q.id];
          const isCorrect = studentAnswer === q.correct_answer;
          return (
            <Card key={q.id} className={`surface-card ${isCorrect ? "border-success/25" : "border-destructive/25"}`}>
              <CardContent className="pt-4 pb-3.5">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug"><span className="text-foreground-muted mr-1">Q{idx + 1}.</span> {q.question}</p>
                    <p className="text-2xs text-foreground-subtle mt-0.5 uppercase tracking-wide">{q.topic}</p>
                  </div>
                </div>
                <div className="grid gap-1.5 ml-[34px]">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                    const isThisCorrect = q.correct_answer === key;
                    const isStudentPick = studentAnswer === key;
                    let cls = "border-border/60 text-foreground-muted";
                    if (isThisCorrect) cls = "border-success/40 bg-success/8 text-success font-semibold";
                    else if (isStudentPick) cls = "border-destructive/40 bg-destructive/8 text-destructive";
                    return (
                      <div key={key} className={`rounded-xl border px-3 py-1.5 text-xs ${cls}`}>
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

export default StudentDetail;
