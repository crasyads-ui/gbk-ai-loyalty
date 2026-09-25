"use client";

import { useEffect, useState } from "react";

const offers = [
  ["🏨","Hotels & Resorts","Up to 10% GBK","Stay and earn"],
  ["✈️","Tours & Travel","Up to 10% GBK","Travel and earn"],
  ["🍽️","Restaurants & Cafés","Up to 5% GBK","Dine and earn"],
  ["🛍️","Stores & Supermarkets","2–10% GBK","Shop and earn"],
  ["🏠","Real Estate","GBK offers","Property services and leads"],
  ["🔧","Local Services","Up to 20% GBK","Use and earn"],
];

const languages = ["English","हिन्दी","తెలుగు","বাংলা","தமிழ்","मराठी","Español","العربية","Français","Português"];
const countries = ["Global","India","United Arab Emirates","United States","United Kingdom","Singapore","Australia","Canada","Saudi Arabia","Malaysia"];

const roles = [
  {icon:"👤",title:"Customer",text:"Ask GBK AI for products or services, pay the merchant normally and receive eligible GBK Loyalty rewards.",items:["Earn GBK","Hold • Swap • Transfer"]},
  {icon:"🏪",title:"Merchant",text:"Register your business, accept the lead terms, choose a loyalty offer and maintain GBK reward balance in advance.",items:["5%–20% or Custom","Automatic rewards"]},
  {icon:"🌍",title:"Founder",text:"Country or Global Founder Members can onboard businesses and receive the Founder allocation from verified loyalty sales.",items:["Add businesses","Track earnings"]},
];

