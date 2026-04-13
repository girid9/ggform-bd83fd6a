import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, GraduationCap, Brain, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 relative overflow-hidden page-bg">
      <div className="absolute top-5 right-5 z-10">
        <DarkModeToggle />
      </div>

      {/* Soft decorative circles */}
      <div className="absolute top-[-15%] right-[-15%] w-[500px] h-[500px] rounded-full bg-primary/5 dark:bg-primary/5 -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent dark:bg-accent/30 -z-10 pointer-events-none" />

      <div className="text-center max-w-sm w-full space-y-8 animate-fade-up">
        {/* Logo */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-lg shadow-primary/20">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              gg<span className="gradient-text">form</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Keep your information in our app.
              <br />768 MCQ questions · Theory & Skills
            </p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {[
            { icon: BookOpen, label: "Study First" },
            { icon: Brain, label: "Then Test" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="chip-primary">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 space-y-3">
          <Link to="/admin">
            <Button
              size="lg"
              className="gap-2.5 w-full h-13 text-sm btn-primary"
            >
              <Shield className="w-4.5 h-4.5" />
              Tutor Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Students: Use the quiz link shared by your tutor
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 text-center">
        <span className="text-[11px] text-muted-foreground/50 font-medium">
          Made with ♥ for educators
        </span>
      </div>
    </div>
  );
};

export default Index;
