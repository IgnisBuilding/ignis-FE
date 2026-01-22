interface StatusBadgeProps {
  status: "Active" | "Reported" | "Responding" | "Responded" | "Resolved" | "Critical" | "High" | "Medium" | "Low";
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const statusConfig: Record<string, { bg: string; text: string }> = {
    Active: { bg: "bg-red-500", text: "text-white" },
    Critical: { bg: "bg-red-500", text: "text-white" },
    Reported: { bg: "bg-orange-500", text: "text-white" },
    High: { bg: "bg-orange-500", text: "text-white" },
    Responding: { bg: "bg-yellow-500", text: "text-gray-900" },
    Medium: { bg: "bg-yellow-500", text: "text-gray-900" },
    Responded: { bg: "bg-blue-500", text: "text-white" },
    Resolved: { bg: "bg-green-500", text: "text-white" },
    Low: { bg: "bg-green-500", text: "text-white" },
  };

  const config = statusConfig[status] || statusConfig.Active;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]} ${config.bg} ${config.text}`}
    >
      {status.toUpperCase()}
    </span>
  );
}
