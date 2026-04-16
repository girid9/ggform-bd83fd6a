import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, BookOpen, Printer, CheckCircle2, Lightbulb, Zap, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import curriculumData from "@/data/curriculum.json";
import confetti from "canvas-confetti";
import TopicCard from "@/components/learn/TopicCard";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "learnhub-progress";

type Subject = (typeof curriculumData.subjects)[number];

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveProgress(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

const LearnHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(curriculumData.subjects[0].id);
  const [search, setSearch] = useState("");
  const [learned, setLearned] = useState<Set<string>>(loadProgress);
  const [openTopic, setOpenTopic] = useState<number | null>(null);

  const totalTopics = useMemo(
    () => curriculumData.subjects.reduce((sum, s) => sum + s.topics.length, 0),
    []
  );

  useEffect(() => {
    saveProgress(learned);
    if (learned.size === totalTopics && totalTopics > 0) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }
  }, [learned, totalTopics]);

  const toggleLearned = useCallback((topicKey: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      next.has(topicKey) ? next.delete(topicKey) : next.add(topicKey);
      return next;
    });
  }, []);

  const activeSubject = curriculumData.subjects.find((s) => s.id === activeTab)!;
  const isElectronics = activeTab === "electronics";
  const accentColor = isElectronics ? "#3B82F6" : "#10B981";

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return activeSubject.topics;
    const q = search.toLowerCase();
    return activeSubject.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.simple_explanation.toLowerCase().includes(q)
    );
  }, [search, activeSubject]);

  const subjectLearnedCount = (s: Subject) =>
    s.topics.filter((t) => learned.has(`${s.id}-${t.id}`)).length;

  return (
    <div className="page-bg min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" style={{ color: accentColor }} />
              <h1 className="text-xl font-bold">📚 Student Learning Hub</h1>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => window.print()}
                title="Print"
              >
                <Printer className="w-4 h-4" />
              </Button>
              <DarkModeToggle />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Click any topic to learn it in simple words
          </p>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-3">
            <Progress value={(learned.size / totalTopics) * 100} className="h-2 flex-1" />
            <span className="text-xs font-bold tabular-nums whitespace-nowrap">
              {learned.size} / {totalTopics} learned
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="🔍 Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="flex gap-2 mb-4">
          {curriculumData.subjects.map((s) => {
            const isActive = s.id === activeTab;
            const isElec = s.id === "electronics";
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveTab(s.id);
                  setOpenTopic(null);
                  setSearch("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                  isActive
                    ? "text-white shadow-lg"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/20"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: isElec ? "#3B82F6" : "#10B981",
                        borderColor: isElec ? "#3B82F6" : "#10B981",
                      }
                    : undefined
                }
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.name}</span>
                <span className="sm:hidden">{isElec ? "Electronics" : "Computer"}</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] ml-1"
                  style={isActive ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : {}}
                >
                  {subjectLearnedCount(s)}/{s.topics.length}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Topics */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {filteredTopics.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No topics found for "{search}"
              </p>
            )}
            {filteredTopics.map((topic, idx) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={idx}
                subjectId={activeSubject.id}
                accentColor={accentColor}
                isLearned={learned.has(`${activeSubject.id}-${topic.id}`)}
                isOpen={openTopic === topic.id}
                onToggleOpen={() => setOpenTopic(openTopic === topic.id ? null : topic.id)}
                onToggleLearned={() => toggleLearned(`${activeSubject.id}-${topic.id}`)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {learned.size === totalTopics && totalTopics > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mt-8 p-6 rounded-2xl bg-card border border-border"
          >
            <p className="text-4xl mb-2">🎉</p>
            <h2 className="text-xl font-bold mb-1">Congratulations!</h2>
            <p className="text-muted-foreground">You've completed all {totalTopics} topics!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LearnHub;
