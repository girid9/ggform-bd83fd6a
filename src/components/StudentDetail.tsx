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
    <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <Card className="mb-6 text-center glass-card overflow-hidden">
        <div className={`h-1.5 w-full ${passed ? "bg-success" : "bg-destructive"}`} />
        <CardContent className="py-6">
          <h2 className="text-lg font-bold mb-0.5">{attempt.student_name}</h2>
          <p className="text-muted-foreground text-xs mb-3">
            {new Date(attempt.created_at).toLocaleString()}
          </p>
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              passed ? "bg-success/10" : "bg-destructive/10"
            }`}
          >
            <span className={`text-2xl font-extrabold ${passed ? "text-success" : "text-destructive"}`}>
              {percentage}%
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold">
            {attempt.score}/{attempt.total_questions} correct
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const studentAnswer = attempt.answers[q.id];
          const isCorrect = studentAnswer === q.correct_answer;
          return (
            <Card key={q.id} className={`glass-card ${isCorrect ? "border-success/25" : "border-destructive/25"}`}>
              <CardContent className="pt-4 pb-3.5">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug">
                      <span className="text-muted-foreground mr-1">Q{idx + 1}.</span> {q.question}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 uppercase tracking-wide">{q.topic}</p>
                  </div>
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

export default StudentDetail;
