// Production sync: ensure latest Founder wallet recognition is deployed.
"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import QRCode from "qrcode";
import { getStoredSession, loyaltyApi, signInAnonymously, connectEvmWallet, getConnectedEvmWallet, approveMerchantRewardDistributor, getGbkWalletStatus, getWalletAssetBalances, loyaltyReviewApi, type LoyaltySession } from "../lib/loyalty";

const businessCategories = ["All Products & Services","Hotels & Resorts","Restaurants & Cafés","Stores & Supermarkets","Groceries & Supermarkets","Fashion & Apparel","Electronics","Pharmacies & Health Stores","Salons & Beauty","AC Repair","Plumbing & Electrical","Home Services","Automotive & EV","Fuel & Charging","Travel Agencies","Flights & Holidays","Taxis & Transport","Parcel & Logistics","Education & Courses","Spoken English","Healthcare & Clinics","Real Estate","Agriculture & Farm Services","Seeds & Fertilizer","Farm Equipment","Crop Advisory","Legal Services","Accounting","Insurance","IT & Web Development","Digital Marketing","Events & Weddings","Fitness & Sports","Professional Services","Local Shops","Wholesale & Distribution","Manufacturing","Construction","Cleaning Services","Pet Services"];

const offers = [
  ["🏨","Hotels & Resorts","Up to 10% GBK","Stay and earn"],
  ["✈️","Tours & Travel","Up to 10% GBK","Travel and earn"],
  ["🍽️","Restaurants & Cafés","Up to 5% GBK","Dine and earn"],
  ["🛍️","Stores & Supermarkets","2–10% GBK","Shop and earn"],
  ["🏠","Real Estate","GBK offers","Property services and leads"],
  ["🔧","Local Services","Up to 20% GBK","Use and earn"],
];

const languages = ["English","हिन्दी","తెలుగు","தமிழ்","ಕನ್ನಡ","മലയാളം","বাংলা","मराठी","العربية","Español","中文","Français","Português"];
const countries = ["Global","India","United Arab Emirates","United States","United Kingdom","Singapore","Australia","Canada","Saudi Arabia","Malaysia","Germany","France","Italy","Spain","Portugal","Netherlands","Belgium","Switzerland","Austria","Sweden","Norway","Denmark","Finland","Ireland","New Zealand","Japan","South Korea","China","Hong Kong","Thailand","Indonesia","Philippines","Vietnam","Bangladesh","Sri Lanka","Nepal","Pakistan","South Africa","Nigeria","Kenya","Egypt","Turkey","Brazil","Mexico","Argentina","Colombia","Chile","Peru"];
const currencyMap: Record<string,string> = {India:"INR", "United Arab Emirates":"AED", "United States":"USD", "United Kingdom":"GBP", Singapore:"SGD", Australia:"AUD", Canada:"CAD", "Saudi Arabia":"SAR", Malaysia:"MYR", Germany:"EUR", France:"EUR", Italy:"EUR", Spain:"EUR", Portugal:"EUR", Netherlands:"EUR", Belgium:"EUR", Switzerland:"CHF", Austria:"EUR", Sweden:"SEK", Norway:"NOK", Denmark:"DKK", Finland:"EUR", Ireland:"EUR", "New Zealand":"NZD", Japan:"JPY", "South Korea":"KRW", China:"CNY", "Hong Kong":"HKD", Thailand:"THB", Indonesia:"IDR", Philippines:"PHP", Vietnam:"VND", Bangladesh:"BDT", "Sri Lanka":"LKR", Nepal:"NPR", Pakistan:"PKR", "South Africa":"ZAR", Nigeria:"NGN", Kenya:"KES", Egypt:"EGP", Turkey:"TRY", Brazil:"BRL", Mexico:"MXN", Argentina:"ARS", Colombia:"COP", Chile:"CLP", Peru:"PEN"};
const currencyForCountry = (value:string) => currencyMap[value] || "USD";

const roles = [
  {icon:"👤",title:"Customer",text:"Find businesses, pay normally and earn eligible GBK Loyalty rewards.",items:["Earn GBK","Hold • Use • Transfer"]},
  {icon:"🏪",title:"Merchant",text:"Register or claim your business, connect the merchant wallet, add GBK and activate. A live GBK balance is required before the business becomes ACTIVE.",items:["5%–20% or Custom","Automatic rewards"]},
  {icon:"🌍",title:"Founder",text:"Country or Global Founder Members can onboard businesses and receive the Founder allocation from verified loyalty sales.",items:["Add users","Add businesses","Track earnings"]},
];

const priorityCities: Record<string,string[]> = {
  India:["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Surat","Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Dhanbad","Amritsar","Navi Mumbai","Allahabad","Ranchi","Howrah","Coimbatore","Vijayawada","Jodhpur","Madurai","Raipur","Kota","Guwahati","Chandigarh","Solapur","Hubballi","Mysuru","Tiruchirappalli","Bareilly","Aligarh","Tiruppur"],
  "United States":["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","Seattle","Denver","Washington","Boston","Nashville","Detroit","Oklahoma City","Portland","Las Vegas","Memphis","Louisville","Baltimore","Milwaukee","Albuquerque","Tucson","Fresno","Sacramento","Atlanta","Kansas City","Mesa","Raleigh","Omaha","Miami","Long Beach","Virginia Beach","Oakland","Minneapolis","Tulsa","Tampa","Arlington","New Orleans","Wichita","Cleveland","Bakersfield"],
  "United Arab Emirates":["Dubai","Abu Dhabi","Sharjah","Al Ain","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain","Khor Fakkan","Dibba Al-Fujairah"],
  Thailand:["Bangkok","Chiang Mai","Pattaya","Phuket","Nonthaburi","Hat Yai","Nakhon Ratchasima","Chiang Rai","Udon Thani","Hua Hin"],
  Malaysia:["Kuala Lumpur","George Town","Johor Bahru","Ipoh","Kota Kinabalu","Shah Alam","Malacca City","Kuching","Petaling Jaya","Kota Bharu"],
  Philippines:["Manila","Quezon City","Davao City","Cebu City","Zamboanga City","Antipolo","Pasig","Taguig","Cagayan de Oro","Parañaque"]
};

const buildAndroidUpiIntent = (params: URLSearchParams) => { const fallback = typeof window !== "undefined" ? window.location.href : "https://loyalty.gbkai.com"; return "intent://pay?" + params.toString() + "#Intent;scheme=upi;S.browser_fallback_url=" + encodeURIComponent(fallback) + ";end"; };
const buildPhonePeIntent = (params: URLSearchParams) => {
  const fallback = typeof window !== "undefined" ? window.location.href : "https://loyalty.gbkai.com";
  return "intent://pay?" + params.toString() + "#Intent;scheme=phonepe;package=com.phonepe.app;S.browser_fallback_url=" + encodeURIComponent(fallback) + ";end";
};

