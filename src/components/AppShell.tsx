import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  Leaf,
  Menu,
} from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSidebar, SidebarProvider } from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Question Bank", url: "/questions", icon: BookOpen },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/questions": "Question Bank",
  "/analytics": "Analytics",
};

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">ggform</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground-muted hover:bg-accent hover:text-foreground transition-all duration-150"
            activeClassName="bg-primary/10 text-primary font-semibold border-l-[3px] border-primary"
          >
            <item.icon className="w-4.5 h-4.5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">T</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Tutor</p>
            <p className="text-2xs text-foreground-subtle">Teacher</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "ggform";

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarNav />
              </SheetContent>
            </Sheet>
            <h1 className="font-display font-semibold text-lg">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-up">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-8 py-6 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-sm text-foreground-subtle font-display">🌿 ggform — keeping learning fresh</span>
          <span className="text-xs text-foreground-subtle">v1.0 · Made with ♥ for educators</span>
        </footer>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
