
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      // Success states
      case 'closed won':
      case 'approved':
      case 'signed':
      case 'completed':
      case 'fulfilled':
      case 'in progress':
        return 'badge-success';
        
      // Warning states
      case 'negotiation':
      case 'proposal':
      case 'qualified':
      case 'in review':
      case 'not started':
      case 'on hold':
        return 'badge-warning';
        
      // Error states  
      case 'closed lost':
      case 'cancelled':
        return 'badge-error';
        
      // Info states
      case 'new':
      case 'draft':
      case 'open':
      default:
        return 'badge-info';
    }
  };

  return (
    <span className={cn("badge", getStatusClass(status), className)}>
      {status}
    </span>
  );
}
