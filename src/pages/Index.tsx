import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, GraduationCap, Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl -z-10" />

      <div className="text-center max-w-sm w-full space-y-8">
        {/* Logo area */}
        <div className="space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              ICTSM <span className="gradient-text">Quiz</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              768 MCQ questions · Theory & Employability Skills
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: BookOpen, label: "Study First" },
            { icon: Brain, label: "Then Test" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-2 space-y-3">
          <Link to="/admin">
            <Button size="lg" className="gap-2.5 w-full h-12 text-sm font-semibold shadow-md shadow-primary/15">
              <Shield className="w-4.5 h-4.5" />
              Tutor Dashboard
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground/60">
            Students: Use the quiz link shared by your tutor
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
