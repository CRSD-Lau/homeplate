import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const PROFILE_PICTURE_MAX_BYTES = 3 * 1024 * 1024;

export type ProfilePictureExtension = "jpg" | "png" | "webp";

const PROFILE_PICTURE_EXTENSIONS: ProfilePictureExtension[] = [
  "jpg",
  "png",
  "webp",
];

const PROFILE_PICTURE_CONTENT_TYPES: Record<string, ProfilePictureExtension> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PROFILE_PICTURE_RESPONSE_TYPES: Record<ProfilePictureExtension, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const PROFILE_PICTURE_PUBLIC_DIR = "/profile-pictures";

export function getProfilePictureExtension(contentType: string) {
  const normalized = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  return PROFILE_PICTURE_CONTENT_TYPES[normalized] ?? null;
}

export function getProfilePictureWebPath(
  userId: string,
  extension: ProfilePictureExtension,
) {
  return `${PROFILE_PICTURE_PUBLIC_DIR}/${getSafeProfilePictureId(
    userId,
  )}.${extension}`;
}

export function getProfilePictureCandidates(userId: string) {
  return PROFILE_PICTURE_EXTENSIONS.map((extension) => ({
    extension,
    publicPath: getProfilePictureWebPath(userId, extension),
  }));
}

export function parseProfilePictureFileName(fileName: string) {
  const match = /^([a-zA-Z0-9_-]+)\.(jpg|png|webp)$/.exec(fileName);

  if (!match) return null;

  return {
    userId: match[1],
    extension: match[2] as ProfilePictureExtension,
  };
}

export function getProfilePictureContentType(
  extension: ProfilePictureExtension,
) {
  return PROFILE_PICTURE_RESPONSE_TYPES[extension];
}

export async function getExistingProfilePicturePath(userId: string) {
  for (const candidate of getProfilePictureCandidates(userId)) {
    try {
      await access(getProfilePictureFilePath(userId, candidate.extension));
      return candidate.publicPath;
    } catch {
      // Keep checking the remaining supported extensions.
    }
  }

  return null;
}

export async function saveProfilePicture(userId: string, file: File) {
  const extension = getProfilePictureExtension(file.type);

  if (!extension) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size <= 0) {
    throw new Error("Choose an image before uploading.");
  }

  if (file.size > PROFILE_PICTURE_MAX_BYTES) {
    throw new Error("Profile picture must be 3 MB or smaller.");
  }

  await mkdir(getProfilePictureDirectory(), { recursive: true });
  await removeProfilePicture(userId);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(getProfilePictureFilePath(userId, extension), buffer);

  return getProfilePictureWebPath(userId, extension);
}

export async function removeProfilePicture(userId: string) {
  await Promise.all(
    PROFILE_PICTURE_EXTENSIONS.map((extension) =>
      rm(getProfilePictureFilePath(userId, extension), { force: true }),
    ),
  );
}

export function getProfilePictureFilePath(
  userId: string,
  extension: ProfilePictureExtension,
) {
  return path.join(
    getProfilePictureDirectory(),
    `${getSafeProfilePictureId(userId)}.${extension}`,
  );
}

function getProfilePictureDirectory() {
  return path.join(process.cwd(), "public", "profile-pictures");
}

function getSafeProfilePictureId(userId: string) {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "");
}
