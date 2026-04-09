import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, GraduationCap, Brain, Leaf, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 relative overflow-hidden nature-gradient">
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-200/40 dark:bg-emerald-900/15 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-teal-200/30 dark:bg-teal-900/10 blur-3xl -z-10 pointer-events-none" />

      <div className="text-center max-w-sm w-full space-y-8 animate-fade-up">
        {/* Logo */}
        <div className="space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-600/20">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              gg<span className="gradient-text">form</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2.5 leading-relaxed">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300"
            >
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
              className="gap-2.5 w-full h-12 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-md shadow-emerald-600/15 rounded-xl hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
            >
              <Shield className="w-4.5 h-4.5" />
              Tutor Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground/60">
            Students: Use the quiz link shared by your tutor
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center">
        <span className="text-[10px] text-muted-foreground/40 font-display">
          🌿 Made with ♥ for educators
        </span>
      </div>
    </div>
  );
};

export default Index;
