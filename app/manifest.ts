import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hòm thư góp ý điện tử - LỮ ĐOÀN PPK234",
    short_name: "Hòm thư góp ý điện tử",
    description: "Hòm thư góp ý điện tử và khảo sát trực tuyến của LỮ ĐOÀN PPK234",
    start_url: "/",
    display: "standalone",
    background_color: "#fefce8",
    theme_color: "#b91c1c",
    icons: [
      {
        src: "/logo-ludoan234.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-ludoan234.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
