import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-2">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">ICTSM Quiz System</h1>
        <p className="text-muted-foreground text-base">
          768 MCQ questions covering ICTSM Theory & Employability Skills.
          Study first, then test your knowledge.
        </p>
        <div className="pt-4">
          <Link to="/admin">
            <Button size="lg" className="gap-2 w-full">
              <Shield className="w-5 h-5" />
              Tutor Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
