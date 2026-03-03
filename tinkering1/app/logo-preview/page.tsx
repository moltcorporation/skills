import Image from "next/image";

const fonts = [
  {
    name: "Geist Mono",
    import: "Geist+Mono:wght@500;600;700",
    family: "'Geist Mono'",
    note: "Vercel's typeface — terminal that happens to be beautiful",
  },
  {
    name: "IBM Plex Mono",
    import: "IBM+Plex+Mono:wght@500;600;700",
    family: "'IBM Plex Mono'",
    note: "Industrial, serious — infrastructure weight that pairs with 'corp'",
  },
  {
    name: "Space Grotesk",
    import: "Space+Grotesk:wght@500;600;700",
    family: "'Space Grotesk'",
    note: "Geometric, modern, techy — clean but distinctive",
  },
  {
    name: "Syne",
    import: "Syne:wght@500;600;700",
    family: "'Syne'",
    note: "Bold, unconventional letterforms — futuristic",
  },
  {
    name: "Outfit",
    import: "Outfit:wght@500;600;700",
    family: "'Outfit'",
    note: "Clean geometric sans with personality",
  },
  {
    name: "Chakra Petch",
    import: "Chakra+Petch:wght@500;600;700",
    family: "'Chakra Petch'",
    note: "Angular, industrial — very tech-forward",
  },
  {
    name: "IBM Plex Sans",
    import: "IBM+Plex+Sans:wght@500;600;700",
    family: "'IBM Plex Sans'",
    note: "Professional, engineered — trusted tech feel",
  },
  {
    name: "Azeret Mono",
    import: "Azeret+Mono:wght@500;600;700",
    family: "'Azeret Mono'",
    note: "Monospace with character — terminal meets brand",
  },
  {
    name: "Exo 2",
    import: "Exo+2:wght@500;600;700",
    family: "'Exo 2'",
    note: "Futuristic geometric — sci-fi meets startup",
  },
];

const fontImportUrl = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f.import}`).join("&")}&display=swap`;

export default function LogoPreviewPage() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontImportUrl} />
      <div className="min-h-screen bg-background p-12">
        <h1 className="text-2xl font-semibold mb-2">Logo Font Preview</h1>
        <p className="text-muted-foreground mb-10 text-sm">
          Compare font options for the MoltCorp wordmark. Each row shows the
          logo at different weights.
        </p>

        <div className="space-y-12">
          {fonts.map((font) => (
            <div key={font.name} className="border border-border rounded-lg p-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">
                  {font.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {font.note}
                </span>
              </div>
              <div className="border-t border-border pt-6 space-y-6">
                {[500, 600, 700].map((weight) => (
                  <div key={weight} className="flex items-center gap-8">
                    <span className="text-xs font-mono text-muted-foreground w-8">
                      {weight}
                    </span>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/icon-dark.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-[4px] dark:block hidden"
                      />
                      <Image
                        src="/icon-light.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-[4px] dark:hidden block"
                      />
                      <span
                        className="text-base tracking-tight"
                        style={{
                          fontFamily: font.family,
                          fontWeight: weight,
                        }}
                      >
                        MoltCorp
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-8">
                      <Image
                        src="/icon-dark.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-[4px] dark:block hidden"
                      />
                      <Image
                        src="/icon-light.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-[4px] dark:hidden block"
                      />
                      <span
                        className="text-xl tracking-tight"
                        style={{
                          fontFamily: font.family,
                          fontWeight: weight,
                        }}
                      >
                        MoltCorp
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
