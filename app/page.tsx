"use client";

import { useEffect, useState } from "react";
import { getStoredSession, loyaltyApi, signInAnonymously, connectEvmWallet, getConnectedEvmWallet, approveMerchantRewardDistributor, type LoyaltySession } from "../lib/loyalty";

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
  const [searchFocused,setSearchFocused] = useState(false);
  const [language,setLanguage] = useState("English");
  const [country,setCountry] = useState("Global");
  const [role,setRole] = useState<string|null>(null);
  const [merchantOffer,setMerchantOffer] = useState("10%");
  const [customOffer,setCustomOffer] = useState("25");
  const [shareNotice,setShareNotice] = useState("");
  const [installPrompt,setInstallPrompt] = useState<any>(null);
  const [installed,setInstalled] = useState(false);
  const [paymentGateway,setPaymentGateway] = useState("DIRECT");
  const [paymentAccountRef,setPaymentAccountRef] = useState("");
  const [paymentMethod,setPaymentMethod] = useState("CASH");
  const [paymentCurrency,setPaymentCurrency] = useState("INR");
  const [paymentDetails,setPaymentDetails] = useState("");
  const [merchantWallet,setMerchantWallet] = useState("");
  const [session,setSession] = useState<LoyaltySession|null>(null);
  const [activeWalletRole,setActiveWalletRole] = useState<"customer"|"merchant"|"founder"|null>(null);
  const [authMode,setAuthMode] = useState<"login"|"signup">("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [fullName,setFullName] = useState("");
  const [authNotice,setAuthNotice] = useState("");
  const [apiBusy,setApiBusy] = useState(false);
  const [searchResults,setSearchResults] = useState<any[]>([]);
  const [selectedMerchant,setSelectedMerchant] = useState<any|null>(null);
  const [orderAmount,setOrderAmount] = useState("");
  const [merchantBusinessName,setMerchantBusinessName]=useState("");
  const [merchantOwnerName,setMerchantOwnerName]=useState("");
  const [merchantPhone,setMerchantPhone]=useState("");
  const [merchantEmail,setMerchantEmail]=useState("");
  const [merchantCity,setMerchantCity]=useState("");
  const [merchantCategory,setMerchantCategory]=useState(businessCategories[0]);
  const [walletAddress,setWalletAddress]=useState("");
  const [founderType,setFounderType]=useState<"country"|"global">("country");
  const [founderTier,setFounderTier]=useState("COUNTRY_300");
  const [founderTxHash,setFounderTxHash]=useState("");
  const [founderStatus,setFounderStatus]=useState<any>(null);
  const [merchantStatus,setMerchantStatus]=useState<any>(null);
  const isIndia = country === "India";

  useEffect(() => {
    const w = window as any;
    const handler = (event:any) => { event.preventDefault(); setInstallPrompt(event); };
    w.addEventListener("beforeinstallprompt",handler);
    setInstalled(w.matchMedia("(display-mode: standalone)").matches);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
    const stored = getStoredSession();
    if (stored) setSession(stored);
    try {
      const storedRole = localStorage.getItem("gbk_loyalty_active_role");
      if (storedRole === "customer" || storedRole === "merchant" || storedRole === "founder") setActiveWalletRole(storedRole);
    } catch {}
    getConnectedEvmWallet().then((addr)=>{
      if (addr) setWalletAddress(addr);
    }).catch(()=>{});
    // Restore an existing merchant session directly to Merchant Wallet.
    if (stored) {
      loyaltyApi(stored,"my_data",{}).then((data:any)=>{
        const merchant = (data?.merchants || [])[0];
        const storedWallet = String(data?.profile?.wallet_address || "");
        if (storedWallet) {
          setWalletAddress(storedWallet);
          setMerchantWallet(storedWallet);
        }
        if (merchant) {
          setActiveWalletRole("merchant");
          setMerchantStatus({merchant,merchant_orders:data?.merchant_orders || []});
          try { localStorage.setItem("gbk_loyalty_active_role","merchant"); } catch {}
        }
      }).catch(()=>{});
    }
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
    return loyaltyApi(s,"profile_upsert",{role:roleName,full_name:fullName || "GBK Wallet User",country,wallet_address:walletAddress || merchantWallet || undefined});
  };
  const connectWallet = async (targetRole:"customer"|"merchant"|"founder"="customer") => {
    setApiBusy(true); setAuthNotice("");
    try {
      const address = await connectEvmWallet();
      setWalletAddress(address);
      setMerchantWallet(address);

      let s = session || getStoredSession();

      // A wallet is the role/account boundary. If the connected wallet differs
      // from the wallet stored in the current anonymous session, create a fresh
      // Supabase anonymous session so one wallet cannot inherit another wallet's role.
      if (s) {
        try {
          const current = await loyaltyApi(s, "my_data", {});
          const currentWallet = String(current?.profile?.wallet_address || "").toLowerCase();
          if (currentWallet && currentWallet !== address.toLowerCase()) {
            s = await signInAnonymously();
          }
        } catch {
          s = await signInAnonymously();
        }
      } else {
        s = await signInAnonymously();
      }

      await loyaltyApi(s, "profile_upsert", {
        role: targetRole,
        full_name: fullName || "GBK Wallet User",
        country,
        wallet_address: address
      });

      setSession(s);
      setActiveWalletRole(targetRole);
      try { localStorage.setItem("gbk_loyalty_active_role", targetRole); } catch {}
      setRole(targetRole === "merchant" ? "Merchant" : targetRole === "founder" ? "Founder" : "Customer");
      setAuthNotice(targetRole === "merchant"
        ? "Merchant wallet connected successfully."
        : targetRole === "founder"
          ? "Founder wallet connected successfully."
          : "Customer wallet connected successfully.");
    } catch(e:any) {
      setAuthNotice(e.message || "Wallet connection failed.");
    } finally { setApiBusy(false); }
  };
  const doAuth = async () => connectWallet("customer");
  const openFounder = async () => {
    setRole("Founder");
    if (!session) return;
    try { const r = await loyaltyApi(session,"founder_status",{}); setFounderStatus(r.founder || null); } catch {}
  };
  const openMerchantWallet = async () => {
    setApiBusy(true); setAuthNotice("");
    try {
      let s = session || getStoredSession();
      if (!s) { s = await signInAnonymously(); setSession(s); }
      const data = await loyaltyApi(s,"my_data",{});
      const merchant = (data.merchants || [])[0];
      if (!merchant) { setRole("Merchant"); setAuthNotice("Merchant profile not found. Register as a merchant first."); return; }
      setMerchantStatus({merchant});
      const [live,dataWithOrders] = await Promise.all([
        loyaltyApi(s,"merchant_fund_status",{merchant_id:merchant.id}),
        loyaltyApi(s,"my_data",{})
      ]);
      setMerchantStatus({...live,merchant_orders:dataWithOrders?.merchant_orders || []});
      setRole("MerchantWallet");
    } catch(e:any) {
      setAuthNotice(e.message || "Merchant wallet status could not be loaded.");
    } finally { setApiBusy(false); }
  };
  const openWallet = async () => {
    setApiBusy(true); setAuthNotice("");
    try {
      const s = session || getStoredSession();
      if (s) {
        const data = await loyaltyApi(s,"my_data",{});
        const merchant = (data?.merchants || [])[0];
        const serverWallet = String(data?.profile?.wallet_address || "");
        if (serverWallet) {
          setWalletAddress(serverWallet);
          setMerchantWallet(serverWallet);
        }
        if (merchant) {
          await openMerchantWallet();
          return;
        }
      }
      if (activeWalletRole==="merchant") {
        await openMerchantWallet();
        return;
      }
      if (activeWalletRole==="customer") setRole("Customer");
      else if (activeWalletRole==="founder") setRole("Founder");
      else setRole("Merchant");
    } catch {
      if (activeWalletRole==="merchant") await openMerchantWallet();
      else if (activeWalletRole==="customer") setRole("Customer");
      else if (activeWalletRole==="founder") setRole("Founder");
      else setRole("Merchant");
    } finally { setApiBusy(false); }
  };

  const waitForChainTx = async (txHash:string) => {
    const provider = (window as any).ethereum;
    if (!provider) return;
    for (let i=0;i<30;i++) {
      const receipt = await provider.request({method:"eth_getTransactionReceipt",params:[txHash]}).catch(()=>null);
      if (receipt) {
        if (String(receipt.status).toLowerCase() !== "0x1") throw new Error("GBK approval transaction failed.");
        return;
      }
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    throw new Error("Approval transaction is still pending. Refresh the Merchant Wallet after confirmation.");
  };
  const approveRewardForOrder = async (order:any) => {
    if (!order?.reward_required_raw || Number(order.reward_required_raw)<=0) return;
    setApiBusy(true); setAuthNotice("");
    try {
      const txHash=await approveMerchantRewardDistributor(String(order.reward_required_raw));
      setAuthNotice("GBK reward approval submitted. Waiting for confirmation…");
      await waitForChainTx(txHash);
      const result=await loyaltyApi(session!,"reward_settle",{order_id:order.id});
      setAuthNotice(result?.status==="SETTLED" ? "GBK reward released successfully." : (result?.error || "Reward settlement is pending."));
      await openMerchantWallet();
    } catch(e:any) { setAuthNotice(e.message || "GBK reward approval failed."); }
    finally { setApiBusy(false); }
  };
  const retryRewardSettlement = async (order:any) => {
    if (!session) return;
    setApiBusy(true); setAuthNotice("");
    try {
      const result=await loyaltyApi(session,"reward_settle",{order_id:order.id});
      setAuthNotice(result?.status==="SETTLED" ? "GBK reward released successfully." : (result?.error || "Reward settlement is still pending."));
      await openMerchantWallet();
    } catch(e:any) { setAuthNotice(e.message || "Reward settlement failed."); }
    finally { setApiBusy(false); }
  };

  const verifyFounder = async () => {
    if (!walletAddress) { await connectWallet("founder"); return; }
    if (!session) { await connectWallet("founder"); return; }
    setApiBusy(true); setAuthNotice("");
    try {
      await ensureProfile(session,"founder");
      const r = await loyaltyApi(session,"founder_verify",{wallet_address:walletAddress,founder_type:founderType,founder_tier:founderTier,tx_hash:founderTxHash.trim()});
      setFounderStatus(r.founder || null);
      setAuthNotice(r.verification?.benefits_active ? "Founder verified. 50% minimum GBK reserve is currently maintained." : "Founder transaction verified. Maintain the required 50% GBK reserve to keep Founder benefits active.");
    } catch(e:any) { setAuthNotice(e.message || "Founder verification failed."); }
    finally { setApiBusy(false); }
  };
  const doSearch = async () => {
    const q=query.trim(); if(q.length<2){setAuthNotice("Please enter what you need.");return;}
    setApiBusy(true); setAuthNotice("");
    try {
      let activeSession=session;
      if(!activeSession){
        activeSession=await signInAnonymously();
        setSession(activeSession);
        try{ await loyaltyApi(activeSession,"profile_upsert",{role:"customer",country,wallet_address:walletAddress||null}); }catch{}
      }
      const r=await loyaltyApi(activeSession,"search",{query:q,country});
      setSearchResults(r.results||[]);
      setAuthNotice(r.results?.length ? "" : "No active GBK Loyalty businesses matched this request yet.");
      setTimeout(()=>document.getElementById("searchResults")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
    } catch(e:any){setAuthNotice(e.message||"Search failed");}
    finally {setApiBusy(false);}
  };
  const createOrderFor = async (m:any) => {
    const amount=String(orderAmount||"").trim();
    if(!amount || !Number.isFinite(Number(amount)) || Number(amount)<=0){ setAuthNotice("Enter the purchase/order amount first."); return; }
    setApiBusy(true);
    try {
      let activeSession:any=null;
      try {
        activeSession=JSON.parse(localStorage.getItem("gbk_loyalty_customer_session")||"null");
      } catch {}
      if(!activeSession?.access_token){
        activeSession=await signInAnonymously();
        localStorage.setItem("gbk_loyalty_customer_session",JSON.stringify(activeSession));
      }
      await loyaltyApi(activeSession,"profile_upsert",{role:"customer",country,wallet_address:walletAddress||null});
      const currency = String(m?.payment_currency || (country==="India" ? "INR" : "USD")).toUpperCase();
      const created = await loyaltyApi(activeSession,"create_order",{merchant_id:m.id,amount_minor:Math.round(Number(amount)*100),currency,request_text:query,category:m.category,country,order_source:"GBK_AI"});
      let paid:any;
      try {
        paid = await loyaltyApi(activeSession,"payment_create",{order_id:created.order.id});
      } catch (e:any) {
        // Direct/Cash merchants do not use an online gateway. Keep the order active
        // so the merchant can verify the payment manually.
        if (m?.payment_provider === "DIRECT" || m?.payment_method === "CASH") {
          setAuthNotice("Order sent to the merchant. Pay the merchant directly; the merchant must verify the payment before your GBK reward can be released.");
          setSelectedMerchant(null);
          return;
        }
        throw e;
      }
      if (paid?.payment?.provider === "DIRECT") {
        setAuthNotice("Order sent to the merchant. Pay the merchant directly; the merchant must verify the payment before your GBK reward can be released.");
        setSelectedMerchant(null);
        return;
      }
      if (paid?.payment?.provider === "RAZORPAY") {
        await new Promise<void>((resolve,reject)=>{
          const w:any=window;
          const open=()=>{
            const rzp=new w.Razorpay({
              key:paid.payment.key_id,
              amount:paid.payment.amount,
              currency:paid.payment.currency,
              name:paid.payment.merchant_name,
              description:"GBK AI Loyalty",
              order_id:paid.payment.order_id,
              handler:async(response:any)=>{
                try{
                  const verified=await loyaltyApi(activeSession,"payment_verify",{order_id:paid.payment.gbk_order_id,payment_id:response.razorpay_payment_id,signature:response.razorpay_signature});
                  setAuthNotice(verified?.settlement?.status==="REWARD_PREPARED" ? "Payment verified and GBK reward prepared." : "Payment verified. Reward settlement is waiting for merchant completion or funding.");
                }catch(e:any){setAuthNotice(e.message||"Payment verification failed.");}
                resolve();
              },
              modal:{ondismiss:()=>resolve()}
            });
            rzp.on("payment.failed",(r:any)=>{setAuthNotice(r?.error?.description||"Payment failed.");resolve();});
            rzp.open();
          };
          if(w.Razorpay){open();return;}
          const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.onload=open; s.onerror=()=>reject(new Error("Payment checkout could not load")); document.body.appendChild(s);
        });
      }
    } catch(e:any){setAuthNotice(e.message||"Payment setup failed");} finally {setApiBusy(false);}
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

  const registerMerchant = async () => {
    if (role !== "Merchant") return;
    setApiBusy(true);
    setAuthNotice("");
    try {
      const existingSession = session || getStoredSession();
      if (existingSession) {
        const existingData = await loyaltyApi(existingSession,"my_data",{});
        const existingMerchant = (existingData?.merchants || [])[0];
        if (existingMerchant) {
          setApiBusy(false);
          await openMerchantWallet();
          return;
        }
      }      if (!merchantWallet) {
        await connectWallet("merchant");
        return;
      }
      let activeSession = session || getStoredSession();
      if (!activeSession) activeSession = await signInAnonymously();
      setSession(activeSession);
      await ensureProfile(activeSession, "merchant");
      await loyaltyApi(activeSession, "merchant_register", {
        business_name: merchantBusinessName.trim(),
        owner_name: merchantOwnerName.trim(),
        category: merchantCategory,
        country,
        city: merchantCity.trim(),
        phone: merchantPhone || null,
        email: merchantEmail || null,
        loyalty_offer_percent: selectedOffer,
        lead_commission_percent: 0,
        payment_provider: paymentGateway,
        payment_account_ref: paymentGateway === "DIRECT" ? null : (paymentAccountRef || null),
        payment_currency: paymentCurrency,
        payment_method: paymentMethod,
        payment_details: { details: paymentDetails, owner: merchantOwnerName },
      });
      setAuthNotice("Merchant registration submitted successfully.");
      setRole(null);
    } catch (e: any) {
      setAuthNotice(e?.message || "Merchant registration failed");
    } finally {
      setApiBusy(false);
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
          <button className="walletBtn" onClick={openWallet}>{activeWalletRole==="merchant" ? "Merchant Wallet" : activeWalletRole==="customer" ? "Customer Wallet" : activeWalletRole==="founder" ? "Founder" : "Wallet"}</button>
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
        <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>{setSearchFocused(true);setTimeout(()=>document.querySelector(".search")?.scrollIntoView({behavior:"smooth",block:"center"}),120)}} onBlur={()=>setTimeout(()=>setSearchFocused(false),250)} placeholder="Ask GBK AI for anything: product, service, agriculture, hotel, repair, travel..."/><button onMouseDown={()=>setSearchFocused(true)} onClick={doSearch} disabled={apiBusy}>{apiBusy ? "Searching…" : "Ask AI"}</button></div>
        <div className="suggestions">
          <button onClick={()=>setQuery("restaurants with GBK rewards")}>🍽️ Restaurants</button>
          <button onClick={()=>setQuery("hotels with GBK offers")}>🏨 Hotels</button>
          <button onClick={()=>setQuery("tours and travel")}>✈️ Travel</button>
          <button onClick={()=>setQuery("AC repair near me")}>🔧 Services</button><button onClick={()=>setQuery("agriculture products or farm service near me")}>🌾 Agriculture</button>
        </div>
      </section>

      {searchResults.length > 0 && <section id="searchResults" className="roleSection">
        <div className="sectionHead"><div><span className="eyebrow">GBK AI RESULTS</span><h2>Businesses matching your request</h2><p>Choose a participating business to create a customer order.</p></div></div>
        <div className="roleGrid">
          {searchResults.map((m:any)=><div className="roleCard" key={m.id}>
            <div className="roleIcon">🏪</div>
            <h3>{m.business_name}</h3>
            <p>{[m.category,m.city,m.country].filter(Boolean).join(" • ")}</p>
            {m.description && <p>{m.description}</p>}
            <div><span className="roleTag">{Math.round(Number(m.loyalty_offer_bps||0)/100)}% GBK Loyalty</span><span className="roleTag">Active merchant</span></div>
            <button className="primary" onClick={()=>setSelectedMerchant(m)}>View & Order →</button>
          </div>)}
        </div>
      </section>}
      {searchResults.length === 0 && authNotice && authNotice.includes("No") && <section id="searchResults" className="roleSection"><div className="status"><span>{authNotice}</span></div></section>}
      {selectedMerchant && <div className="modalBackdrop">
        <div className="modal">
          <button className="modalClose" onClick={()=>setSelectedMerchant(null)}>×</button>
          <div className="roleIcon">🏪</div>
          <h2>{selectedMerchant.business_name}</h2>
          <p>{[selectedMerchant.category,selectedMerchant.city,selectedMerchant.country].filter(Boolean).join(" • ")}</p>
          <p>GBK Loyalty offer: <b>{Math.round(Number(selectedMerchant.loyalty_offer_bps||0)/100)}%</b></p>
          <label style={{display:"grid",gap:6,margin:"14px 0"}}>
            <b>Order amount</b>
            <input className="modalInput" inputMode="decimal" type="number" min="0.01" step="0.01" value={orderAmount} onChange={e=>setOrderAmount(e.target.value)} placeholder={country==="India" ? "Enter amount in INR" : "Enter amount in local currency"} />
          </label>
          {authNotice && <div className="notice" style={{margin:"12px 0"}}>{authNotice}</div>}
          <small>{selectedMerchant.payment_provider==="DIRECT" || selectedMerchant.payment_method==="CASH"
            ? "Pay the merchant directly. The merchant will verify the payment before any GBK reward is released."
            : "Continue to the merchant's configured payment method."}</small>
          <button className="primary" disabled={apiBusy || !orderAmount} onClick={()=>createOrderFor(selectedMerchant)}>{apiBusy ? "Creating order…" : (selectedMerchant.payment_provider==="DIRECT" || selectedMerchant.payment_method==="CASH" ? "Create Order → Send to Merchant" : "Create Order & Pay")}</button>
          <button className="secondary" onClick={()=>{setSelectedMerchant(null);setOrderAmount("");}}>Cancel</button>
        </div>
      </div>}
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
          <div className="founderPanel"><div className="roleIcon">📋</div><h3>My Network</h3><p>View businesses added, users invited, active merchants, leads and loyalty activity.</p><button className="secondary" onClick={openFounder}>Open Founder Dashboard →</button></div>
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
        <button onClick={()=>activeWalletRole==="merchant" ? openMerchantWallet() : setRole(activeWalletRole==="customer" ? "Customer" : activeWalletRole==="founder" ? "Founder" : "Merchant")}>👛 {activeWalletRole==="merchant" ? "Merchant wallet" : activeWalletRole==="customer" ? "Customer wallet" : activeWalletRole==="founder" ? "Founder wallet" : "Wallet"}</button>
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
          <div className="roleIcon">{role==="MerchantWallet" ? "👛" : (roles.find(r=>r.title===role)?.icon || (role==="FounderUser" ? "👥" : role==="FounderBusiness" ? "🏪" : "🌍"))}</div>
          <h2>{role==="MerchantWallet" ? "Merchant Wallet" : `${role} registration`}</h2>
          {role==="MerchantWallet" ? <>
            <p>Manage the connected merchant reward wallet. Customer payments remain direct to the merchant; GBK is used only for the merchant-funded loyalty reward pool.</p>
            <div className="offerPreview" style={{display:"grid",gap:6}}>
              <b>Merchant: {merchantStatus?.merchant?.business_name || "—"}</b>
              <span>Wallet: {walletAddress ? walletAddress.slice(0,6)+"…"+walletAddress.slice(-4) : (merchantStatus?.merchant?.profile_id ? "Connected" : "Not connected")}</span>
            </div>
            <div className="stats" style={{margin:"12px 0"}}>
              <div><b>{merchantStatus?.live_gbk_balance_raw ? (Number(merchantStatus.live_gbk_balance_raw)/1e8).toLocaleString() : "0"} GBK</b><span>Live GBK balance</span></div>
              <div><b>{merchantStatus?.threshold_raw ? (Number(merchantStatus.threshold_raw)/1e8).toLocaleString() : "0"} GBK</b><span>GBK funding reserve</span></div>
            </div>
            <div className={merchantStatus?.active || Number(merchantStatus?.threshold_raw || 0) === 0 && Number(merchantStatus?.live_gbk_balance_raw || 0) > 0 ? "status" : "status paused"}>
              {merchantStatus?.active
                ? "🟢 Merchant active & funded"
                : Number(merchantStatus?.threshold_raw || 0) === 0 && Number(merchantStatus?.live_gbk_balance_raw || 0) > 0
                  ? "🟢 Merchant wallet funded"
                  : "⏸ Reward balance low"}
              <span>{merchantStatus?.active
                ? "Eligible to receive reward-funded customer orders."
                : Number(merchantStatus?.threshold_raw || 0) === 0 && Number(merchantStatus?.live_gbk_balance_raw || 0) > 0
                  ? "No order-specific reward is reserved yet. The live wallet balance will be checked against each eligible order."
                  : "Top up GBK in the connected merchant wallet; the system will re-check the live balance."}</span>
            </div>
            <button className="secondary" onClick={openMerchantWallet} disabled={apiBusy}>{apiBusy ? "Checking…" : "Refresh live GBK balance"}</button>
            {merchantStatus?.merchant?.invitation_status !== "ACCEPTED" && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:14}}>
              <b>Merchant activation</b>
              <span>Accept the GBK Loyalty terms to activate this business for customer search and orders. Activation verifies the connected merchant wallet and uses its current GBK balance as the reward funding allowance.</span>
              <button className="primary" disabled={apiBusy} onClick={async()=>{
                if(!session || !merchantStatus?.merchant?.id) return;
                setApiBusy(true); setAuthNotice("");
                try{
                  const r=await loyaltyApi(session,"merchant_accept",{merchant_id:merchantStatus.merchant.id,terms_version:"GBK-LOYALTY-2026-09"});
                  setAuthNotice(r?.activation?.status==="ACTIVE" ? "Merchant activated. Customers can now find this business." : "Merchant activation completed.");
                  await openMerchantWallet();
                }catch(e:any){setAuthNotice(e.message||"Merchant activation failed");}
                finally{setApiBusy(false);}
              }}>{apiBusy ? "Activating…" : "Accept Terms & Activate Merchant"}</button>
            </div>}
            {authNotice && <div className="status" style={{marginTop:10}}><span>{authNotice}</span></div>}
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:14}}>
              <b>Orders & reward funding</b>
              {(merchantStatus?.merchant_orders || []).length === 0
                ? <span>No merchant orders yet. Eligible customer orders will appear here.</span>
                : (merchantStatus.merchant_orders || []).slice(0,5).map((o:any)=>(
                  <div key={o.id} style={{padding:"10px 0",borderTop:"1px solid rgba(0,0,0,.08)"}}>
                    <b>{o.currency} {(Number(o.amount_minor||0)/100).toLocaleString()}</b>
                    <span style={{display:"block"}}>{o.merchant_response_status || "PENDING"} · Payment: {o.payment_status || "PENDING"}</span>
                    <span style={{display:"block"}}>{o.reward_required_raw && Number(o.reward_required_raw)>0 ? "Required for this order: "+(Number(o.reward_required_raw)/1e8).toLocaleString()+" GBK" : o.payment_status==="VERIFIED" ? "Reward requirement: calculated after completion" : "Reward requirement: pending payment verification"}</span>
                    {o.reward_settlement_status && <span style={{display:"block",fontWeight:700}}>
                      {o.reward_settlement_status==="SETTLED" ? "🟢 GBK reward settled" :
                       o.reward_settlement_status==="AWAITING_MERCHANT_APPROVAL" ? "🟠 Merchant wallet approval required" :
                       o.reward_settlement_status==="BLOCKCHAIN_SETTLEMENT_FAILED" ? "🔴 Blockchain settlement failed" :
                       o.reward_settlement_status==="BLOCKCHAIN_SETTLEMENT_PENDING" ? "🟡 Blockchain settlement pending" :
                       "⚪ Reward pending"}
                    </span>}
                    {o.reward_settlement_status==="AWAITING_MERCHANT_APPROVAL" && o.reward_required_raw && <button className="secondary" style={{marginTop:6}} disabled={apiBusy} onClick={()=>approveRewardForOrder(o)}>
                      {apiBusy ? "Approving…" : "Approve GBK reward spending"}
                    </button>}
                    {o.reward_settlement_status && o.reward_settlement_status!=="SETTLED" && o.payment_status==="VERIFIED" && o.merchant_response_status==="COMPLETED" && o.reward_settlement_status!=="AWAITING_MERCHANT_APPROVAL" && <button className="secondary" style={{marginTop:6}} disabled={apiBusy} onClick={()=>retryRewardSettlement(o)}>
                      {apiBusy ? "Releasing…" : "Retry reward release"}
                    </button>}
                    {o.reward_settlement_tx_hash && <a href={"https://bscscan.com/tx/"+o.reward_settlement_tx_hash} target="_blank" rel="noreferrer" style={{display:"block",marginTop:6}}>View GBK settlement transaction ↗</a>}
                    {o.merchant?.payment_provider==="DIRECT" && o.payment_status!=="VERIFIED" && <button className="secondary" style={{marginTop:6}} disabled={apiBusy} onClick={async()=>{
                      if(!session)return;
                      setApiBusy(true);
                      try{
                        await loyaltyApi(session,"direct_payment_verify",{order_id:o.id});
                        setAuthNotice("Direct payment verified. Now accept and complete the order to prepare the GBK reward.");
                        await openMerchantWallet();
                      }catch(e:any){setAuthNotice(e.message||"Payment verification failed");}finally{setApiBusy(false);}
                    }}>Verify direct payment</button>}
                    {["PENDING","ACCEPTED"].includes(o.merchant_response_status || "PENDING") && <button className="secondary" style={{marginTop:6}} disabled={apiBusy} onClick={async()=>{
                      if(!session)return;
                      setApiBusy(true);
                      try{
                        const next=o.merchant_response_status==="PENDING"?"ACCEPTED":"COMPLETED";
                        await loyaltyApi(session,"merchant_order_update",{order_id:o.id,status:next});
                        setAuthNotice(next==="ACCEPTED" ? "Order accepted." : "Order marked completed. Payment verification remains required before reward release.");
                        await openMerchantWallet();
                      }catch(e:any){setAuthNotice(e.message||"Order update failed");}finally{setApiBusy(false);}
                    }}>{o.merchant_response_status==="PENDING" ? "Accept order" : "Complete order"}</button>}
                  </div>
                ))}
            </div>
          </> : role==="Customer" ? <>
            <p>Connect a separate customer wallet for purchases and eligible GBK Loyalty rewards. This wallet is kept separate from your merchant reward wallet.</p>
            <div className="walletConnectBox">
              <div className="roleIcon">👛</div>
              <h3>Customer wallet</h3>
              <p>Your connected customer wallet is your customer identity and reward destination.</p>
              <button className="primary" onClick={()=>connectWallet("customer")} disabled={apiBusy}>{apiBusy ? "Connecting…" : (activeWalletRole==="customer" && walletAddress ? "Reconnect Customer Wallet" : "Connect Customer Wallet")}</button>
              {activeWalletRole==="customer" && walletAddress && <div className="status"><span>🟢 Customer wallet connected</span><small>{walletAddress.slice(0,6)}…{walletAddress.slice(-4)}</small></div>}
              <button className="secondary" onClick={()=>connectWallet("merchant")} disabled={apiBusy}>{apiBusy ? "Switching…" : "Switch to Merchant Wallet"}</button>
            </div>
          </> : role==="Auth" ? <>
            <div className="walletConnectBox">
              <div className="roleIcon">👛</div>
              <h3>Connect your wallet</h3>
              <p>No email or password is required for GBK AI Loyalty. Your EVM wallet is your primary account identity and reward destination.</p>
              <button className="primary" onClick={()=>connectWallet("customer")} disabled={apiBusy}>{apiBusy ? "Connecting…" : "Connect Wallet"}</button>
              <small>Supported in wallet browsers and compatible EVM wallets. Sign-in is handled by the wallet-linked account.</small>
            </div>
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
            <input placeholder="Phone (optional)" value={merchantPhone} onChange={e=>setMerchantPhone(e.target.value)}/>
            <input type="email" placeholder="Email (optional)" value={merchantEmail} onChange={e=>setMerchantEmail(e.target.value)}/>
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
              <select className="modalSelect" value={paymentGateway} onChange={e=>setPaymentGateway(e.target.value)}>
                <option value="DIRECT">Direct payment</option>
                <option value="RAZORPAY">Razorpay (optional)</option>
                <option value="CASHFREE">Cashfree Easy Split (optional)</option>
                <option value="PAYU">PayU Split Settlement (optional)</option>
              </select>
              <small>Choose how the customer normally pays you. Payment-provider accounts are optional during registration.</small>
              {paymentGateway !== "DIRECT" && <input className="modalInput" value={paymentAccountRef} onChange={e=>setPaymentAccountRef(e.target.value.trim())} placeholder="Approved linked merchant ID (optional)"/>}
              <select className="modalSelect" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="USDT">USDT</option>
                <option value="LOCAL_CURRENCY">Local currency / bank / UPI</option>
              </select>
              <input className="modalInput" value={paymentCurrency} onChange={e=>setPaymentCurrency(e.target.value.toUpperCase())} placeholder="Currency code e.g. INR, AED, USD" maxLength={3}/>
              {paymentMethod !== "CASH" && <input className="modalInput" value={paymentDetails} onChange={e=>setPaymentDetails(e.target.value)} placeholder={paymentMethod==="USDT" ? "USDT wallet/payment details (optional)" : "UPI, bank or payment details (optional)"}/>}
              {paymentMethod === "CASH" && <small>Cash payments are recorded and verified by the merchant before any GBK reward is released.</small>}
              <div className="walletRequiredBox">
                <b>Merchant GBK wallet — required</b>
                <small>The connected wallet is the merchant identity and reward-balance wallet.</small>
                <input className="modalInput" value={merchantWallet} readOnly placeholder="Connect Wallet to continue"/>
                <button type="button" className="secondary" onClick={()=>connectWallet("merchant")} disabled={apiBusy}>{merchantWallet ? "Wallet Connected" : "Connect Wallet"}</button>
              </div>
              {isIndia && <small>India: INR/local payment only. USDT is disabled for this merchant flow.</small>}
            </div>
            <label className="check"><input type="checkbox"/> I accept that GBK provides leads and loyalty benefits; the merchant controls the product/service and its business policy.</label>
          </> : <>
            <p>Start with simple registration. Wallet connection, verification and role-specific setup come next.</p>
            <input placeholder="Full name"/>
            <input placeholder="Mobile or email"/>
          </>}
          {role==="Merchant" && authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
          {role==="Founder" ? <button className="primary" onClick={verifyFounder} disabled={apiBusy}>{apiBusy ? "Verifying…" : "Verify Founder Member →"}</button> : role==="Merchant" ? <button className="primary" disabled={apiBusy} onClick={registerMerchant}>{apiBusy ? "Registering…" : "Continue →"}</button> : null}{role==="MerchantWallet" ? <small>Send GBK only to the connected merchant wallet. The website does not take custody of merchant GBK.</small> : <small>No token transfer happens from this screen.</small>}
        </div>
      </div>}

      <nav className={`bottomNav${searchFocused ? " searchFocused" : ""}`}><a className="active">⌂<span>Home</span></a><a onClick={()=>setRole("Customer")}>⌕<span>Explore</span></a><a onClick={()=>setRole("Customer")}>🎁<span>Rewards</span></a><a onClick={()=>activeWalletRole==="merchant" ? openMerchantWallet() : setRole(activeWalletRole==="customer" ? "Customer" : activeWalletRole==="founder" ? "Founder" : "Merchant")}>👛<span>Wallet</span></a><a onClick={()=>setRole("Customer")}>☻<span>Profile</span></a></nav>
    </main>
  );
}
