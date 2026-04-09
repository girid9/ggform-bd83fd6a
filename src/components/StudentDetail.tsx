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

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <Card className="mb-6 text-center">
        <CardContent className="py-6">
          <h2 className="text-xl font-bold mb-1">{attempt.student_name}</h2>
          <p className="text-muted-foreground text-sm mb-3">
            {new Date(attempt.created_at).toLocaleString()}
          </p>
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              percentage >= 60 ? "bg-success/10" : "bg-destructive/10"
            }`}
          >
            <span className={`text-2xl font-bold ${percentage >= 60 ? "text-success" : "text-destructive"}`}>
              {percentage}%
            </span>
          </div>
          <p className="mt-2 font-medium">
            {attempt.score}/{attempt.total_questions} correct
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const studentAnswer = attempt.answers[q.id];
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
                  <div>
                    <p className="font-medium">
                      <span className="text-primary font-bold">Q{idx + 1}.</span> {q.question}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{q.topic}</p>
                  </div>
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

export default StudentDetail;
