'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

const countries = [
  ["🌍", "Global"],
  ["🇮🇳", "India"],
  ["🇦🇪", "UAE"],
  ["🇺🇸", "USA"],
  ["🇬🇧", "UK"],
  ["🇸🇬", "Singapore"],
  ["🇦🇺", "Australia"],
  ["🇨🇦", "Canada"],
  ["🇸🇦", "Saudi Arabia"],
  ["🇲🇾", "Malaysia"],
  ["🇩🇪", "Germany"],
  ["🇫🇷", "France"],
  ["🇿🇦", "South Africa"],
];

const steps = [
  ["📣", "Promotion", "Creators, communities & social media"],
  ["🌍", "Founder", "Get a referral link & build a network"],
  ["🏪", "Merchant", "Claim, activate & offer loyalty"],
  ["🛍️", "Customer", "Find a participating business"],
  ["✅", "Verified Order", "Complete the purchase verification"],
  ["🎁", "GBK Reward", "Eligible loyalty reward is calculated"],
];

export default function GlobalPromotionFunnel() {
  const [country, setCountry] = useState("Global");
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://loyalty.gbkai.com/global";
    return window.location.href;
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#07152f 0%,#0d2d61 42%,#f6f9ff 42%,#f6f9ff 100%)", color: "#10203a" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 70px" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, color: "#fff", marginBottom: 48 }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 21 }}>🌐 GBK LOYALTY</Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={country} onChange={e => setCountry(e.target.value)} style={{ borderRadius: 12, padding: "10px 12px", border: "1px solid #ffffff55", background: "#ffffff12", color: "#fff" }}>
              {countries.map(([flag, name]) => <option key={name} value={name} style={{ color: "#10203a" }}>{flag} {name}</option>)}
            </select>
            <Link href="/" style={{ color: "#fff", textDecoration: "none", padding: "10px 14px", borderRadius: 12, border: "1px solid #ffffff55" }}>Open Loyalty</Link>
          </div>
        </nav>

        <div style={{ textAlign: "center", color: "#fff", maxWidth: 900, margin: "0 auto 34px" }}>
          <div style={{ display: "inline-block", padding: "7px 13px", borderRadius: 999, background: "#ffffff16", border: "1px solid #ffffff30", fontWeight: 800, fontSize: 13 }}>🌍 GLOBAL PROMOTION FUNNEL • {country.toUpperCase()}</div>
          <h1 style={{ fontSize: "clamp(36px,6vw,68px)", lineHeight: 1.02, margin: "18px 0 16px", fontWeight: 950 }}>One Loyalty Experience.<br /><span style={{ color: "#8ee7ff" }}>Every Country.</span></h1>
          <p style={{ fontSize: 20, lineHeight: 1.55, opacity: .9, margin: 0 }}>Businesses attract customers. Customers receive eligible GBK rewards. Founders build business networks.</p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
            <Link href="/?role=founder" style={{ textDecoration: "none", background: "#7c3aed", color: "#fff", padding: "14px 22px", borderRadius: 14, fontWeight: 900 }}>🌍 Start as Founder →</Link>
            <Link href="/?role=merchant" style={{ textDecoration: "none", background: "#16a34a", color: "#fff", padding: "14px 22px", borderRadius: 14, fontWeight: 900 }}>🏪 Register / Claim Business →</Link>
            <Link href="/?role=customer" style={{ textDecoration: "none", background: "#1677ff", color: "#fff", padding: "14px 22px", borderRadius: 14, fontWeight: 900 }}>🛍️ Find Businesses →</Link>
          </div>
        </div>

        <section style={{ background: "#fff", borderRadius: 26, padding: 24, boxShadow: "0 22px 70px #001b4425", marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 26 }}>🚀 How the promotion funnel works</h2>
          <p style={{ margin: "0 0 20px", color: "#5a6a82" }}>A simple path from promotion to real merchant activity and verified purchases.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10 }}>
            {steps.map(([icon, title, text], i) => (
              <div key={title} style={{ position: "relative", padding: 16, borderRadius: 18, background: i % 2 ? "#f4f7ff" : "#f7fbff", border: "1px solid #e5ebf5" }}>
                <div style={{ fontSize: 28 }}>{icon}</div>
                <strong style={{ display: "block", marginTop: 8 }}>{title}</strong>
                <small style={{ display: "block", marginTop: 5, lineHeight: 1.4, color: "#607089" }}>{text}</small>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginBottom: 28 }}>
          {[
            ["🌍", "For Founders", "Build your own business network with GBK Loyalty.", ["Connect wallet", "Verify Founder membership", "Get your referral link", "Bring businesses", "Track eligible activity"], "#7c3aed", "/?role=founder"],
            ["🏪", "For Merchants", "Bring your business into a digital loyalty ecosystem.", ["Find or claim business", "Connect merchant wallet", "Choose loyalty percentage", "Fund required GBK balance", "Activate"], "#16a34a", "/?role=merchant"],
            ["🛍️", "For Customers", "Find participating businesses and complete eligible purchases.", ["Find a business", "Shop / pay locally", "Verify purchase", "Receive eligible GBK reward"], "#1677ff", "/?role=customer"],
          ].map(([icon, title, text, items, accent, href]) => (
            <div key={title as string} style={{ background: "#fff", borderRadius: 24, padding: 24, border: "1px solid #e6ecf5", boxShadow: "0 12px 35px #09234d12" }}>
              <div style={{ fontSize: 34 }}>{icon}</div>
              <h2 style={{ margin: "8px 0 8px" }}>{title}</h2>
              <p style={{ color: "#5c6b82", lineHeight: 1.5, minHeight: 48 }}>{text}</p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>{(items as string[]).map(x => <li key={x}>{x}</li>)}</ul>
              <Link href={href as string} style={{ display: "inline-block", marginTop: 8, background: accent as string, color: "#fff", padding: "12px 16px", borderRadius: 12, textDecoration: "none", fontWeight: 850 }}>Continue →</Link>
            </div>
          ))}
        </section>

        <section style={{ background: "linear-gradient(135deg,#102d5e,#164e91)", color: "#fff", borderRadius: 26, padding: 28, marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 850, color: "#8ee7ff" }}>🌎 GLOBAL CREATOR PROGRAM</div>
              <h2 style={{ fontSize: 32, margin: "8px 0" }}>Promote GBK Loyalty in your country</h2>
              <p style={{ lineHeight: 1.6, opacity: .9 }}>Creators can share a Founder referral link, introduce businesses, help owners activate and track genuine business-network activity.</p>
              <p style={{ fontSize: 13, opacity: .75 }}>Rewards and allocations are subject to the applicable GBK program rules; examples are not guaranteed income.</p>
              <Link href="/?role=founder" style={{ display: "inline-block", marginTop: 8, background: "#fff", color: "#12335f", padding: "12px 17px", borderRadius: 12, textDecoration: "none", fontWeight: 900 }}>Join as Founder →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["Social media", "Creators", "Local communities", "Business outreach"].map(x => <div key={x} style={{ background: "#ffffff12", border: "1px solid #ffffff20", borderRadius: 15, padding: 18, fontWeight: 800 }}>✓ {x}</div>)}
            </div>
          </div>
        </section>

        <section style={{ background: "#fff", borderRadius: 24, padding: 24, border: "1px solid #e6ecf5", marginBottom: 28 }}>
          <h2 style={{ marginTop: 0 }}>🔗 Your global promotion link</h2>
          <p style={{ color: "#5c6b82" }}>Use this page as the main link in social posts, creator campaigns, WhatsApp messages and business outreach.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <code style={{ flex: 1, minWidth: 250, padding: 13, borderRadius: 12, background: "#f3f6fa", border: "1px solid #e2e8f0" }}>https://loyalty.gbkai.com/global</code>
            <button onClick={copyLink} style={{ border: 0, borderRadius: 12, padding: "12px 18px", background: "#102d5e", color: "#fff", fontWeight: 850, cursor: "pointer" }}>{copied ? "✓ Copied" : "Copy Funnel Link"}</button>
          </div>
        </section>

        <footer style={{ textAlign: "center", color: "#66758b", padding: "8px 0" }}>
          <strong>GBK Loyalty</strong> • One Loyalty Experience. Every Country. • <Link href="/" style={{ color: "#164e91" }}>Open platform</Link>
        </footer>
      </section>
    </main>
  );
}
