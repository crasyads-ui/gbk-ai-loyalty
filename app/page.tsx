"use client";
import { useState } from "react";

const offers=[["🏨","Hotels & Resorts","Up to 10% GBK","Stay and earn"],["🍽️","Restaurants & Cafés","Up to 5% GBK","Dine and earn"],["🛍️","Stores & Supermarkets","2–10% GBK","Shop and earn"],["🔧","Local Services","Up to 5% GBK","Use and earn"]];

export default function Home(){
 const [query,setQuery]=useState("");
 const scroll=()=>document.getElementById("offers")?.scrollIntoView({behavior:"smooth"});
 return <main className="shell">
  <header className="topbar"><div className="brand"><span className="brandMark">G</span><div><strong>GBK AI</strong><small>LOYALTY</small></div></div><button className="walletBtn">Connect Wallet</button></header>
  <section className="hero"><div className="eyebrow">🌐 GLOBAL LOYALTY</div><h1>Shop • Earn • Hold • Swap • Transfer</h1><p>Discover businesses with GBK rewards and earn from eligible purchases.</p>
   <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="What are you looking for?"/><button onClick={scroll}>Search</button></div>
   <div className="suggestions"><button onClick={()=>setQuery("restaurants with GBK rewards")}>🍽️ Restaurants</button><button onClick={()=>setQuery("hotels with GBK offers")}>🏨 Hotels</button><button onClick={()=>setQuery("shops near me")}>🛍️ Shops</button></div>
  </section>
  <section className="stats"><div><b>0 GBK</b><span>Rewards earned</span></div><div><b>0</b><span>Reward transactions</span></div><button>👛 Connect wallet</button></section>
  <section id="offers"><div className="sectionHead"><div><span className="eyebrow">🎁 DISCOVER</span><h2>GBK Rewards Near You</h2></div><button className="textBtn">View all</button></div>
   <div className="grid">{offers.map(([icon,title,reward,note])=><article className="card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><strong>{reward}</strong><p>{note} with participating businesses.</p><span className="arrow">›</span></article>)}</div>
  </section>
  <section className="how"><span className="eyebrow">HOW IT WORKS</span><h2>Simple for customers. Flexible for merchants.</h2><div className="steps"><div><b>01</b><h3>Find</h3><p>Use GBK AI to discover participating businesses and offers.</p></div><div><b>02</b><h3>Purchase</h3><p>Complete an eligible purchase and verify the transaction.</p></div><div><b>03</b><h3>Earn</h3><p>GBK rewards move from the merchant reward balance to your wallet.</p></div></div></section>
  <section className="merchant"><div><span className="eyebrow">FOR BUSINESSES</span><h2>Turn every customer into a loyal customer.</h2><p>Register your business, maintain a GBK reward balance and create store-wide or product-specific offers.</p></div><button>Register as Merchant →</button></section>
  <nav className="bottomNav"><a className="active">⌂<span>Home</span></a><a>⌕<span>Explore</span></a><a>🎁<span>Rewards</span></a><a>👛<span>Wallet</span></a><a>☻<span>Profile</span></a></nav>
 </main>;
}