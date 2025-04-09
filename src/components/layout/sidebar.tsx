
import { NavLink } from "react-router-dom";
import { Home, BarChart4, Briefcase, FileText, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { hasPermission } = useAuth();

  return (
    <div
      className={cn(
        "bg-sidebar h-screen flex flex-col border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary ml-2">DM Platform</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "ml-auto",
            collapsed && "mx-auto"
          )}
          onClick={() => onToggle(!collapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="flex flex-col gap-1 px-2">
          <TooltipProvider delayDuration={0}>
            {hasPermission('canViewDashboard') && (
              <NavItem
                to="/"
                label="Dashboard"
                icon={Home}
                collapsed={collapsed}
              />
            )}

            {hasPermission('canViewAccounts') && (
              <NavItem
                to="/accounts"
                label="Accounts"
                icon={Briefcase}
                collapsed={collapsed}
              />
            )}

            {hasPermission('canViewDemand') && (
              <NavItem
                to="/demand"
                label="Demand"
                icon={FileText}
                collapsed={collapsed}
              />
            )}

            <NavItem
              to="/analytics"
              label="Analytics"
              icon={BarChart4}
              collapsed={collapsed}
            />
          </TooltipProvider>
        </nav>
      </div>
      
      <div className="border-t py-4 px-2">
        <div className="text-xs text-sidebar-foreground/70 px-3 mb-1">
          {!collapsed && "Demand Flow Navigator"}
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
}

function NavItem({ to, label, icon: Icon, collapsed }: NavItemProps) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center h-10 w-10 rounded-md",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-sidebar-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center h-10 px-3 rounded-md gap-3 text-sm font-medium",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-muted text-sidebar-foreground"
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}
