"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PropertyCategory = "All Properties" | "Buy Property" | "Sell Property" | "Rent Property" | "Commercial Property" | "Land / Plots";
const categories: { title: PropertyCategory; icon: string; detail: string }[] = [
  { title: "Buy Property", icon: "🏡", detail: "Houses, apartments, villas and plots" },
  { title: "Sell Property", icon: "🔑", detail: "List and sell directly as the owner" },
  { title: "Rent Property", icon: "🏠", detail: "Houses, flats, rooms and villas" },
  { title: "Commercial Property", icon: "🏢", detail: "Shops, offices and warehouses" },
  { title: "Land / Plots", icon: "🌿", detail: "Residential, commercial and agricultural land" },
];

export default function DirectOwnerPropertiesPage() {
  const [category, setCategory] = useState<PropertyCategory>("All Properties");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [ownerForm, setOwnerForm] = useState({ name: "", type: "House / Apartment", intent: "Sell", location: "", price: "", reward: "Custom", customReward: "", contact: "" });

  const categoryTypes: Record<PropertyCategory, string[]> = {
    "All Properties": [],
    "Buy Property": ["Buy"],
    "Sell Property": ["Sell"],
    "Rent Property": ["Rent"],
    "Commercial Property": ["Commercial"],
    "Land / Plots": ["Land"],
  };
  const options = useMemo(() => ["House / Apartment", "Villa", "Room / PG", "Shop / Showroom", "Office", "Commercial Building", "Warehouse / Godown", "Restaurant / Business Space", "Residential Plot", "Agricultural Land", "Industrial Property", "Other"], []);

  const submitOwnerListing = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Your listing details are ready for submission. Owner verification, property review, GBK balance eligibility and secure listing storage must be connected before this form can publish a live listing.");
  };

  return (
    <main className="propertyPage">
      <header className="propertyTopbar">
        <Link href="/" className="propertyBrand" aria-label="GBK AI Loyalty home"><span>♛</span><strong>GBK AI <b>Loyalty</b></strong></Link>
        <nav aria-label="Main navigation"><Link href="/">Home</Link><a href="#categories">Property Categories</a><a href="#listings">Direct Owner Listings</a></nav>
        <div className="propertyLocale"><span>🌐 {country}</span><span>GBK Loyalty</span></div>
      </header>

      <section className="propertyHero">
        <div className="propertyHeroCopy">
          <span className="propertyEyebrow">GBK LOYALTY · PROPERTY</span>
          <h1>Direct Owner Properties<br/><em>Buy, Sell &amp; Rent</em></h1>
          <p className="propertyLead">Connect directly with property owners. <strong>No broker required.</strong></p>
          <p>Discover homes, apartments, villas, shops, offices, warehouses and land listed directly by owners.</p>
          <div className="propertyActions">
            <a className="propertyPrimary" href="#listings">⌕ Browse Direct Owner Properties</a>
            <button className="propertySecondary" onClick={() => { setShowOwnerForm(true); setNotice(""); }}>＋ List Your Property as Owner</button>
          </div>
          <div className="propertyTrust"><span>✓ Direct owner listings</span><span>✓ Buy, sell or rent</span><span>✓ Owner chooses GBK reward %</span></div>
        </div>
        <div className="propertyHeroArt" role="img" aria-label="Modern house representing direct owner property listings"><div className="propertySun" /><div className="propertyHouse"><div className="propertyRoof"/><div className="propertyHouseBody"><div/><div/><div/></div><div className="propertyDoor"/></div><div className="propertyPlant plantOne"/><div className="propertyPlant plantTwo"/><div className="propertyArtCaption">Your property. Your choice. Direct connection.</div></div>
      </section>

      <section id="categories" className="propertySection">
        <div className="propertySectionHead"><div><span className="propertyEyebrow">FIND YOUR PROPERTY</span><h2>Explore Property Categories</h2></div><p>Owner-to-customer connections across countries and cities.</p></div>
        <div className="propertyCategoryGrid">
          {categories.map(item => <button key={item.title} className={category === item.title ? "propertyCategory active" : "propertyCategory"} onClick={() => { setCategory(item.title); document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" }); }}><span className="propertyCategoryIcon">{item.icon}</span><strong>{item.title}</strong><small>{item.detail}</small></button>)}
        </div>
      </section>

      <section className="propertySearch" aria-label="Search direct owner properties">
        <label className="propertySearchText"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search house, office, plot or area…" /></label>
        <label><span className="srOnly">Country</span><select value={country} onChange={e => setCountry(e.target.value)}><option>India</option><option>Thailand</option><option>United Arab Emirates</option><option>United States</option><option>United Kingdom</option><option>Global</option></select></label>
        <label><span className="srOnly">City or area</span><input value={city} onChange={e => setCity(e.target.value)} placeholder="City / Area" /></label>
        <label><span className="srOnly">Category</span><select value={category} onChange={e => setCategory(e.target.value as PropertyCategory)}>{["All Properties", ...categories.map(c => c.title)].map(c => <option key={c}>{c}</option>)}</select></label>
        <button onClick={() => { setNotice("Search filters are ready. Live results will appear when approved direct-owner property listings are connected."); document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" }); }}>Search Properties</button>
      </section>

      {showOwnerForm && <section className="propertyOwnerPanel" id="owner-form">
        <div className="propertySectionHead"><div><span className="propertyEyebrow">FOR PROPERTY OWNERS</span><h2>List Your Property Directly</h2></div><button className="propertyClose" onClick={() => setShowOwnerForm(false)} aria-label="Close owner listing form">×</button></div>
        <p>Owners set their own loyalty percentage. No broker is required to create a listing.</p>
        <form onSubmit={submitOwnerListing} className="propertyOwnerForm">
          <label>Owner name<input required value={ownerForm.name} onChange={e => setOwnerForm({...ownerForm, name:e.target.value})} placeholder="Full name" /></label>
          <label>Property type<select value={ownerForm.type} onChange={e => setOwnerForm({...ownerForm,type:e.target.value})}>{options.map(o=><option key={o}>{o}</option>)}</select></label>
          <label>Listing purpose<select value={ownerForm.intent} onChange={e => setOwnerForm({...ownerForm,intent:e.target.value})}><option>Sell</option><option>Buy</option><option>Rent</option><option>Lease</option></select></label>
          <label>Country<input required value={country} onChange={e => setCountry(e.target.value)} /></label>
          <label>City / area<input required value={ownerForm.location} onChange={e => setOwnerForm({...ownerForm,location:e.target.value})} placeholder="City, neighbourhood" /></label>
          <label>Asking price / rent<input required value={ownerForm.price} onChange={e => setOwnerForm({...ownerForm,price:e.target.value})} placeholder="Amount and currency" /></label>
          <label>Owner's loyalty reward<select value={ownerForm.reward} onChange={e => setOwnerForm({...ownerForm,reward:e.target.value})}><option>Custom</option><option>0.5%</option><option>1%</option><option>2%</option><option>3%</option><option>5%</option><option>10%</option></select></label>
          {ownerForm.reward === "Custom" && <label>Custom reward percentage<input inputMode="decimal" value={ownerForm.customReward} onChange={e => setOwnerForm({...ownerForm,customReward:e.target.value})} placeholder="Enter your own %" /></label>}
          <label>Contact details<input required value={ownerForm.contact} onChange={e => setOwnerForm({...ownerForm,contact:e.target.value})} placeholder="Phone or email" /></label>
          <div className="propertyOwnerFormFoot"><small>Listing requires owner/property verification. The GBK balance rule is separate: maintain at least $1 worth of GBK per active listing. This is not a platform fee.</small><button className="propertyPrimary" type="submit">Continue to Owner Verification</button></div>
        </form>
      </section>}

      <section id="listings" className="propertySection propertyListings">
        <div className="propertySectionHead"><div><span className="propertyEyebrow">VERIFIED AND APPROVED ONLY</span><h2>Direct Owner Listings</h2></div><span className="propertyNoBroker">No broker required</span></div>
        <div className="propertyEmpty"><div className="propertyEmptyIcon">⌂</div><h3>Discover Direct Owner Properties</h3><p>Approved owner listings will appear here. We only show real listings after owner and property details have been reviewed.</p><button className="propertyPrimary" onClick={() => { setShowOwnerForm(true); setNotice(""); document.getElementById("owner-form")?.scrollIntoView({behavior:"smooth"}); }}>List Your Property as Owner</button></div>
      </section>

      {notice && <div className="propertyNotice" role="status"><strong>Next step</strong><p>{notice}</p></div>}
      <footer className="propertyFooter"><strong>GBK AI Loyalty</strong><span>Property deals made direct, with rewards.</span><Link href="/">Back to GBK Loyalty Home</Link></footer>

      <style jsx>{`
        .propertyPage{--purple:#6d28d9;--violet:#9333ea;--ink:#17152b;--muted:#6c6678;max-width:1440px;margin:0 auto;padding:0 26px 40px;color:var(--ink)}
        .propertyTopbar{height:76px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid #ece7f4;margin-bottom:22px}
        .propertyBrand{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;white-space:nowrap}.propertyBrand>span{font-size:32px;color:#b7791f}.propertyBrand strong{font-size:22px;letter-spacing:-.7px}.propertyBrand b{color:var(--purple)}
        nav{display:flex;align-items:center;gap:24px}nav a{color:#484257;text-decoration:none;font-weight:700;font-size:14px}nav a:hover{color:var(--purple)}.propertyLocale{display:flex;gap:8px}.propertyLocale span{border:1px solid #e8e1f1;background:#fff;border-radius:12px;padding:10px 12px;font-size:12px;font-weight:800;white-space:nowrap}
        .propertyHero{display:grid;grid-template-columns:1.1fr .9fr;min-height:350px;border-radius:25px;overflow:hidden;background:linear-gradient(115deg,#f1eaff,#fff 62%,#e6ddff);border:1px solid #e7d9ff;box-shadow:0 14px 40px #5b21b012}
        .propertyHeroCopy{padding:35px 34px}.propertyEyebrow{font-size:11px;letter-spacing:1.8px;font-weight:900;color:var(--purple)}.propertyHero h1{font-size:clamp(34px,4vw,56px);line-height:1.02;letter-spacing:-2px;margin:14px 0}.propertyHero h1 em{font-style:normal;background:linear-gradient(90deg,#2563eb,#7c3aed);color:transparent;background-clip:text}.propertyHero p{line-height:1.55;color:#514a62;margin:8px 0}.propertyHero .propertyLead{font-size:19px;color:#211b35}.propertyActions{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0 17px}.propertyPrimary,.propertySecondary{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:12px;padding:13px 17px;font-size:14px;font-weight:850;text-decoration:none;cursor:pointer}.propertyPrimary{background:linear-gradient(100deg,#2563eb,#6d28d9);color:#fff}.propertySecondary{background:#fff;color:var(--purple);border:1px solid #cbb7ff}.propertyTrust{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;font-weight:800;color:#3d7952}.propertyHeroArt{position:relative;overflow:hidden;min-height:300px;background:linear-gradient(180deg,#b9dcff 0%,#fff0c9 56%,#77a95c 57%,#397248 100%)}
        .propertySun{position:absolute;right:18%;top:11%;width:70px;height:70px;border-radius:50%;background:#fff5cb;box-shadow:0 0 65px #fff7cc}.propertyHouse{position:absolute;bottom:9%;left:16%;width:66%;height:59%;background:#f9f4eb;box-shadow:0 18px 25px #182d2833}.propertyRoof{position:absolute;left:-7%;top:-22%;width:114%;height:42%;background:linear-gradient(135deg,#453a51,#1d2c43);clip-path:polygon(50% 0,100% 100%,0 100%)}.propertyHouseBody{position:absolute;inset:17% 7% 0;display:flex;justify-content:space-around;align-items:center;background:#f9f4eb}.propertyHouseBody div{width:21%;height:40%;background:linear-gradient(145deg,#8fd2f2,#264d72);border:5px solid #fff}.propertyDoor{position:absolute;bottom:0;left:43%;width:19%;height:48%;background:#6d4c41;border:4px solid #fff}.propertyPlant{position:absolute;bottom:7%;width:34px;height:90px;border-radius:70% 0 70% 0;background:#23633b;transform:rotate(20deg)}.plantOne{left:8%}.plantTwo{right:10%;transform:rotate(-18deg)}.propertyArtCaption{position:absolute;bottom:14px;left:18px;color:#fff;font-weight:850;text-shadow:0 2px 5px #17321f}
        .propertySection{margin-top:34px}.propertySectionHead{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:0 0 16px}.propertySectionHead h2{margin:5px 0 0;font-size:26px;letter-spacing:-.6px}.propertySectionHead p{color:var(--muted);font-size:13px;margin:0}.propertyCategoryGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px}.propertyCategory{display:flex;flex-direction:column;align-items:flex-start;gap:9px;text-align:left;padding:19px 16px;border:1px solid #e7e0f0;background:#fff;border-radius:17px;box-shadow:0 4px 13px #30205008;cursor:pointer;min-height:150px}.propertyCategory:hover,.propertyCategory.active{border-color:#a78bfa;background:#faf7ff;transform:translateY(-2px)}.propertyCategoryIcon{font-size:27px}.propertyCategory strong{font-size:15px}.propertyCategory small{color:var(--muted);font-size:12px;line-height:1.45}
        .propertySearch{display:grid;grid-template-columns:2fr 1fr 1.1fr 1.3fr auto;gap:10px;padding:13px;background:#eee8fb;border-radius:17px;margin-top:24px}.propertySearch label{display:flex;align-items:center;min-width:0;background:#fff;border:1px solid #ded4ef;border-radius:11px;padding:0 10px}.propertySearch label span:not(.srOnly){font-size:22px;color:#6d28d9}.propertySearch input,.propertySearch select{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:12px 4px;color:#352d43;font-size:13px}.propertySearch>button{border:0;border-radius:11px;background:#6d28d9;color:#fff;font-weight:850;padding:0 17px;cursor:pointer}.srOnly{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
        .propertyNoBroker{font-size:12px;color:#4b7d56;background:#edf9ef;padding:8px 12px;border-radius:20px;font-weight:800}.propertyEmpty{border:1px dashed #cfc0e8;border-radius:20px;padding:35px 20px;text-align:center;background:linear-gradient(135deg,#fff,#faf7ff)}.propertyEmptyIcon{display:grid;place-items:center;margin:0 auto 12px;width:54px;height:54px;border-radius:17px;background:#eee6ff;color:#6d28d9;font-size:30px}.propertyEmpty h3{margin:8px 0;font-size:21px}.propertyEmpty p{max-width:570px;margin:0 auto 18px;color:var(--muted);line-height:1.6;font-size:14px}.propertyOwnerPanel{margin-top:30px;padding:24px;border:1px solid #ded1f4;border-radius:20px;background:#fff;box-shadow:0 12px 35px #4422780d}.propertyClose{border:0;background:#f2ebfb;border-radius:10px;font-size:24px;width:40px;height:40px;cursor:pointer;color:#6d28d9}.propertyOwnerPanel>p{color:var(--muted);font-size:14px}.propertyOwnerForm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.propertyOwnerForm label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:800;color:#4a405b}.propertyOwnerForm input,.propertyOwnerForm select{width:100%;border:1px solid #e2d8ee;border-radius:10px;padding:12px;background:#fff;color:#2a2335;font:inherit;font-weight:500}.propertyOwnerFormFoot{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:6px}.propertyOwnerFormFoot small{max-width:620px;line-height:1.5;color:var(--muted)}.propertyNotice{margin-top:20px;border:1px solid #cbb7ff;background:#f8f4ff;border-radius:14px;padding:15px 18px;color:#3c2b5c}.propertyNotice p{margin:6px 0 0;line-height:1.5;font-size:14px}.propertyFooter{display:flex;align-items:center;justify-content:space-between;gap:15px;border-top:1px solid #e8e0f1;margin-top:40px;padding-top:22px;color:var(--muted);font-size:13px}.propertyFooter strong{color:#29203a}.propertyFooter a{color:var(--purple);font-weight:800;text-decoration:none}
        @media(max-width:900px){.propertyTopbar{height:auto;min-height:70px;flex-wrap:wrap;padding:12px 0}.propertyTopbar nav{order:3;width:100%;justify-content:center;flex-wrap:wrap;gap:16px}.propertyHero{grid-template-columns:1fr}.propertyHeroArt{min-height:250px}.propertyCategoryGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.propertySearch{grid-template-columns:1fr 1fr}.propertySearchText{grid-column:1/-1}.propertySearch>button{min-height:44px}.propertyOwnerForm{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.propertyPage{padding:0 13px 28px}.propertyBrand strong{font-size:18px}.propertyLocale{display:none}.propertyHeroCopy{padding:25px 19px}.propertyHero h1{font-size:36px;letter-spacing:-1.4px}.propertyHero .propertyLead{font-size:16px}.propertyActions{flex-direction:column;align-items:stretch}.propertyTrust{gap:8px;flex-direction:column}.propertyCategoryGrid{grid-template-columns:1fr 1fr;gap:8px}.propertyCategory{padding:14px 11px;min-height:142px}.propertySectionHead{align-items:flex-start;flex-direction:column}.propertySearch{grid-template-columns:1fr}.propertySearchText{grid-column:auto}.propertyOwnerForm{grid-template-columns:1fr}.propertyOwnerFormFoot{grid-column:auto;align-items:stretch;flex-direction:column}.propertyFooter{align-items:flex-start;flex-direction:column}}
      `}</style>
    </main>
  );
}
