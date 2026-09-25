"use client";

import { useEffect, useState } from "react";
import { getStoredSession, loyaltyApi, signIn, signOut, signUp, type LoyaltySession } from "../lib/loyalty";

const businessCategories = ["All Products & Services","Hotels & Resorts","Restaurants & Cafés","Stores & Supermarkets","Groceries & Supermarkets","Fashion & Apparel","Electronics","Pharmacies & Health Stores","Salons & Beauty","AC Repair","Plumbing & Electrical","Home Services","Automotive & EV","Fuel & Charging","Travel Agencies","Flights & Holidays","Taxis & Transport","Parcel & Logistics","Education & Courses","Spoken English","Healthcare & Clinics","Real Estate","Agriculture & Farm Services","Seeds & Fertilizer","Farm Equipment","Crop Advisory","Legal Services","Accounting","Insurance","IT & Web Development","Digital Marketing","Events & Weddings","Fitness & Sports","Professional Services","Local Shops","Wholesale & Distribution","Manufacturing","Construction","Cleaning Services","Pet Services"];

const offers = [
  ["🏨","Hotels & Resorts","Up to 10% GBK","Stay and earn"],
  ["✈️","Tours & Travel","Up to 10% GBK","Travel and earn"],
  ["🍽️","Restaurants & Cafés","Up to 5% GBK","Dine and earn"],
  ["🛍️","Stores & Supermarkets","2–10% GBK","Shop and earn"],
  ["🏠","Real Estate","GBK offers","Property services and leads"],
  ["🔧","Local Services","Up to 20% GBK","Use and earn"],
];

const languages = ["English","हिन्दी","తెలుగు","বাংলা","தமிழ்","मराठी","Español","العربية","Français","Português"];
const countries = ["Global","India","United Arab Emirates","United States","United Kingdom","Singapore","Australia","Canada","Saudi Arabia","Malaysia","Germany","France","Italy","Spain","Portugal","Netherlands","Belgium","Switzerland","Austria","Sweden","Norway","Denmark","Finland","Ireland","New Zealand","Japan","South Korea","China","Hong Kong","Thailand","Indonesia","Philippines","Vietnam","Bangladesh","Sri Lanka","Nepal","Pakistan","South Africa","Nigeria","Kenya","Egypt","Turkey","Brazil","Mexico","Argentina","Colombia","Chile","Peru"];

const roles = [
  {icon:"👤",title:"Customer",text:"Ask GBK AI for products or services, pay the merchant normally and receive eligible GBK Loyalty rewards.",items:["Earn GBK","Hold • Swap • Transfer"]},
  {icon:"🏪",title:"Merchant",text:"Register your business, accept the lead terms, choose a loyalty offer and maintain GBK reward balance in advance.",items:["5%–20% or Custom","Automatic rewards"]},
  {icon:"🌍",title:"Founder",text:"Country or Global Founder Members can onboard businesses and receive the Founder allocation from verified loyalty sales.",items:["Add users","Add businesses","Track earnings"]},
];

