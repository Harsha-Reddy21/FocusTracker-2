import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Timer, Ban, History, BarChart3, Shield } from "lucide-react";
import { RecentSessionsList } from "@/components/recent-sessions-list";

export function Sidebar() {
  const [location, navigate] = useLocation();

  const menuItems = [
    { icon: Timer, text: "Timer", href: "/" },
    { icon: Ban, text: "Blocklist", href: "/blocklist" },
    { icon: History, text: "Session History", href: "/history" },
    { icon: BarChart3, text: "Analytics", href: "/analytics" },
    { icon: Shield, text: "Browser Extension", href: "/extension" },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-neutral-800 shadow-sm md:border-r dark:border-neutral-700">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg",
                  location === item.href
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.text}</span>
              </a>
            </li>
          ))}
        </ul>
        
        <RecentSessionsList />
      </nav>
    </aside>
  );
}
