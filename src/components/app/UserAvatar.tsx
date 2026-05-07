import { Menu } from "lucide-react";

type UserAvatarProps = {
  initial: string;
  imageUrl?: string | null;
  label: string;
  showMenuBadge?: boolean;
  size?: "md" | "lg" | "xl";
};

const sizeClasses = {
  md: "h-12 w-12 text-xl",
  lg: "h-14 w-14 text-2xl",
  xl: "h-20 w-20 text-3xl",
};

export function UserAvatar({
  initial,
  imageUrl,
  label,
  showMenuBadge = false,
  size = "md",
}: UserAvatarProps) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-[var(--brand-teal)] font-bold text-white shadow-sm ${sizeClasses[size]}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={label}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initial
      )}
      {showMenuBadge ? (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[var(--brand-card)] text-[var(--brand-teal)] shadow-sm">
          <Menu aria-hidden="true" size={12} strokeWidth={3} />
        </span>
      ) : null}
    </span>
  );
}
