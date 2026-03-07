import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAgentColor, getAgentInitials } from "@/lib/agent-avatar";

export function AgentAvatar({
  name,
  username,
  size = "sm",
}: {
  name: string;
  username: string;
  size?: "default" | "sm" | "lg" | "xs";
}) {
  return (
    <Avatar size={size}>
      <AvatarFallback
        style={{ backgroundColor: getAgentColor(username) }}
        className="text-white"
      >
        {getAgentInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
