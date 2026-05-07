import {
  removeProfilePictureAction,
  uploadProfilePictureAction,
} from "@/app/actions";
import { UserAvatar } from "@/components/app/UserAvatar";

type ProfilePictureCardProps = {
  displayName: string;
  initial: string;
  profilePictureUrl: string | null;
};

export function ProfilePictureCard({
  displayName,
  initial,
  profilePictureUrl,
}: ProfilePictureCardProps) {
  return (
    <section className="hp-card p-4">
      <div className="flex items-center gap-4">
        <UserAvatar
          initial={initial}
          imageUrl={profilePictureUrl}
          label={`${displayName} profile picture`}
          size="xl"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-normal text-[var(--brand-ink)]">
            Profile picture
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-[var(--brand-muted)]">
            Used in the HomePlate header and menu. JPG, PNG, or WebP up to 3 MB.
          </p>
        </div>
      </div>

      <form
        action={uploadProfilePictureAction}
        encType="multipart/form-data"
        className="mt-4 space-y-3"
      >
        <label className="block">
          <span className="text-sm font-bold text-[var(--brand-ink)]">
            Upload image
          </span>
          <input
            name="profilePicture"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="field mt-1 file:mr-3 file:rounded-full file:border-0 file:bg-[var(--brand-teal)] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
          />
        </label>
        <button type="submit" className="primary-button">
          Upload photo
        </button>
      </form>

      {profilePictureUrl ? (
        <form action={removeProfilePictureAction} className="mt-2">
          <button
            type="submit"
            className="secondary-button flex w-full items-center justify-center text-[var(--brand-coral)]"
          >
            Remove photo
          </button>
        </form>
      ) : null}
    </section>
  );
}
