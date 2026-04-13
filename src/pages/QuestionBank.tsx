import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface Question { id: string; topic: string; question: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_answer: string; }

const QuestionBank = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase.from("quiz_questions").select("*").order("topic");
      if (data) setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const topics = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q) => map.set(q.topic, (map.get(q.topic) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchesTopic = topicFilter === "all" || q.topic === topicFilter;
      const matchesSearch = !search || q.question.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [questions, topicFilter, search]);

  const groupedByTopic = useMemo(() => {
    const map = new Map<string, Question[]>();
    filtered.forEach((q) => { if (!map.has(q.topic)) map.set(q.topic, []); map.get(q.topic)!.push(q); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => { const next = new Set(prev); if (next.has(topic)) next.delete(topic); else next.add(topic); return next; });
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto page-bg">
      <div className="fixed top-5 right-5 z-20"><DarkModeToggle /></div>

      <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold font-display">Question Bank</h1>
        </div>
        <p className="text-xs text-muted-foreground ml-[52px]">{questions.length} questions across {topics.length} topics</p>
      </div>

      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 text-sm rounded-xl" />
        </div>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-40 h-10 text-xs rounded-xl"><SelectValue placeholder="All topics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics ({questions.length})</SelectItem>
            {topics.map(([topic, count]) => (<SelectItem key={topic} value={topic}>{topic} ({count})</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-muted-foreground">Loading questions…</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium font-display">No questions found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedByTopic.map(([topic, qs], i) => {
            const isExpanded = expandedTopics.has(topic);
            return (
              <Card key={topic} className="overflow-hidden rounded-2xl animate-fade-up border-0 shadow-sm" style={{ animationDelay: `${Math.min(i * 40, 400)}ms`, animationFillMode: "both" }}>
                <button
                  onClick={() => toggleTopic(topic)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold font-display">{topic}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{qs.length} question{qs.length !== 1 ? "s" : ""}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border/40 divide-y divide-border/30">
                    {qs.map((q, idx) => (
                      <div key={q.id} className="px-5 py-4">
                        <p className="text-xs font-medium mb-2.5">
                          <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>{q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(["A", "B", "C", "D"] as const).map((key) => {
                            const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                            const isCorrect = q.correct_answer === key;
                            return (
                              <div key={key} className={`rounded-xl px-3 py-2 text-[11px] ${isCorrect ? "bg-primary/5 text-primary font-medium border border-primary/20" : "bg-secondary text-muted-foreground"}`}>
                                <span className="font-semibold mr-1.5">{key}.</span>{text}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground/50 mt-6">Showing {filtered.length} of {questions.length} questions</p>
    </div>
  );
};

export default QuestionBank;
