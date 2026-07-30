import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SnapWorxx — Never Miss The Moments";

async function loadFont(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Outfit:wght@${weight}&text=NevrMisThmntoLiudgphakySNAPWORXXcw.%C2%B7`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  ).then((r) => r.text());
  const match = css.match(/src: url\((.+?)\)/);
  if (!match) throw new Error("Font URL not found");
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OgImage() {
  const [outfitBold, outfitRegular] = await Promise.all([
    loadFont(700),
    loadFont(400),
  ]);

  const cx = 936; // bloom / lens center x
  const cy = 265; // bloom / lens center y
  const rings = [
    { r: 90, a: 0.18 },
    { r: 150, a: 0.15 },
    { r: 220, a: 0.12 },
    { r: 300, a: 0.09 },
    { r: 390, a: 0.06 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundImage: "linear-gradient(160deg, #3F0E76 0%, #2B0852 70%)",
          fontFamily: "Outfit",
          overflow: "hidden",
        }}
      >
        {/* flash bloom */}
        <div
          style={{
            position: "absolute",
            left: cx - 450,
            top: cy - 450,
            width: 900,
            height: 900,
            backgroundImage:
              "radial-gradient(circle, rgba(140,85,225,0.55) 0%, rgba(140,85,225,0.22) 35%, rgba(140,85,225,0) 68%)",
          }}
        />
        {/* shutter rings */}
        {rings.map((ring, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - ring.r,
              top: cy - ring.r,
              width: ring.r * 2,
              height: ring.r * 2,
              borderRadius: "50%",
              border: `2px solid rgba(200,170,255,${ring.a})`,
            }}
          />
        ))}
        {/* lens */}
        <div
          style={{
            position: "absolute",
            left: cx - 88,
            top: cy - 88,
            width: 176,
            height: 176,
            borderRadius: "50%",
            backgroundColor: "#935CFF",
            border: "9px solid rgba(255,255,255,0.95)",
          }}
        />
        {/* satellite dot */}
        <div
          style={{
            position: "absolute",
            left: cx + 120,
            top: cy - 155,
            width: 34,
            height: 34,
            borderRadius: "50%",
            backgroundColor: "#A878FF",
          }}
        />
        {/* logo mark + wordmark */}
        <div
          style={{
            position: "absolute",
            left: 58,
            top: 44,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <svg
            width="88"
            height="70"
            viewBox="0 0 100 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="14"
              y="10"
              width="72"
              height="60"
              rx="16"
              stroke="white"
              strokeWidth="6"
            />
            <line
              x1="2"
              y1="22"
              x2="42"
              y2="22"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="50" cy="42" r="15" fill="#935CFF" />
            <circle cx="50" cy="42" r="19" stroke="white" strokeWidth="5" />
            <circle cx="80" cy="22" r="4.5" fill="#A878FF" />
          </svg>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 24,
              fontWeight: 700,
              color: "white",
              letterSpacing: 8,
            }}
          >
            SNAPWORXX
          </div>
        </div>
        {/* headline block */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 218,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 95,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.08,
            }}
          >
            Never Miss
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 95,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.08,
            }}
          >
            The Moments
          </div>
          <div
            style={{
              display: "flex",
              width: 110,
              height: 4,
              backgroundColor: "#935CFF",
              marginTop: 22,
            }}
          />
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 28,
              fontWeight: 400,
              color: "#E0D2FA",
            }}
          >
            Live in minutes · Nothing to download · Everyone gets the photos
          </div>
        </div>
        {/* url */}
        <div
          style={{
            position: "absolute",
            left: 62,
            bottom: 34,
            display: "flex",
            fontSize: 22,
            fontWeight: 400,
            color: "#B296EB",
            letterSpacing: 3,
          }}
        >
          snapworxx.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Outfit", data: outfitBold, weight: 700, style: "normal" },
        { name: "Outfit", data: outfitRegular, weight: 400, style: "normal" },
      ],
    }
  );
}
