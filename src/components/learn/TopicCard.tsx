import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TopicCardProps {
  topic: any;
  index: number;
  subjectId: string;
  accentColor: string;
  isLearned: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleLearned: () => void;
}

const TopicCard = memo(
  ({
    topic,
    index,
    subjectId,
    accentColor,
    isLearned,
    isOpen,
    onToggleOpen,
    onToggleLearned,
  }: TopicCardProps) => {
    return (
      <motion.div
        layout
        className={`rounded-xl border-2 bg-card overflow-hidden transition-colors ${
          isLearned ? "border-emerald-400/50" : "border-border"
        }`}
        style={isOpen ? { borderColor: accentColor } : undefined}
      >
        {/* Header */}
        <button
          onClick={onToggleOpen}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors min-h-[56px]"
        >
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: accentColor }}
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{topic.title}</span>
              {topic.symbol && topic.symbol !== "-" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {topic.symbol}
                </Badge>
              )}
              {topic.unit && topic.unit !== "-" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {topic.unit}
                </Badge>
              )}
            </div>
            {topic.full_form && (
              <p className="text-[11px] text-muted-foreground truncate">{topic.full_form}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLearned && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                {/* Simple Explanation */}
                <div>
                  <p className="text-sm leading-relaxed">{topic.simple_explanation}</p>
                </div>

                {/* Example */}
                {topic.example && (
                  <div
                    className="rounded-lg p-3 text-sm flex gap-2"
                    style={{ backgroundColor: `${accentColor}12` }}
                  >
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                    <span>{topic.example}</span>
                  </div>
                )}

                {/* Memory Trick */}
                {topic.memory_trick && (
                  <div className="rounded-lg p-3 text-sm bg-amber-500/10 border border-amber-500/20">
                    <span className="font-bold text-amber-600">💡 Memory Trick: </span>
                    {topic.memory_trick}
                  </div>
                )}

                {/* Formula */}
                {topic.formula && (
                  <div className="rounded-lg bg-muted p-3 font-mono text-sm border border-border">
                    📐 <span className="font-bold">{topic.formula}</span>
                  </div>
                )}

                {/* Key Points */}
                {topic.key_points && topic.key_points.length > 0 && (
                  <ul className="space-y-1.5">
                    {topic.key_points.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-500 flex-shrink-0">✅</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Types */}
                {topic.types && (
                  <div className="flex flex-wrap gap-1.5">
                    {topic.types.map((t: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Configurations */}
                {topic.configurations && (
                  <div className="space-y-1">
                    {Object.entries(topic.configurations).map(([key, val]) => (
                      <p key={key} className="text-sm">
                        <span className="font-bold">{key}:</span> {val as string}
                      </p>
                    ))}
                  </div>
                )}

                {/* Colors table for resistor color code */}
                {topic.colors && (
                  <div className="grid grid-cols-5 gap-1.5 text-xs">
                    {Object.entries(topic.colors).map(([color, val]) => (
                      <div
                        key={color}
                        className="rounded-md p-1.5 text-center font-bold"
                        style={{
                          backgroundColor:
                            color.toLowerCase() === "black"
                              ? "#1a1a1a"
                              : color.toLowerCase() === "brown"
                              ? "#8B4513"
                              : color.toLowerCase() === "white"
                              ? "#f0f0f0"
                              : color.toLowerCase() === "grey"
                              ? "#808080"
                              : color.toLowerCase(),
                          color: ["black", "brown", "red", "blue", "violet", "green"].includes(
                            color.toLowerCase()
                          )
                            ? "white"
                            : "#000",
                        }}
                      >
                        {val as number}
                      </div>
                    ))}
                  </div>
                )}

                {/* Full forms */}
                {topic.full_forms && (
                  <div className="space-y-1">
                    {Object.entries(topic.full_forms).map(([key, val]) => (
                      <p key={key} className="text-sm">
                        <span className="font-bold">{key}:</span> {val as string}
                      </p>
                    ))}
                  </div>
                )}

                {/* Mark as Learned */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLearned();
                  }}
                  className={`w-full mt-2 h-12 text-sm font-bold rounded-xl transition-all ${
                    isLearned
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : ""
                  }`}
                  style={!isLearned ? { backgroundColor: accentColor, color: "white" } : undefined}
                >
                  {isLearned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Learned ✓
                    </>
                  ) : (
                    "Mark as Learned"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

TopicCard.displayName = "TopicCard";
export default TopicCard;
