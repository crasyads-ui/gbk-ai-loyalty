"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import QRCode from "qrcode";
import { getStoredSession, loyaltyApi, signInAnonymously, connectEvmWallet, getConnectedEvmWallet, approveMerchantRewardDistributor, getGbkWalletStatus, loyaltyReviewApi, type LoyaltySession } from "../lib/loyalty";

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
const currencyMap: Record<string,string> = {India:"INR", "United Arab Emirates":"AED", "United States":"USD", "United Kingdom":"GBP", Singapore:"SGD", Australia:"AUD", Canada:"CAD", "Saudi Arabia":"SAR", Malaysia:"MYR", Germany:"EUR", France:"EUR", Italy:"EUR", Spain:"EUR", Portugal:"EUR", Netherlands:"EUR", Belgium:"EUR", Switzerland:"CHF", Austria:"EUR", Sweden:"SEK", Norway:"NOK", Denmark:"DKK", Finland:"EUR", Ireland:"EUR", "New Zealand":"NZD", Japan:"JPY", "South Korea":"KRW", China:"CNY", "Hong Kong":"HKD", Thailand:"THB", Indonesia:"IDR", Philippines:"PHP", Vietnam:"VND", Bangladesh:"BDT", "Sri Lanka":"LKR", Nepal:"NPR", Pakistan:"PKR", "South Africa":"ZAR", Nigeria:"NGN", Kenya:"KES", Egypt:"EGP", Turkey:"TRY", Brazil:"BRL", Mexico:"MXN", Argentina:"ARS", Colombia:"COP", Chile:"CLP", Peru:"PEN"};
const currencyForCountry = (value:string) => currencyMap[value] || "USD";

const roles = [
  {icon:"👤",title:"Customer",text:"Find businesses, pay normally and earn eligible GBK Loyalty rewards.",items:["Earn GBK","Hold • Use • Transfer"]},
  {icon:"🏪",title:"Merchant",text:"Register your business, connect your merchant wallet and activate. Add GBK to the reward wallet when eligible rewards need funding.",items:["5%–20% or Custom","Automatic rewards"]},
  {icon:"🌍",title:"Founder",text:"Country or Global Founder Members can onboard businesses and receive the Founder allocation from verified loyalty sales.",items:["Add users","Add businesses","Track earnings"]},
];

