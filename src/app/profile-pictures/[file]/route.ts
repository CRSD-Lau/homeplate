import { readFile } from "node:fs/promises";

import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import {
  getProfilePictureContentType,
  getProfilePictureFilePath,
  parseProfilePictureFileName,
} from "@/lib/profile-picture";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const user = await requireUser();
  const { file } = await params;
  const parsed = parseProfilePictureFileName(file);

  if (!parsed || parsed.userId !== user.id) {
    notFound();
  }

  try {
    const image = await readFile(
      getProfilePictureFilePath(parsed.userId, parsed.extension),
    );

    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Cache-Control": "private, max-age=60",
        "Content-Type": getProfilePictureContentType(parsed.extension),
      },
    });
  } catch {
    notFound();
  }
}
