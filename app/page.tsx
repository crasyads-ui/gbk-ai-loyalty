"use client";
import { useEffect, useState } from "react";

const offers=[["🏨","Hotels & Resorts","Up to 10% GBK","Stay and earn"],["✈️","Tours & Travel","Up to 10% GBK","Travel and earn"],["🍽️","Restaurants & Cafés","Up to 5% GBK","Dine and earn"],["🛍️","Stores & Supermarkets","2–10% GBK","Shop and earn"],["🏠","Real Estate","GBK offers","Property services and leads"],["🔧","Local Services","Up to 5% GBK","Use and earn"]];
const languages=["English","हिन्दी","తెలుగు","বাংলা","தமிழ்","मराठी","Español","العربية","Français","Português"];
const countries=["Global","India","United Arab Emirates","United States","United Kingdom","Singapore","Australia","Canada","Saudi Arabia","Malaysia"];

export default function Home(){
 const [query,setQuery]=useState(""); const [language,setLanguage]=useState("English"); const [country,setCountry]=useState("Global"); const [installPrompt,setInstallPrompt]=useState<any>(null); const [installed,setInstalled]=useState(false);
 useEffect(()=>{const h=(e:any)=>{e.preventDefault();setInstallPrompt(e)}; window.addEventListener("beforeinstallprompt",h); setInstalled(window.matchMedia("(display-mode: standalone)").matches); if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{}); return()=>window.removeEventListener("beforeinstallprompt",h)},[]);
 const install=async()=>{if(installPrompt){await installPrompt.prompt(); setInstallPrompt(null)}else{alert("On iPhone/iPad: use Share → Add to Home Screen. On Android: use the browser menu → Install app or Add to Home screen.")}};
 const scroll=()=>document.getElementById("offers")?.scrollIntoView({behavior:"smooth"});
 return <main className="shell">
  <header className="topbar"><div className="brand"><span className="brandMark">G</span><div><strong>GBK AI</strong><small>LOYALTY</small></div></div><div className="topActions"><select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language">{languages.map(x=><option key={x}>{x}</option>)}</select><select value={country} onChange={e=>setCountry(e.target.value)} aria-label="Country">{countries.map(x=><option key={x}>{x}</option>)}</select><button className="walletBtn">Connect Wallet</button></div></header>
  <div className="globalBar"><span>🌐 {country}</span><span>🗣️ {language}</span>{!installed&&<button className="installBtn" onClick={install}>{installPrompt?"📲 Install App":"📲 PWA App"}</button>}</div>
  <section className="hero"><div className="eyebrow">🌐 GLOBAL LOYALTY</div><h1>Shop • Earn • Hold • Swap • Transfer</h1><p>Discover businesses, travel, properties and services with GBK rewards.</p>
   <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="What are you looking for?"/><button onClick={scroll}>Search</button></div>
   <div className="suggestions"><button onClick={()=>setQuery("restaurants with GBK rewards")}>🍽️ Restaurants</button><button onClick={()=>setQuery("hotels with GBK offers")}>🏨 Hotels</button><button onClick={()=>setQuery("tours and travel")}>✈️ Travel</button><button onClick={()=>setQuery("real estate")}>🏠 Real Estate</button></div>
  </section>
  <section className="stats"><div><b>0 GBK</b><span>Rewards earned</span></div><div><b>0</b><span>Reward transactions</span></div><button>👛 Connect wallet</button></section>
  <section id="offers"><div className="sectionHead"><div><span className="eyebrow">🎁 DISCOVER</span><h2>GBK Rewards Near You</h2></div><button className="textBtn">View all</button></div><div className="grid">{offers.map(([icon,title,reward,note])=><article className="card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><strong>{reward}</strong><p>{note} with participating businesses.</p><span className="arrow">›</span></article>)}</div></section>
  <section className="how"><span className="eyebrow">HOW IT WORKS</span><h2>Simple for customers. Flexible for merchants.</h2><div className="steps"><div><b>01</b><h3>Find</h3><p>Use GBK AI to discover participating businesses, travel offers and property services.</p></div><div><b>02</b><h3>Purchase or Request</h3><p>Complete an eligible purchase or verified request with a participating business.</p></div><div><b>03</b><h3>Earn</h3><p>Eligible GBK rewards move from the merchant reward balance to your wallet.</p></div></div></section>
  <section className="merchant"><div><span className="eyebrow">FOR BUSINESSES</span><h2>Turn every customer into a loyal customer.</h2><p>Register your business, maintain a GBK reward balance and create store-wide or product-specific offers.</p></div><button>Register as Merchant →</button></section>
  <nav className="bottomNav"><a className="active">⌂<span>Home</span></a><a>⌕<span>Explore</span></a><a>🎁<span>Rewards</span></a><a>👛<span>Wallet</span></a><a>☻<span>Profile</span></a></nav>
 </main>;
}