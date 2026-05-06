import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomePlate",
    short_name: "HomePlate",
    description: "Private household nutrition, body, and wellness tracker.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7faf8",
    theme_color: "#256f5b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