export default function Home() {
  const [query,setQuery] = useState("");
  const [searchFocused,setSearchFocused] = useState(false);
  const [voiceListening,setVoiceListening] = useState(false);
  const [voiceSupported,setVoiceSupported] = useState(false);
  const [speaking,setSpeaking] = useState(false);
  const [language,setLanguage] = useState("English");
  const [country,setCountry] = useState("Global");
  const [currency,setCurrency] = useState("USD");
  const [role,setRole] = useState<string|null>(null);
  const [merchantOffer,setMerchantOffer] = useState("10%");
  const [customOffer,setCustomOffer] = useState("25");
  const [shareNotice,setShareNotice] = useState("");
  const [merchantQr,setMerchantQr] = useState("");
  const [qrBusy,setQrBusy] = useState(false);
  const [suggestedBusinessId,setSuggestedBusinessId] = useState("");
  const [claimBusiness,setClaimBusiness] = useState<any|null>(null);
  const [claimName,setClaimName] = useState("");
  const [claimContact,setClaimContact] = useState("");
  const [installPrompt,setInstallPrompt] = useState<any>(null);
  const [installed,setInstalled] = useState(false);
  const [paymentGateway,setPaymentGateway] = useState("DIRECT");
  const [paymentAccountRef,setPaymentAccountRef] = useState("");
  const [paymentMethod,setPaymentMethod] = useState("CASH");
  const [paymentCurrency,setPaymentCurrency] = useState("INR");
  const [paymentDetails,setPaymentDetails] = useState("");
  const [merchantWallet,setMerchantWallet] = useState("");
  const [merchantUpiId,setMerchantUpiId] = useState("");
  const [merchantUpiEditing,setMerchantUpiEditing] = useState(false);
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
  const [currentOrderReference,setCurrentOrderReference] = useState("");
  const [upiPayment,setUpiPayment] = useState<any|null>(null);
  const [merchantBusinessName,setMerchantBusinessName]=useState("");
  const [founderReferralCode,setFounderReferralCode]=useState("");
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
  const [founderNetwork,setFounderNetwork]=useState<{users:any[];businesses:any[]}>({users:[],businesses:[]});
  const [founderUserName,setFounderUserName]=useState("");
  const [founderUserContact,setFounderUserContact]=useState("");
  const [founderUserCountry,setFounderUserCountry]=useState("");
  const [founderBusinessName,setFounderBusinessName]=useState("");
  const [founderBusinessOwner,setFounderBusinessOwner]=useState("");
  const [founderBusinessContact,setFounderBusinessContact]=useState("");
  const [founderBusinessCity,setFounderBusinessCity]=useState("");
  const [founderBusinessCountry,setFounderBusinessCountry]=useState("");
  const [founderBusinessAddress,setFounderBusinessAddress]=useState("");
  const [founderBusinessWebsite,setFounderBusinessWebsite]=useState("");
  const [founderBusinessCategory,setFounderBusinessCategory]=useState(businessCategories[0]);
  const [founderBusinessOffer,setFounderBusinessOffer]=useState("10%");
  const [suggestBusinessName,setSuggestBusinessName]=useState("");
  const [suggestBusinessCategory,setSuggestBusinessCategory]=useState(businessCategories[0]);
  const [suggestBusinessCity,setSuggestBusinessCity]=useState("");
  const [suggestBusinessCountry,setSuggestBusinessCountry]=useState("");
  const [suggestBusinessAddress,setSuggestBusinessAddress]=useState("");
  const [suggestBusinessPhone,setSuggestBusinessPhone]=useState("");
  const [suggestBusinessWebsite,setSuggestBusinessWebsite]=useState("");
  const [suggestBusinessMapsUrl,setSuggestBusinessMapsUrl]=useState("");
  const [merchantStatus,setMerchantStatus]=useState<any>(null);
  const [merchantChainStatus,setMerchantChainStatus] = useState<{balanceRaw:string;allowanceRaw:string}|null>(null);
  const [merchantChainBusy,setMerchantChainBusy] = useState(false);
  const [reviewQueue,setReviewQueue] = useState<any[]>([]);
  const [reviewBusy,setReviewBusy] = useState(false);
  const [claimQueue,setClaimQueue] = useState<any[]>([]);
  const [claimBusy,setClaimBusy] = useState(false);
  const [scannerOpen,setScannerOpen] = useState(false);
  const [scannerBusy,setScannerBusy] = useState(false);
  const scannerVideoRef = useRef<HTMLVideoElement|null>(null);
  const scannerControlsRef = useRef<any>(null);
  const isIndia = country === "India";
  const visibleSearchResults = (() => {
    const byKey = new Map<string, any>();
    for (const item of searchResults) {
      const key = [String(item.business_name||"").trim().toLowerCase(), String(item.city||"").trim().toLowerCase(), String(item.country||"").trim().toLowerCase()].join("|");
      const existing = byKey.get(key);
      if (!existing || (existing.unclaimed && !item.unclaimed)) byKey.set(key,item);
    }
    return Array.from(byKey.values());
  })();
  const holderRewardMin = 0.7;
  const holderRewardMax = 6.3;

  const selectCountry = (value:string) => { setCountry(value); const next = value === "Global" ? "USD" : currencyForCountry(value); setCurrency(next); setPaymentCurrency(next); try { localStorage.setItem("gbk_loyalty_country", value); localStorage.setItem("gbk_loyalty_currency", next); } catch {} };

  useEffect(() => {
    const merchantId = new URLSearchParams(window.location.search).get("merchant");
    if(!merchantId)return;
    (async()=>{
      try{
        let active=getStoredSession();
        if(!active) active=await signInAnonymously();
        setSession(active);
        const result=await loyaltyApi(active,"get_merchant",{merchant_id:merchantId});
        if(result?.merchant){setSelectedMerchant(result.merchant);}
      }catch(e:any){setAuthNotice(e?.message||"Business page could not be opened.");}
    })();
  }, []);

  useEffect(() => {
    const claimId = new URLSearchParams(window.location.search).get("claim");
    if(!claimId)return;
    (async()=>{
      try{
        let active=getStoredSession();
        if(!active) active=await signInAnonymously();
        setSession(active);
        const result=await loyaltyApi(active,"get_business_suggestion",{suggestion_id:claimId});
        if(result?.suggestion){setClaimBusiness(result.suggestion);setRole("ClaimBusiness");}
      }catch(e:any){setAuthNotice(e?.message||"Business link could not be opened.");}
    })();
  }, []);

  useEffect(() => {
    const w = window as any;
    const handler = (event:any) => { event.preventDefault(); setInstallPrompt(event); };
    w.addEventListener("beforeinstallprompt",handler);
    setInstalled(w.matchMedia("(display-mode: standalone)").matches);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
    const stored = getStoredSession();
    if (stored) setSession(stored);
    try {
      const storedCountry = localStorage.getItem("gbk_loyalty_country");
      const storedCurrency = localStorage.getItem("gbk_loyalty_currency");
      if (storedCountry && countries.includes(storedCountry)) setCountry(storedCountry);
      if (storedCurrency) { setCurrency(storedCurrency); setPaymentCurrency(storedCurrency); }
    } catch {}
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognitionCtor);
    try {
      const storedRole = localStorage.getItem("gbk_loyalty_active_role");
      if (storedRole === "customer" || storedRole === "merchant" || storedRole === "founder") setActiveWalletRole(storedRole);
    } catch {}
    try {
      const storedMerchantWallet = localStorage.getItem("gbk_loyalty_merchant_wallet") || "";
      if (/^0x[a-fA-F0-9]{40}$/.test(storedMerchantWallet)) {
        setMerchantWallet(storedMerchantWallet);
        setWalletAddress(storedMerchantWallet);
      }
    } catch {}
    getConnectedEvmWallet().then((addr)=>{
      if (addr) {
        setWalletAddress(addr);
        try { localStorage.setItem("gbk_loyalty_merchant_wallet", addr); } catch {}
      }
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
      setSession(s);

      // Merchant wallets are identified by the connected EVM address.
      // Check the registered merchant record first, then create/reconcile the
      // wallet-linked profile only if needed.
      if (targetRole === "merchant") {
        let lookup = await loyaltyApi(s, "merchant_wallet_lookup", { wallet_address: address });
        if (lookup?.merchant) {
          await loyaltyApi(s, "profile_upsert", {
            role: "merchant",
            full_name: fullName || "GBK Wallet User",
            country,
            wallet_address: address
          });
          lookup = await loyaltyApi(s, "merchant_wallet_lookup", { wallet_address: address });
        } else {
          await loyaltyApi(s, "profile_upsert", {
            role: "merchant",
            full_name: fullName || "GBK Wallet User",
            country,
            wallet_address: address
          });
          lookup = await loyaltyApi(s, "merchant_wallet_lookup", { wallet_address: address });
        }

        if (lookup?.merchant) {
          setActiveWalletRole("merchant");
          const savedUpiId = String(lookup.merchant?.payment_details?.upi_id || lookup.merchant?.payment_details?.details || "").trim();
          setMerchantUpiId(savedUpiId);
          setMerchantUpiEditing(false);
          setMerchantStatus({merchant: lookup.merchant});
          try {
            localStorage.setItem("gbk_loyalty_merchant_wallet", address);
            localStorage.setItem("gbk_loyalty_active_role", "merchant");
          } catch {}
          try {
            const [live, dataWithOrders] = await Promise.all([
              loyaltyApi(s, "merchant_fund_status", { merchant_id: lookup.merchant.id }),
              loyaltyApi(s, "my_data", {})
            ]);
            setMerchantStatus({...live, merchant_orders:dataWithOrders?.merchant_orders || []});
            await refreshMerchantChainStatus(address);
          } catch {}
          setRole("MerchantWallet");
          setAuthNotice(`Existing merchant found: ${lookup.merchant.business_name || "Registered business"}. Merchant Wallet opened.`);
          return;
        }

        try {
          localStorage.setItem("gbk_loyalty_merchant_wallet", address);
          localStorage.setItem("gbk_loyalty_active_role", "merchant");
        } catch {}
        setActiveWalletRole("merchant");
        setRole("Merchant");
        setAuthNotice("New merchant wallet connected. Complete the registration form to create the merchant account.");
        return;
      }

      await loyaltyApi(s, "profile_upsert", {
        role: targetRole,
        full_name: fullName || "GBK Wallet User",
        country,
        wallet_address: address
      });

      setActiveWalletRole(targetRole);
      try { localStorage.setItem("gbk_loyalty_active_role", targetRole); } catch {}
      setRole(targetRole === "founder" ? "Founder" : "Customer");
      setAuthNotice(targetRole === "founder"
        ? "Founder wallet connected successfully."
        : "Customer wallet connected successfully.");
    } catch(e:any) {
      setAuthNotice(e.message || "Wallet connection failed.");
    } finally { setApiBusy(false); }
  };
  const doAuth = async () => connectWallet("customer");
  const loadFounderNetwork = async (s?: LoyaltySession) => {
    const active=s||session||getStoredSession(); if(!active)return;
    try{const r=await loyaltyApi(active,"founder_network",{});setFounderNetwork({users:r.users||[],businesses:r.businesses||[]});}catch{}
  };
  const loadReviewQueue = async () => {
    const active=session||getStoredSession();
    if(!active){ setAuthNotice("Connect your Founder wallet first."); return; }
    setReviewBusy(true); setAuthNotice("");
    try {
      const r=await loyaltyReviewApi(active,"review_queue",{});
      setReviewQueue(r.suggestions||[]);
      setRole("ReviewCenter");
    } catch(e:any) { setAuthNotice(e.message||"Review queue could not be loaded."); }
    finally { setReviewBusy(false); }
  };
  const loadClaimQueue = async () => {
    const active=session||getStoredSession();
    if(!active){ setAuthNotice("Connect your Founder wallet first."); return; }
    setClaimBusy(true); setAuthNotice("");
    try {
      const r=await loyaltyReviewApi(active,"claim_queue",{});
      setClaimQueue(r.claims||[]);
      setRole("ClaimCenter");
    } catch(e:any) { setAuthNotice(e.message||"Claim queue could not be loaded."); }
    finally { setClaimBusy(false); }
  };
  const decideClaim = async (id:string, decision:"APPROVE"|"REJECT") => {
    const active=session||getStoredSession(); if(!active)return;
    setClaimBusy(true);
    try {
      await loyaltyReviewApi(active,"claim_decision",{claim_id:id,decision});
      setClaimQueue(q=>q.filter(x=>x.id!==id));
      setAuthNotice(decision==="APPROVE" ? "Claim approved. The owner can now connect the Merchant Wallet and complete activation." : "Claim rejected. The listing is available for further review.");
    } catch(e:any) { setAuthNotice(e.message||"Claim action failed."); }
    finally { setClaimBusy(false); }
  };
  const decideReview = async (id:string, decision:"APPROVE"|"REJECT") => {
    const active=session||getStoredSession(); if(!active)return;
    setReviewBusy(true);
    try {
      await loyaltyReviewApi(active,"review_decision",{suggestion_id:id,decision});
      setReviewQueue(q=>q.filter(x=>x.id!==id));
      setAuthNotice(decision==="APPROVE" ? "Business approved as an unclaimed listing. Owner claim is still required for activation." : "Business suggestion rejected.");
    } catch(e:any) { setAuthNotice(e.message||"Review action failed."); }
    finally { setReviewBusy(false); }
  };
  const openFounder = async () => {
    setRole("Founder");
    const active=session||getStoredSession(); if(!active)return;
    try{const r=await loyaltyApi(active,"founder_status",{});setFounderStatus(r.founder||null);if(r.founder?.founder_verified)await loadFounderNetwork(active);}catch{}
  };
  const addFounderUser = async () => {
    const active=session||getStoredSession(); if(!active){await connectWallet("founder");return;}
    const targetCountry=founderUserCountry||(country!=="Global"?country:"");
    if(!founderUserName.trim()||!founderUserContact.trim()||!targetCountry){setAuthNotice("Enter the user name, mobile/email and country.");return;}
    setApiBusy(true);setAuthNotice("");
    try{await loyaltyApi(active,"founder_add_user",{referred_name:founderUserName.trim(),referred_email:founderUserContact.includes("@")?founderUserContact.trim():null,referred_phone:founderUserContact.includes("@")?null:founderUserContact.trim(),country:targetCountry});await loadFounderNetwork(active);setFounderUserName("");setFounderUserContact("");setFounderUserCountry("");setAuthNotice("User referral saved in your Founder network.");setRole("Founder");}
    catch(e:any){setAuthNotice(e.message||"User referral could not be saved.");}finally{setApiBusy(false);}
  };
  const addFounderBusiness = async () => {
    const active=session||getStoredSession(); if(!active){await connectWallet("founder");return;}
    const targetCountry=founderBusinessCountry||(country!=="Global"?country:"");
    if(!founderBusinessName.trim()||!founderBusinessCity.trim()||!targetCountry){setAuthNotice("Enter the business name, city and country.");return;}
    setApiBusy(true);setAuthNotice("");
    try{await loyaltyApi(active,"founder_add_business",{business_name:founderBusinessName.trim(),owner_name:founderBusinessOwner.trim()||null,phone:founderBusinessContact.includes("@")?null:founderBusinessContact.trim()||null,email:founderBusinessContact.includes("@")?founderBusinessContact.trim():null,category:founderBusinessCategory,country:targetCountry,city:founderBusinessCity.trim(),address:founderBusinessAddress.trim()||null,website:founderBusinessWebsite.trim()||null,loyalty_offer_percent:Number(founderBusinessOffer.replace("%",""))});await loadFounderNetwork(active);setFounderBusinessName("");setFounderBusinessOwner("");setFounderBusinessContact("");setFounderBusinessCity("");setFounderBusinessCountry("");setFounderBusinessAddress("");setFounderBusinessWebsite("");setAuthNotice("Business referral saved. Owner activation is required before public customer search.");setRole("Founder");}
    catch(e:any){setAuthNotice(e.message||"Business referral could not be saved.");}finally{setApiBusy(false);}
  };
  const refreshMerchantChainStatus = async (address?:string) => {
    const target = String(address || merchantWallet || walletAddress || "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(target)) return;
    setMerchantChainBusy(true);
    try {
      const live = await getGbkWalletStatus(target);
      setMerchantChainStatus(live);
    } catch (e:any) {
      setMerchantChainStatus(null);
      setAuthNotice(e.message || "Live GBK wallet balance could not be read.");
    } finally { setMerchantChainBusy(false); }
  };

  const openMerchantWallet = async () => {
    setApiBusy(true); setAuthNotice("");
    try {
      let s = session || getStoredSession();
      if (!s) { s = await signInAnonymously(); setSession(s); }
      // Reconcile the merchant by connected wallet. Anonymous sessions can change,
      // but the wallet is the merchant identity.
      const connected = await getConnectedEvmWallet().catch(()=>null);
      const knownMerchantWallet = String(connected || merchantWallet || walletAddress || "").trim();
      if (connected) {
        setWalletAddress(connected);
        setMerchantWallet(connected);
        try { localStorage.setItem("gbk_loyalty_merchant_wallet", connected); } catch {}
      }
      // merchant_wallet_lookup requires a wallet-linked profile first.
      // Establish that profile without creating a new merchant record.
      await loyaltyApi(s,"profile_upsert",{
        role:"merchant",
        full_name:fullName || "GBK Wallet User",
        country,
        wallet_address:knownMerchantWallet
      });
      const lookup = await loyaltyApi(s,"merchant_wallet_lookup",{wallet_address:knownMerchantWallet});
      const merchant = lookup?.merchant || (await loyaltyApi(s,"my_data",{}))?.merchants?.[0];
      if (!merchant) { setRole("Merchant"); setAuthNotice("No merchant is registered for this wallet. Please complete merchant registration once."); return; }
      const savedUpiId = String(merchant?.payment_details?.upi_id || merchant?.payment_details?.details || "").trim();
      setMerchantUpiId(savedUpiId);
      setMerchantUpiEditing(false);
      setMerchantStatus({merchant});
      const [live,dataWithOrders] = await Promise.all([
        loyaltyApi(s,"merchant_fund_status",{merchant_id:merchant.id}),
        loyaltyApi(s,"my_data",{})
      ]);
      setMerchantStatus({...live,merchant_orders:dataWithOrders?.merchant_orders || []});
      await refreshMerchantChainStatus(connected || knownMerchantWallet);
      try { localStorage.setItem("gbk_loyalty_merchant_wallet", String(live?.merchant?.profile_id ? (connected || knownMerchantWallet) : knownMerchantWallet)); } catch {}
      setRole("MerchantWallet");
    } catch(e:any) {
      setAuthNotice(e.message || "Merchant wallet status could not be loaded.");
    } finally { setApiBusy(false); }
  };
  const openWallet = async () => {
    setApiBusy(true); setAuthNotice("");
    try {
      // The connected wallet is the merchant identity. Always reconcile it first;
      // do not depend on an old anonymous session.
      const connected = await getConnectedEvmWallet().catch(()=>null);
      const knownMerchantWallet = String(connected || merchantWallet || walletAddress || "").trim();
      if (connected) {
        setWalletAddress(connected);
        setMerchantWallet(connected);
        try { localStorage.setItem("gbk_loyalty_merchant_wallet", connected); } catch {}
        let s = session || getStoredSession();
        if (!s) s = await signInAnonymously();
        setSession(s);
        // The wallet chooser can be opened before a role/profile exists.
        // Create/update only the wallet-linked profile, then resolve the
        // existing merchant record. This prevents registered merchants from
        // being sent to registration just because the anonymous session is new.
        await loyaltyApi(s,"profile_upsert",{
          role:"merchant",
          full_name:fullName || "GBK Wallet User",
          country,
          wallet_address:connected || knownMerchantWallet
        });
        const lookup = await loyaltyApi(s,"merchant_wallet_lookup",{wallet_address:connected || knownMerchantWallet});
        if (lookup?.merchant) {
          setActiveWalletRole("merchant");
          try { localStorage.setItem("gbk_loyalty_active_role","merchant"); } catch {}
          const [live,dataWithOrders] = await Promise.all([
            loyaltyApi(s,"merchant_fund_status",{merchant_id:lookup.merchant.id}),
            loyaltyApi(s,"my_data",{})
          ]);
          setMerchantStatus({...live,merchant_orders:dataWithOrders?.merchant_orders || []});
          await refreshMerchantChainStatus(connected || knownMerchantWallet);
          try { localStorage.setItem("gbk_loyalty_merchant_wallet", String(connected || knownMerchantWallet)); } catch {}
          setRole("MerchantWallet");
          return;
        }
      }

      if (activeWalletRole==="merchant") {
        await openMerchantWallet();
        return;
      }
      if (activeWalletRole==="customer") setRole("Customer");
      else if (activeWalletRole==="founder") setRole("Founder");
      else {
        setRole("Merchant");
        setAuthNotice("Connect the registered merchant wallet to view its live GBK balance.");
      }
    } catch(e:any) {
      setAuthNotice(e.message || "Merchant wallet status could not be loaded.");
      if (activeWalletRole==="merchant") {
        try { await openMerchantWallet(); } catch {}
      }
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
      setAuthNotice("One-time GBK reward approval submitted. Waiting for confirmation…");
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
      await loadFounderNetwork(session);
      setAuthNotice(r.verification?.benefits_active ? "Founder verified. 50% minimum GBK reserve is currently maintained." : "Founder transaction verified. Maintain the required 50% GBK reserve to keep Founder benefits active.");
    } catch(e:any) { setAuthNotice(e.message || "Founder verification failed."); }
    finally { setApiBusy(false); }
  };
  const speechLangMap:Record<string,string> = {
    "English":"en-IN","हिन्दी":"hi-IN","తెలుగు":"te-IN","বাংলা":"bn-IN","தமிழ்":"ta-IN",
    "मराठी":"mr-IN","Español":"es-ES","العربية":"ar-SA","Français":"fr-FR","Português":"pt-BR"
  };
  const speakText = (text:string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = speechLangMap[language] || "en-IN";
      utter.rate = 0.95;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      const voices = synth.getVoices();
      const wanted = (speechLangMap[language] || "en-IN").toLowerCase();
      const voice = voices.find(v => v.lang.toLowerCase() === wanted) || voices.find(v => v.lang.toLowerCase().startsWith(wanted.split("-")[0]));
      if (voice) utter.voice = voice;
      synth.speak(utter);
    } catch {}
  };
  const openScannedBusiness = async (text:string) => {
    try {
      const parsed = new URL(text);
      const merchantId = parsed.searchParams.get("merchant");
      if (!merchantId) throw new Error("This QR is not a GBK Loyalty merchant QR.");
      setScannerBusy(true);
      let active = session || getStoredSession();
      if (!active) active = await signInAnonymously();
      setSession(active);
      const result = await loyaltyApi(active,"get_merchant",{merchant_id:merchantId});
      if (!result?.merchant) throw new Error("Merchant not found or not active.");
      setSelectedMerchant(result.merchant);
      setScannerOpen(false);
      setAuthNotice("Merchant found. Enter your purchase amount to continue.");
    } catch (e:any) {
      setAuthNotice(e?.message || "Could not open this GBK Loyalty QR.");
    } finally { setScannerBusy(false); }
  };
  useEffect(() => {
    if (!scannerOpen) {
      try { scannerControlsRef.current?.stop?.(); } catch {}
      scannerControlsRef.current = null;
      return;
    }
    let cancelled = false;
    const start = async () => {
      if (!scannerVideoRef.current) return;
      setScannerBusy(true);
      try {
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromConstraints({video:{facingMode:{ideal:"environment"}}}, scannerVideoRef.current, (result) => {
          if (cancelled || !result) return;
          const value = result.getText();
          try { scannerControlsRef.current?.stop?.(); } catch {}
          openScannedBusiness(value);
        });
        if (cancelled) { try { controls.stop(); } catch {} }
        else scannerControlsRef.current = controls;
      } catch (e:any) {
        if (!cancelled) setAuthNotice("Camera access is required. Allow camera permission and try again.");
      } finally { if (!cancelled) setScannerBusy(false); }
    };
    const timer = window.setTimeout(start,120);
    return () => { cancelled=true; window.clearTimeout(timer); try { scannerControlsRef.current?.stop?.(); } catch {} scannerControlsRef.current=null; };
  }, [scannerOpen]);

  const scanQrImage = async (file: File) => {
    if (!file) return;
    setScannerBusy(true);
    setAuthNotice("");
    try {
      const reader = new BrowserQRCodeReader();
      const dataUrl = await new Promise<string>((resolve,reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ""));
        fr.onerror = () => reject(new Error("Could not read the image."));
        fr.readAsDataURL(file);
      });
      const result = await reader.decodeFromImageUrl(dataUrl);
      if (!result) throw new Error("No QR code found in this image.");
      openScannedBusiness(result.getText());
    } catch (e:any) {
      setAuthNotice(e?.message || "No GBK Loyalty QR code was found. Try a clearer image.");
    } finally {
      setScannerBusy(false);
    }
  };

  const spokenSummary = (results:any[]) => {
    if (!results.length) {
      speakText(language === "తెలుగు" ? "మీ అభ్యర్థనకు సరిపడే GBK AI Loyalty వ్యాపారాలు ప్రస్తుతం కనిపించలేదు." :
        language === "हिन्दी" ? "आपकी खोज से मेल खाने वाले GBK AI Loyalty व्यवसाय अभी नहीं मिले।" :
        language === "தமிழ்" ? "உங்கள் தேடலுக்கு பொருந்தும் GBK AI Loyalty வணிகங்கள் இப்போது கிடைக்கவில்லை." :
        language === "العربية" ? "لم يتم العثور على شركات GBK AI Loyalty مطابقة لطلبك حالياً." :
        "No matching GBK AI Loyalty businesses were found yet.");
      return;
    }
    const names = results.slice(0,3).map((m:any)=>m.business_name).filter(Boolean);
    const prefix = language === "తెలుగు" ? "మీకు సరిపడే వ్యాపారాలు దొరికాయి." :
      language === "हिन्दी" ? "आपकी खोज के लिए व्यवसाय मिले हैं।" :
      language === "தமிழ்" ? "உங்கள் தேடலுக்கு பொருந்தும் வணிகங்கள் கிடைத்துள்ளன." :
      language === "العربية" ? "وجدت شركات مناسبة لطلبك." :
      "I found matching businesses for you.";
    speakText(prefix + " " + names.join(", ") + ".");
  };
  const doSearch = async (requestedQuery?:string) => {
    const q=String(requestedQuery ?? query).trim(); if(q.length<2){setAuthNotice("Please enter what you need.");return;}
    if (q !== query) setQuery(q);
    setApiBusy(true); setAuthNotice("");
    try {
      let activeSession=session;
      if(!activeSession){
        activeSession=await signInAnonymously();
        setSession(activeSession);
        try{ await loyaltyApi(activeSession,"profile_upsert",{role:"customer",country,wallet_address:walletAddress||null}); }catch{}
      }
      const r=await loyaltyApi(activeSession,"search",{query:q,country});
      const results=r.results||[];
      setSearchResults(results);
      setAuthNotice(results.length ? "" : "No active GBK Loyalty businesses matched this request yet.");
      if (voiceListening || requestedQuery) spokenSummary(results);
      setTimeout(()=>document.getElementById("searchResults")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
    } catch(e:any){setAuthNotice(e.message||"Search failed"); if(requestedQuery) speakText("Search failed. Please try again.");}
    finally {setApiBusy(false); }
  };
  const startVoiceSearch = () => {
    const w:any = window;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setAuthNotice("Voice search is not supported in this browser. You can type your request instead.");
      return;
    }
    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = speechLangMap[language] || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setVoiceListening(true); setAuthNotice("🎙️ Listening… speak your request."); };
      recognition.onresult = (event:any) => {
        const transcript = String(event.results?.[0]?.[0]?.transcript || "").trim();
        if (transcript) { setQuery(transcript); doSearch(transcript); }
      };
      recognition.onerror = (event:any) => {
        setVoiceListening(false);
        setAuthNotice(event?.error === "not-allowed" ? "Microphone permission is required for voice search." : "Voice search could not hear you. Please try again.");
      };
      recognition.onend = () => setVoiceListening(false);
      recognition.start();
    } catch {
      setVoiceListening(false);
      setAuthNotice("Voice search could not start. Please try again.");
    }
  };
  const createOrderFor = async (m:any) => {
    const amount=String(orderAmount||"").trim();
    if(!amount || !Number.isFinite(Number(amount)) || Number(amount)<=0){ setAuthNotice("Enter the purchase/order amount first."); return; }
    if (currentOrderReference) { setAuthNotice(`ORDER ALREADY CREATED • ${currentOrderReference}. Please use this order instead of creating another one.`); return; }
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
      const orderCurrency = String(m?.payment_currency || currency).toUpperCase();
      const created = await loyaltyApi(activeSession,"create_order",{merchant_id:m.id,amount_minor:Math.round(Number(amount)*100),currency:orderCurrency,request_text:query,category:m.category,country,order_source:"GBK_AI"});
      let paid:any;
      try {
        paid = await loyaltyApi(activeSession,"payment_create",{order_id:created.order.id});
      } catch (e:any) {
        // Direct/Cash merchants do not use an online gateway. Keep the order active
        // so the merchant can verify the payment manually.
        if (m?.payment_provider === "DIRECT" || m?.payment_method === "CASH") {
          const ref = paid?.payment?.order_reference||created?.order_reference||created?.order?.order_reference||"";
          setCurrentOrderReference(ref);
          setUpiPayment(paid?.payment||null);
          setAuthNotice(`ORDER CREATED • ${ref}. Pay the merchant directly. After verified payment confirmation for this order, your GBK reward is released automatically.`);
          return;
        }
        throw e;
      }
      if (paid?.payment?.provider === "DIRECT") {
        const ref = paid?.payment?.order_reference||created?.order_reference||created?.order?.order_reference||"";
        setCurrentOrderReference(ref);
        setUpiPayment(paid?.payment||null);
        setAuthNotice(`ORDER CREATED • ${ref}. Pay the merchant directly. After verified payment confirmation for this order, your GBK reward is released automatically.`);
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
                  setAuthNotice(verified?.settlement?.status==="SETTLED" ? "Payment verified. GBK reward released automatically." : verified?.settlement?.status==="REWARD_PREPARED" ? "Payment verified and GBK reward prepared." : "Payment verified. Automatic reward settlement is waiting for merchant GBK funding or blockchain settlement.");
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

  const openMerchantQr = async (merchant:any) => {
    setQrBusy(true); setMerchantQr("");
    try{
      const url=`${window.location.origin}/?merchant=${merchant.id}`;
      const data=await QRCode.toDataURL(url,{width:320,margin:2,errorCorrectionLevel:"M"});
      setMerchantQr(data);
    }catch(e:any){setAuthNotice(e?.message||"QR code could not be created.");}
    finally{setQrBusy(false);}
  };
  const shareMerchantQr = async (merchant:any) => {
    const url=`${window.location.origin}/?merchant=${merchant.id}`;
    try{
      if(navigator.share) await navigator.share({title:`${merchant.business_name} — GBK Loyalty`,text:"Scan or open this GBK Loyalty business page.",url});
      else {await navigator.clipboard.writeText(url);setShareNotice("Business link copied.");}
    }catch{}
  };
  const downloadMerchantQr = () => {
    if(!merchantQr)return;
    const a=document.createElement("a"); a.href=merchantQr; a.download="gbk-loyalty-business-qr.png"; a.click();
  };

  const suggestBusiness = async () => {
    const targetCountry = suggestBusinessCountry || (country !== "Global" ? country : "");
    if (!suggestBusinessName.trim() || !suggestBusinessCity.trim() || !targetCountry) { setAuthNotice("Enter the business name, city and country."); return; }
    setApiBusy(true); setAuthNotice("");
    try {
      let activeSession = session || getStoredSession();
      if (!activeSession) activeSession = await signInAnonymously();
      setSession(activeSession);
      const result = await loyaltyApi(activeSession, "suggest_business", {
        business_name:suggestBusinessName.trim(),
        category:suggestBusinessCategory==="All Products & Services" ? null : suggestBusinessCategory,
        city:suggestBusinessCity.trim(), country:targetCountry,
        address:suggestBusinessAddress.trim()||null, phone:suggestBusinessPhone.trim()||null,
        website:suggestBusinessWebsite.trim()||null, maps_url:suggestBusinessMapsUrl.trim()||null, source:"COMMUNITY"
      });
      if(result?.status==="EXISTS") setAuthNotice("This business is already in GBK Loyalty. Search for it instead.");
      else if(result?.status==="ALREADY_SUGGESTED") setAuthNotice("This business has already been suggested and is waiting for review.");
      else { setAuthNotice("Business suggestion submitted. It will be reviewed before publication; the owner must claim and activate the merchant profile before reward-eligible orders."); setSuggestBusinessName(""); setSuggestBusinessCity(""); setSuggestBusinessCountry(""); setSuggestBusinessAddress(""); setSuggestBusinessPhone(""); setSuggestBusinessWebsite(""); setSuggestBusinessMapsUrl(""); }
    } catch(e:any) { setAuthNotice(e?.message||"Business suggestion failed"); } finally { setApiBusy(false); }
  };

  const submitClaim = async () => {
    if(!claimBusiness?.id || claimName.trim().length<2 || claimContact.trim().length<4){setAuthNotice("Enter the owner name and phone or email.");return;}
    setApiBusy(true);setAuthNotice("");
    try{
      let active=session||getStoredSession(); if(!active) active=await signInAnonymously(); setSession(active);
      const result=await loyaltyApi(active,"claim_business",{suggestion_id:claimBusiness.id,claimant_name:claimName.trim(),claimant_contact:claimContact.trim()});
      setAuthNotice(result?.status==="ALREADY_PENDING"?"A claim request is already pending.":"Claim request submitted. Verification is required before the business becomes an active merchant.");
    }catch(e:any){setAuthNotice(e?.message||"Claim request failed");}finally{setApiBusy(false);}
  };

  const shareBusinessLink = async (id:string) => {
    const url=`${window.location.origin}/?claim=${id}`;
    try{
      if(navigator.share) await navigator.share({title:"Claim your GBK Loyalty business",text:"Your business has been suggested on GBK Loyalty. Claim the listing here:",url});
      else {await navigator.clipboard.writeText(url);setShareNotice("Owner claim link copied.");}
    }catch{}
  };

  const saveMerchantUpi = async () => {
    const merchantId = String(merchantStatus?.merchant?.id || "");
    const upi = String(merchantUpiId || "").trim();
    if (!merchantId) { setAuthNotice("Merchant account not found. Refresh the Merchant Wallet."); return; }
    if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/.test(upi)) {
      setAuthNotice("Enter a valid UPI ID, for example merchant@upi.");
      return;
    }
    const active = session || getStoredSession();
    if (!active) { setAuthNotice("Connect the merchant wallet first."); return; }
    setApiBusy(true); setAuthNotice("");
    try {
      const result = await loyaltyApi(active, "merchant_payment_update", {
        merchant_id: merchantId,
        upi_id: upi,
        payment_currency: "INR"
      });
      if (result?.merchant) {
        setMerchantStatus((prev:any) => ({...(prev || {}), merchant: result.merchant}));
      }
      setMerchantUpiId(upi);
      setMerchantUpiEditing(false);
      setAuthNotice("UPI payment details saved. Customers can now use PhonePe, Google Pay, Paytm, BHIM or another UPI app.");
    } catch (e:any) {
      setAuthNotice(e?.message || "UPI payment details could not be saved.");
    } finally {
      setApiBusy(false);
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
        founder_referral_code: founderReferralCode.trim() || null,
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
          <select value={country} onChange={e=>selectCountry(e.target.value)} aria-label="Country">{countries.map(x=><option key={x}>{x}</option>)}</select>
          <button className="walletBtn" onClick={()=>setRole("WalletChooser")}>👛 Wallet</button>
        </div>
      </header>

      <div className="globalBar">
        <label className="localeControl">🌐 <select value={country} onChange={e=>selectCountry(e.target.value)} aria-label="Country">{countries.map(x=><option key={x}>{x}</option>)}</select></label><label className="localeControl">💱 <select value={currency} onChange={e=>{setCurrency(e.target.value);setPaymentCurrency(e.target.value);try{localStorage.setItem("gbk_loyalty_currency",e.target.value)}catch{}}} aria-label="Currency"><option value="USD">USD $</option><option value="INR">INR ₹</option><option value="AED">AED د.إ</option><option value="GBP">GBP £</option><option value="EUR">EUR €</option><option value="SGD">SGD S$</option><option value="AUD">AUD A$</option><option value="CAD">CAD C$</option><option value="SAR">SAR ﷼</option><option value="MYR">MYR RM</option><option value="CHF">CHF</option><option value="JPY">JPY ¥</option><option value="KRW">KRW ₩</option><option value="CNY">CNY ¥</option><option value="HKD">HKD $</option><option value="THB">THB ฿</option><option value="IDR">IDR Rp</option><option value="PHP">PHP ₱</option><option value="VND">VND ₫</option><option value="BDT">BDT ৳</option><option value="LKR">LKR Rs</option><option value="NPR">NPR Rs</option><option value="PKR">PKR Rs</option><option value="ZAR">ZAR R</option><option value="NGN">NGN ₦</option><option value="EGP">EGP £</option><option value="TRY">TRY ₺</option><option value="BRL">BRL R$</option><option value="MXN">MXN $</option><option value="ARS">ARS $</option><option value="COP">COP $</option><option value="CLP">CLP $</option><option value="PEN">PEN S/</option><option value="SEK">SEK kr</option><option value="NOK">NOK kr</option><option value="DKK">DKK kr</option><option value="NZD">NZD $</option></select></label><label className="localeControl">🗣️ <select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Language">{languages.map(x=><option key={x}>{x}</option>)}</select></label>
        {!installed && <button className="installBtn" onClick={install}>{installPrompt ? "📲 Install App" : "📲 PWA App"}</button>}
      </div>

      <section className="hero">
        <div className="eyebrow">GBK LOYALTY • GLOBAL</div>
        <h1>Buy normally. Get GBK rewards.</h1>
        <p>Find participating businesses, buy normally, and receive eligible GBK rewards after the order is verified.</p>
        <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>{setSearchFocused(true);setTimeout(()=>document.querySelector(".search")?.scrollIntoView({behavior:"smooth",block:"center"}),120)}} onBlur={()=>setTimeout(()=>setSearchFocused(false),250)} placeholder={language==="తెలుగు" ? "మీకు ఏమి కావాలి?" : language==="हिन्दी" ? "आज आपको क्या चाहिए?" : "What do you need today?"}/><button className="voiceBtn" onMouseDown={()=>setSearchFocused(true)} onClick={startVoiceSearch} disabled={apiBusy || voiceListening} aria-label="Speak your request">{voiceListening ? "🎙️ Listening" : "🎤 Speak"}</button><button onMouseDown={()=>setSearchFocused(true)} onClick={()=>doSearch()} disabled={apiBusy}>{apiBusy ? "Searching…" : "Find businesses"}</button></div>
<div className="voiceStatus">{voiceSupported ? (voiceListening ? "🎙️ GBK AI is listening in " + language : "🎤 Speak in your selected language") : "⌨️ Type your request or use your device voice input"}</div>
        <div className="askHint"><span>Hotels • Restaurants • Shopping • Services • Travel</span></div>
        <div className="suggestions">
          <button onClick={()=>setQuery("restaurants with GBK rewards")}>🍽️ Restaurants</button>
          <button onClick={()=>setQuery("hotels with GBK offers")}>🏨 Hotels</button>
          <button onClick={()=>setQuery("tours and travel")}>✈️ Travel</button>
          <button onClick={()=>setQuery("AC repair near me")}>🔧 Services</button><button onClick={()=>setQuery("agriculture products or farm service near me")}>🌾 Agriculture</button>
        </div>
        <div className="offerPreview" style={{display:"grid",gap:8,marginTop:14}}>
          <b>📷 Customer QR Scanner</b><span>Scan a participating merchant QR with your phone camera to open the business directly.</span>
          <button className="primary" type="button" onClick={()=>{setScannerOpen(true);setAuthNotice("");}}>📷 Scan Merchant QR</button>
          <button className="secondary" type="button" onClick={()=>setRole("SuggestBusiness")}>＋ Add a Business</button>
        </div>
      </section>

      {searchResults.length > 0 && <section id="searchResults" className="roleSection">
        <div className="sectionHead"><div><span className="eyebrow">BUSINESSES & LOCAL LISTINGS</span><h2>Choose a business</h2><p>Active merchants are shown once. Community listings appear only when no active merchant exists for the same business.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="secondary" onClick={()=>{setScannerOpen(true);setAuthNotice("");}}>📷 Scan QR</button><button className="secondary voiceReadBtn" onClick={()=>spokenSummary(visibleSearchResults)}>{speaking ? "🔊 Speaking…" : "🔊 Read results aloud"}</button></div></div>
        <div className="roleGrid">
          {visibleSearchResults.map((m:any)=><div className="roleCard" key={m.id + (m.listing_type || "MERCHANT")}>
            <div className="roleIcon">🏪</div>
            <h3>{m.business_name}</h3>
            <p>{[m.category,m.city,m.country].filter(Boolean).join(" • ")}</p>
            {m.description && <p>{m.description}</p>}
            {m.unclaimed ? <>
              <div><span className="roleTag">Unclaimed business</span><span className="roleTag">Not reward-active</span></div>
              <p style={{fontSize:13}}>This is a community-suggested listing. The owner can claim it and complete verification.</p>
              <button className="primary" onClick={()=>{setClaimBusiness(m);setClaimName("");setClaimContact("");setRole("ClaimBusiness");}}>Claim this business →</button>
            </> : <>
              <div><span className="roleTag">{Math.round(Number(m.loyalty_offer_bps||0)/100)}% GBK Loyalty</span><span className="roleTag">Active merchant</span></div>
              <button className="primary" onClick={()=>setSelectedMerchant(m)}>Earn GBK →</button>
            </>}
          </div>)}
        </div>
      </section>}
      {searchResults.length === 0 && authNotice && authNotice.includes("No") && <section id="searchResults" className="roleSection"><div className="status"><span>{authNotice}</span></div></section>}
      {scannerOpen && <div className="modalBackdrop" onClick={()=>setScannerOpen(false)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <button className="close" onClick={()=>setScannerOpen(false)}>×</button>
          <div className="roleIcon">📷</div>
          <h2>Scan Merchant QR</h2>
          <p>Point your camera at the GBK Loyalty QR displayed by the merchant.</p>
          <div style={{background:"#111",borderRadius:18,overflow:"hidden",position:"relative",minHeight:280}}>
            <video ref={scannerVideoRef} autoPlay muted playsInline style={{width:"100%",display:"block",aspectRatio:"1/1",objectFit:"cover"}} />
            <div style={{position:"absolute",inset:"18%",border:"3px solid #fff",borderRadius:18,pointerEvents:"none"}} />
          </div>
          <div className="status" style={{marginTop:12}}><span>{scannerBusy ? "📷 Scanning…" : "🟢 Camera ready — point at the merchant QR"}</span></div>
          <label className="secondary" style={{display:"block",textAlign:"center",cursor:"pointer",marginTop:10}}>
            🖼️ Upload QR Image
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0]; if(file) scanQrImage(file); e.currentTarget.value="";}} disabled={scannerBusy}/>
          </label>
          <small style={{display:"block",textAlign:"center",marginTop:8}}>Already have a screenshot or QR photo? Upload it here.</small>
          {authNotice && <div className="notice" style={{marginTop:10}}>{authNotice}</div>}
          <button className="secondary" onClick={()=>setScannerOpen(false)}>Cancel</button>
        </div>
      </div>}
      {selectedMerchant && <div className="modalBackdrop">
        <div className="modal">
          <button className="modalClose" onClick={()=>setSelectedMerchant(null)}>×</button>
          <div className="roleIcon">🏪</div>
          <h2>{selectedMerchant.business_name}</h2>
          <p>{[selectedMerchant.category,selectedMerchant.city,selectedMerchant.country].filter(Boolean).join(" • ")}</p>
          <p>GBK Loyalty offer: <b>{Math.round(Number(selectedMerchant.loyalty_offer_bps||0)/100)}%</b></p>
          <div className="offerPreview" style={{display:"grid",gap:8,margin:"14px 0",textAlign:"center"}}>
            <b>📱 Scan to open this business</b>
            {merchantQr ? <img src={merchantQr} alt={`GBK Loyalty QR for ${selectedMerchant.business_name}`} style={{width:220,height:220,maxWidth:"100%",margin:"0 auto",background:"#fff",padding:10,borderRadius:16}}/> : <button className="secondary" type="button" onClick={()=>openMerchantQr(selectedMerchant)} disabled={qrBusy}>{qrBusy?"Creating QR…":"Generate Business QR"}</button>}
            {merchantQr && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><button className="secondary" type="button" onClick={downloadMerchantQr}>⬇️ Download QR</button><button className="secondary" type="button" onClick={()=>shareMerchantQr(selectedMerchant)}>📤 Share</button></div>}
            {shareNotice && <small>{shareNotice}</small>}
          </div>
          <label style={{display:"grid",gap:6,margin:"14px 0"}}>
            <b>Purchase amount</b>
            <input className="modalInput" inputMode="decimal" type="number" min="0.01" step="0.01" value={orderAmount} onChange={e=>setOrderAmount(e.target.value)} placeholder={country==="India" ? "Enter purchase amount in INR" : "Enter purchase amount in local currency"} />
          </label>
          {authNotice && <div className="notice" style={{margin:"12px 0"}}>{authNotice}</div>}
          {upiPayment?.upi_links && <div className="offerPreview" style={{display:"grid",gap:8,margin:"12px 0"}}>
            <b>📲 Pay ₹{upiPayment.amount_major} by UPI</b>
            <small>{upiPayment.upi_id ? `Merchant UPI: ${upiPayment.upi_id}` : "Merchant UPI payment details are not configured."}</small>
            {upiPayment.upi_links.phonepe && <a className="primary" href={upiPayment.upi_links.phonepe}>🟣 Pay with PhonePe</a>}
            {upiPayment.upi_links.googlepay && <a className="primary" href={upiPayment.upi_links.googlepay}>🟢 Pay with Google Pay</a>}
            {upiPayment.upi_links.paytm && <a className="primary" href={upiPayment.upi_links.paytm}>🔵 Pay with Paytm</a>}
            {upiPayment.upi_links.bhim && <a className="secondary" href={upiPayment.upi_links.bhim}>🏦 Pay with BHIM</a>}
            {upiPayment.upi_links.generic && <a className="secondary" href={upiPayment.upi_links.generic}>📱 Open UPI / Other app</a>}
            <small>Payment app opening is not payment verification. GBK reward is released only after verified payment confirmation.</small>
          </div>}
          <small>{selectedMerchant.payment_provider==="DIRECT" || selectedMerchant.payment_method==="CASH"
            ? "Pay the merchant directly. The merchant will verify the payment before any GBK reward is released."
            : "Continue to the merchant's configured payment method."}</small>
          <button className="primary" disabled={apiBusy || !orderAmount || !!currentOrderReference} onClick={()=>createOrderFor(selectedMerchant)}>{apiBusy ? "Creating order…" : currentOrderReference ? "✓ Order Created — Use This Order" : (selectedMerchant.payment_provider==="DIRECT" || selectedMerchant.payment_method==="CASH" ? "Continue → Send to Merchant" : "Continue & Pay")}</button>
          <button className="secondary" onClick={()=>{setSelectedMerchant(null);setOrderAmount("");setCurrentOrderReference("");setUpiPayment(null);setAuthNotice("");}}>Cancel</button>
        </div>
      </div>}
      <section className="holderGrowth">
        <div className="holderGrowthHeader">
          <div className="holderGrowthIcon">💎</div>
          <div>
            <span className="eyebrow">GBK LOYALTY TOKEN</span>
            <h2>Hold GBK. Grow Your GBK Balance.</h2>
            <p>GBK Loyalty Tokens received through the ecosystem can automatically increase according to the applicable holder reward rate.</p>
          </div>
        </div>

        <div className="holderRate">
          <span>WEEKLY VARIABLE RATE</span>
          <strong>0.7%–6.3%</strong>
        </div>

        <div className="holderExamples">
          <div className="holderExample">
            <span>Everyday example</span>
            <b>100 GBK → 105 GBK</b>
            <small>At a 5% weekly rate</small>
          </div>
          <div className="holderExample">
            <span>Larger holder example</span>
            <b>100,000 GBK → 100,700 GBK</b>
            <small>At 0.7% weekly</small>
          </div>
          <div className="holderExample">
            <span>Higher applicable rate example</span>
            <b>100,000 GBK → 106,300 GBK</b>
            <small>At 6.3% weekly</small>
          </div>
        </div>

        <div className="holderNote">
          <span>ⓘ</span>
          <p>Rewards are additional GBK tokens, not cash payments. The applicable rate may vary, and GBK market value can change with market demand and supply. Automatic increases should only apply where supported by the deployed GBK protocol/contract.</p>
        </div>
      </section>

      <section id="roles" className="roleSection roleOnlySection">
        <div className="sectionHead"><div><span className="eyebrow">ONE APP • THREE ROLES</span><h2>Simple loyalty for everyone</h2></div></div>
        <div className="roleGrid">{roles.map(r=>
          <button className="roleCard" key={r.title} onClick={()=>setRole(r.title)}>
            <div className="roleIcon">{r.icon}</div><h3>{r.title}</h3><p>{r.text}</p>
            <div>{r.items.map(i=><span className="roleTag" key={i}>{i}</span>)}</div><b>Get started →</b>
          </button>
        )}</div>
      </section>

      <section className="split compactInfo">
        <div className="panel">
          <span className="eyebrow">MERCHANT-FUNDED LOYALTY</span>
          <h2>One offer. Automatic distribution.</h2>
          <p>The merchant activates first. GBK funding is added to the connected merchant wallet when needed for eligible rewards; the merchant does not manually approve every reward.</p>
          <div className="formula"><span>Customer</span><strong>60%</strong><span>Founder</span><strong>20%</strong><span>Platform</span><strong>20%</strong></div>
          <small>Example: 10% merchant offer → 6% customer + 2% Founder + 2% platform.</small>
        </div>
        <div className="panel">
          <span className="eyebrow">LEAD MODEL</span>
          <h2>GBK AI provides leads + orders</h2>
          <p>GBK AI searches eligible registered businesses for the customer request and can automatically create and route the order/request to the selected merchant. The merchant controls the actual product/service, price and fulfilment.</p>
          <div className="status">🟢 Merchant active <span>Eligible for GBK AI leads + orders</span></div>
          <div className="status paused">⏸ Reward balance low <span>Top up GBK when an eligible reward needs additional funding; merchant visibility remains active.</span></div>
        </div>
      </section>

      <section className="founderWorkspace roleOnlySection">
        <div className="sectionHead"><div><span className="eyebrow">FOUNDER NETWORK</span><h2>Country Founders can build the local GBK network</h2><p>Country Founders can add customers/users and businesses in their assigned country. Global Founders can add users and businesses globally.</p></div></div>
        <div className="founderGrid">
          <div className="founderPanel"><div className="roleIcon">👥</div><h3>Add User</h3><p>Invite customers, community members and prospective users into GBK Loyalty.</p><button className="primary" onClick={()=>setRole("FounderUser")}>＋ Add User</button></div>
          <div className="founderPanel"><div className="roleIcon">🏪</div><h3>Add Business</h3><p>Register hotels, restaurants, shops, services and other legitimate businesses.</p><button className="primary" onClick={()=>setRole("FounderBusiness")}>＋ Add Business</button></div>
          <div className="founderPanel"><div className="roleIcon">📋</div><h3>My Network</h3><p>View businesses added, users invited, active merchants, leads and loyalty activity.</p><button className="secondary" onClick={openFounder}>Open Founder Dashboard →</button></div>
        </div>
        <div className="categoryStrip"><b>Business categories:</b>{businessCategories.map(x=><span key={x}>{x}</span>)}</div>
      </section>

      <section className="merchantRules roleOnlySection">
        <div><span className="eyebrow">MERCHANT TERMS</span><h2>Simple rules before activation</h2></div>
        <div className="ruleGrid">
          <div><b>01 · Activate first</b><p>A verified merchant can activate without a GBK balance. The connected merchant wallet is used for reward funding when an eligible reward is due.</p></div>
          <div><b>02 · Choose loyalty</b><p>Merchant selects 5%, 10%, 15%, 20% or a custom loyalty percentage.</p></div>
          <div><b>03 · Automatic split</b><p>The selected merchant offer is allocated 60% to the customer, 20% to the Founder/referrer and 20% to the GBK platform.</p></div>
          <div><b>04 · Lead commission</b><p>Merchant can accept a separate lead commission before receiving eligible leads.</p></div>
          <div><b>05 · Verified transaction</b><p>No reward is released merely because an order was sent or a payment button was clicked. Payment/order completion must be verified.</p></div>
          <div><b>06 · Low reward balance</b><p>If the connected wallet does not have enough GBK for an eligible reward, the merchant stays visible and active while that reward waits for sufficient funding.</p></div>
        </div>
      </section>

      <section className="stats">
        <div><b>GBK</b><span>Rewards from eligible purchases</span></div>
        <div><b>0</b><span>Reward transactions</span></div>
        <button onClick={()=>activeWalletRole==="merchant" ? openMerchantWallet() : setRole(activeWalletRole==="customer" ? "Customer" : activeWalletRole==="founder" ? "Founder" : "Merchant")}>👛 {activeWalletRole==="merchant" ? "Merchant wallet" : activeWalletRole==="customer" ? "Customer wallet" : activeWalletRole==="founder" ? "Founder wallet" : "Wallet"}</button>
      </section>

      <section id="offers">
        <div className="sectionHead"><div><span className="eyebrow">🎁 DISCOVER</span><h2>GBK Rewards by Category</h2></div><button className="textBtn">View all</button></div>
        <div className="grid">{offers.map(([icon,title,reward,note])=>
          <article className="card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><strong>{reward}</strong><p>{note} with participating businesses.</p><button className="shareBusinessBtn" onClick={()=>shareBusiness(title)}>📤 Share Business</button><span className="arrow">›</span></article>
        )}</div>
      </section>

      <section className="walletExplainer">
  <div className="sectionHead"><div><span className="eyebrow">👛 ONE WALLET • DIFFERENT ROLES</span><h2>How the GBK Loyalty system works</h2></div></div>
  <div className="walletRoleGrid">
    <article><div className="icon">👤</div><h3>Customer Wallet</h3><p>Receive eligible GBK rewards after verified purchases and use them in supported GBK services.</p></article>
    <article><div className="icon">🏪</div><h3>Merchant Wallet</h3><p>Keep GBK available for your loyalty rewards. Customer payments go directly to the merchant.</p></article>
    <article><div className="icon">🌍</div><h3>Founder Wallet</h3><p>Receive the qualifying Founder allocation when eligible loyalty activity is attributed to the Founder.</p></article>
    <article><div className="icon">🏢</div><h3>Platform</h3><p>Operates discovery, marketplace, loyalty, verification and reward settlement infrastructure and receives its defined platform allocation.</p></article>
  </div>
  <div className="walletFlow"><b>Customer</b><span>Scan → Pay → Earn</span><b>Merchant</b><span>Serve → Fund Rewards</span><b>Founder</b><span>Connect → Qualify</span><b>Platform</b><span>Operate → Settle</span></div>
