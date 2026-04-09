import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Shield, Leaf, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>

      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-200/20 dark:bg-emerald-900/10 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-200/15 dark:bg-teal-900/10 blur-3xl -z-10" />

      <div className="text-center max-w-md w-full space-y-8 animate-fade-up">
        {/* Logo */}
        <div className="space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-4xl tracking-tight">
              gg<span className="gradient-text">form</span>
            </h1>
            <p className="text-foreground-muted text-sm mt-2 leading-relaxed">
              Interactive quiz platform for modern classrooms
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { icon: GraduationCap, label: "768 MCQ Questions" },
            { icon: Shield, label: "Auto-Graded" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-2 space-y-3">
          <Link to="/admin">
            <Button size="lg" className="gap-2.5 w-full h-12 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0">
              <Shield className="w-4.5 h-4.5" />
              Tutor Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-2xs text-foreground-subtle">
            Students: Use the quiz link shared by your tutor
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
