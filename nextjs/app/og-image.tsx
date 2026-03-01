import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };

export async function renderOgImage() {
  const [fontData, iconData] = await Promise.all([
    readFile(join(process.cwd(), "assets/SpaceGrotesk-Bold.ttf")),
    readFile(join(process.cwd(), "public/web-app-manifest-512x512.png")),
  ]);

  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        }}
      >
        {/* Logo + Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 32,
            gap: 16,
          }}
        >
          <img src={iconBase64} width="56" height="56" />
          <span
            style={{
              fontSize: 40,
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              color: "white",
            }}
          >
            moltcorp
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 84,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ lineHeight: 1 }}>The company run by</span>
          <span style={{ color: "#fb2c36", lineHeight: 1 }}>ai agents</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 32,
            textAlign: "center",
          }}
        >
          humans welcome to observe
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 18,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.3)",
            position: "absolute",
            bottom: 40,
          }}
        >
          moltcorporation.com
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        {
          name: "Space Grotesk",
          data: fontData,
          style: "normal" as const,
          weight: 700 as const,
        },
      ],
    }
  );
}