</section>

<section className="how">
        <span className="eyebrow">HOW GBK LOYALTY WORKS</span><h2>Find → Buy → Earn → Use</h2>
        <div className="steps">
          <div><b>01</b><h3>Find a business</h3><p>Search participating businesses and services.</p></div>
          <div><b>02</b><h3>Buy normally</h3><p>Pay the business normally using its available payment method.</p></div>
          <div><b>03</b><h3>Get GBK rewards</h3><p>After the order is verified, eligible GBK rewards go to your customer wallet.</p></div>
        </div>
      </section>

      <section className="globalModel">
        <div className="sectionHead"><div><span className="eyebrow">GLOBAL MODEL</span><h2>One loyalty experience. Every country.</h2></div></div>
        <p className="globalModelLead">GBK Loyalty is designed around the customer’s local country, language and currency. Customers pay participating businesses normally; eligible GBK rewards are released only after the purchase is verified and the merchant has funded the reward pool.</p>
        <div className="globalModelGrid">
          <div><b>🌍 Country</b><span>Choose the customer’s country and discover participating local businesses.</span></div>
          <div><b>💱 Local currency</b><span>Pay in the currency and payment method normally used by the merchant.</span></div>
          <div><b>🗣️ Language</b><span>Use GBK Loyalty in supported local languages.</span></div>
          <div><b>🎁 GBK reward</b><span>Verified purchases can receive the configured eligible GBK loyalty reward.</span></div>
        </div>
        <div className="globalModelFlow"><span>Country</span><b>→</b><span>Business</span><b>→</b><span>Local Payment</span><b>→</b><span>Verified Purchase</span><b>→</b><span>GBK Reward</span></div>
      </section>

      <section className="merchant">
        <div><span className="eyebrow">FOR BUSINESSES</span><h2>Activate loyalty. Receive eligible leads.</h2><p>Register any legitimate product or service business, accept the commercial terms, choose 5%–20% or a custom percentage, connect your wallet and activate. GBK funding is added when eligible rewards need it.</p></div>
        <button onClick={()=>connectWallet("merchant")} disabled={apiBusy}>{apiBusy ? "Connecting…" : "Connect / Register Merchant →"}</button>
      </section>

      {role && <div className="modalBackdrop" onClick={()=>setRole(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <button className="close" onClick={()=>setRole(null)}>×</button>
          <div className="roleIcon">{role==="MerchantWallet" ? "👛" : role==="SuggestBusiness" || role==="ClaimBusiness" ? "🏪" : (roles.find(r=>r.title===role)?.icon || (role==="FounderUser" ? "👥" : role==="FounderBusiness" ? "🏪" : "🌍"))}</div>
          <h2>{role==="MerchantWallet" ? "Merchant Wallet" : role==="WalletChooser" ? "Choose Your Wallet" : role==="SuggestBusiness" ? "Suggest a Business" : role==="ClaimBusiness" ? "Claim This Business" : `${role} registration`}</h2>
          {role==="SuggestBusiness" ? <>
            <p>Help GBK Loyalty grow faster globally. Anyone can suggest a legitimate business — no Founder is required and no wallet is required to submit the suggestion.</p>
            <div className="status"><span>🟡 Unclaimed first</span><small>The suggestion is reviewed before publication. The business owner must claim and activate the merchant profile before customers can place reward-eligible orders.</small></div>
            <input placeholder="Business name *" value={suggestBusinessName} onChange={e=>setSuggestBusinessName(e.target.value)}/>
            <select className="modalSelect" value={suggestBusinessCategory} onChange={e=>setSuggestBusinessCategory(e.target.value)}>{businessCategories.map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="City *" value={suggestBusinessCity} onChange={e=>setSuggestBusinessCity(e.target.value)}/>
            <select className="modalSelect" value={suggestBusinessCountry || (country==="Global" ? "" : country)} onChange={e=>setSuggestBusinessCountry(e.target.value)}><option value="">Select country *</option>{countries.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="Address (optional)" value={suggestBusinessAddress} onChange={e=>setSuggestBusinessAddress(e.target.value)}/>
            <input placeholder="Phone (optional)" value={suggestBusinessPhone} onChange={e=>setSuggestBusinessPhone(e.target.value)}/>
            <input placeholder="Website (optional)" value={suggestBusinessWebsite} onChange={e=>setSuggestBusinessWebsite(e.target.value)}/>
            <input placeholder="Google Maps/share link (optional)" value={suggestBusinessMapsUrl} onChange={e=>setSuggestBusinessMapsUrl(e.target.value)}/>
            {authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
            <button className="primary" type="button" onClick={suggestBusiness} disabled={apiBusy}>{apiBusy ? "Submitting…" : "Submit Business Suggestion →"}</button>
            {suggestedBusinessId && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
              <b>🔗 Owner claim link ready</b>
              <span>Send this link to the business owner so they can claim the listing.</span>
              <button className="secondary" type="button" onClick={()=>shareBusinessLink(suggestedBusinessId)}>📤 Share / Invite Owner</button>
              {shareNotice && <small>{shareNotice}</small>}
            </div>}

          </> : role==="ClaimBusiness" ? <>
            <p>Claim this business as the owner or an authorized representative.</p>
            {claimBusiness && <div className="offerPreview" style={{marginBottom:12}}>
              <b>{claimBusiness.business_name}</b>
              <span>{[claimBusiness.category,claimBusiness.city,claimBusiness.country].filter(Boolean).join(" • ")}</span>
              <span>After your claim is submitted, GBK Loyalty will verify the business before merchant activation.</span>
            </div>}
            <input placeholder="Owner / authorized representative name *" value={claimName} onChange={e=>setClaimName(e.target.value)}/>
            <input placeholder="Phone or email *" value={claimContact} onChange={e=>setClaimContact(e.target.value)}/>
            {authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
            <button className="primary" type="button" onClick={submitClaim} disabled={apiBusy}>{apiBusy ? "Submitting claim…" : "Submit Claim →"}</button>
          
          </> : role==="WalletChooser" ? <>
            <p>Connect your wallet to enter the correct GBK Loyalty account. Registered merchants open directly; new merchants can register after wallet connection.</p>
            <div className="walletChoiceGrid">
              <button className="walletChoice" onClick={async()=>{await connectWallet("customer");}}>
                <span>👤</span><b>Customer</b><small>Buy, earn and manage your GBK rewards.</small>
              </button>
              <button className="walletChoice" onClick={async()=>{await connectWallet("merchant");}}>
                <span>🏪</span><b>Merchant</b><small>Connect your merchant wallet. Registered businesses open directly; new businesses continue to registration.</small>
              </button>
              <button className="walletChoice" onClick={async()=>{await connectWallet("founder");}}>
                <span>🌍</span><b>Founder</b><small>Enter your verified Founder account and benefits.</small>
              </button>
            </div>
            <div className="status" style={{marginTop:14}}>
              <span>🔐 Wallet-based role access</span>
              <small>Merchant wallets are checked against the registered merchant record. Existing merchants open directly; unregistered wallets continue to new merchant registration.</small>
            </div>
          </> : role==="MerchantWallet" ? <>
            <p>Manage the connected merchant reward wallet. Customer payments remain direct to the merchant; GBK is used only for the merchant-funded loyalty reward pool.</p>
            <div className="offerPreview" style={{display:"grid",gap:6}}>
              <b>Merchant: {merchantStatus?.merchant?.business_name || "—"}</b>
              <span>Wallet: {walletAddress ? walletAddress.slice(0,6)+"…"+walletAddress.slice(-4) : (merchantStatus?.merchant?.profile_id ? "Connected" : "Not connected")}</span>
            </div>
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:14}}>
              <b>📲 Merchant UPI Payment</b>
              {!merchantUpiEditing ? <>
                <span>{merchantUpiId ? <>UPI ID: <strong>{merchantUpiId}</strong></> : "No UPI ID configured yet."}</span>
                <button className="secondary" type="button" onClick={()=>setMerchantUpiEditing(true)}>✏️ {merchantUpiId ? "Edit UPI ID" : "Add UPI ID"}</button>
              </> : <>
                <small>Customers can pay this merchant through supported UPI apps. One UPI ID works for PhonePe, Google Pay, Paytm, BHIM and other UPI apps.</small>
                <input
                  className="modalInput"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={merchantUpiId}
                  onChange={e=>setMerchantUpiId(e.target.value)}
                  placeholder="merchant@upi"
                />
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button className="primary" type="button" onClick={saveMerchantUpi} disabled={apiBusy}>{apiBusy ? "Saving…" : "💾 Save UPI ID"}</button>
                  <button className="secondary" type="button" onClick={()=>{
                    const saved=String(merchantStatus?.merchant?.payment_details?.upi_id || merchantStatus?.merchant?.payment_details?.details || "").trim();
                    setMerchantUpiId(saved); setMerchantUpiEditing(false);
                  }} disabled={apiBusy}>Cancel</button>
                </div>
                <small>UPI payments use INR. GBK reward release still requires verified payment confirmation.</small>
              </>}
            </div>
            <div className="merchantWalletLive">
              <div className="merchantWalletPrimary">
                <span>LIVE ON-CHAIN GBK BALANCE</span>
                <strong>{merchantChainStatus ? (Number(merchantChainStatus.balanceRaw)/1e8).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"} <em>GBK</em></strong>
                <small>{merchantChainStatus ? "Read directly from the connected BNB Smart Chain wallet." : "Connect the merchant wallet to read the live balance."}</small>
              </div>
              <div className="merchantWalletMetric">
                <span>Reward allowance</span>
                <b>{merchantChainStatus ? (merchantChainStatus.allowanceRaw === "0" ? "Not approved" : "Approved") : "—"}</b>
                <small>{merchantChainStatus?.allowanceRaw && merchantChainStatus.allowanceRaw !== "0" ? "Distributor approval is active." : "One-time approval is required before reward settlement."}</small>
              </div>
              <div className="merchantWalletMetric">
                <span>Database balance</span>
                <b>{merchantStatus?.merchant?.gbk_balance_raw != null ? (Number(merchantStatus.merchant.gbk_balance_raw)/1e8).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : (merchantStatus?.live_gbk_balance_raw ? (Number(merchantStatus.live_gbk_balance_raw)/1e8).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "0")} GBK</b>
                <small>Database funding balance recorded for this merchant. Live on-chain balance above is used for current funding checks.</small>
              </div>
            </div>
            <div className="merchantWalletActions">
              <button className="secondary" onClick={()=>refreshMerchantChainStatus()} disabled={merchantChainBusy}>{merchantChainBusy ? "Reading wallet…" : "↻ Refresh live balance"}</button>
              {merchantChainStatus && merchantChainStatus.allowanceRaw === "0" && <button className="primary" onClick={async()=>{
                setApiBusy(true); setAuthNotice("");
                try {
                  const txHash = await approveMerchantRewardDistributor("1");
                  setAuthNotice("GBK reward approval submitted. Confirm the transaction in your merchant wallet.");
                  await waitForChainTx(txHash);
                  await refreshMerchantChainStatus();
                  setAuthNotice("GBK reward approval confirmed. The merchant wallet is ready for eligible reward settlements.");
                } catch(e:any) { setAuthNotice(e.message || "GBK reward approval failed."); }
                finally { setApiBusy(false); }
              }} disabled={apiBusy}>{apiBusy ? "Approving…" : "Approve GBK rewards once"}</button>}
            </div>
            <div className={Number(merchantChainStatus?.balanceRaw || merchantStatus?.live_gbk_balance_raw || 0) > 0 ? "status" : "status paused"}>
              {Number(merchantChainStatus?.balanceRaw || merchantStatus?.live_gbk_balance_raw || 0) > 0
                ? "🟢 Merchant active & funded"
                : "⏸ Reward balance low"}
              <span>{Number(merchantChainStatus?.balanceRaw || merchantStatus?.live_gbk_balance_raw || 0) > 0
                ? "Live GBK balance is available. Each eligible order is checked against the live balance before reward settlement."
                : "Top up GBK in the connected merchant wallet; the system will re-check the live balance."}</span>
            </div>
            <button className="secondary" onClick={openMerchantWallet} disabled={apiBusy}>{apiBusy ? "Checking…" : "Refresh live GBK balance"}</button>
            {merchantStatus?.merchant?.invitation_status !== "ACCEPTED" && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:14}}>
              <b>Merchant activation</b>
              <span>Accept the GBK Loyalty terms to activate this business for customer search and orders. Activation verifies the connected merchant wallet. A GBK balance is not required just to activate; the connected wallet is used when reward funding is needed.</span>
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
                       o.reward_settlement_status==="BELOW_MINIMUM_REWARD" ? "⚪ Below $0.10 minimum — no GBK transfer" :
                       "⚪ Reward pending"}
                    </span>}
                    {o.reward_settlement_status==="AWAITING_MERCHANT_APPROVAL" && o.reward_required_raw && <button className="secondary" style={{marginTop:6}} disabled={apiBusy} onClick={()=>approveRewardForOrder(o)}>
                      {apiBusy ? "Approving…" : "Approve GBK rewards once"}
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
                        await loyaltyApi(session,"merchant_order_update",{order_id:o.id,status:"COMPLETED"});
                        setAuthNotice("Payment verified and order completed. Releasing the GBK reward…");
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
          </> : role==="ClaimCenter" ? <>
            <p><b>Business Claims</b> — verify owner or authorized representative claims before merchant activation.</p>
            {authNotice && <div className="status" style={{marginBottom:12}}><span>{authNotice}</span></div>}
            {claimQueue.length===0 ? <div className="offerPreview"><b>✅ No pending claims</b><span>New owner claims will appear here after submission.</span></div> :
              <div style={{display:"grid",gap:12}}>
                {claimQueue.map((c:any)=><div key={c.id} className="offerPreview">
                  <b>{c.suggestion?.business_name || "Business claim"}</b>
                  <span>{[c.suggestion?.category,c.suggestion?.city,c.suggestion?.country].filter(Boolean).join(" · ")}</span>
                  <span>👤 Claimant: {c.claimant_name}</span>
                  <span>📞 Contact: {c.claimant_contact}</span>
                  <span>Submitted: {new Date(c.created_at).toLocaleString()}</span>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                    <button className="primary" type="button" disabled={claimBusy} onClick={()=>decideClaim(c.id,"APPROVE")}>✅ Approve Claim</button>
                    <button className="secondary" type="button" disabled={claimBusy} onClick={()=>decideClaim(c.id,"REJECT")}>❌ Reject</button>
                  </div>
                </div>)}
              </div>}
          </> : role==="ReviewCenter" ? <>
            <p><b>Automatic-first review.</b> Clean submissions are auto-approved for the unclaimed directory workflow. Flagged submissions are shown here for manual checking. Approval does not activate payments or GBK rewards; the owner must still claim and complete merchant activation.</p>
            {authNotice && <div className="status" style={{marginBottom:12}}><span>{authNotice}</span></div>}
            {reviewQueue.length===0 ? <div className="offerPreview"><b>✅ No manual review cases</b><span>The automatic screening queue is clear.</span></div> :
              <div style={{display:"grid",gap:12}}>
                {reviewQueue.map((s:any)=><div key={s.id} className="offerPreview">
                  <b>{s.business_name}</b>
                  <span>{s.category} · {s.city}, {s.country}</span>
                  {s.address && <span>📍 {s.address}</span>}
                  {s.phone && <span>📞 {s.phone}</span>}
                  {s.website && <span>🌐 {s.website}</span>}
                  {s.maps_url && <span>🗺️ Maps link supplied</span>}
                  <span>Risk score: {s.auto_review_score} · Flags: {(s.auto_review_flags||[]).join(", ") || "None"}</span>
                  <span>Status: {s.auto_review_status} · Submitted {new Date(s.created_at).toLocaleString()}</span>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                    <button className="primary" type="button" disabled={reviewBusy} onClick={()=>decideReview(s.id,"APPROVE")}>✅ Approve Unclaimed</button>
                    <button className="secondary" type="button" disabled={reviewBusy} onClick={()=>decideReview(s.id,"REJECT")}>❌ Reject</button>
                  </div>
                </div>)}
              </div>}
          </> : role==="FounderUser" ? <>
            <p>Add a user to your Founder network. The referral is saved in GBK Loyalty so you can track it later.</p>
            <input placeholder="User full name" value={founderUserName} onChange={e=>setFounderUserName(e.target.value)}/>
            <input placeholder="Mobile or email" value={founderUserContact} onChange={e=>setFounderUserContact(e.target.value)}/>
            <select className="modalSelect" value={founderUserCountry||(country==="Global"?"":country)} onChange={e=>setFounderUserCountry(e.target.value)}><option value="">Select country</option>{countries.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select>
            <label className="check"><input type="checkbox"/> I confirm this person has agreed to be contacted/invited.</label>
            <button className="primary" onClick={addFounderUser} disabled={apiBusy}>{apiBusy?"Saving…":"Save User Referral →"}</button>
          </> : role==="FounderBusiness" ? <>
            <p>Add a business referral to GBK Loyalty. It appears in your Founder network immediately and becomes public to customers after owner activation and funding.</p>
            <input placeholder="Business name" value={founderBusinessName} onChange={e=>setFounderBusinessName(e.target.value)}/>
            <select className="modalSelect" value={founderBusinessCategory} onChange={e=>setFounderBusinessCategory(e.target.value)}>{businessCategories.filter(x=>x!=="All Products & Services").map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="Owner / contact name" value={founderBusinessOwner} onChange={e=>setFounderBusinessOwner(e.target.value)}/>
            <input placeholder="Mobile or email" value={founderBusinessContact} onChange={e=>setFounderBusinessContact(e.target.value)}/>
            <input placeholder="City" value={founderBusinessCity} onChange={e=>setFounderBusinessCity(e.target.value)}/>
            <select className="modalSelect" value={founderBusinessCountry||(country==="Global"?"":country)} onChange={e=>setFounderBusinessCountry(e.target.value)}><option value="">Select country</option>{countries.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="Address" value={founderBusinessAddress} onChange={e=>setFounderBusinessAddress(e.target.value)}/>
            <input placeholder="Website (optional)" value={founderBusinessWebsite} onChange={e=>setFounderBusinessWebsite(e.target.value)}/>
            <select className="modalSelect" value={founderBusinessOffer} onChange={e=>setFounderBusinessOffer(e.target.value)}><option>5%</option><option>10%</option><option>15%</option><option>20%</option></select>
            <label className="check"><input type="checkbox"/> Business owner has agreed to the listing and GBK Loyalty terms.</label>
            <button className="primary" onClick={addFounderBusiness} disabled={apiBusy}>{apiBusy?"Saving…":"Save Business Referral →"}</button>
          </> : role==="Merchant" ? <>
            <p>Start your merchant setup. Connect your merchant wallet, choose your loyalty offer and activate. A GBK balance is not required just to activate.</p>
            <input placeholder="Business name" value={merchantBusinessName} onChange={e=>setMerchantBusinessName(e.target.value)}/>
            <input placeholder="Owner name" value={merchantOwnerName} onChange={e=>setMerchantOwnerName(e.target.value)}/>
            <input placeholder="Phone (optional)" value={merchantPhone} onChange={e=>setMerchantPhone(e.target.value)}/>
            <input type="email" placeholder="Email (optional)" value={merchantEmail} onChange={e=>setMerchantEmail(e.target.value)}/>
            <select className="modalSelect" value={merchantCategory} onChange={e=>setMerchantCategory(e.target.value)}>{businessCategories.map(x=><option key={x}>{x}</option>)}</select>
            <input placeholder="City" value={merchantCity} onChange={e=>setMerchantCity(e.target.value)}/>
            <input className="modalInput" placeholder="Founder referral code (optional)" value={founderReferralCode} onChange={e=>setFounderReferralCode(e.target.value.toUpperCase())}/>
            <small>Optional. Anyone can list a business directly. Enter a verified Founder code only if this business was referred by that Founder.</small>
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
              {paymentMethod !== "CASH" && <input className="modalInput" value={paymentDetails} onChange={e=>setPaymentDetails(e.target.value)} placeholder={paymentMethod==="USDT" ? "USDT wallet/payment details (optional)" : "Merchant UPI ID, bank or payment details (e.g. merchant@upi)"}/>}
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
          </> : role==="Founder" ? <>
            <p>Founder registration is required before Founder benefits are available in GBK Loyalty. Connect the same wallet used for your verified Founder membership.</p>
            <div className="walletRequiredBox">
              <b>Founder wallet — required</b>
              <small>Your wallet is used to match the verified Founder membership. No private key or seed phrase is requested.</small>
              <input className="modalInput" value={walletAddress || ""} readOnly placeholder="Connect Founder wallet"/>
              <button type="button" className="secondary" onClick={()=>connectWallet("founder")} disabled={apiBusy}>{walletAddress ? "Wallet Connected" : "Connect Founder Wallet"}</button>
            </div>
            <div className="founderRegistrationGrid">
              <label><span>Founder type</span><select value={founderType} onChange={e=>setFounderType(e.target.value as "country"|"global")}><option value="country">Country Founder</option><option value="global">Global Founder</option></select></label>
              <label><span>Founder tier</span><select value={founderTier} onChange={e=>setFounderTier(e.target.value)}><option value="COUNTRY_300">Country Founder — $300</option><option value="COUNTRY_500">Country Growth Founder — $500</option><option value="COUNTRY_1000">Country Leadership Founder — $1,000</option><option value="GLOBAL_3000">Global Founder — $3,000</option><option value="GLOBAL_5000">Global Growth Founder — $5,000</option><option value="GLOBAL_10000">Global Leadership Founder — $10,000</option></select></label>
            </div>
            <input className="modalInput" value={founderTxHash} onChange={e=>setFounderTxHash(e.target.value)} placeholder="BSC transaction hash from Founder membership"/>
            <a className="secondary" href="https://founder.gbkai.com" target="_blank" rel="noreferrer">Open Founder Membership Portal ↗</a>
            {authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
            {founderStatus?.founder_verified && <div className="offerPreview" style={{marginTop:12}}>
              <b>Founder referral code</b>
              <span>Share this code with businesses you personally refer to GBK Loyalty.</span>
              <strong style={{fontSize:20,letterSpacing:1}}>{founderStatus.founder_referral_code || "Generated for your Founder account"}</strong>
            </div>}
            {founderStatus?.founder_verified && <div className="offerPreview" style={{marginTop:12}}>
              <b>🛡️ Business Review Center</b>
              <span>Automatic screening handles normal submissions. Only flagged or pending cases need manual review.</span>
              <button className="secondary" type="button" style={{marginTop:10,width:"100%"}} onClick={loadReviewQueue} disabled={reviewBusy}>
                {reviewBusy ? "Loading review queue…" : "Open Review Queue →"}
              </button>
              <button className="secondary" type="button" style={{marginTop:8,width:"100%"}} onClick={loadClaimQueue} disabled={claimBusy}>
                {claimBusy ? "Loading claim requests…" : "Open Business Claims →"}
              </button>
            </div>}
            {founderStatus?.founder_verified && <div className="founderNetworkList">
              <div className="offerPreview" style={{marginTop:12}}>
                <b>👑 Founder Network</b>
                <span>Add users and businesses directly from your verified Founder account.</span>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginTop:10}}>
                  <button className="primary" type="button" onClick={()=>setRole("FounderUser")}>👤 Add User</button>
                  <button className="primary" type="button" onClick={()=>setRole("FounderBusiness")}>🏪 Add Business</button>
                </div>
                <button className="secondary" type="button" style={{marginTop:10,width:"100%"}} onClick={()=>loadFounderNetwork()}>↻ Refresh My Network</button>
              </div>
              <div className="offerPreview"><b>👥 My User Referrals ({founderNetwork.users.length})</b>{founderNetwork.users.length===0?<span>No user referrals yet.</span>:founderNetwork.users.slice(0,8).map((u:any)=><div key={u.id}><strong>{u.referred_name}</strong><span>{u.country} · {u.status}</span></div>)}</div>
              <div className="offerPreview"><b>🏪 My Business Referrals ({founderNetwork.businesses.length})</b>{founderNetwork.businesses.length===0?<span>No business referrals yet.</span>:founderNetwork.businesses.slice(0,8).map((b:any)=><div key={b.id}><strong>{b.business_name}</strong><span>{b.city}, {b.country} · {b.listing_status} · {b.invitation_status}</span></div>)}</div>
            </div>}
          </> : <>
            <p>Start with simple registration. Wallet connection, verification and role-specific setup come next.</p>
            <input placeholder="Full name"/>
            <input placeholder="Mobile or email"/>
          </>}
          {role==="Merchant" && authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
          {role==="Founder" ? <button className="primary" onClick={verifyFounder} disabled={apiBusy}>{apiBusy ? "Verifying…" : "Verify Founder Member →"}</button> : role==="Merchant" ? <button className="primary" disabled={apiBusy} onClick={registerMerchant}>{apiBusy ? "Registering…" : "Continue →"}</button> : null}{role==="MerchantWallet" ? <small>Send GBK only to the connected merchant wallet. The website does not take custody of merchant GBK.</small> : <small>No token transfer happens from this screen.</small>}
        </div>
      </div>}

      <nav className={`bottomNav${searchFocused ? " searchFocused" : ""}`}><a className="active">⌂<span>Home</span></a><a onClick={()=>setRole("Customer")}>⌕<span>Explore</span></a><a onClick={()=>setRole("Customer")}>🎁<span>Rewards</span></a><a onClick={()=>activeWalletRole==="merchant" ? openMerchantWallet() : activeWalletRole==="customer" ? setRole("Customer") : activeWalletRole==="founder" ? setRole("Founder") : connectWallet("merchant")}>👛<span>Wallet</span></a><a onClick={()=>setRole("Customer")}>☻<span>Profile</span></a></nav>
    </main>
  );
}