export default function Home() {
  const [query,setQuery] = useState("");
  const [language,setLanguage] = useState("English");
  const [country,setCountry] = useState("Global");
  const [role,setRole] = useState<string|null>(null);
  const [merchantOffer,setMerchantOffer] = useState("10%");
  const [customOffer,setCustomOffer] = useState("25");
  const [shareNotice,setShareNotice] = useState("");
  const [installPrompt,setInstallPrompt] = useState<any>(null);
  const [installed,setInstalled] = useState(false);
  const [paymentMethod,setPaymentMethod] = useState("LOCAL_CURRENCY");
  const [paymentCurrency,setPaymentCurrency] = useState("INR");
  const [paymentDetails,setPaymentDetails] = useState("");
  const [session,setSession] = useState<LoyaltySession|null>(null);
  const [authMode,setAuthMode] = useState<"login"|"signup">("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [fullName,setFullName] = useState("");
  const [authNotice,setAuthNotice] = useState("");
  const [apiBusy,setApiBusy] = useState(false);
  const [searchResults,setSearchResults] = useState<any[]>([]);
  const [selectedMerchant,setSelectedMerchant] = useState<any|null>(null);
  const [merchantBusinessName,setMerchantBusinessName]=useState("");
  const [merchantOwnerName,setMerchantOwnerName]=useState("");
  const [merchantContact,setMerchantContact]=useState("");
  const [merchantCity,setMerchantCity]=useState("");
  const [merchantCategory,setMerchantCategory]=useState(businessCategories[0]);
  const isIndia = country === "India";

  useEffect(() => {
    const w = window as any;
    const handler = (event:any) => { event.preventDefault(); setInstallPrompt(event); };
    w.addEventListener("beforeinstallprompt",handler);
    setInstalled(w.matchMedia("(display-mode: standalone)").matches);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
    const stored = getStoredSession();
    if (stored) setSession(stored);
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
  const ensureProfile = async (s:LoyaltySession, roleName:"customer"|"merchant"|"founder") => {
    return loyaltyApi(s,"profile_upsert",{role:roleName,full_name:fullName,country});
  };
  const doAuth = async () => {
    setApiBusy(true); setAuthNotice("");
    try {
      const s = authMode === "login" ? await signIn(email,password) : await signUp(email,password,fullName);
      if (!s) { setAuthNotice("Account created. Check your email to confirm the account, then sign in."); return; }
      setSession(s); await ensureProfile(s, "customer"); setRole("Customer"); setAuthNotice("Signed in successfully.");
    } catch(e:any) { setAuthNotice(e.message || "Authentication failed"); }
    finally { setApiBusy(false); }
  };
  const doSearch = async () => {
    const q=query.trim(); if(q.length<2){setAuthNotice("Please enter what you need.");return;}
    if(!session){setRole("Auth");setAuthNotice("Sign in first to search registered GBK Loyalty businesses.");return;}
    setApiBusy(true); setAuthNotice("");
    try { const r=await loyaltyApi(session,"search",{query:q,country}); setSearchResults(r.results||[]); document.getElementById("searchResults")?.scrollIntoView({behavior:"smooth"}); }
    catch(e:any){setAuthNotice(e.message||"Search failed");} finally {setApiBusy(false);}
  };
  const createOrderFor = async (m:any) => {
    if(!session){setRole("Auth");return;}
    const amount=window.prompt("Enter purchase/order amount in local currency:");
    if(!amount || !Number.isFinite(Number(amount)) || Number(amount)<=0) return;
    setApiBusy(true);
    try {
      await loyaltyApi(session,"create_order",{merchant_id:m.id,amount_minor:Math.round(Number(amount)*100),currency:country==="India"?"INR":"USD",request_text:query,category:m.category,country,order_source:"GBK_AI"});
      setAuthNotice("Order request created. Payment must be completed and verified before GBK reward settlement.");
    } catch(e:any){setAuthNotice(e.message||"Order creation failed");} finally {setApiBusy(false);}
  };

  const shareBusiness = async (businessName:string, businessUrl?:string) => {
    const url = businessUrl || window.location.href;
    const text = `Check out ${businessName} on GBK AI Loyalty. Discover participating businesses and earn eligible GBK rewards from qualifying purchases.`;
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({title: businessName, text, url}))) {
        await navigator.share({title: businessName, text, url});
        setShareNotice(`${businessName} was shared successfully.`);
      } else {
        await navigator.clipboard?.writeText(`${text} ${url}`);
        setShareNotice(`Business link copied. Share it on WhatsApp, Facebook, Instagram or other social channels. Customer sharing does not create a referral reward.`);
      }
    } catch {
      setShareNotice("Share cancelled or unavailable on this device.");
    }
  };

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
          <button className="walletBtn" onClick={()=>setRole(session ? "Customer" : "Auth")}>{session ? "Account" : "Sign in"}</button>
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
        <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask GBK AI for anything: product, service, agriculture, hotel, repair, travel..."/><button onClick={doSearch} disabled={apiBusy}>{apiBusy ? "Searching…" : "Ask AI"}</button></div>
        <div className="suggestions">
          <button onClick={()=>setQuery("restaurants with GBK rewards")}>🍽️ Restaurants</button>
          <button onClick={()=>setQuery("hotels with GBK offers")}>🏨 Hotels</button>
          <button onClick={()=>setQuery("tours and travel")}>✈️ Travel</button>
          <button onClick={()=>setQuery("AC repair near me")}>🔧 Services</button><button onClick={()=>setQuery("agriculture products or farm service near me")}>🌾 Agriculture</button>
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
          <h2>GBK AI provides leads + orders</h2>
          <p>GBK AI searches eligible registered businesses for the customer request and can automatically create and route the order/request to the selected merchant. The merchant controls the actual product/service, price and fulfilment.</p>
          <div className="status">🟢 Merchant active <span>Eligible for GBK AI leads + orders</span></div>
          <div className="status paused">⏸ Reward balance low <span>Top up GBK to receive new reward-eligible orders</span></div>
        </div>
      </section>

      <section className="founderWorkspace">
        <div className="sectionHead"><div><span className="eyebrow">FOUNDER NETWORK</span><h2>Country Founders can build the local GBK network</h2><p>Country Founders can add customers/users and businesses in their assigned country. Global Founders can add users and businesses globally.</p></div></div>
        <div className="founderGrid">
          <div className="founderPanel"><div className="roleIcon">👥</div><h3>Add User</h3><p>Invite customers, community members and prospective users into GBK Loyalty.</p><button className="primary" onClick={()=>setRole("FounderUser")}>＋ Add User</button></div>
          <div className="founderPanel"><div className="roleIcon">🏪</div><h3>Add Business</h3><p>Register hotels, restaurants, shops, services and other legitimate businesses.</p><button className="primary" onClick={()=>setRole("FounderBusiness")}>＋ Add Business</button></div>
          <div className="founderPanel"><div className="roleIcon">📋</div><h3>My Network</h3><p>View businesses added, users invited, active merchants, leads and loyalty activity.</p><button className="secondary" onClick={()=>setRole("Founder")}>Open Founder Dashboard →</button></div>
        </div>
        <div className="categoryStrip"><b>Business categories:</b>{businessCategories.map(x=><span key={x}>{x}</span>)}</div>
      </section>

      <section className="merchantRules">
        <div><span className="eyebrow">MERCHANT TERMS</span><h2>Simple rules before activation</h2></div>
        <div className="ruleGrid">
          <div><b>01 · 100% order balance</b><p>Before an eligible order proceeds, the merchant must have 100% of the GBK value required for that order’s selected loyalty percentage. No partial funding.</p></div>
          <div><b>02 · Choose loyalty</b><p>Merchant selects 5%, 10%, 15%, 20% or a custom loyalty percentage.</p></div>
          <div><b>03 · Automatic split</b><p>The selected merchant offer is allocated 60% to the customer, 20% to the Founder/referrer and 20% to the GBK platform.</p></div>
          <div><b>04 · Lead commission</b><p>Merchant can accept a separate lead commission before receiving eligible leads.</p></div>
          <div><b>05 · Verified transaction</b><p>No reward is released merely because an order was sent or a payment button was clicked. Payment/order completion must be verified.</p></div>
          <div><b>06 · Insufficient balance</b><p>If the full required GBK balance is unavailable, the reward-eligible order is paused until the merchant funds enough GBK.</p></div>
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
          <article className="card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><strong>{reward}</strong><p>{note} with participating businesses.</p><button className="shareBusinessBtn" onClick={()=>shareBusiness(title)}>📤 Share Business</button><span className="arrow">›</span></article>
        )}</div>
      </section>

      <section className="how">
        <span className="eyebrow">HOW IT WORKS</span><h2>Ask AI → Find business → Send order → Verify → Reward.</h2>
        <div className="steps">
          <div><b>01</b><h3>Ask</h3><p>Customer asks GBK AI for any product or service, including agriculture and local needs.</p></div>
          <div><b>02</b><h3>Route</h3><p>GBK AI searches registered eligible businesses and sends the request/order to the selected merchant.</p></div>
          <div><b>03</b><h3>Complete & Reward</h3><p>Merchant completes the order, payment is verified, then the merchant-funded GBK allocation is distributed automatically.</p></div>
        </div>
      </section>

      <section className="merchant">
        <div><span className="eyebrow">FOR BUSINESSES</span><h2>Activate loyalty. Receive eligible leads.</h2><p>Register any legitimate product or service business, accept the commercial terms, choose 5%–20% or a custom percentage, connect your wallet and maintain enough GBK reward balance for eligible orders.</p></div>
        <button onClick={()=>setRole("Merchant")}>Register as Merchant →</button>
      </section>

      {role && <div className="modalBackdrop" onClick={()=>setRole(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <button className="close" onClick={()=>setRole(null)}>×</button>
          <div className="roleIcon">{roles.find(r=>r.title===role)?.icon || (role==="FounderUser" ? "👥" : role==="FounderBusiness" ? "🏪" : "🌍")}</div>
          <h2>{role} registration</h2>
          {role==="Auth" ? <>
            <p>Use your GBK Loyalty account. Your account is used to protect merchant, order and reward records.</p>
            {authMode==="signup" && <input placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)}/>}
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
            <button className="primary" onClick={doAuth} disabled={apiBusy}>{apiBusy ? "Please wait…" : authMode==="login" ? "Sign in" : "Create account"}</button>
            <button className="secondary" onClick={()=>setAuthMode(authMode==="login"?"signup":"login")}>{authMode==="login" ? "Create a new account" : "I already have an account"}</button>
          </> : role==="FounderUser" ? <>
            <p>Add a user to your Founder network. Country Founders are restricted to their assigned country; Global Founders can select any country.</p>
            <input placeholder="User full name"/><input placeholder="Mobile or email"/>
            <select className="modalSelect"><option>Customer</option><option>Merchant prospect</option></select>
            <select className="modalSelect"><option>{country === "Global" ? "Select country" : country}</option>{countries.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select>
            <label className="check"><input type="checkbox"/> I confirm this person has agreed to be contacted/invited.</label>
          </> : role==="FounderBusiness" ? <>
            <p>Add a business to the Founder network. The business remains responsible for its own products, prices, payments and loyalty funding.</p>
            <input placeholder="Business name"/><select className="modalSelect">{businessCategories.map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="Owner / contact name"/><input placeholder="Mobile or email"/><input placeholder="City"/>
            <select className="modalSelect"><option>{country === "Global" ? "Select country" : country}</option>{countries.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="Address"/><input placeholder="Website (optional)"/>
            <label className="check"><input type="checkbox"/> Business owner has agreed to the listing and GBK Loyalty terms.</label>
          </> : role==="Merchant" ? <>
            <p>Start your merchant setup. You will confirm your loyalty and lead terms before activation.</p>
            <input placeholder="Business name" value={merchantBusinessName} onChange={e=>setMerchantBusinessName(e.target.value)}/>
            <input placeholder="Owner name" value={merchantOwnerName} onChange={e=>setMerchantOwnerName(e.target.value)}/>
            <input placeholder="Mobile or email" value={merchantContact} onChange={e=>setMerchantContact(e.target.value)}/>
            <select className="modalSelect" value={merchantCategory} onChange={e=>setMerchantCategory(e.target.value)}>{businessCategories.map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="City" value={merchantCity} onChange={e=>setMerchantCity(e.target.value)}/>
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
            <div className="paymentBox">
              <b>Merchant payment</b>
              <small>Customer pays you directly in your local currency. GBK does not receive the customer payment.</small>
              <select className="modalSelect" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                <option value="LOCAL_CURRENCY">Local currency payment</option>
                {!isIndia && <option value="USDT">USDT — optional</option>}
              </select>
              <input className="modalInput" value={paymentCurrency} onChange={e=>setPaymentCurrency(e.target.value.toUpperCase())} placeholder="Currency code e.g. INR, AED, USD" maxLength={3}/>
              <input className="modalInput" value={paymentDetails} onChange={e=>setPaymentDetails(e.target.value)} placeholder={paymentMethod==="USDT" ? "USDT wallet/payment details" : "UPI, bank, payment account or provider details"}/>
              {isIndia && <small>India: INR/local payment only. USDT is disabled for this merchant flow.</small>}
            </div>
            <label className="check"><input type="checkbox"/> I accept that GBK provides leads and loyalty benefits; the merchant controls the product/service and its business policy.</label>
          </> : <>
            <p>Start with simple registration. Wallet connection, verification and role-specific setup come next.</p>
            <input placeholder="Full name"/>
            <input placeholder="Mobile or email"/>
          </>}
          <button className="primary" onClick={async ()=>{ if(role==="Merchant"){ if(!session){setRole("Auth");return;} setApiBusy(true); try { await ensureProfile(session,"merchant"); const r=await loyaltyApi(session,"merchant_register",{business_name:merchantBusinessName,category:merchantCategory,country,city:merchantCity,phone:merchantContact,loyalty_offer_percent:selectedOffer,lead_commission_percent:0,payment_currency:paymentCurrency,payment_method:paymentMethod,payment_details:{details:paymentDetails,owner:merchantOwnerName}}); setAuthNotice("Merchant application submitted. The business must accept the invitation/terms and fund GBK before activation."); setRole(null); } catch(e:any){setAuthNotice(e.message||"Merchant registration failed");} finally {setApiBusy(false);} } else if(role==="FounderUser"){alert("User invitation workflow will be connected to Founder authentication next.");} else if(role==="FounderBusiness"){alert("Business referral workflow will be connected to Founder authentication next.");} }}>Continue →</button>
          <small>No token transfer happens from this screen.</small>
        </div>
      </div>}

      <nav className="bottomNav"><a className="active">⌂<span>Home</span></a><a onClick={()=>setRole("Customer")}>⌕<span>Explore</span></a><a onClick={()=>setRole("Customer")}>🎁<span>Rewards</span></a><a onClick={()=>setRole("Customer")}>👛<span>Wallet</span></a><a onClick={()=>setRole("Customer")}>☻<span>Profile</span></a></nav>
    </main>
  );
}
