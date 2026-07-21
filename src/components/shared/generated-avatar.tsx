import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";

import { cn } from "@/lib/utils";
import glassDefinition from "@dicebear/styles/glass.json";
import initialsDefinition from "@dicebear/styles/initials.json";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GeneratedAvatarProps {
  seed: string;
  className?: string;
  variant?: "initials" | "glass";
}

export const GeneratedAvatar = ({
  seed,
  className,
  variant,
}: GeneratedAvatarProps) => {
  let avatarStyle: Style;
  if (variant === "glass") {
    avatarStyle = new Style(glassDefinition);
  } else {
    avatarStyle = new Style(initialsDefinition);
  }

  const avatar = new DiceBearAvatar(avatarStyle, {
    seed,
  });

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={avatar.toDataUri()} alt="Avatar" />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};