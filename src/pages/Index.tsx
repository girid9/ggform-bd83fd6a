import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, GraduationCap, Brain, ArrowRight, Sparkles } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 relative overflow-hidden page-bg">
      <div className="absolute top-6 right-6 z-50">
        <DarkModeToggle />
      </div>

      <div className="text-center max-w-lg w-full space-y-12 animate-slide-up-subtle">
        {/* Branding */}
        <div className="space-y-8">
          <div className="relative inline-flex mx-auto">
            <div className="relative inline-flex items-center justify-center w-28 h-28 border-4 border-foreground bg-background transition-transform hover:scale-105 duration-500 rounded-none">
              <GraduationCap className="w-14 h-14 text-foreground" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-display text-6xl font-black tracking-tighter uppercase">
              ggform
            </h1>
            <p className="text-foreground text-lg font-bold leading-relaxed max-w-[320px] mx-auto border-b-2 border-foreground pb-2">
              Next-Gen MCQ Architecture
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: BookOpen, label: "Phase 1: Knowledge Acquisition", desc: "Master the content with guided study" },
            { icon: Brain, label: "Phase 2: Cognitive Testing", desc: "Validate your memory with smart filters" },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div 
              key={label} 
              className="group flex items-center gap-5 p-5 bg-card border-2 border-border shadow-sm hover:border-foreground transition-all duration-300 animate-slide-up-subtle opacity-0 rounded-none cursor-default text-left"
              style={{ animationDelay: `${200 + (i * 100)}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex h-12 w-12 items-center justify-center border-2 border-border text-foreground transition-colors duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background font-bold tracking-tighter">
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black uppercase tracking-widest">{label}</p>
                <p className="text-xs text-muted-foreground font-bold mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Center */}
        <div className="pt-4 space-y-6">
          <Link to="/admin" className="block">
            <Button
              size="lg"
              className="gap-4 w-full h-16 btn-primary text-lg group rounded-none border-2 border-foreground"
            >
              <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              TUTOR CONSOLE
              <ArrowRight className="w-5 h-5 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-2 text-xs text-foreground font-bold uppercase tracking-[0.2em] border-2 border-transparent p-2">
            <Sparkles className="w-4 h-4" />
            Enter Study Session via Invitation
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 w-full px-6 flex justify-between items-center max-w-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <span>© 2026 GGFORM Redesign</span>
        <div className="h-0.5 flex-1 mx-4 bg-muted-foreground/30" />
        <span>Cognitive Excellence</span>
      </footer>
    </div>
  );
};

export default Index;