export default function Home() {
  const [query,setQuery] = useState("");
  const [searchFocused,setSearchFocused] = useState(false);
  const [voiceListening,setVoiceListening] = useState(false);
  const [voiceSupported,setVoiceSupported] = useState(false);
  const [speaking,setSpeaking] = useState(false);
  const speechRecognitionRef = useRef<any>(null);
  const speechUnlockedRef = useRef(false);
  const [askQuery,setAskQuery] = useState("");
  const [askAnswer,setAskAnswer] = useState("");
  const [askResults,setAskResults] = useState<any[]>([]);
  const [askBusy,setAskBusy] = useState(false);
  const [askAiOpen,setAskAiOpen] = useState(false);
  const [language,setLanguage] = useState("English");
  const [country,setCountry] = useState("Global");
  const [currency,setCurrency] = useState("USD");
  const [role,setRole] = useState<string|null>(null);
  const [merchantOffer,setMerchantOffer] = useState("10%");
  const [customOffer,setCustomOffer] = useState("25");
  const [merchantOfferType,setMerchantOfferType] = useState<"Product"|"Service">("Product");
  const [merchantOfferDescription,setMerchantOfferDescription] = useState("");
  const [merchantOfferAmount,setMerchantOfferAmount] = useState("");
  const [shareNotice,setShareNotice] = useState("");
  const [merchantQr,setMerchantQr] = useState("");
  const [qrBusy,setQrBusy] = useState(false);
  const [suggestedBusinessId,setSuggestedBusinessId] = useState("");
  const [claimBusiness,setClaimBusiness] = useState<any|null>(null);
  const [claimName,setClaimName] = useState("");
  const [claimMobile,setClaimMobile] = useState("");
  const [claimEmail,setClaimEmail] = useState("");
  const [claimSubmitted,setClaimSubmitted] = useState(false);
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
  const [merchantOfferEditing,setMerchantOfferEditing] = useState(false);
  const [merchantOfferEdit,setMerchantOfferEdit] = useState("10");
  const [merchantOfferEditType,setMerchantOfferEditType] = useState<"Flat Store"|"Product"|"Service">("Flat Store");
  const [merchantOfferEditDescription,setMerchantOfferEditDescription] = useState("");
  const [merchantOfferEditAmount,setMerchantOfferEditAmount] = useState("");
  const [merchantOfferEditCurrency,setMerchantOfferEditCurrency] = useState("INR");
  const [merchantOfferEditCustom,setMerchantOfferEditCustom] = useState("25");
  const [session,setSession] = useState<LoyaltySession|null>(null);
  const [activeWalletRole,setActiveWalletRole] = useState<"customer"|"merchant"|"founder"|null>(null);
  const [authMode,setAuthMode] = useState<"login"|"signup">("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [fullName,setFullName] = useState("");
  const [authNotice,setAuthNotice] = useState("");
  const [apiBusy,setApiBusy] = useState(false);
  const [searchResults,setSearchResults] = useState<any[]>([]);
  const [directoryResults,setDirectoryResults] = useState<any[]>([]);
  const [directoryCounts,setDirectoryCounts] = useState({active:0,unclaimed:0,total:0});
  const [directoryLoading,setDirectoryLoading] = useState(false);
  const [showBackToTop,setShowBackToTop] = useState(false);
  const [selectedMerchant,setSelectedMerchant] = useState<any|null>(null);
  const [orderAmount,setOrderAmount] = useState("");
  const [currentOrderReference,setCurrentOrderReference] = useState("");
  const [upiPayment,setUpiPayment] = useState<any|null>(null);
  const [upiQrDataUrl,setUpiQrDataUrl] = useState("");
  const [paymentUtr,setPaymentUtr] = useState("");
  const [paymentSuccess,setPaymentSuccess] = useState<any>(null);
  const [merchantBusinessName,setMerchantBusinessName]=useState("");
  const [founderReferralCode,setFounderReferralCode]=useState("");
  const [creatorReferralCode,setCreatorReferralCode]=useState("");
  const [creatorReferralStatus,setCreatorReferralStatus]=useState<any>(null);
  const [creatorReferralLink,setCreatorReferralLink]=useState("");
  const [universalReferralCode,setUniversalReferralCode]=useState("");
  const [universalReferralStatus,setUniversalReferralStatus]=useState<any>(null);
  const [universalReferralLink,setUniversalReferralLink]=useState("");
  const [founderReferralStatus,setFounderReferralStatus]=useState<any>(null);
  const [merchantOwnerName,setMerchantOwnerName]=useState("");
  const [merchantTermsAccepted,setMerchantTermsAccepted]=useState(false);
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
  const [merchantInviteName,setMerchantInviteName]=useState("");
  const [merchantInviteContact,setMerchantInviteContact]=useState("");
  const [merchantInviteCity,setMerchantInviteCity]=useState("");
  const [merchantInviteCategory,setMerchantInviteCategory]=useState(businessCategories[0]);
  const [merchantInviteNotice,setMerchantInviteNotice]=useState("");
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
  const [walletAssetStatus,setWalletAssetStatus] = useState<{gbkRaw:string;usdtRaw:string;bnbRaw:string}|null>(null);
  const [walletAssetBusy,setWalletAssetBusy] = useState(false);
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

  const selectCountry = (value:string) => { setCountry(value); const next = value === "Global" ? "USD" : currencyForCountry(value); setCurrency(next); setPaymentCurrency(next); if (value === "United States") { setPaymentGateway("STRIPE"); setPaymentMethod("CARD_WALLETS"); setPaymentDetails(""); } else if (value === "India") { setPaymentGateway("DIRECT"); setPaymentMethod("UPI"); setPaymentDetails(""); } else { setPaymentGateway("DIRECT"); setPaymentMethod("LOCAL_CURRENCY"); setPaymentDetails(""); } try { localStorage.setItem("gbk_loyalty_country", value); localStorage.setItem("gbk_loyalty_currency", next); } catch {} };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 550);
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const rawRef = new URLSearchParams(window.location.search).get("ref");
    if (!rawRef) return;
    const ref = rawRef.trim();
    let cancelled=false;
    (async()=>{
      try{
        const active = session || getStoredSession() || await signInAnonymously();
        if(!session) setSession(active);
        const creator = await loyaltyApi(active,"creator_referral_check",{creator_referral_code:ref});
        if(creator?.verified){
          if(!cancelled){ setCreatorReferralCode(ref); setCreatorReferralStatus(creator.creator); setFounderReferralCode(""); }
          return;
        }
      }catch{}
      if(!cancelled) setFounderReferralCode(ref);
    })();
    return()=>{cancelled=true;};
  }, []);

  useEffect(() => {
    if (role !== "Merchant" || !founderReferralCode.trim()) {
      if (!founderReferralCode.trim()) setFounderReferralStatus(null);
      return;
    }
    let cancelled=false;
    const timer=window.setTimeout(async()=>{
      try{
        let active=session || getStoredSession();
        if(!active) active=await signInAnonymously();
        if(!cancelled){
          setSession(active);
          const result=await loyaltyApi(active,"founder_referral_check",{
            founder_referral_code:founderReferralCode.trim(),
            country
          });
          if(result?.verified){
            setFounderReferralStatus(result.founder);
          }else{
            setFounderReferralStatus({error:result?.message||"Founder referral is not verified."});
          }
        }
      }catch(e:any){
        if(!cancelled)setFounderReferralStatus({error:e?.message||"Founder referral verification failed."});
      }
    },350);
    return ()=>{cancelled=true;window.clearTimeout(timer);};
  }, [founderReferralCode,country,role]);

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
    let cancelled=false;
    const loadClaim = async () => {
      try{
        let active=getStoredSession();
        if(!active) active=await signInAnonymously();
        if(cancelled)return;
        setSession(active);
        const result=await loyaltyApi(active,"get_business_suggestion",{suggestion_id:claimId});
        if(cancelled || !result?.suggestion)return;
        const b=result.suggestion;
        setClaimBusiness(b);
        if(result.claim?.claimant_name && !claimName) setClaimName(result.claim.claimant_name);
        if(result.claim_status==="PENDING") setClaimSubmitted(true);
        const approved=result.claim_status==="APPROVED" || b.status==="CONVERTED";
        if(approved){
          setMerchantBusinessName(b.business_name||"");
          setMerchantOwnerName(result.claim?.claimant_name||claimName||"");
          setMerchantPhone(b.phone||"");
          setMerchantEmail("");
          setMerchantCity(b.city||"");
          setMerchantCategory(b.category||businessCategories[0]);
          if(b.country && countries.includes(b.country)) selectCountry(b.country);
          setAuthNotice("Claim approved. The same business details are now loaded into Merchant Registration. Connect the merchant wallet to continue activation.");
          setRole("Merchant");
        }else{
          setRole("ClaimBusiness");
        }
      }catch(e:any){if(!cancelled)setAuthNotice(e?.message||"Business link could not be opened.");}
    };
    loadClaim();
    const timer=window.setInterval(async()=>{
      if(cancelled)return;
      try{
        const active=getStoredSession();
        if(!active)return;
        const result=await loyaltyApi(active,"get_business_suggestion",{suggestion_id:claimId});
        const b=result?.suggestion;
        if(!b)return;
        setClaimBusiness(b);
        if(result.claim_status==="APPROVED" || b.status==="CONVERTED"){
          setMerchantBusinessName(b.business_name||"");
          setMerchantOwnerName(result.claim?.claimant_name||claimName||"");
          setMerchantPhone(b.phone||"");
          setMerchantCity(b.city||"");
          setMerchantCategory(b.category||businessCategories[0]);
          if(b.country && countries.includes(b.country)) selectCountry(b.country);
          setAuthNotice("Claim approved. Business details loaded into Merchant Registration. Connect the merchant wallet to continue.");
          setRole("Merchant");
          window.clearInterval(timer);
        }
      }catch{}
    },5000);
    return()=>{cancelled=true;window.clearInterval(timer);};
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
    if ("speechSynthesis" in w) {
      try {
        w.speechSynthesis.getVoices();
        w.speechSynthesis.addEventListener?.("voiceschanged", () => w.speechSynthesis.getVoices());
      } catch {}
    }
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
          let merchantPaymentDetails:any = lookup.merchant?.payment_details ?? "";
          if (typeof merchantPaymentDetails === "string") { try { merchantPaymentDetails = JSON.parse(merchantPaymentDetails); } catch {} }
          const savedUpiId = String(merchantPaymentDetails?.upi_id ?? merchantPaymentDetails?.details ?? merchantPaymentDetails?.vpa ?? merchantPaymentDetails?.upi ?? "").trim();
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
            await refreshWalletAssetStatus(address);
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
      await refreshWalletAssetStatus(address);
      try { localStorage.setItem("gbk_loyalty_active_role", targetRole); } catch {}

      if (targetRole === "founder") {
        // First sync an already-active Founder membership from the Founder system
        // using the same connected wallet. This prevents verified Founders from
        // being shown the Loyalty registration form again.
        try {
          await loyaltyApi(s, "founder_sync_verified_membership", {
            country: country === "Global" ? "" : country
          });
        } catch {
          // A new/unverified Founder can continue through the normal verification flow.
        }
        try {
          const founderResult = await loyaltyApi(s, "founder_status", {});
          setFounderStatus(founderResult?.founder || null);
          if (founderResult?.founder?.founder_verified) {
            await loadFounderNetwork(s);
            setRole("Founder");
            setAuthNotice("Verified Founder recognized. Founder benefits and network are ready.");
          } else {
            setFounderNetwork({users:[], businesses:[]});
            setRole("Founder");
            setAuthNotice("Founder wallet connected. Complete Founder verification if this wallet is not yet verified.");
          }
        } catch {
          setFounderStatus(null);
          setFounderNetwork({users:[], businesses:[]});
          setRole("Founder");
          setAuthNotice("Founder wallet connected. Complete Founder verification to activate benefits.");
        }
      } else {
        try {
          const referralResult=await loyaltyApi(s,"universal_referral_register",{handle:fullName.trim()||undefined,country:country==="Global"?null:country,language});
          if(referralResult?.customer_referral_code){
            setUniversalReferralCode(referralResult.customer_referral_code);
            setUniversalReferralLink(referralResult.referral_link || ("https://loyalty.gbkai.com/?ref="+referralResult.customer_referral_code));
            setUniversalReferralStatus(referralResult.customer);
          }
        } catch {}
        setRole("Customer");
        setAuthNotice("Customer wallet connected successfully. Your unique referral link is available below.");
      }
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
  const refreshWalletAssetStatus = async (address?:string) => {
    const target = String(address || walletAddress || merchantWallet || "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(target)) return;
    setWalletAssetBusy(true);
    try {
      const live = await getWalletAssetBalances(target);
      setWalletAssetStatus(live);
    } catch (e:any) {
      setWalletAssetStatus(null);
      setAuthNotice(e.message || "Live wallet balances could not be read.");
    } finally { setWalletAssetBusy(false); }
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
      let merchantPaymentDetails:any = merchant?.payment_details ?? "";
      if (typeof merchantPaymentDetails === "string") { try { merchantPaymentDetails = JSON.parse(merchantPaymentDetails); } catch {} }
      const savedUpiId = String(merchantPaymentDetails?.upi_id ?? merchantPaymentDetails?.details ?? merchantPaymentDetails?.vpa ?? merchantPaymentDetails?.upi ?? "").trim();
      const savedOffer = merchantPaymentDetails?.offer && typeof merchantPaymentDetails.offer === "object" ? merchantPaymentDetails.offer : {};
      setMerchantUpiId(savedUpiId);
      setMerchantUpiEditing(false);
      setMerchantOfferEdit(String(Number(merchant?.loyalty_offer_bps || 0) / 100));
      setMerchantOfferEditType(savedOffer?.type === "Flat Store" ? "Flat Store" : savedOffer?.type === "Service" ? "Service" : "Product");
      setMerchantOfferEditDescription(String(savedOffer?.description || merchant?.description || ""));
      setMerchantOfferEditAmount(savedOffer?.amount != null ? String(savedOffer.amount) : "");
      setMerchantOfferEditCurrency(String(savedOffer?.currency || merchant?.payment_currency || currencyForCountry(merchant?.country || country) || "USD").toUpperCase());
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
    "मराठी":"mr-IN","ಕನ್ನಡ":"kn-IN","മലയാളം":"ml-IN","Español":"es-ES","العربية":"ar-SA",
    "Français":"fr-FR","Português":"pt-BR","中文":"zh-CN"
  };
  const speakText = (text:string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
      setAuthNotice("🔊 Voice playback is not available in this browser. Try Chrome/Android or use the text result.");
      return;
    }
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();
      const wanted = (speechLangMap[language] || "en-IN").toLowerCase();
      const utter = new SpeechSynthesisUtterance(text.trim());
      utter.lang = wanted;
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.volume = 1;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      const voices = synth.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase() === wanted)
        || voices.find(v => v.lang.toLowerCase().startsWith(wanted.split("-")[0]))
        || voices.find(v => v.default);
      if (voice) utter.voice = voice;
      synth.speak(utter);
      window.setTimeout(() => {
        if (!synth.speaking && !synth.pending) {
          setSpeaking(false);
          setAuthNotice("🔊 Tap “Read results aloud” once to enable voice playback on this device.");
        }
      }, 700);
    } catch {
      setSpeaking(false);
      setAuthNotice("🔊 Voice playback could not start. Tap “Read results aloud” again.");
    }
  };

  const unlockVoice = () => {
    if (typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();
      const utter = new SpeechSynthesisUtterance("");
      utter.volume = 0;
      synth.speak(utter);
      speechUnlockedRef.current = true;
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
  const loadBusinessDirectory = async () => {
    setDirectoryLoading(true);
    try {
      let activeSession=session||getStoredSession();
      if(!activeSession){ activeSession=await signInAnonymously(); setSession(activeSession); }
      const r=await loyaltyApi(activeSession,"directory",{country});
      setDirectoryResults(r.results||[]);
      setDirectoryCounts(r.counts||{active:0,unclaimed:0,total:(r.results||[]).length});
    } catch(e:any) {
      setAuthNotice(e.message||"Business Directory could not be loaded");
    } finally { setDirectoryLoading(false); }
  };

  useEffect(() => { loadBusinessDirectory(); }, [country]);

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
    unlockVoice();
    if (!SpeechRecognitionCtor) {
      setAuthNotice("🎤 Voice input is not available in this browser. On Android, open GBKAI in Chrome and allow microphone access; on iPhone use the keyboard microphone.");
      document.getElementById("searchInput")?.focus();
      return;
    }
    try {
      try { speechRecognitionRef.current?.abort?.(); } catch {}
      const recognition = new SpeechRecognitionCtor();
      speechRecognitionRef.current = recognition;
      recognition.lang = speechLangMap[language] || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.onstart = () => {
        setVoiceListening(true);
        setAuthNotice("🎙️ Listening… speak your request now.");
      };
      recognition.onresult = (event:any) => {
        const transcript = String(event.results?.[0]?.[0]?.transcript || "").trim();
        if (transcript) {
          setQuery(transcript);
          setVoiceListening(false);
          void doSearch(transcript);
        } else {
          setAuthNotice("🎙️ I did not hear a request. Tap Speak and try again.");
        }
      };
      recognition.onerror = (event:any) => {
        setVoiceListening(false);
        const code = String(event?.error || "");
        if (code === "not-allowed" || code === "service-not-allowed") {
          setAuthNotice("🎤 Microphone permission is blocked. Allow microphone access for loyalty.gbkai.com and try again.");
        } else if (code === "no-speech") {
          setAuthNotice("🎙️ No speech detected. Tap Speak and speak clearly.");
        } else if (code === "network") {
          setAuthNotice("🌐 Browser voice service is unavailable. Try Chrome on Android or use the keyboard microphone.");
        } else {
          setAuthNotice("🎙️ Voice search could not start. Please try again.");
        }
      };
      recognition.onend = () => {
        setVoiceListening(false);
        speechRecognitionRef.current = null;
      };
      recognition.start();
    } catch (e:any) {
      setVoiceListening(false);
      speechRecognitionRef.current = null;
      setAuthNotice("🎙️ Voice search could not start. Allow microphone access and try again.");
    }
  };
  const continueCurrentPayment = async () => {
    if (!currentOrderReference || !selectedMerchant) return;
    setApiBusy(true);
    try {
      let merchant:any = selectedMerchant;
      try {
        const active = session || getStoredSession() || await signInAnonymously();
        if (!session) setSession(active);
        const fresh = await loyaltyApi(active,"get_merchant",{merchant_id:selectedMerchant.id});
        if (fresh?.merchant) {
          merchant = fresh.merchant;
          setSelectedMerchant(merchant);
        }
      } catch {}
      let paymentDetails:any = merchant?.payment_details ?? "";
      if (typeof paymentDetails === "string") {
        try { paymentDetails = JSON.parse(paymentDetails); } catch {}
      }
      const details = paymentDetails?.upi_id ?? paymentDetails?.details ?? paymentDetails?.vpa ?? paymentDetails?.upi ?? paymentDetails ?? "";
      const upiId = typeof details === "string" ? details.trim() : "";
      if (!upiId) { setAuthNotice("Merchant UPI payment details are not configured."); return; }
      const amountMajor = Number(orderAmount || 0).toFixed(2);
      const params = new URLSearchParams({pa:upiId,pn:merchant.business_name||"GBK Merchant",am:amountMajor,cu:String(merchant.payment_currency||currency||"INR").toUpperCase(),tr:currentOrderReference,tid:currentOrderReference,tn:"GBK Loyalty "+currentOrderReference});
      const links = {
        generic:buildAndroidUpiIntent(params),
        phonepe:buildPhonePeIntent(params),
        googlepay:buildAndroidUpiIntent(params),
        paytm:buildAndroidUpiIntent(params),
        bhim:buildAndroidUpiIntent(params)
      };
      setUpiPayment({provider:"DIRECT",method:merchant.payment_method||"LOCAL_CURRENCY",currency:String(merchant.payment_currency||currency||"INR").toUpperCase(),merchant_name:merchant.business_name||"GBK Merchant",gbk_order_id:upiPayment?.gbk_order_id||null,order_reference:currentOrderReference,amount_major:amountMajor,upi_id:upiId,upi_links:links});
      setAuthNotice("Payment options are ready. Choose your UPI app below.");
    } catch(e:any) {
      setAuthNotice(e?.message||"Payment options could not be loaded.");
    } finally {
      setApiBusy(false);
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
          const ref = created?.order?.order_reference||created?.order_reference||"";
          let paymentDetails:any = m?.payment_details ?? "";
          if (typeof paymentDetails === "string") { try { paymentDetails = JSON.parse(paymentDetails); } catch {} }
          const details = paymentDetails?.upi_id ?? paymentDetails?.details ?? paymentDetails?.vpa ?? paymentDetails?.upi ?? paymentDetails ?? "";
          const upiId = typeof details === "string" ? details.trim() : "";
          const amountMajor = Number(amount).toFixed(2);
          const params = new URLSearchParams({pa:upiId,pn:m?.business_name||"GBK Merchant",am:amountMajor,cu:orderCurrency,tr:ref,tid:ref,tn:"GBK Loyalty "+ref});
          const upiUrl = upiId ? "upi://pay?" + params.toString() : "";
          const links = upiId ? {
            generic:buildAndroidUpiIntent(params),
            phonepe:buildAndroidUpiIntent(params),
            googlepay:buildAndroidUpiIntent(params),
            paytm:buildAndroidUpiIntent(params),
            bhim:buildAndroidUpiIntent(params)
          } : null;
          setCurrentOrderReference(ref);
          setUpiPayment({
            provider:"DIRECT",method:m?.payment_method||"LOCAL_CURRENCY",currency:orderCurrency,
            merchant_name:m?.business_name||"GBK Merchant",gbk_order_id:created?.order?.id,
            order_reference:ref,amount_major:amountMajor,upi_id:upiId||null,upi_links:links
          });
          setAuthNotice(`ORDER CREATED • ${ref}. Continue with the payment buttons below.`);
          return;
        }
        throw e;
      }
      if (paid?.payment?.provider === "DIRECT") {
        const ref = paid?.payment?.order_reference||created?.order_reference||created?.order?.order_reference||"";
        let paymentDetails:any = m?.payment_details ?? "";
        if (typeof paymentDetails === "string") { try { paymentDetails = JSON.parse(paymentDetails); } catch {} }
        const details = paymentDetails?.upi_id ?? paymentDetails?.details ?? paymentDetails?.vpa ?? paymentDetails?.upi ?? paymentDetails ?? "";
        const upiId = typeof details === "string" ? details.trim() : "";
        const amountMajor = Number(amount).toFixed(2);
        const params = upiId ? new URLSearchParams({pa:upiId,pn:m?.business_name||"GBK Merchant",am:amountMajor,cu:orderCurrency,tn:ref}) : null;
        const links = upiId && params ? {
          generic:buildAndroidUpiIntent(params),
          phonepe:buildAndroidUpiIntent(params),
          googlepay:buildAndroidUpiIntent(params),
          paytm:buildAndroidUpiIntent(params),
          bhim:buildAndroidUpiIntent(params)
        } : null;
        setCurrentOrderReference(ref);
        setUpiPayment({...paid.payment,gbk_order_id:created?.order?.id,order_reference:ref,amount_major:amountMajor,upi_id:upiId||null,upi_links:links});
        setAuthNotice(upiId ? `ORDER CREATED • ${ref}. Choose your UPI app below, then verify the payment with the UTR.` : `ORDER CREATED • ${ref}. Merchant UPI payment details are not configured.`);
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

  useEffect(() => {
    let cancelled = false;
    const buildQr = async () => {
      const upiId = String(upiPayment?.upi_id || "").trim();
      const amount = String(upiPayment?.amount_major || "").trim();
      const ref = String(upiPayment?.order_reference || "").trim();
      const currencyCode = String(upiPayment?.currency || "INR").toUpperCase();
      if (!upiId || !amount || !ref) { setUpiQrDataUrl(""); return; }
      try {
        const params = new URLSearchParams({pa:upiId,pn:String(upiPayment?.merchant_name || "GBK Merchant"),am:amount,cu:currencyCode,tr:ref,tid:ref,tn:"GBK Loyalty "+ref});
        const dataUrl = await QRCode.toDataURL("upi://pay?" + params.toString(), {width:360,margin:2});
        if (!cancelled) setUpiQrDataUrl(dataUrl);
      } catch { if (!cancelled) setUpiQrDataUrl(""); }
    };
    buildQr();
    return () => { cancelled = true; };
  }, [upiPayment?.upi_id,upiPayment?.amount_major,upiPayment?.order_reference,upiPayment?.currency,upiPayment?.merchant_name]);

  const launchUpiApp = (appLink:string, appName:string) => {
    setAuthNotice("Opening "+appName+"… If the app does not open, use the UPI QR below.");
  };
  const checkAutomaticPaymentStatus = async (silent=false) => {
    const orderId=String(upiPayment?.gbk_order_id||"").trim();
    if(!orderId) {
      if(!silent) setAuthNotice("GBK Order ID is missing. Please create the order again.");
      return false;
    }
    try {
      const active=session||getStoredSession()||await signInAnonymously(); if(!session) setSession(active);
      const result=await loyaltyApi(active,"payment_status",{order_id:orderId});
      const paymentStatus=String(result?.payment_status||"").toUpperCase();
      if(paymentStatus!=="VERIFIED") {
        if(!silent) {
          const statusText = paymentStatus==="NOT_STARTED" ? "Payment is not confirmed yet. Complete the UPI payment first, then tap Check payment status again." : "Payment is still pending confirmation. Please complete the payment and try again.";
          setAuthNotice("⏳ "+statusText);
        }
        return false;
      }
      let settlement:any=null; try { settlement=await loyaltyApi(active,"reward_settle",{order_id:orderId}); } catch {}
      const status=settlement?.status||"REWARD_SETTLEMENT_PENDING";
      const customerRaw=String(settlement?.calculation?.customer_raw||"0");
      const rewardGbk=customerRaw!=="0" ? (Number(customerRaw)/1e8).toLocaleString(undefined,{maximumFractionDigits:8}) : "";
      setPaymentSuccess({status,orderReference:result?.order_reference||currentOrderReference,txHash:settlement?.tx_hash||"",rewardGbk}); setPaymentUtr("");
      setAuthNotice(status==="SETTLED" ? "Payment verified automatically. GBK reward released successfully." : "Payment verified automatically. GBK reward settlement is processing."); return true;
    } catch(e:any) { if(!silent) setAuthNotice(e?.message||"Automatic payment confirmation is still pending."); return false; }
  };

  useEffect(() => {
    if(!upiPayment?.gbk_order_id || paymentSuccess) return; let stopped=false,attempts=0;
    const poll=async()=>{ if(stopped) return; attempts++; const done=await checkAutomaticPaymentStatus(true); if(done||attempts>=40){stopped=true;return;} window.setTimeout(poll,3000); };
    const onVisible=()=>{ if(document.visibilityState==="visible") checkAutomaticPaymentStatus(true); };
    document.addEventListener("visibilitychange",onVisible); const timer=window.setTimeout(poll,1500);
    return()=>{stopped=true;window.clearTimeout(timer);document.removeEventListener("visibilitychange",onVisible);};
  },[upiPayment?.gbk_order_id,paymentSuccess]);

  const verifyCustomerDirectPayment = async () => {
    const txId = paymentUtr.trim();
    setPaymentSuccess(null);
    const orderId = String(upiPayment?.gbk_order_id || "").trim();
    if (!orderId) { setAuthNotice("GBK Order ID is missing. Please create the order again."); return; }
    if (!txId) { setAuthNotice("Enter the UPI transaction ID / UTR after completing the payment."); return; }
    setApiBusy(true); setAuthNotice("");
    try {
      const active = session || getStoredSession() || await signInAnonymously();
      if (!session) setSession(active);
      const result = await loyaltyApi(active,"direct_payment_verify",{order_id:orderId,payment_transaction_id:txId});
      const settlement=result?.settlement;
      const customerRaw=String(settlement?.calculation?.customer_raw||"0");
      const rewardGbk=customerRaw!=="0" ? (Number(customerRaw)/1e8).toLocaleString(undefined,{maximumFractionDigits:8}) : "";
      setAuthNotice(
        settlement?.status==="SETTLED"
          ? "Payment verified. GBK reward released successfully."
          : settlement?.status==="REWARD_PENDING"
            ? "Payment verified. Your GBK reward is reserved and pending merchant GBK funding."
            : settlement?.status==="AWAITING_MERCHANT_APPROVAL"
              ? "Payment verified. Merchant wallet approval is required once to release the GBK reward."
              : settlement?.status==="BELOW_MINIMUM_REWARD"
                ? "Payment verified. This order is below the minimum on-chain reward amount."
                : "Payment verified. GBK reward settlement is processing."
      );
      if (settlement?.status==="SETTLED" || settlement?.status==="REWARD_PENDING" || settlement?.status==="AWAITING_MERCHANT_APPROVAL") {
        setPaymentUtr("");
        setPaymentSuccess({
          status:settlement?.status,
          orderReference:result?.order?.order_reference||currentOrderReference,
          txHash:settlement?.tx_hash||"",
          rewardGbk
        });
      }
    } catch(e:any) { setAuthNotice(e.message || "Payment verification failed."); }
    finally { setApiBusy(false); }
  };

  const createUniversalReferral = async () => {
    setApiBusy(true); setAuthNotice("");
    try{
      const active=session || getStoredSession() || await signInAnonymously();
      setSession(active);
      const result=await loyaltyApi(active,"universal_referral_register",{handle:fullName.trim()||undefined,country:country==="Global"?null:country,language});
      if(result?.referral_code){
        setUniversalReferralStatus(result.referrer);
        setUniversalReferralCode(result.referral_code);
        setUniversalReferralLink(result.referral_link || ("https://loyalty.gbkai.com/?ref="+result.referral_code));
        setAuthNotice("Your unique GBK referral link is ready.");
      }
    }catch(e:any){setAuthNotice(e?.message||"Referral link could not be created.");}
    finally{setApiBusy(false);}
  };
  const copyUniversalReferralLink = async () => {
    const link=universalReferralLink || (universalReferralCode ? "https://loyalty.gbkai.com/?ref="+universalReferralCode : "");
    if(!link){setAuthNotice("Create your unique GBK referral link first.");return;}
    try{await navigator.clipboard.writeText(link);setShareNotice("Your unique GBK referral link was copied.");}
    catch{setAuthNotice("Referral link: "+link);}
  };
  const createCreatorReferral = async () => {
    setApiBusy(true); setAuthNotice("");
    try{
      const active=session || getStoredSession() || await signInAnonymously();
      setSession(active);
      const result=await loyaltyApi(active,"universal_referral_register",{
        creator_name:fullName.trim()||undefined,
        handle:fullName.trim()||undefined,
        platform:"MULTI",
        country:country==="Global"?null:country,
        language,
      });
      if(result?.creator){
        setCreatorReferralStatus(result.creator);
        setCreatorReferralCode(result.creator.referral_code);
        setCreatorReferralLink(result.creator.referral_link || ("https://loyalty.gbkai.com/?ref="+result.creator.referral_code));
        setAuthNotice("Your unique GBKAI Merchant Referral link is ready. Share it with real businesses.");
      }
    }catch(e:any){setAuthNotice(e?.message||"Creator referral link could not be created.");}
    finally{setApiBusy(false);}
  };

  const copyCreatorReferralLink = async () => {
    const link=creatorReferralLink || (creatorReferralCode ? "https://loyalty.gbkai.com/?ref="+creatorReferralCode : "");
    if(!link){setAuthNotice("Create your unique referral link first.");return;}
    try{await navigator.clipboard.writeText(link);setShareNotice("Unique GBKAI referral link copied.");}
    catch{setAuthNotice("Referral link: "+link);}
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
      const data=await QRCode.toDataURL(url,{width:640,margin:4,errorCorrectionLevel:"H"});
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

  const downloadInstallQr = async () => {
    try {
      const data = await QRCode.toDataURL("https://loyalty.gbkai.com", {
        width: 800,
        margin: 3,
        errorCorrectionLevel: "H"
      });
      const a = document.createElement("a");
      a.href = data;
      a.download = "gbk-loyalty-install-webapp-qr.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShareNotice("GBK Loyalty Install Web App QR downloaded.");
    } catch (e:any) {
      setAuthNotice(e?.message || "Install QR could not be created.");
    }
  };

  const downloadStoreSticker = async (merchant:any) => {
    if (!merchantQr) {
      setAuthNotice("Generate the Business QR first.");
      return;
    }
    try {
      const esc = (value:any) => String(value ?? "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
      const businessName = esc(merchant?.business_name || "GBK Loyalty Merchant");
      const category = esc(merchant?.category || "Business");
      const city = esc(merchant?.city || "");
      const countryName = esc(merchant?.country || "");
      const merchantPool = Number(merchant?.loyalty_offer_bps || 0) / 100;
      const customerReward = merchantPool * 0.6;
      const founderReward = merchantPool * 0.2;
      const platformReward = merchantPool * 0.2;
      const formatPercent = (value:number) => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/,"");
      const customerRewardText = formatPercent(customerReward);
      const merchantPoolText = formatPercent(merchantPool);
      const founderRewardText = formatPercent(founderReward);
      const platformRewardText = formatPercent(platformReward);
      const qrX = 200, qrY = 365, qrSize = 800;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" rx="48" fill="#ffffff"/>
  <rect x="40" y="40" width="1120" height="1520" rx="40" fill="#ffffff" stroke="#6d28d9" stroke-width="6"/>
  <circle cx="600" cy="145" r="58" fill="#6d28d9"/>
  <text x="600" y="163" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="800" fill="#ffffff">GBK</text>
  <text x="600" y="245" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="800" fill="#171717">GBK LOYALTY PARTNER</text>
  <text x="600" y="292" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" fill="#555555">Shop Local • Earn Global</text>
  <text x="600" y="345" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="#171717">SCAN TO PAY &amp; EARN GBK</text>
  <rect x="170" y="335" width="860" height="860" rx="28" fill="#ffffff"/>
  <image href="${merchantQr}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" preserveAspectRatio="none"/>
  <circle cx="600" cy="765" r="44" fill="#ffffff" stroke="#6d28d9" stroke-width="6"/>
  <circle cx="600" cy="765" r="33" fill="#6d28d9"/>
  <text x="600" y="777" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#ffffff">GBK</text>
  <text x="600" y="1260" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#171717">${businessName}</text>
  <text x="600" y="1302" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#555555">${category}${city ? " • " + city : ""}${countryName ? " • " + countryName : ""}</text>
  <rect x="235" y="1335" width="730" height="92" rx="46" fill="#f3e8ff"/>
  <text x="600" y="1374" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="800" fill="#6d28d9">CUSTOMER EARNS ${customerRewardText}% GBK</text>
  <text x="600" y="1410" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="#555555">Merchant Loyalty Pool ${merchantPoolText}% • Customer 60%</text>
  <text x="600" y="1465" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="700" fill="#171717">Pool: ${merchantPoolText}% → Customer ${customerRewardText}% • Founder ${founderRewardText}% • Platform ${platformRewardText}%</text>
  <text x="600" y="1510" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#555555">loyalty.gbkai.com</text>
  <text x="600" y="1542" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#777777">Open the web app • No Play Store required</text>
</svg>`;
      const blob = new Blob([svg], {type:"image/svg+xml;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gbk-loyalty-${String(merchant?.business_name || "store").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()}-store-sticker.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setShareNotice("GBK branded store sticker downloaded.");
    } catch (e:any) {
      setAuthNotice(e?.message || "Store sticker could not be created.");
    }
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
    if(!claimBusiness?.id || claimName.trim().length<2 || claimMobile.trim().length<5 || claimEmail.trim().length<5){setAuthNotice("Enter the owner name, mobile number and email.");return;}
    setApiBusy(true);setAuthNotice("");
    try{
      let active=session||getStoredSession(); if(!active) active=await signInAnonymously(); setSession(active);
      const result=await loyaltyApi(active,"claim_business",{suggestion_id:claimBusiness.id,claimant_name:claimName.trim(),claimant_contact:`Mobile: ${claimMobile.trim()} | Email: ${claimEmail.trim()}`});
      setClaimSubmitted(result?.status !== "ALREADY_PENDING");
      setAuthNotice(result?.status==="ALREADY_PENDING"?"A claim request is already pending.":"Claim submitted. After Founder approval, the same business details will automatically open in Merchant Registration—no re-entry.");
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

  const saveMerchantOffer = async () => {
    const merchantId = String(merchantStatus?.merchant?.id || "");
    const offer = merchantOfferEdit === "custom" ? Number(merchantOfferEditCustom) : Number(merchantOfferEdit);
    const isFlatStore = merchantOfferEditType === "Flat Store";
    const amount = Number(merchantOfferEditAmount);
    const description = String(merchantOfferEditDescription || "").trim();
    const active = session || getStoredSession();
    if (!merchantId) { setAuthNotice("Merchant account not found. Refresh the Merchant Wallet."); return; }
    if (!Number.isFinite(offer) || offer < 1 || offer > 50) { setAuthNotice("Enter a loyalty offer from 1% to 50%."); return; }
    if (!isFlatStore && !description) { setAuthNotice("Enter the product or service name/description."); return; }
    if (!isFlatStore && (!Number.isFinite(amount) || amount <= 0)) { setAuthNotice("Enter a valid product/service amount greater than 0."); return; }
    if (!isFlatStore && !/^[A-Za-z]{3}$/.test(merchantOfferEditCurrency.trim().toUpperCase())) { setAuthNotice("Enter a valid 3-letter currency code."); return; }
    if (!active) { setAuthNotice("Connect the merchant wallet first."); return; }
    const current = Number(merchantStatus?.merchant?.loyalty_offer_bps || 0) / 100;
    if (!window.confirm(isFlatStore ? `Save Flat Store loyalty at ${offer}%?` : `Save ${merchantOfferEditType} offer: ${description}, ${merchantOfferEditCurrency.toUpperCase()} ${amount}, with ${offer}% loyalty?`)) return;
    setApiBusy(true); setAuthNotice("");
    try {
      const result = await loyaltyApi(active, "merchant_offer_update", {
        merchant_id: merchantId,
        loyalty_offer_percent: offer,
        offer_type: merchantOfferEditType,
        offer_description: description,
        offer_amount: amount,
        offer_currency: merchantOfferEditCurrency.trim().toUpperCase()
      });
      if (result?.merchant) setMerchantStatus((prev:any) => ({...(prev || {}), merchant: result.merchant}));
      setMerchantOfferEditing(false);
      setMerchantOfferEdit(String(offer));
      setMerchantOfferEditCustom(String(offer));
      setAuthNotice(isFlatStore ? `Flat Store loyalty saved at ${offer}%.` : `Offer saved: ${merchantOfferEditType} — ${description}, ${merchantOfferEditCurrency.trim().toUpperCase()} ${amount}, ${offer}% loyalty.`);
    } catch (e:any) {
      setAuthNotice(e?.message || "GBK Loyalty offer could not be updated.");
    } finally { setApiBusy(false); }
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
      const referralCheck = founderReferralCode.trim()
        ? await loyaltyApi(activeSession, "founder_referral_check", {founder_referral_code:founderReferralCode.trim(), country})
        : {verified:false};
      if(founderReferralCode.trim() && !referralCheck?.verified){
        setFounderReferralStatus({error:referralCheck?.message||"Founder referral is not valid or the Founder is not verified."});
        throw new Error(referralCheck?.message||"Founder referral is not valid or the Founder is not verified.");
      }
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
        offer_type: merchantOfferType,
        offer_description: merchantOfferDescription.trim() || null,
        offer_amount: merchantOfferAmount.trim() ? Number(merchantOfferAmount) : null,
        offer_currency: paymentCurrency,
        payment_provider: paymentGateway,
        payment_account_ref: paymentGateway === "DIRECT" ? null : (paymentAccountRef || null),
        payment_currency: paymentCurrency,
        payment_method: paymentMethod,
        payment_details: { details: paymentDetails, owner: merchantOwnerName, offer: { type: merchantOfferType, description: merchantOfferDescription.trim() || null, amount: merchantOfferAmount.trim() ? Number(merchantOfferAmount) : null, currency: paymentCurrency, loyalty_pool_percent: selectedOffer, customer_percent: customerShare, founder_percent: founderShare, platform_percent: platformShare }, supported_methods: country === "United States" ? ["APPLE_PAY","GOOGLE_PAY","CARD","PAYPAL","VENMO","SQUARE","GBK_QR"] : country === "India" ? ["UPI","CARD","GBK_QR"] : country === "Thailand" ? ["THAI_QR","THAI_BANK","CARD","GBK_QR"] : country === "Malaysia" ? ["MY_QR","MY_BANK","CARD","GBK_QR"] : country === "Philippines" ? ["PH_QR","PH_BANK","CARD","GBK_QR"] : country === "United Arab Emirates" ? ["UAE_QR","UAE_BANK","CARD","GBK_QR"] : ["LOCAL_CURRENCY","CARD","GBK_QR"], terms_accepted: merchantTermsAccepted },
        founder_referral_code: founderReferralCode.trim() || null,
        creator_referral_code: creatorReferralCode.trim() || null,
        terms_accepted: merchantTermsAccepted,
      });
      setAuthNotice("Merchant registration submitted successfully.");
      setRole(null);
    } catch (e: any) {
      setAuthNotice(e?.message || "Merchant registration failed");
    } finally {
      setApiBusy(false);
    }
  };

  const askGbkAi = async (question:string) => {
    const q = question.trim();
    if (!q) return;
    setAskQuery(q);
    setAskBusy(true);
    setAskAnswer("");
    try {
      let activeSession = session || getStoredSession();
      if (!activeSession) { activeSession = await signInAnonymously(); setSession(activeSession); }
      const search = await loyaltyApi(activeSession, "search", { query: q, country });
      const matches = (search?.results || []).filter((x:any) => !x?.unclaimed);
      setAskResults(matches);
    } catch {
      setAskResults([]);
    } finally {
      setAskBusy(false);
    }
    const key = q.toLowerCase();
    const answers:Record<string,string> = {
      "English":"GBK Loyalty connects customers, merchants, Founders and business owners. Customers discover businesses, pay normally and receive eligible GBK rewards after verified purchases. Merchants can register or claim a business, verify ownership, add payment details, create offers and fund eligible rewards. Founders can build their network and participate in applicable Founder benefits. Unclaimed businesses can be claimed by the owner or an authorized representative and become reward-active only after verification and activation.",
      "हिन्दी":"GBK Loyalty ग्राहकों, व्यापारियों, Founders और व्यवसाय मालिकों को जोड़ता है। ग्राहक व्यवसाय खोजते हैं, सामान्य तरीके से भुगतान करते हैं और सत्यापित खरीद के बाद पात्र GBK रिवॉर्ड प्राप्त करते हैं। व्यापारी अपना व्यवसाय रजिस्टर या क्लेम कर सकते हैं, स्वामित्व सत्यापित कर सकते हैं, भुगतान विवरण जोड़ सकते हैं और ऑफर बना सकते हैं। Unclaimed business का मालिक उसे क्लेम करके सत्यापन और activation पूरा कर सकता है।",
      "తెలుగు":"GBK Loyalty కస్టమర్లు, వ్యాపారులు, Founders మరియు బిజినెస్ ఓనర్లను కలుపుతుంది. కస్టమర్లు బిజినెస్‌ను కనుగొని సాధారణంగా చెల్లించి, పేమెంట్/ఆర్డర్ ధృవీకరించిన తర్వాత అర్హత ఉన్న GBK రివార్డ్ పొందుతారు. వ్యాపారులు బిజినెస్‌ను రిజిస్టర్ లేదా క్లెయిమ్ చేసి, యజమాన్యాన్ని ధృవీకరించి, UPI వివరాలు జోడించి ఆఫర్లు సృష్టించవచ్చు. Unclaimed business ను యజమాని క్లెయిమ్ చేసి verification మరియు activation పూర్తి చేయవచ్చు.",
      "தமிழ்":"GBK Loyalty வாடிக்கையாளர்கள், வணிகர்கள், Founders மற்றும் வணிக உரிமையாளர்களை இணைக்கிறது. வாடிக்கையாளர்கள் வணிகத்தை கண்டுபிடித்து வழக்கம்போல் பணம் செலுத்தி, சரிபார்க்கப்பட்ட வாங்குதலுக்குப் பிறகு தகுதியான GBK rewards பெறலாம். வணிகர்கள் பதிவு செய்யலாம் அல்லது வணிகத்தை claim செய்யலாம், உரிமையை சரிபார்த்து UPI விவரங்களைச் சேர்த்து offers உருவாக்கலாம். Unclaimed business-ஐ உரிமையாளர் claim செய்து verification மற்றும் activation முடிக்கலாம்.",
      "ಕನ್ನಡ":"GBK Loyalty ಗ್ರಾಹಕರು, ವ್ಯಾಪಾರಿಗಳು, Founders ಮತ್ತು ವ್ಯವಹಾರ ಮಾಲೀಕರನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ. ಗ್ರಾಹಕರು ವ್ಯವಹಾರವನ್ನು ಹುಡುಕಿ ಸಾಮಾನ್ಯವಾಗಿ ಪಾವತಿಸಿ, ಪರಿಶೀಲಿಸಿದ ಖರೀದಿಯ ನಂತರ ಅರ್ಹ GBK rewards ಪಡೆಯುತ್ತಾರೆ. ವ್ಯಾಪಾರಿಗಳು ನೋಂದಣಿ ಅಥವಾ business claim ಮಾಡಿ, ಮಾಲೀಕತ್ವ ಪರಿಶೀಲಿಸಿ, UPI ವಿವರಗಳನ್ನು ಸೇರಿಸಿ offers ರಚಿಸಬಹುದು. Unclaimed business ಅನ್ನು ಮಾಲೀಕರು claim ಮಾಡಿ verification ಮತ್ತು activation ಪೂರ್ಣಗೊಳಿಸಬಹುದು.",
      "മലയാളം":"GBK Loyalty ഉപഭോക്താക്കളെയും വ്യാപാരികളെയും Founders-നെയും ബിസിനസ് ഉടമകളെയും ബന്ധിപ്പിക്കുന്നു. ഉപഭോക്താക്കൾ ബിസിനസ് കണ്ടെത്തി സാധാരണയായി പണം നൽകി, സ്ഥിരീകരിച്ച വാങ്ങലിന് ശേഷം അർഹമായ GBK rewards നേടാം. വ്യാപാരികൾ രജിസ്റ്റർ ചെയ്യുകയോ ബിസിനസ് claim ചെയ്യുകയോ ചെയ്ത് ഉടമസ്ഥാവകാശം പരിശോധിച്ച് UPI വിവരങ്ങൾ ചേർത്ത് offers സൃഷ്ടിക്കാം. Unclaimed business ഉടമയ്ക്ക് claim ചെയ്ത് verification, activation പൂർത്തിയാക്കാം.",
      "বাংলা":"GBK Loyalty গ্রাহক, মার্চেন্ট, Founder এবং ব্যবসার মালিকদের সংযুক্ত করে। গ্রাহকরা ব্যবসা খুঁজে স্বাভাবিকভাবে পেমেন্ট করেন এবং যাচাইকৃত কেনাকাটার পরে যোগ্য GBK reward পান। মার্চেন্টরা ব্যবসা রেজিস্টার বা claim করতে পারেন, মালিকানা যাচাই করে UPI তথ্য ও offer যোগ করতে পারেন। Unclaimed business-এর মালিক claim করে verification ও activation সম্পন্ন করতে পারেন.",
      "मराठी":"GBK Loyalty ग्राहक, व्यापारी, Founders आणि व्यवसाय मालकांना जोडते. ग्राहक व्यवसाय शोधतात, नेहमीप्रमाणे पेमेंट करतात आणि पडताळलेल्या खरेदीनंतर पात्र GBK rewards मिळवतात. व्यापारी व्यवसाय register किंवा claim करून मालकी पडताळू शकतात, UPI माहिती जोडू शकतात आणि offers तयार करू शकतात. Unclaimed business चा मालक claim करून verification आणि activation पूर्ण करू शकतो.",
      "العربية":"يربط GBK Loyalty بين العملاء والتجار وFounders وأصحاب الأعمال. يمكن للعميل اكتشاف النشاط التجاري والدفع بالطريقة المعتادة والحصول على مكافآت GBK المؤهلة بعد التحقق من عملية الشراء. يمكن للتاجر تسجيل النشاط أو المطالبة به والتحقق من الملكية وإضافة بيانات الدفع وإنشاء العروض. ويمكن لمالك النشاط غير المطالب به تقديم مطالبة ثم إكمال التحقق والتفعيل.",
      "Español":"GBK Loyalty conecta a clientes, comercios, Founders y propietarios de negocios. Los clientes descubren negocios, pagan normalmente y reciben recompensas GBK elegibles después de verificar la compra. Los comercios pueden registrarse o reclamar un negocio, verificar la propiedad, añadir datos de pago y crear ofertas. Un negocio no reclamado puede ser reclamado por su propietario y activarse después de la verificación.",
      "中文":"GBK Loyalty 连接客户、商户、Founder 和企业主。客户可以发现商户，正常付款，并在购买完成验证后获得符合条件的 GBK 奖励。商户可以注册或认领企业、完成所有权验证、添加支付信息并创建优惠。未认领的企业可以由企业主或授权代表认领，并在验证和激活后成为可参与奖励的商户。",
      "Français":"GBK Loyalty relie les clients, les commerçants, les Founders et les propriétaires d’entreprise. Les clients découvrent les commerces, paient normalement et reçoivent les récompenses GBK éligibles après vérification de l’achat. Les commerçants peuvent s’inscrire ou revendiquer une entreprise, vérifier leur propriété, ajouter leurs informations de paiement et créer des offres. Une entreprise non revendiquée peut être revendiquée par son propriétaire puis activée après vérification.",
      "Português":"O GBK Loyalty conecta clientes, comerciantes, Founders e proprietários de empresas. Os clientes encontram empresas, pagam normalmente e recebem recompensas GBK elegíveis após a verificação da compra. Os comerciantes podem cadastrar ou reivindicar uma empresa, verificar a propriedade, adicionar dados de pagamento e criar ofertas. Uma empresa não reivindicada pode ser reivindicada pelo proprietário e ativada após a verificação."
    };
    const langAnswer=answers[language] || answers.English;
    let prefix="";
    if(key.includes("claim") || key.includes("unclaimed") || key.includes("owner")) prefix=language==="English"?"To claim a business: open the Unclaimed listing → Claim This Business → submit owner/contact details → wait for verification → connect the Merchant Wallet → accept terms and activate.":langAnswer;
    else if(key.includes("merchant") || key.includes("shop") || key.includes("business")) prefix=language==="English"?"Merchant path: register or claim the business → verify ownership → complete the merchant profile → add UPI/payment details → connect the GBK wallet → choose the loyalty offer → activate.":langAnswer;
    else if(key.includes("founder")) prefix=language==="English"?"Founder path: connect the Founder wallet → complete Founder verification → add users or businesses to the network → track eligible activity and applicable Founder benefits.":langAnswer;
    else if(key.includes("customer") || key.includes("earn") || key.includes("reward")) prefix=language==="English"?"Customer path: choose country/city → find a participating merchant → scan the merchant QR or open the business → enter the purchase amount → pay → wait for verified payment/order confirmation → receive the eligible GBK reward.":langAnswer;
    else prefix=langAnswer;
    setAskAnswer(prefix);
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
        <div className="search"><span>⌕</span><input id="searchInput" value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>{setSearchFocused(true);setTimeout(()=>document.querySelector(".search")?.scrollIntoView({behavior:"smooth",block:"center"}),120)}} onBlur={()=>setTimeout(()=>setSearchFocused(false),250)} placeholder={language==="తెలుగు" ? "మీకు ఏమి కావాలి?" : language==="हिन्दी" ? "आज आपको क्या चाहिए?" : "What do you need today?"}/><button className="voiceBtn" onMouseDown={()=>setSearchFocused(true)} onClick={startVoiceSearch} disabled={apiBusy || voiceListening} aria-label="Speak your request">{voiceListening ? "🎙️ Listening" : "🎤 Speak"}</button><button onMouseDown={()=>setSearchFocused(true)} onClick={()=>doSearch()} disabled={apiBusy}>{apiBusy ? "Searching…" : "Find businesses"}</button></div>
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

      <section id="businessDirectory" className="roleSection">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">🌍 GBK BUSINESS DIRECTORY</span>
            <h2>Unclaimed Businesses</h2>
            <p>Browse all approved unclaimed business listings. Owners can claim their business and complete GBK Loyalty activation.</p>
          </div>
          <button className="secondary" type="button" onClick={loadBusinessDirectory} disabled={directoryLoading}>{directoryLoading ? "Refreshing…" : "↻ Refresh Directory"}</button>
        </div>
        {directoryLoading && <div className="status"><span>Loading Business Directory…</span></div>}
        {!directoryLoading && directoryResults.length===0 && <div className="offerPreview"><b>No unclaimed businesses found</b><span>Approved unclaimed business listings will appear here.</span></div>}
        <div className="roleGrid">
          {directoryResults.filter((m:any)=>m.unclaimed).map((m:any)=>
            <div className="roleCard" key={"directory-"+m.id}>
              <div className="roleIcon">🏪</div>
              <h3>{m.business_name}</h3>
              <p>{[m.category,m.city,m.country].filter(Boolean).join(" • ")}</p>
              {m.address && <p>{m.address}</p>}
              <div><span className="roleTag">Unclaimed business</span><span className="roleTag">Not reward-active</span></div>
              <p style={{fontSize:13}}>This business is listed but has not completed owner claim and merchant activation.</p>
              <button className="primary" type="button" onClick={()=>{setClaimBusiness(m);setClaimName("");setClaimMobile("");setClaimEmail("");setClaimSubmitted(false);setRole("ClaimBusiness");}}>Claim this business →</button>
            </div>
          )}
        </div>
      </section>

      {searchResults.length > 0 && <section id="searchResults" className="roleSection">
        <div className="sectionHead"><div><span className="eyebrow">BUSINESSES & LOCAL LISTINGS</span><h2>Choose a business</h2><p>Active merchants are shown once. Community listings appear only when no active merchant exists for the same business.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="secondary" onClick={()=>{setScannerOpen(true);setAuthNotice("");}}>📷 Scan QR</button><button className="secondary voiceReadBtn" onClick={()=>{unlockVoice();spokenSummary(visibleSearchResults)}}>{speaking ? "🔊 Speaking…" : "🔊 Read results aloud"}</button></div></div>
        <div className="roleGrid">
          {visibleSearchResults.map((m:any)=><div className="roleCard" key={m.id + (m.listing_type || "MERCHANT")}>
            <div className="roleIcon">🏪</div>
            <h3>{m.business_name}</h3>
            <p>{[m.category,m.city,m.country].filter(Boolean).join(" • ")}</p>
            {m.description && <p>{m.description}</p>}
            {m.unclaimed ? <>
              <div><span className="roleTag">Unclaimed business</span><span className="roleTag">Not reward-active</span></div>
              <p style={{fontSize:13}}>This is a community-suggested listing. The owner can claim it and complete verification.</p>
              <button className="primary" onClick={()=>{setClaimBusiness(m);setClaimName("");setClaimMobile("");setClaimEmail("");setClaimSubmitted(false);setRole("ClaimBusiness");}}>Claim this business →</button>
            </> : <>
              <div><span className="roleTag">{Math.round(Number(m.loyalty_offer_bps||0)/100)}% GBK Loyalty</span><span className="roleTag">Active merchant</span></div>
              <button className="primary" onClick={()=>setSelectedMerchant(m)}>Earn GBK →</button>
            </>}
          </div>)}
        </div>
      </section>}
      {searchResults.length === 0 && authNotice && authNotice.includes("No") && <section id="searchResults" className="roleSection"><div className="status"><span>{authNotice}</span></div></section>}
      {askAiOpen && <div className="askAiModalBackdrop" onClick={()=>setAskAiOpen(false)}><section className="askGbkSection askAiModal" onClick={e=>e.stopPropagation()}>
        <div className="sectionHead">
          <div><span className="eyebrow">🤖 ASK GBK AI</span><h2>Ask anything about GBK Loyalty</h2><p>Get simple step-by-step guidance for customers and business owners. Ask how to register, claim a business, activate, or find a service. Active businesses can receive customer leads and orders from GBK AI.</p></div>
          <button className="secondary" onClick={()=>{setAskQuery("");setAskAnswer("");setAskResults([]);}}>Clear</button>
        </div>
        <div className="askAiPanel">
          <div className="askAiTop">
            <span>🗣️ Answer language</span>
            <select value={language} onChange={e=>{setLanguage(e.target.value);if(askQuery) setTimeout(()=>askGbkAi(askQuery),0);}} aria-label="Ask GBK AI language">{languages.map(x=><option key={x}>{x}</option>)}</select>
          </div>
          <div className="askAiPromptGrid">
            <button onClick={()=>askGbkAi("How does GBK Loyalty work?")}>🌐 How does GBK Loyalty work?</button>
            <button onClick={()=>askGbkAi("I am a customer. How do I earn GBK?")}>👤 How does a customer earn GBK?</button>
            <button onClick={()=>askGbkAi("How can I become a merchant?")}>🏪 How can I become a merchant?</button>
            <button onClick={()=>askGbkAi("What is Founder membership?")}>👑 What is Founder membership?</button>
            <button onClick={()=>askGbkAi("How do I claim my unclaimed business?")}>🏢 How do I claim my business?</button>
            <button onClick={()=>askGbkAi("How do I create a loyalty offer?")}>🎁 How do I create an offer?</button>
          </div>
          <div className="askAiInput">
            <input value={askQuery} onChange={e=>setAskQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")askGbkAi(askQuery)}} placeholder="Try: restaurants in Nagpur, plumber in Vizag, hotel in Hyderabad…" />
            <button className="primary" onClick={()=>askGbkAi(askQuery)} disabled={!askQuery.trim() || askBusy}>{askBusy ? "Searching…" : "🤖 Ask GBK AI"}</button>
            <button className="secondary" onClick={()=>{setAskAiOpen(false);setQuery(askQuery);setSearchFocused(true);setTimeout(()=>document.getElementById("searchInput")?.focus(),50);}}>🏪 Direct Store Search</button>
          </div>
          {askAnswer && <div className="askAiAnswer"><b>🤖 GBK AI</b><p>{askAnswer}</p></div>}
          {askBusy && <div className="status"><span>🔎 Finding active GBK businesses…</span></div>}
          {askResults.length > 0 && <div className="askAiResults"><b>🏪 Active businesses found</b>{askResults.slice(0,8).map((m:any)=><div key={m.id} className="askAiResultCard"><div><strong>{m.business_name}</strong><small>{[m.category,m.city,m.country].filter(Boolean).join(" • ")}</small>{m.loyalty_offer_percent ? <small>GBK Loyalty: {m.loyalty_offer_percent}%</small> : null}</div><button className="primary" onClick={()=>{setAskAiOpen(false);setSelectedMerchant(m);}}>Open & Pay</button></div>)}</div>}
          {!askBusy && askResults.length === 0 && askQuery.trim() && <div className="askAiAnswer"><b>🏪 Business search</b><p>No active GBK business matched this request yet. Try another city/category, or use Direct Store Search.</p></div>}
          <div className="askAiRoles">
            <div><b>👤 Customer</b><span>Find → Scan → Pay → Earn</span></div>
            <div><b>🏪 Merchant</b><span>Register/Claim → Verify → Activate</span></div>
            <div><b>👑 Founder</b><span>Connect → Build → Qualify</span></div>
            <div><b>🌐 Business Owner</b><span>Claim → Verify → Activate</span></div>
          </div>
          <small>GBK AI answers should follow the selected language. For payment, reward and account status, the live GBK Loyalty system remains the source of truth.</small>
        </div>
      </section></div>}


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
          <p>Customer reward: <b>{((Number(selectedMerchant.loyalty_offer_bps||0)/100)*0.6).toFixed(1).replace(/\.0$/,"")}% GBK</b> · Merchant Loyalty Pool: <b>{(Number(selectedMerchant.loyalty_offer_bps||0)/100).toFixed(1).replace(/\.0$/,"")}%</b></p>
          <div className="offerPreview" style={{display:"grid",gap:8,margin:"14px 0",textAlign:"center"}}>
            <b>📱 Scan to open this business</b>
            {merchantQr ? <img src={merchantQr} alt={`GBK Loyalty QR for ${selectedMerchant.business_name}`} style={{width:220,height:220,maxWidth:"100%",margin:"0 auto",background:"#fff",padding:10,borderRadius:16}}/> : <button className="secondary" type="button" onClick={()=>openMerchantQr(selectedMerchant)} disabled={qrBusy}>{qrBusy?"Creating QR…":"Generate Business QR"}</button>}
            {merchantQr && <div style={{display:"grid",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:8}}>
                <button className="primary" type="button" onClick={()=>downloadStoreSticker(selectedMerchant)}>🏪 Store Sticker</button>
                <button className="secondary" type="button" onClick={install}>📲 Install App</button>
                <button className="secondary" type="button" onClick={()=>shareMerchantQr(selectedMerchant)}>📤 Share</button>
              </div>
              <details>
                <summary style={{cursor:"pointer",textAlign:"center",padding:"8px",fontWeight:700,color:"#6d28d9"}}>More QR options</summary>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                  <button className="secondary" type="button" onClick={downloadMerchantQr}>⬇️ Business QR</button>
                  <button className="secondary" type="button" onClick={downloadInstallQr}>📱 Install QR</button>
                </div>
              </details>
            </div>}
            {shareNotice && <small>{shareNotice}</small>}
          </div>
          <label style={{display:"grid",gap:6,margin:"14px 0"}}>
            <b>Purchase amount</b>
            <input className="modalInput" inputMode="decimal" type="number" min="0.01" step="0.01" value={orderAmount} onChange={e=>setOrderAmount(e.target.value)} placeholder={country==="India" ? "Enter purchase amount in INR" : "Enter purchase amount in local currency"} />
          </label>
          {authNotice && <div className="notice" style={{margin:"12px 0"}}>{authNotice}</div>}
          {currentOrderReference && <div className="offerPreview" style={{display:"grid",gap:8,margin:"12px 0",border:"2px solid rgba(99,45,255,.25)"}}>
            <b>🧾 GBK Order Created</b>
            <strong style={{fontSize:18}}>{currentOrderReference}</strong>
            <small>Pay the merchant using your preferred UPI app. Your payment confirmation is matched to this GBK Order ID before the GBK reward is released.</small>
          </div>}
          {upiPayment?.upi_links && <div className="offerPreview" style={{display:"grid",gap:8,margin:"12px 0"}}>
            <b>📲 Pay ₹{upiPayment.amount_major} by UPI</b>
            <small>{upiPayment.upi_id ? `Merchant UPI: ${upiPayment.upi_id}` : "Merchant UPI payment details are not configured."}</small>
            {upiPayment.upi_links.phonepe && <a className="primary" href={upiPayment.upi_links.phonepe} onClick={()=>launchUpiApp(upiPayment.upi_links.phonepe,"PhonePe")}>📱 Pay directly with PhonePe</a>}
            {upiPayment.upi_links.googlepay && <a className="secondary" href={upiPayment.upi_links.googlepay} onClick={()=>launchUpiApp(upiPayment.upi_links.googlepay,"UPI")}>🟢 Open Google Pay / UPI</a>}
            {upiPayment.upi_links.paytm && <a className="secondary" href={upiPayment.upi_links.paytm} onClick={()=>launchUpiApp(upiPayment.upi_links.paytm,"UPI")}>🔵 Open Paytm / UPI</a>}
            {upiPayment.upi_links.bhim && <a className="secondary" href={upiPayment.upi_links.bhim}>🏦 Open BHIM / UPI</a>}
            {upiPayment.upi_links.generic && <a className="secondary" href={upiPayment.upi_links.generic}>📱 Open UPI / Other app</a>}
            {upiQrDataUrl && <div className="offerPreview" style={{display:"grid",justifyItems:"center",gap:8,marginTop:10}}>
              <b>▣ Scan this QR with any UPI app</b>
              <img src={upiQrDataUrl} alt="GBK Loyalty UPI payment QR" style={{width:240,height:240,borderRadius:12,border:"1px solid #ddd",background:"#fff",padding:8}} />
              <small>Amount ₹{upiPayment.amount_major} · Order {upiPayment.order_reference}</small>
            </div>}
            <small>Use the app buttons or scan the universal QR. Opening a payment app is not payment verification; GBK reward is released only after verified payment confirmation.</small>
          </div>}
          {paymentSuccess ? <div className="offerPreview" style={{display:"grid",gap:10,margin:"12px 0",textAlign:"center",padding:"20px",border:"2px solid #22c55e"}}>
            <div style={{fontSize:52}}>{paymentSuccess.status==="SETTLED" ? "✅" : "⏳"}</div>
            <b style={{fontSize:22}}>{paymentSuccess.status==="SETTLED" ? "Payment Successful" : "GBK Reward Pending"}</b>
            {paymentSuccess.rewardGbk && <div style={{fontSize:28,fontWeight:800}}>+{paymentSuccess.rewardGbk} GBK</div>}
            <div>{paymentSuccess.status==="SETTLED" ? "Payment verified and the GBK reward has been released successfully." : "Payment verified. Your eligible GBK reward is reserved and will be released automatically after the merchant adds sufficient GBK funding."}</div>
            <small>GBK Order: {paymentSuccess.orderReference}</small>
            {paymentSuccess.status!=="SETTLED" && <small>Merchant action: Add GBK balance to complete the reward settlement.</small>}
            {paymentSuccess.txHash && <small>Reward transaction: {paymentSuccess.txHash.slice(0,10)}…{paymentSuccess.txHash.slice(-8)}</small>}
            <button className="primary" type="button" onClick={()=>{setPaymentSuccess(null);setUpiPayment(null);setCurrentOrderReference("");setOrderAmount("");}}>Done ✓</button>
          </div> : upiPayment?.upi_links && upiPayment?.gbk_order_id && <div className="offerPreview" style={{display:"grid",gap:8,margin:"12px 0"}}>
            <b>🔄 Payment verification</b>
            <span>After PhonePe/UPI payment, return to GBK Loyalty. We check the GBK Order for trusted payment confirmation. Gateway payments can be confirmed automatically; merchant-direct UPI payments use UTR verification when automatic confirmation is not available.</span>
            <button className="secondary" type="button" onClick={()=>checkAutomaticPaymentStatus(false)} disabled={apiBusy}>↻ Check payment status</button>
            <details>
              <summary style={{cursor:"pointer",fontWeight:700}}>Having trouble? Enter UTR manually</summary>
              <input className="modalInput" inputMode="text" value={paymentUtr} onChange={e=>setPaymentUtr(e.target.value)} placeholder="UPI Transaction ID / UTR"/>
              <button className="primary" type="button" onClick={verifyCustomerDirectPayment} disabled={apiBusy || !paymentUtr.trim()}>
                {apiBusy ? "Verifying payment…" : "Verify Payment & Receive GBK Reward →"}
              </button>
            </details>
          </div>}
          <small>{selectedMerchant.payment_provider==="DIRECT" || selectedMerchant.payment_method==="CASH"
            ? "Pay the merchant directly. Payment confirmation must match this GBK Order ID before any GBK reward is released."
            : "Continue to the merchant's configured payment method."}</small>
          <button className="primary" disabled={apiBusy || !orderAmount} onClick={()=>currentOrderReference ? continueCurrentPayment() : createOrderFor(selectedMerchant)}>{apiBusy ? "Creating order…" : currentOrderReference ? "Continue to Payment ↓" : (selectedMerchant.payment_provider==="DIRECT" || selectedMerchant.payment_method==="CASH" ? "Create GBK Order → Pay" : "Continue & Pay")}</button>
          <button className="secondary" onClick={()=>{setSelectedMerchant(null);setOrderAmount("");setCurrentOrderReference("");setUpiPayment(null);setPaymentUtr("");setPaymentSuccess(null);setAuthNotice("");}}>Cancel</button>
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
          <p>GBK AI searches <b>active registered businesses</b> for each customer request and can automatically create and route the lead/order to the selected merchant. The merchant controls the actual product/service, price and fulfilment.</p>
          <div className="status">🟢 Merchant active <span>Eligible for GBK AI leads + orders</span></div>
           <div className="status">📈 More active businesses <span>More registrations = more customer choices and more opportunities to receive relevant GBK AI leads.</span></div>
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

      <section className="offerGrid" style={{marginTop:18}}>
        <div className="offerPreview" style={{display:"grid",gap:10}}>
          <span className="eyebrow">🔗 GBKAI MERCHANT REFERRAL</span>
          <h2 style={{margin:0}}>Recruit real merchants with your unique referral link</h2>
          <p>Anyone can create a unique GBKAI referral link. Bring a real business to GBK Loyalty. When the merchant has no Founder attached, the qualifying loyalty reward allocation includes <strong>10% for the referring creator</strong>.</p>
          <div className="status"><span>60% Customer · 10% Creator · 30% Platform</span><small>With an eligible Founder attached, the Founder allocation applies instead: 60% Customer · 20% Founder · 20% Platform. Creator and Founder rewards do not stack.</small></div>
          <button className="primary" type="button" onClick={()=>setRole("Creator")}>🔗 Get My Unique Referral Link</button>
        </div>
        <div className="offerPreview" style={{display:"grid",gap:8}}>
          <b>🎥 Not only YouTubers</b>
          <span>Customers, creators, local influencers, salespeople and community members can recruit legitimate merchants.</span>
          <span>Rewards are tied to <strong>real verified loyalty transactions</strong> — not clicks, views or fake registrations.</span>
        </div>
      </section>

      <section className="merchantRules roleOnlySection">
        <div><span className="eyebrow">MERCHANT TERMS</span><h2>Simple rules before activation</h2></div>
        <div className="ruleGrid">
          <div><b>01 · Activate first</b><p>A verified merchant can activate without a GBK balance. The connected merchant wallet is used for reward funding when an eligible reward is due.</p></div>
          <div><b>02 · Choose loyalty</b><p>Merchant selects 5%, 10%, 15%, 20% or a custom loyalty percentage.</p></div>
          <div><b>03 · Automatic split</b><p>With a Founder: 60% Customer / 20% Founder / 20% Platform. Without a Founder but with a creator referral: 60% Customer / 10% Creator / 30% Platform. Without either: 60% Customer / 40% Platform.</p></div>
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
        <div><span className="eyebrow">DIRECT MERCHANT ACTIVE PROGRAM</span><h2>Activate real merchants city by city.</h2><p>Directly invite legitimate businesses, send the owner a Claim & Activate link, connect the merchant wallet, add a live GBK balance, create the loyalty offer and make the business ACTIVE for real customer transactions.</p></div>
        <button onClick={()=>connectWallet("merchant")} disabled={apiBusy}>{apiBusy ? "Connecting…" : "Connect / Register Merchant →"}</button>
      </section>
      <section className="cityActivation" style={{marginTop:18}}>
        <div className="sectionHead">
          <div><span className="eyebrow">🌍 GBKAI CITY 50 PROGRAM</span><h2>50 real ACTIVE merchants in every priority city.</h2></div>
          <button className="textBtn" type="button" onClick={loadBusinessDirectory} disabled={directoryLoading}>{directoryLoading ? "Refreshing…" : "↻ Refresh"}</button>
        </div>
        <p style={{marginTop:-4}}>Only verified ACTIVE merchants count. Customer referral is not used for merchant onboarding: merchants enter through Founder onboarding or direct merchant registration. Once active, relevant GBKAI customer searches can be routed to them.</p>
        <div className="offerGrid" style={{marginTop:14}}>
          <div className="offerPreview" style={{display:"grid",gap:7}}>
            <b>🎯 Country target</b>
            <span><strong>50 priority cities × 50 ACTIVE merchants = 2,500 ACTIVE merchants</strong> for each country.</span>
            <span>Registrations, unclaimed businesses and inactive wallets do not count.</span>
          </div>
          <div className="offerPreview" style={{display:"grid",gap:7}}>
            <b>📲 Lead engine</b>
            <span>Customer searches are matched to ACTIVE merchants by country, city and business category.</span>
            <span>Track <strong>lead → response → verified transaction</strong>, not registrations alone.</span>
          </div>
        </div>
        <div className="cityGrid" style={{marginTop:14}}>
          {(priorityCities[country] || priorityCities.India).slice(0,50).map((city)=>{
            const activeCount=directoryResults.filter((m:any)=>String(m.city||"").trim().toLowerCase()===city.toLowerCase() && String(m.status||"").toUpperCase()==="ACTIVE").length;
            const pct=Math.min(100,Math.round(activeCount/50*100));
            return <article className="offerPreview" key={city} style={{display:"grid",gap:6}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>📍 {city}</b><strong>{activeCount}/50</strong></div>
              <div style={{height:7,borderRadius:99,background:"rgba(127,127,127,.18)",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",borderRadius:99,background:"currentColor"}}/></div>
              <small>{activeCount>=50 ? "🟢 City Activated" : activeCount>0 ? "🟡 Building active merchant network" : "🔴 Needs real merchants"}</small>
            </article>;
          })}
        </div>
      </section>
      <section className="offerGrid" style={{marginTop:18}}>
        <div className="offerPreview" style={{display:"grid",gap:8}}>
          <b>🏙️ City activation target</b>
          <span>Start with <strong>50 active merchants per pilot city</strong> and expand after real transactions are proven.</span>
          <span>Priority: groceries · restaurants · retail · services · hotels · real estate.</span>
        </div>
        <div className="offerPreview" style={{display:"grid",gap:8}}>
          <b>📲 Direct owner activation</b>
          <span>Business added → owner invited → owner claims → payment method → GBK balance → offer → 🟢 ACTIVE.</span>
          <button className="secondary" type="button" onClick={()=>setRole("SuggestBusiness")}>➕ Founder: Add Real Business Lead</button>
        </div>
      </section>

      {role && <div className="modalBackdrop" onClick={()=>setRole(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <button className="close" onClick={()=>setRole(null)}>×</button>
          <div className="roleIcon">{role==="MerchantWallet" ? "👛" : role==="SuggestBusiness" || role==="ClaimBusiness" ? "🏪" : (roles.find(r=>r.title===role)?.icon || (role==="FounderUser" ? "👥" : role==="FounderBusiness" ? "🏪" : "🌍"))}</div>
          <h2>{role==="MerchantWallet" ? "Merchant Wallet" : role==="WalletChooser" ? "Choose Your Wallet" : role==="SuggestBusiness" ? "Suggest a Business" : role==="ClaimBusiness" ? "Claim This Business" : role==="Creator" ? "GBKAI Merchant Referral" : `${role} registration`}</h2>
          {role==="SuggestBusiness" ? <>
            <p>Merchant onboarding now has only two routes: a verified Founder referral or direct merchant registration. Customers do not refer merchants. Founders can add legitimate business leads, and the business owner completes activation before it becomes ACTIVE.</p>
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
            <p><b>This is an unclaimed business listing.</b> If you are the owner or an authorized representative, you can claim it and manage the business after verification.</p>
            {claimBusiness && <div className="offerPreview" style={{display:"grid",gap:8,marginBottom:12}}>
              <b>🏪 {claimBusiness.business_name}</b>
              <span>📍 {[claimBusiness.category,claimBusiness.city,claimBusiness.country].filter(Boolean).join(" • ")}</span>
              <div className="status"><span>🟡 UNCLAIMED BUSINESS</span><small>This listing helps customers discover the business. It is not yet a verified GBK Loyalty merchant and is not reward-active.</small></div>
            </div>}
            <div className="offerPreview" style={{display:"grid",gap:8}}>
              <b>✨ What you get after verification</b>
              <span>✅ Manage your business information</span>
              <span>📲 Add your UPI/payment details</span>
              <span>🎁 Create GBK customer offers</span>
              <span>📊 View customer orders and eligible rewards</span>
              <span>👥 Participate in the GBK Loyalty network</span>
              <span>🔗 Promote your business to GBK customers</span>
            </div>
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
              <b>🔄 How it works</b>
              <span><b>1. Claim</b> — tell us who you are with your mobile and email.</span>
              <span><b>2. Verify</b> — GBK reviews the owner/authorized representative claim.</span>
              <span><b>3. Complete profile</b> — update business and payment information.</span>
              <span><b>4. Connect wallet</b> — connect the merchant GBK wallet.</span>
              <span><b>5. Activate</b> — accept the merchant terms and become a verified merchant.</span>
            </div>
            <div className="status" style={{marginTop:12}}>
              <span>💡 No claim? No problem.</span>
              <small>The business can remain visible as an unclaimed listing. The owner can claim it later.</small>
            </div>
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
              <b>Business status</b>
              <span>🟡 Unclaimed → 🔵 Claim Pending → 🟢 Verified Merchant</span>
              <small>Only a verified merchant can activate reward-eligible loyalty orders.</small>
            </div>
            {!claimSubmitted ? <>
              <input placeholder="Owner / authorized representative name *" value={claimName} onChange={e=>setClaimName(e.target.value)}/>
              <input placeholder="Mobile number *" value={claimMobile} onChange={e=>setClaimMobile(e.target.value)}/>
              <input type="email" placeholder="Email address *" value={claimEmail} onChange={e=>setClaimEmail(e.target.value)}/>
              {authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
              <button className="primary" type="button" onClick={submitClaim} disabled={apiBusy}>{apiBusy ? "Submitting claim…" : "👉 Claim This Business — Submit →"}</button>
            </> : <div className="status" style={{marginTop:12}}>
              <span>🔵 CLAIM PENDING</span>
              <small>Your claim has been submitted. GBK will verify the owner/authorized representative before merchant activation.</small>
            </div>}
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
            <p>Manage the connected merchant reward wallet. Customer payments remain direct to the merchant; the connected wallet must have a live GBK balance before this merchant can become ACTIVE. GBK is used for eligible loyalty rewards.</p>
            <div className="offerPreview" style={{display:"grid",gap:6}}>
              <b>Merchant: {merchantStatus?.merchant?.business_name || "—"}</b>
              <span>Wallet: {walletAddress ? walletAddress.slice(0,6)+"…"+walletAddress.slice(-4) : (merchantStatus?.merchant?.profile_id ? "Connected" : "Not connected")}</span>
            </div>
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
              <b>🎁 GBK Loyalty Offer</b>
              {!merchantOfferEditing ? <>
                <span>Product / Service: <strong>{String(merchantStatus?.merchant?.payment_details?.offer?.description || merchantStatus?.merchant?.description || "Not configured")}</strong></span>
                {merchantStatus?.merchant?.payment_details?.offer?.amount != null && <span>Offer amount: <strong>{String(merchantStatus?.merchant?.payment_details?.offer?.currency || merchantStatus?.merchant?.payment_currency || "USD").toUpperCase()} {Number(merchantStatus.merchant.payment_details.offer.amount).toLocaleString()}</strong></span>}
                <span>Current loyalty: <strong>{(Number(merchantStatus?.merchant?.loyalty_offer_bps || 0)/100).toFixed(merchantStatus?.merchant?.loyalty_offer_bps % 100 ? 2 : 0)}%</strong> · Customer 60% · Founder 20% · Platform 20%</span>
                <button className="secondary" type="button" onClick={()=>{
                  const saved=merchantStatus?.merchant?.payment_details?.offer || {};
                  setMerchantOfferEdit(String(Number(merchantStatus?.merchant?.loyalty_offer_bps || 0)/100));
                  setMerchantOfferEditCustom(String(Number(merchantStatus?.merchant?.loyalty_offer_bps || 0)/100));
                  setMerchantOfferEditType(saved?.type === "Service" ? "Service" : saved?.type === "Product" ? "Product" : "Flat Store");
                  setMerchantOfferEditDescription(String(saved?.description || merchantStatus?.merchant?.description || ""));
                  setMerchantOfferEditAmount(saved?.amount != null ? String(saved.amount) : "");
                  setMerchantOfferEditCurrency(String(saved?.currency || merchantStatus?.merchant?.payment_currency || "USD").toUpperCase());
                  setMerchantOfferEditing(true);
                }}>✏️ Edit Offer</button>
              </> : <>
                <small>Edit the Product/Service, amount and custom loyalty percentage. Completed orders keep their original offer.</small>
                <select className="modalSelect" value={merchantOfferEditType} onChange={e=>setMerchantOfferEditType(e.target.value as "Flat Store"|"Product"|"Service")}>
                  <option value="Flat Store">Flat Store Percentage</option>
                  <option value="Product">Product Offer</option>
                  <option value="Service">Service Offer</option>
                </select>
                {merchantOfferEditType !== "Flat Store" ? <>
                  <input className="modalInput" value={merchantOfferEditDescription} onChange={e=>setMerchantOfferEditDescription(e.target.value)} placeholder={merchantOfferEditType==="Product" ? "Product name / offer" : "Service name / offer"}/>
                  <input className="modalInput" type="number" min="0.01" step="0.01" value={merchantOfferEditAmount} onChange={e=>setMerchantOfferEditAmount(e.target.value)} placeholder={`Amount in ${merchantOfferEditCurrency.toUpperCase()}`}/>
                  <input className="modalInput" value={merchantOfferEditCurrency} onChange={e=>setMerchantOfferEditCurrency(e.target.value.toUpperCase())} maxLength={3} placeholder="Currency code e.g. INR, AED, USD"/>
                </> : <small>Use one store-wide loyalty percentage for all eligible orders.</small>}
                <label><b>Flat Store Percentage</b><small>Keep the previous store-wide percentage option for all eligible purchases.</small></label>
                <select className="modalSelect" value={merchantOfferEdit} onChange={e=>setMerchantOfferEdit(e.target.value)}>
                  <option value="2">2% loyalty</option>
                  <option value="3">3% loyalty</option>
                  <option value="5">5% loyalty</option>
                  <option value="10">10% loyalty</option>
                  <option value="15">15% loyalty</option>
                  <option value="20">20% loyalty</option>
                  <option value="custom">Custom percentage</option>
                </select>
                {merchantOfferEdit === "custom" ? <input className="modalInput" type="number" min="1" max="50" step="0.1" value={merchantOfferEditCustom} onChange={e=>setMerchantOfferEditCustom(e.target.value)} placeholder="Custom loyalty percentage 1%–50%"/> : null}
                <small>Custom percentage: enter 1%–50%. Reward pool is split 60% Customer / 20% Founder / 20% Platform.</small>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button className="primary" type="button" onClick={saveMerchantOffer} disabled={apiBusy}>{apiBusy ? "Saving…" : "💾 Save Offer"}</button>
                  <button className="secondary" type="button" onClick={()=>setMerchantOfferEditing(false)} disabled={apiBusy}>Cancel</button>
                </div>
              </>}
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
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
              <b>💰 LIVE USDT + BNB BALANCE</b>
              <span>USDT and native BNB are read directly from BNB Smart Chain for this merchant wallet.</span>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><small>USDT</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.usdtRaw)/1e18).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}</strong></div>
                <div><small>BNB (gas)</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.bnbRaw)/1e18).toLocaleString(undefined,{minimumFractionDigits:4,maximumFractionDigits:6}) : "—"}</strong></div>
              </div>
              <button className="secondary" type="button" onClick={()=>refreshWalletAssetStatus()} disabled={walletAssetBusy}>{walletAssetBusy ? "Reading blockchain…" : "↻ Refresh USDT + BNB"}</button>
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
                <span>Current reward funding</span>
                <b>{merchantChainStatus ? (Number(merchantChainStatus.balanceRaw)/1e8).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"} GBK</b>
                <small>{merchantChainStatus
                  ? "Live merchant wallet balance available for eligible loyalty rewards."
                  : "Connect the merchant wallet to read the live funding balance."
                }</small>
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
            <div className={merchantStatus?.merchant?.invitation_status==="ACCEPTED" ? "status" : "status paused"}>
              {merchantStatus?.merchant?.invitation_status==="ACCEPTED"
                ? "🟢 Merchant Active"
                : "⏳ Merchant activation pending"}
              <span>{merchantStatus?.merchant?.invitation_status==="ACCEPTED"
                ? (Number(merchantChainStatus?.balanceRaw || merchantStatus?.live_gbk_balance_raw || 0) > 0
                  ? "Merchant is active and the live GBK balance is available for eligible rewards."
                  : "Merchant is active, but the live GBK balance is now zero. Add GBK before processing reward-eligible transactions.")
                : "Connect the merchant wallet, add UPI/bank details, accept the terms and maintain the required live GBK balance to activate."}</span>
            </div>
            <button className="secondary" onClick={openMerchantWallet} disabled={apiBusy}>{apiBusy ? "Checking…" : "Refresh live GBK balance"}</button>
            {merchantStatus?.merchant?.invitation_status !== "ACCEPTED" && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:10}}>
              <b>💰 Get GBK to activate</b>
              <span>Activation requires a positive live GBK balance in the connected merchant wallet.</span>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <a className="primary" href="https://swap.gbkai.com" target="_blank" rel="noreferrer" style={{textAlign:"center",textDecoration:"none"}}>🔄 Get GBK — USDT → GBK</a>
                <button className="secondary" type="button" onClick={async()=>{
                  const address=merchantWallet || walletAddress || "";
                  if(!address){setAuthNotice("Connect the merchant wallet first.");return;}
                  try{await navigator.clipboard.writeText(address);setAuthNotice("Merchant wallet address copied. Transfer GBK to this wallet, then refresh the live balance.");}
                  catch{setAuthNotice("Merchant wallet: "+address);}
                }}>📥 Copy Wallet — Transfer GBK</button>
              </div>
              <small>GBK remains in the merchant's connected wallet. GBKAI does not take custody of the merchant's tokens.</small>
            </div>}
            {merchantStatus?.merchant?.invitation_status !== "ACCEPTED" && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:14}}>
              <b>Merchant activation</b>
              <span>GBK balance is required for activation. Connect the merchant wallet, add a payment method, accept the terms, then use Get GBK or transfer GBK into the connected wallet. The system checks the live BNB Smart Chain balance before making the business ACTIVE.</span>
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
              <b>📲 Share My Business</b>
              <span>Share this registered business with customers. This is separate from your personal GBK Referral Link.</span>
              {merchantStatus?.merchant?.id && <>
                <input className="modalInput" readOnly value={`${window.location.origin}/?merchant=${merchantStatus.merchant.id}`} />
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button className="primary" type="button" onClick={()=>shareBusiness(String(merchantStatus?.merchant?.business_name||"this business"),`${window.location.origin}/?merchant=${merchantStatus.merchant.id}`)}>📤 Share Business</button>
                  <button className="secondary" type="button" onClick={async()=>{
                    const link=`${window.location.origin}/?merchant=${merchantStatus.merchant.id}`;
                    try{await navigator.clipboard.writeText(link);setShareNotice("Business link copied. Share it with customers.");}
                    catch{setAuthNotice("Business link: "+link);}
                  }}>🔗 Copy Business Link</button>
                </div>
              </>}
            </div>
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
                       o.reward_settlement_status==="BELOW_MINIMUM_REWARD" ? "⚪ Below $0.05 minimum — held until eligible" :
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
                      const txId=window.prompt("Enter the verified UPI transaction ID / UTR for this GBK Order.");
                      if(!txId?.trim()) return;
                      setApiBusy(true);
                      try{
                        const result=await loyaltyApi(session,"direct_payment_verify",{order_id:o.id,payment_transaction_id:txId.trim()});
                        const settlement=result?.settlement;
                        setAuthNotice(
                          settlement?.status==="SETTLED"
                            ? "Payment verified. GBK reward released successfully."
                            : settlement?.status==="AWAITING_MERCHANT_APPROVAL"
                              ? "Payment verified. Merchant wallet approval is required once to release the GBK reward."
                              : settlement?.status==="BELOW_MINIMUM_REWARD"
                                ? "Payment verified. This order is below the minimum on-chain reward amount."
                                : "Payment verified. GBK reward settlement is processing."
                        );
                        await openMerchantWallet();
                      }catch(e:any){setAuthNotice(e.message||"Payment verification failed");}finally{setApiBusy(false);}
                    }}>Verify UPI transaction & release reward</button>}
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
              {activeWalletRole==="customer" && walletAddress && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
                <b>💰 LIVE ON-CHAIN WALLET</b>
                <span>Read directly from BNB Smart Chain — not from the database.</span>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
                  <div><small>GBK</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.gbkRaw)/1e8).toLocaleString(undefined,{maximumFractionDigits:2}) : "—"}</strong></div>
                  <div><small>USDT</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.usdtRaw)/1e18).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}</strong></div>
                  <div><small>BNB</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.bnbRaw)/1e18).toLocaleString(undefined,{minimumFractionDigits:4,maximumFractionDigits:6}) : "—"}</strong></div>
                </div>
                <button className="secondary" type="button" onClick={()=>refreshWalletAssetStatus()} disabled={walletAssetBusy}>{walletAssetBusy ? "Reading blockchain…" : "↻ Refresh live balances"}</button>
                <a className="secondary" href={"https://bscscan.com/address/"+walletAddress} target="_blank" rel="noreferrer" style={{textAlign:"center",textDecoration:"none"}}>View wallet on BscScan ↗</a>
              </div>}
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
            <input className="modalInput" placeholder="Founder referral code or referral link (optional)" value={founderReferralCode} onChange={e=>setFounderReferralCode(e.target.value)}/>
            {founderReferralStatus?.id ? (
              <div className="offerPreview" style={{marginTop:6}}>
                <b>✅ Founder referral verified</b>
                <span>{founderReferralStatus.referral_code ? "Code: "+founderReferralStatus.referral_code+" · " : ""}{founderReferralStatus.country || "Global"} Founder</span>
              </div>
            ) : founderReferralStatus?.error ? (
              <small style={{color:"#b42318",display:"block",marginTop:6}}>❌ {founderReferralStatus.error}</small>
            ) : founderReferralCode.trim() ? (
              <small style={{display:"block",marginTop:6}}>Checking Founder referral…</small>
            ) : null}
            <small>Optional. You can paste the Founder code, wallet address, or the full GBK referral link. A Founder reward is assigned only after verification.</small>
            <div className="offerPreview" style={{display:"grid",gap:8,marginTop:8}}>
              <b>🛍️ Offer Setup</b>
              <span>Create the product or service offer customers will see. Your existing loyalty percentage controls remain below.</span>
              <select className="modalSelect" value={merchantOfferType} onChange={e=>setMerchantOfferType(e.target.value as "Product"|"Service")}>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
              </select>
              <input className="modalInput" value={merchantOfferDescription} onChange={e=>setMerchantOfferDescription(e.target.value)} placeholder={merchantOfferType==="Product" ? "Product name / offer, e.g. Grocery package" : "Service name / offer, e.g. AC service"}/>
              <input className="modalInput" type="number" min="0" step="0.01" value={merchantOfferAmount} onChange={e=>setMerchantOfferAmount(e.target.value)} placeholder={`Amount in ${paymentCurrency}`}/>
              <small>Amount is only the offer example/price. The actual customer reward is calculated from the verified purchase amount.</small>
            </div>
            <label><b>Flat Store Percentage</b><small>Store-wide loyalty percentage applied to eligible purchases.</small></label>
            <select className="modalSelect" value={merchantOffer} onChange={e=>setMerchantOffer(e.target.value)}>
              <option value="2%">2% loyalty</option>
              <option value="3%">3% loyalty</option>
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
              <b>Merchant payment — {country === "United States" ? "🇺🇸 USA" : country === "India" ? "🇮🇳 India" : "🌍 Global"}</b>
              <small>Customer pays the merchant in the local payment system. GBK Loyalty uses payment confirmation only to release eligible GBK rewards.</small>
              {country === "United States" ? <>
                <select className="modalSelect" value={paymentGateway} onChange={e=>setPaymentGateway(e.target.value)}>
                  <option value="STRIPE">Stripe Checkout</option>
                  <option value="DIRECT">Merchant-direct payment</option>
                </select>
                <div className="offerPreview"><b>USA checkout methods</b><span>Apple Pay · Google Pay · Credit/Debit Card</span><span>Optional: PayPal · Venmo · Square</span><small>Wallet methods appear when supported by the connected provider, customer device and checkout.</small></div>
                {paymentGateway !== "DIRECT" && <input className="modalInput" value={paymentAccountRef} onChange={e=>setPaymentAccountRef(e.target.value.trim())} placeholder="Stripe Connected Account ID (when enabled)"/>}
                <input className="modalInput" value={paymentDetails} onChange={e=>setPaymentDetails(e.target.value)} placeholder="USA payment details or connected account reference (optional)"/>
              </> : <>
                <select className="modalSelect" value={paymentGateway} onChange={e=>setPaymentGateway(e.target.value)}>
                  <option value="DIRECT">Merchant-direct payment</option>
                  <option value="RAZORPAY">Razorpay (optional)</option>
                  <option value="CASHFREE">Cashfree Easy Split (optional)</option>
                  <option value="PAYU">PayU Split Settlement (optional)</option>
                </select>
                <select className="modalSelect" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                  {isIndia ? <option value="UPI">UPI / UPI QR</option> : country === "Thailand" ? <>
                    <option value="THAI_QR">Thai QR / PromptPay</option>
                    <option value="THAI_BANK">Thai Bank Transfer</option>
                    <option value="LOCAL_CURRENCY">Local currency / bank / wallet</option>
                  </> : country === "Malaysia" ? <>
                    <option value="MY_QR">DuitNow QR</option>
                    <option value="MY_BANK">Malaysian Bank Transfer</option>
                    <option value="LOCAL_CURRENCY">Local currency / bank / wallet</option>
                  </> : country === "Philippines" ? <>
                    <option value="PH_QR">GCash / QR Ph</option>
                    <option value="PH_BANK">Philippine Bank Transfer</option>
                    <option value="LOCAL_CURRENCY">Local currency / bank / wallet</option>
                  </> : country === "United Arab Emirates" ? <>
                    <option value="UAE_QR">UAE QR / Merchant QR</option>
                    <option value="UAE_BANK">UAE Bank Transfer</option>
                    <option value="LOCAL_CURRENCY">Local currency / bank / wallet</option>
                  </> : <option value="LOCAL_CURRENCY">Local currency / bank / wallet</option>}
                  <option value="CASH">Cash</option>
                  <option value="USDT">USDT</option>
                </select>
                <input className="modalInput" value={paymentCurrency} onChange={e=>setPaymentCurrency(e.target.value.toUpperCase())} placeholder="Currency code e.g. INR, AED, USD" maxLength={3}/>
                {paymentMethod !== "CASH" && <input className="modalInput" value={paymentDetails} onChange={e=>setPaymentDetails(e.target.value)} placeholder={
                  paymentMethod==="USDT" ? "USDT payment details (optional)" :
                  paymentMethod==="UPI" ? "Merchant UPI ID, e.g. merchant@upi" :
                  paymentMethod==="THAI_QR" ? "PromptPay / Thai QR ID or QR image URL" :
                  paymentMethod==="THAI_BANK" ? "Thai bank name, account name, account number, branch" :
                  paymentMethod==="MY_QR" ? "DuitNow QR ID or QR image URL" :
                  paymentMethod==="MY_BANK" ? "Malaysian bank name, account name, account number" :
                  paymentMethod==="PH_QR" ? "GCash / QR Ph number or QR image URL" :
                  paymentMethod==="PH_BANK" ? "Philippine bank name, account name, account number" :
                  paymentMethod==="UAE_QR" ? "UAE merchant QR ID or QR image URL" :
                  paymentMethod==="UAE_BANK" ? "UAE bank name, account name, IBAN, SWIFT/BIC" :
                  "Local payment / bank / wallet details (optional)"
                }/>}
                {(paymentMethod==="THAI_QR" || paymentMethod==="MY_QR" || paymentMethod==="PH_QR" || paymentMethod==="UAE_QR") && <small>QR payment details can be saved for the merchant and shown to customers during payment.</small>}
                {(paymentMethod==="THAI_BANK" || paymentMethod==="MY_BANK" || paymentMethod==="PH_BANK" || paymentMethod==="UAE_BANK") && <small>Enter the merchant bank details used to receive the local-currency payment.</small>}
              </>}
              <div className="walletRequiredBox">
                <b>Merchant GBK wallet — required</b>
                <small>Connect the BNB Smart Chain wallet that funds loyalty rewards. The live GBK balance is checked automatically.</small>
                <input className="modalInput" value={merchantWallet} readOnly placeholder="Connect Wallet to continue"/>
                <button type="button" className="secondary" onClick={()=>connectWallet("merchant")} disabled={apiBusy}>{merchantWallet ? "Wallet Connected" : "Connect Wallet"}</button>
                <a className="secondary" href="https://swap.gbkai.com" target="_blank" rel="noreferrer" style={{display:"block",textAlign:"center",marginTop:8}}>🔄 Swap USDT → GBK</a>
              </div>
              <small>Payment processing requires the merchant’s supported provider account to be connected and configured. GBK funding is separate from customer payment.</small>
            </div>
            <label className="check"><input type="checkbox" checked={merchantTermsAccepted} onChange={e=>setMerchantTermsAccepted(e.target.checked)}/> I accept the GBK Loyalty merchant terms and understand that my connected GBK wallet funds eligible loyalty rewards.</label>
          </> : role==="Founder" ? <>
            {founderStatus?.founder_verified ? <>
            <div className="status" style={{marginBottom:12}}>
              <span>🟢 VERIFIED FOUNDER — Loyalty connected</span>
              <small>Same verified Founder wallet recognized. Founder registration is not required again.</small>
            </div>
            <div className="offerPreview" style={{display:"grid",gap:8}}>
              <b>👑 Founder Dashboard</b>
              <span>{founderStatus.founder_type === "global" ? "Global Founder" : "Country Founder"} · {founderStatus.founder_tier || "Verified membership"}</span>
              <span>Wallet: {walletAddress ? `${walletAddress.slice(0,8)}…${walletAddress.slice(-6)}` : "Connected"}</span>
              <span>Founder benefits: {founderStatus.founder_benefits_active ? "Active" : "Verified — holding requirement may need attention"}</span>
            </div>
          </> : <>
            <p>Founder registration is required only when this wallet has not yet been verified in the Founder membership system.</p>
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
          </>} 
            {authNotice && <div className="status" style={{marginTop:12}}><span>{authNotice}</span></div>}
            {founderStatus?.founder_verified && <div className="offerPreview" style={{marginTop:12}}>
              <b>👑 My Founder Referral Link</b>
              <span>Share your Founder link with businesses and users you personally bring to GBK Loyalty. Founder attribution has priority only when no earlier valid customer referral is already locked.</span>
              <strong style={{fontSize:20,letterSpacing:1}}>{founderStatus.founder_referral_code || "Generated for your Founder account"}</strong>
              {founderStatus.founder_referral_code && <div style={{display:"grid",gap:8,marginTop:8}}>
                <input className="modalInput" readOnly value={`https://app.gbkai.com/?ref=${founderStatus.founder_referral_code}`} onFocus={e=>e.currentTarget.select()} />
                <button className="primary" type="button" onClick={async()=>{
                  const link=`https://app.gbkai.com/?ref=${founderStatus.founder_referral_code}`;
                  try { await navigator.clipboard.writeText(link); setAuthNotice("Founder referral link copied. Share it with businesses and users."); }
                  catch { setAuthNotice(link); }
                }}>🔗 Copy Founder Referral Link</button>
              </div>}
            </div>}
            {founderStatus?.founder_verified && walletAddress && <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
              <b>💰 LIVE ON-CHAIN FOUNDER WALLET</b>
              <span>GBK, USDT and native BNB are read directly from BNB Smart Chain.</span>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
                <div><small>GBK</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.gbkRaw)/1e8).toLocaleString(undefined,{maximumFractionDigits:2}) : "—"}</strong></div>
                <div><small>USDT</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.usdtRaw)/1e18).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}</strong></div>
                <div><small>BNB</small><strong style={{display:"block"}}>{walletAssetStatus ? (Number(walletAssetStatus.bnbRaw)/1e18).toLocaleString(undefined,{minimumFractionDigits:4,maximumFractionDigits:6}) : "—"}</strong></div>
              </div>
              <button className="secondary" type="button" onClick={()=>refreshWalletAssetStatus()} disabled={walletAssetBusy}>{walletAssetBusy ? "Reading blockchain…" : "↻ Refresh live balances"}</button>
              <a className="secondary" href={"https://bscscan.com/address/"+walletAddress} target="_blank" rel="noreferrer" style={{textAlign:"center",textDecoration:"none"}}>View wallet on BscScan ↗</a>
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
                <div className="offerPreview" style={{display:"grid",gap:8,marginTop:12}}>
                  <b>📲 Invite a Merchant Online</b>
                  <span>Enter a real business lead, then send the owner a ready-to-register invitation. The owner completes wallet verification and GBK funding before becoming ACTIVE.</span>
                  <input className="modalInput" placeholder="Business name" value={merchantInviteName} onChange={e=>setMerchantInviteName(e.target.value)}/>
                  <input className="modalInput" placeholder="Owner WhatsApp / phone / email" value={merchantInviteContact} onChange={e=>setMerchantInviteContact(e.target.value)}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <input className="modalInput" placeholder="City" value={merchantInviteCity} onChange={e=>setMerchantInviteCity(e.target.value)}/>
                    <select className="modalSelect" value={merchantInviteCategory} onChange={e=>setMerchantInviteCategory(e.target.value)}>{businessCategories.filter(x=>x!=="All Products & Services").map(x=><option key={x}>{x}</option>)}</select>
                  </div>
                  <button className="primary" type="button" onClick={async()=>{
                    const name=merchantInviteName.trim();
                    const contact=merchantInviteContact.trim();
                    const city=merchantInviteCity.trim();
                    if(!name||!contact||!city){setMerchantInviteNotice("Enter business name, owner contact and city.");return;}
                    const base="https://loyalty.gbkai.com";
                    const params=new URLSearchParams({role:"Merchant",invite:"founder",business:name,city,country,catalog:merchantInviteCategory});
                    const link=base+"?"+params.toString();
                    const msg="Hi! "+name+" is invited to join GBKAI Loyalty. Register your business online, connect your own BNB Smart Chain wallet, fund GBK rewards, and become an ACTIVE merchant eligible for customer leads. Register here: "+link;
                    try{
                      await navigator.clipboard.writeText(msg);
                      setMerchantInviteNotice("Invitation message copied. Open WhatsApp or email and send it to the business owner.");
                    }catch{setMerchantInviteNotice(msg);}
                    setMerchantInviteName(""); setMerchantInviteContact(""); setMerchantInviteCity("");
                  }}>📋 Create & Copy Invitation</button>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button className="secondary" type="button" onClick={()=>{
                      const name=merchantInviteName.trim()||"your business";
                      const city=merchantInviteCity.trim()||"your city";
                      const params=new URLSearchParams({role:"Merchant",invite:"founder",business:name,city,country,catalog:merchantInviteCategory});
                      const link="https://loyalty.gbkai.com?"+params.toString();
                      const msg="Join GBKAI Loyalty for "+name+" in "+city+". Register online and become an ACTIVE merchant eligible for customer leads: "+link;
                      window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
                    }}>💬 Send WhatsApp</button>
                    <button className="secondary" type="button" onClick={()=>{
                      const name=merchantInviteName.trim()||"your business";
                      const city=merchantInviteCity.trim()||"your city";
                      const params=new URLSearchParams({role:"Merchant",invite:"founder",business:name,city,country,catalog:merchantInviteCategory});
                      const link="https://loyalty.gbkai.com?"+params.toString();
                      const subject=encodeURIComponent("GBKAI Loyalty Merchant Invitation");
                      const body=encodeURIComponent("Please register "+name+" in "+city+" as a GBKAI Loyalty merchant. Become ACTIVE after wallet and GBK funding verification. Register: "+link);
                      window.location.href="mailto:?subject="+subject+"&body="+body;
                    }}>✉️ Send Email</button>
                  </div>
                  {merchantInviteNotice && <small style={{display:"block"}}>{merchantInviteNotice}</small>}
                </div>
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
          {role==="Founder" ? <button className="primary" onClick={verifyFounder} disabled={apiBusy}>{apiBusy ? "Verifying…" : "Verify Founder Member →"}</button> : role==="Merchant" ? <button className="primary" disabled={apiBusy || !merchantTermsAccepted} onClick={registerMerchant}>{apiBusy ? "Registering…" : merchantTermsAccepted ? "Register & Activate →" : "Accept terms to continue →"}</button> : null}{role==="MerchantWallet" ? <small>Send GBK only to the connected merchant wallet. The website does not take custody of merchant GBK.</small> : <small>No token transfer happens from this screen.</small>}
        </div>
      </div>}

      {showBackToTop && <button className="backToTop" type="button" aria-label="Back to top" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>↑ Top</button>}
      <nav className={`bottomNav${searchFocused ? " searchFocused" : ""}`}><a className="active">⌂<span>Home</span></a><a onClick={()=>setRole("Customer")}>⌕<span>Explore</span></a><a onClick={()=>setRole("Customer")}>🎁<span>Rewards</span></a><a onClick={()=>activeWalletRole==="merchant" ? openMerchantWallet() : activeWalletRole==="customer" ? setRole("Customer") : activeWalletRole==="founder" ? setRole("Founder") : connectWallet("merchant")}>👛<span>Wallet</span></a><a onClick={()=>setAskAiOpen(true)}>🤖<span>Ask AI</span></a></nav>
    </main>
  );
}