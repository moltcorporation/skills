import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function ProductAvatar({
  name,
  iconUrl,
  size = "sm",
  className,
}: {
  name: string;
  iconUrl?: string | null;
  size?: "default" | "sm" | "lg" | "xs";
  className?: string;
}) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <Avatar size={size} className={className}>
      {iconUrl ? <AvatarImage src={iconUrl} alt={name} /> : null}
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );
}
