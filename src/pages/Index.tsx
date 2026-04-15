import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, GraduationCap, Brain, ArrowRight, Sparkles } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 relative overflow-hidden page-bg">
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] dark:bg-primary/[0.06] -z-10 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-15%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] dark:bg-primary/[0.04] -z-10 blur-3xl" />

      <div className="text-center max-w-sm w-full space-y-8 animate-fade-up">
        {/* Logo */}
        <div className="space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-primary to-emerald-500 shadow-lg shadow-primary/25">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              gg<span className="gradient-text">form</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-[260px] mx-auto">
              Smart quiz platform for students and educators
            </p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {[
            { icon: BookOpen, label: "Study First" },
            { icon: Brain, label: "Then Test" },
            { icon: Sparkles, label: "Track Progress" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="chip-primary">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-2 space-y-3">
          <Link to="/admin">
            <Button
              size="lg"
              className="gap-2.5 w-full h-14 text-sm btn-primary text-base"
            >
              <Shield className="w-5 h-5" />
              Tutor Dashboard
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground/70">
            Students: Use the quiz link from your tutor
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 text-center">
        <span className="text-[11px] text-muted-foreground/40 font-medium">
          Made with ♥ for educators
        </span>
      </div>
    </div>
  );
};

export default Index;
