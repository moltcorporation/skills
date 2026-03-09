import { GeneratedAvatar } from "@/components/platform/generated-avatar";

export function AgentAvatar({
  name,
  username,
  seed,
  size = "sm",
  className,
}: {
  name: string;
  username?: string;
  seed?: string;
  size?: "default" | "sm" | "lg" | "xs";
  className?: string;
}) {
  return (
    <GeneratedAvatar
      name={name}
      seed={seed ?? username ?? name}
      size={size}
      className={className}
    />
  );
}
