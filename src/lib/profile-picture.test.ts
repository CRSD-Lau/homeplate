import { describe, expect, it } from "vitest";

import {
  getProfilePictureCandidates,
  getProfilePictureContentType,
  getProfilePictureExtension,
  parseProfilePictureFileName,
  getProfilePictureWebPath,
} from "./profile-picture";

describe("profile picture helpers", () => {
  it("maps supported image content types to safe file extensions", () => {
    expect(getProfilePictureExtension("image/jpeg")).toBe("jpg");
    expect(getProfilePictureExtension("image/png")).toBe("png");
    expect(getProfilePictureExtension("image/webp")).toBe("webp");
  });

  it("rejects unsupported profile picture content types", () => {
    expect(getProfilePictureExtension("image/gif")).toBeNull();
    expect(getProfilePictureExtension("text/plain")).toBeNull();
    expect(getProfilePictureExtension("")).toBeNull();
  });

  it("builds deterministic public paths for a user profile picture", () => {
    expect(getProfilePictureWebPath("user-123", "webp")).toBe(
      "/profile-pictures/user-123.webp",
    );
  });

  it("checks all supported profile picture candidates in stable order", () => {
    expect(getProfilePictureCandidates("user-123")).toEqual([
      {
        extension: "jpg",
        publicPath: "/profile-pictures/user-123.jpg",
      },
      {
        extension: "png",
        publicPath: "/profile-pictures/user-123.png",
      },
      {
        extension: "webp",
        publicPath: "/profile-pictures/user-123.webp",
      },
    ]);
  });

  it("parses safe profile picture filenames", () => {
    expect(parseProfilePictureFileName("user-123.png")).toEqual({
      userId: "user-123",
      extension: "png",
    });
  });

  it("rejects unsafe profile picture filenames", () => {
    expect(parseProfilePictureFileName("../user-123.png")).toBeNull();
    expect(parseProfilePictureFileName("user-123.gif")).toBeNull();
    expect(parseProfilePictureFileName("user-123")).toBeNull();
  });

  it("returns response content types for supported extensions", () => {
    expect(getProfilePictureContentType("jpg")).toBe("image/jpeg");
    expect(getProfilePictureContentType("png")).toBe("image/png");
    expect(getProfilePictureContentType("webp")).toBe("image/webp");
  });
});