export default function Home() {
  const [query,setQuery] = useState("");
  const [language,setLanguage] = useState("English");
  const [country,setCountry] = useState("Global");
  const [role,setRole] = useState<string|null>(null);
  const [merchantOffer,setMerchantOffer] = useState("10%");
  const [customOffer,setCustomOffer] = useState("25");
  const [installPrompt,setInstallPrompt] = useState<any>(null);
  const [installed,setInstalled] = useState(false);

  useEffect(() => {
    const w = window as any;
    const handler = (event:any) => { event.preventDefault(); setInstallPrompt(event); };
    w.addEventListener("beforeinstallprompt",handler);
    setInstalled(w.matchMedia("(display-mode: standalone)").matches);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
    return () => w.removeEventListener("beforeinstallprompt",handler);
  }, []);

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
    } else {
      alert("On iPhone/iPad: Share → Add to Home Screen. On Android: browser menu → Install app.");
    }
  };

  const scroll = () => document.getElementById("roles")?.scrollIntoView({behavior:"smooth"});

  const selectedOffer = merchantOffer === "custom" ? Number(customOffer || 0) : Number(merchantOffer.replace("%",""));
  const customerShare = selectedOffer * 0.6;
  const founderShare = selectedOffer * 0.2;
  const platformShare = selectedOffer * 0.2;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brandMark">G</span><div><strong>GBK AI</strong><small>LOYALTY</small></div></div>
        <div className="topActions">
          <select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language">{languages.map(x=><option key={x}>{x}</option>)}</select>
          <select value={country} onChange={e=>setCountry(e.target.value)} aria-label="Country">{countries.map(x=><option key={x}>{x}</option>)}</select>
          <button className="walletBtn" onClick={()=>setRole("Customer")}>Connect Wallet</button>
        </div>
      </header>

      <div className="globalBar">
        <span>🌐 {country}</span><span>🗣️ {language}</span>
        {!installed && <button className="installBtn" onClick={install}>{installPrompt ? "📲 Install App" : "📲 PWA App"}</button>}
      </div>

      <section className="hero">
        <div className="eyebrow">🌐 GLOBAL CUSTOMER LOYALTY</div>
        <h1>Ask • Shop • Earn • Hold • Swap • Transfer</h1>
        <p>GBK AI brings customers to participating businesses and provides a simple, merchant-funded GBK Loyalty benefit after a verified qualifying transaction.</p>
        <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="What do you need? e.g. hotel, restaurant, AC repair"/><button onClick={scroll}>Find</button></div>
        <div className="suggestions">
          <button onClick={()=>setQuery("restaurants with GBK rewards")}>🍽️ Restaurants</button>
          <button onClick={()=>setQuery("hotels with GBK offers")}>🏨 Hotels</button>
          <button onClick={()=>setQuery("tours and travel")}>✈️ Travel</button>
          <button onClick={()=>setQuery("AC repair near me")}>🔧 Services</button>
        </div>
      </section>

      <section id="roles" className="roleSection">
        <div className="sectionHead"><div><span className="eyebrow">ONE APP • THREE ROLES</span><h2>Choose how you use GBK Loyalty</h2></div></div>
        <div className="roleGrid">{roles.map(r=>
          <button className="roleCard" key={r.title} onClick={()=>setRole(r.title)}>
            <div className="roleIcon">{r.icon}</div><h3>{r.title}</h3><p>{r.text}</p>
            <div>{r.items.map(i=><span className="roleTag" key={i}>{i}</span>)}</div><b>Get started →</b>
          </button>
        )}</div>
      </section>

      <section className="split">
        <div className="panel">
          <span className="eyebrow">MERCHANT-FUNDED LOYALTY</span>
          <h2>One offer. Automatic distribution.</h2>
          <p>The merchant agrees to the loyalty offer and maintains GBK in advance. The merchant does not manually approve every reward.</p>
          <div className="formula"><span>Customer</span><strong>60%</strong><span>Founder</span><strong>20%</strong><span>Platform</span><strong>20%</strong></div>
          <small>Example: 10% merchant offer → 6% customer + 2% Founder + 2% platform.</small>
        </div>
        <div className="panel">
          <span className="eyebrow">LEAD MODEL</span>
          <h2>GBK provides leads + loyalty</h2>
          <p>GBK AI connects the customer with the merchant. The merchant controls the actual product/service, price and business policy.</p>
          <div className="status">🟢 Merchant active <span>Eligible for GBK AI leads</span></div>
          <div className="status paused">⏸ Reward balance low <span>Pause new reward-eligible leads</span></div>
        </div>
      </section>

      <section className="merchantRules">
        <div><span className="eyebrow">MERCHANT TERMS</span><h2>Simple rules before activation</h2></div>
        <div className="ruleGrid">
          <div><b>01 · Maintain GBK</b><p>Merchant deposits/approves the reward balance in advance.</p></div>
          <div><b>02 · Choose loyalty</b><p>Merchant selects 5%, 10%, 15%, 20% or a custom loyalty percentage.</p></div>
          <div><b>03 · Automatic split</b><p>The selected merchant offer is allocated 60% to the customer, 20% to the Founder/referrer and 20% to the GBK platform.</p></div>
          <div><b>04 · Lead commission</b><p>Merchant can accept a separate lead commission before receiving eligible leads.</p></div>
          <div><b>05 · Verified transaction</b><p>No reward is released merely because a lead was sent or a payment button was clicked.</p></div>
          <div><b>06 · Returns</b><p>If a completed transaction is refunded, the corresponding reward can be reversed according to the published terms.</p></div>
        </div>
      </section>

      <section className="stats">
        <div><b>0 GBK</b><span>Rewards earned</span></div>
        <div><b>0</b><span>Reward transactions</span></div>
        <button onClick={()=>setRole("Customer")}>👛 Connect wallet</button>
      </section>

      <section id="offers">
        <div className="sectionHead"><div><span className="eyebrow">🎁 DISCOVER</span><h2>GBK Rewards Near You</h2></div><button className="textBtn">View all</button></div>
        <div className="grid">{offers.map(([icon,title,reward,note])=>
          <article className="card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><strong>{reward}</strong><p>{note} with participating businesses.</p><span className="arrow">›</span></article>
        )}</div>
      </section>

      <section className="how">
        <span className="eyebrow">HOW IT WORKS</span><h2>Simple, automatic and traceable.</h2>
        <div className="steps">
          <div><b>01</b><h3>Find</h3><p>GBK AI connects the customer with an eligible business.</p></div>
          <div><b>02</b><h3>Complete</h3><p>Customer pays in local currency and the merchant completes the qualifying sale/service.</p></div>
          <div><b>03</b><h3>Reward</h3><p>After verification, the merchant-funded GBK allocation is distributed automatically.</p></div>
        </div>
      </section>

      <section className="merchant">
        <div><span className="eyebrow">FOR BUSINESSES</span><h2>Activate loyalty. Receive eligible leads.</h2><p>Register your business, accept the commercial terms, choose 5%–20% or a custom percentage, connect your wallet and maintain the required GBK reward balance.</p></div>
        <button onClick={()=>setRole("Merchant")}>Register as Merchant →</button>
      </section>

      {role && <div className="modalBackdrop" onClick={()=>setRole(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <button className="close" onClick={()=>setRole(null)}>×</button>
          <div className="roleIcon">{roles.find(r=>r.title===role)?.icon}</div>
          <h2>{role} registration</h2>
          {role==="Merchant" ? <>
            <p>Start your merchant setup. You will confirm your loyalty and lead terms before activation.</p>
            <input placeholder="Business name"/>
            <input placeholder="Owner name"/>
            <input placeholder="Mobile or email"/>
            <select className="modalSelect" value={merchantOffer} onChange={e=>setMerchantOffer(e.target.value)}>
              <option value="5%">5% loyalty</option>
              <option value="10%">10% loyalty</option>
              <option value="15%">15% loyalty</option>
              <option value="20%">20% loyalty</option>
              <option value="custom">Custom percentage</option>
            </select>
            {merchantOffer === "custom" && <>
              <input className="modalInput" type="number" min="1" max="50" step="0.1" value={customOffer} onChange={e=>setCustomOffer(e.target.value)} placeholder="Custom loyalty percentage"/>
              <small>Enter 1%–50%. The final merchant offer is split 60% Customer / 20% Founder / 20% Platform.</small>
            </>}
            <div className="offerPreview">
              <b>Selected offer: {selectedOffer > 0 ? selectedOffer : 0}%</b>
              <span>Customer {customerShare.toFixed(1)}% · Founder {founderShare.toFixed(1)}% · Platform {platformShare.toFixed(1)}%</span>
            </div>
            <select className="modalSelect" defaultValue="0%"><option>0% lead commission</option><option>5% lead commission</option><option>10% lead commission</option><option>15% lead commission</option><option>20% lead commission</option></select>
            <label className="check"><input type="checkbox"/> I accept that GBK provides leads and loyalty benefits; the merchant controls the product/service and its business policy.</label>
          </> : <>
            <p>Start with simple registration. Wallet connection, verification and role-specific setup come next.</p>
            <input placeholder="Full name"/>
            <input placeholder="Mobile or email"/>
          </>}
          <button className="primary" onClick={()=>alert("Registration form ready. Backend activation will be connected after wallet and verification setup.")}>Continue →</button>
          <small>No token transfer happens from this screen.</small>
        </div>
      </div>}

      <nav className="bottomNav"><a className="active">⌂<span>Home</span></a><a onClick={()=>setRole("Customer")}>⌕<span>Explore</span></a><a onClick={()=>setRole("Customer")}>🎁<span>Rewards</span></a><a onClick={()=>setRole("Customer")}>👛<span>Wallet</span></a><a onClick={()=>setRole("Customer")}>☻<span>Profile</span></a></nav>
    </main>
  );
}
