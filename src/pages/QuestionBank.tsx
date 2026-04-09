import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

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
    filtered.forEach((q) => {
      if (!map.has(q.topic)) map.set(q.topic, []);
      map.get(q.topic)!.push(q);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic); else next.add(topic);
      return next;
    });
  };

  return (
    <div>
      {/* Header stats */}
      <div className="mb-6">
        <p className="text-sm text-foreground-muted">{questions.length} questions across {topics.length} topics</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
          <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-44 h-10 text-xs">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics ({questions.length})</SelectItem>
            {topics.map(([topic, count]) => (
              <SelectItem key={topic} value={topic}>{topic} ({count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--surface-raised)) 50%, hsl(var(--muted)) 75%)', backgroundSize: '200% 100%' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="surface-card">
          <CardContent className="py-16 text-center">
            <svg className="w-16 h-16 text-foreground-subtle/30 mx-auto mb-4" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="10" y="6" width="44" height="52" rx="4" /><line x1="20" y1="18" x2="44" y2="18" /><line x1="20" y1="26" x2="38" y2="26" /><line x1="20" y1="34" x2="42" y2="34" /></svg>
            <p className="text-sm font-semibold mb-1">No questions found</p>
            <p className="text-xs text-foreground-muted">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groupedByTopic.map(([topic, qs]) => {
            const isExpanded = expandedTopics.has(topic);
            return (
              <Card key={topic} className="surface-card overflow-hidden">
                <button onClick={() => toggleTopic(topic)} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold font-display">{topic}</p>
                    <p className="text-2xs text-foreground-subtle">{qs.length} question{qs.length !== 1 ? "s" : ""}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground-subtle" /> : <ChevronDown className="w-4 h-4 text-foreground-subtle" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {qs.map((q, idx) => (
                      <div key={q.id} className="px-4 py-3">
                        <p className="text-xs font-medium mb-2"><span className="text-foreground-muted mr-1">{idx + 1}.</span>{q.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {(["A", "B", "C", "D"] as const).map((key) => {
                            const text = q[`option_${key.toLowerCase()}` as keyof Question] as string;
                            const isCorrect = q.correct_answer === key;
                            return (
                              <div key={key} className={`rounded-xl px-3 py-2 text-xs ${isCorrect ? "bg-success/10 text-success font-medium border border-success/20" : "bg-muted/50 text-foreground-muted"}`}>
                                <span className="font-semibold mr-1">{key}.</span>{text}
                                {isCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1 -mt-0.5" />}
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

      <p className="text-center text-2xs text-foreground-subtle mt-6">Showing {filtered.length} of {questions.length} questions</p>
    </div>
  );
};

export default QuestionBank;
