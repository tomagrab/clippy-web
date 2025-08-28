import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/lib/types/text-stream/status/connection-status";
import { CheckCircleIcon, LoaderIcon, XCircleIcon } from "lucide-react";

type TextStreamStatusProps = {
  connectionStatus: ConnectionStatus;
};

export default function TextStreamStatus({
  connectionStatus,
}: TextStreamStatusProps) {
  const getStatusStyles = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          className:
            "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/30 border-0 ring-2 ring-green-400/20 hover:shadow-green-500/40 transition-all duration-300",
          icon: CheckCircleIcon,
        };
      case "connecting":
        return {
          className:
            "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/30 border-0 ring-2 ring-yellow-400/20 hover:shadow-yellow-500/40 transition-all duration-300 animate-pulse",
          icon: LoaderIcon,
        };
      case "disconnected":
        return {
          className:
            "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30 border-0 ring-2 ring-red-400/20 hover:shadow-red-500/40 transition-all duration-300",
          icon: XCircleIcon,
        };
    }
  };

  const { className, icon: StatusIcon } = getStatusStyles();

  return (
    <Badge className={`font-semibold px-2 py-1.5 ${className}`}>
      <StatusIcon className="h-4 w-4" />
    </Badge>
  );
}
