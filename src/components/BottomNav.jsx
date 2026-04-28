import { Link, useLocation } from "react-router-dom";
import { Mic, Monitor, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/voice", icon: Mic, label: "Speaking" },
  { path: "/presentation", icon: Monitor, label: "Speech" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();

  // Hide on chat/practice pages
  const hiddenPaths = ["/voice/chat", "/voice/setup", "/voice/report", "/presentation/practice", "/presentation/report"];
  if (location.pathname === "/" || hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass border-t border-white/10">
        <nav className="flex items-center justify-around max-w-lg mx-auto py-2.5 px-4">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = path === "/voice" 
              ? location.pathname.startsWith("/voice")
              : location.pathname.startsWith(path);
            
            return (
              <Link
                key={path}
                to={path}
                className="relative flex flex-col items-center gap-1.5 py-2 px-6"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                  className="absolute -top-0.5 w-9 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[16px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
