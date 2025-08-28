import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TextStreamStatus from "./text-stream-status";
import { ConnectionStatus } from "@/lib/types/text-stream/status/connection-status";
import { Button } from "@/components/ui/button";

type TextStreamCardProps = {
  connectionStatus: ConnectionStatus;
};

export default function TextStreamCard({
  connectionStatus,
}: TextStreamCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-1">
          <TextStreamStatus connectionStatus={connectionStatus} />
          <h2 className="text-xl">Live Text Stream</h2>
        </CardTitle>
        <Button>Clear This Shit!</Button>
      </CardHeader>
      <CardContent>
        <CardDescription>
          Messages from your CLI tool will appear here in real-time
        </CardDescription>
      </CardContent>
    </Card>
  );
}
