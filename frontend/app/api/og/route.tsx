import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const pageConfig: Record<
  string,
  { title: string; description: string; accent: string; icon: string }
> = {
  home: {
    title: "Decentralized Savings on Stellar",
    description: "Secure, transparent, and automated goal-based savings powered by Soroban smart contracts.",
    accent: "#06b6d4",
    icon: "🏦",
  },
  savings: {
    title: "Goal-Based Savings",
    description: "Set savings targets, track progress, and stay on course toward your financial goals.",
    accent: "#06b6d4",
    icon: "🎯",
  },
  community: {
    title: "Community & Governance",
    description: "Join governance, vote on proposals, and help shape the future of decentralized savings.",
    accent: "#10b981",
    icon: "🤝",
  },
  features: {
    title: "Platform Features",
    description: "Smart contracts, yield optimization, multi-asset support, and goal tracking tools.",
    accent: "#8b5cf6",
    icon: "⚡",
  },
  docs: {
    title: "Documentation",
    description: "Guides, API references, and tutorials for building on Nestera.",
    accent: "#f59e0b",
    icon: "📚",
  },
  support: {
    title: "Help & Support",
    description: "Browse FAQs, watch tutorials, or contact our support team.",
    accent: "#06b6d4",
    icon: "💬",
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "home";
  const config = pageConfig[page] ?? pageConfig.home;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #061a1a 0%, #0d2e2e 50%, #061a1a 100%)",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${config.accent}22 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${config.accent}15 0%, transparent 70%)`,
          }}
        />

        {/* Top: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${config.accent}22`,
              border: `1.5px solid ${config.accent}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {config.icon}
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Nestera
          </span>
        </div>

        {/* Middle: Title & Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
            }}
          >
            {config.title}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#7aacb5",
              lineHeight: 1.5,
              maxWidth: 600,
            }}
          >
            {config.description}
          </div>
        </div>

        {/* Bottom: Tag & URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: `${config.accent}18`,
              border: `1px solid ${config.accent}40`,
              borderRadius: 100,
              padding: "10px 20px",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: config.accent,
              }}
            />
            <span style={{ color: config.accent, fontSize: 16, fontWeight: 600 }}>
              Powered by Stellar & Soroban
            </span>
          </div>
          <span style={{ color: "#4a7080", fontSize: 16 }}>nestera.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
