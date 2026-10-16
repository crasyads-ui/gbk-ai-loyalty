"use client";

import { useMemo, useState } from "react";

const countries = [
  { name: "India", status: "Legal review required", currency: "INR", notes: [
    "Show the seller's legal/business identity, contact details, full price, delivery or service terms, cancellation/refund policy and complaint contact before checkout.",
    "Explain what GBK rewards are, when they are earned, any limits or fees, and that rewards are not a guaranteed cash return or investment profit.",
    "Use only payment methods supported by the merchant and applicable local rules. Do not mark a UPI payment as paid or release rewards based only on a screenshot or customer-entered UTR.",
    "Review applicable e-commerce, consumer protection, privacy/data protection, tax, advertising and payment rules before enabling paid transactions."
  ]},
  { name: "United Arab Emirates", status: "Legal review required", currency: "AED", notes: [
    "Display the seller's identity, total price and applicable fees, delivery/service terms, refunds and a complaint route.",
    "Review UAE consumer protection, privacy, e-commerce, tax, advertising and payment-services requirements for the specific business model.",
    "Do not offer token exchange, custody, investment or other regulated virtual-asset/payment activity unless the required permissions and provider arrangements are confirmed."
  ]},
  { name: "Thailand", status: "Legal review required", currency: "THB", notes: [
    "Display seller identity, total price, delivery/service conditions, cancellation/refund terms and customer support details.",
    "Review Thai consumer protection, personal-data protection, e-commerce, tax, advertising and payment/virtual-asset requirements before activation.",
    "Do not imply GBK rewards are government-backed, guaranteed in value, or redeemable for cash unless that feature is lawful and actually supported."
  ]},
  { name: "Other countries", status: "Country addendum required", currency: "Local currency", notes: [
    "Before activating a country, identify applicable consumer, privacy, e-commerce, tax, advertising, payments, sanctions and virtual-asset rules.",
    "Publish a country addendum and provide local complaint, refund and seller-disclosure information as required.",
    "Keep the country disabled for checkout or rewards if required legal review, payment support or operational controls are missing."
  ]}
];

export default function LegalPage() {
  const [country, setCountry] = useState("India");
  const [accepted, setAccepted] = useState(false);
  const selected = useMemo(() => countries.find(c => c.name === country) || countries[0], [country]);

  return (
    <main style={{maxWidth: 900, margin: "0 auto", padding: "24px 18px 56px", color: "#172033", fontFamily: "Arial, sans-serif", lineHeight: 1.6}}>
      <a href="/" style={{color:"#1769aa"}}>← Back to GBK Loyalty</a>
      <h1 style={{fontSize:32, lineHeight:1.2, marginTop:24}}>GBKAI Global — Legal Terms</h1>
      <p>Country-specific terms for customers, merchants and platform participants. Choose the country relevant to the transaction to see the additional review checklist.</p>
      <div style={{padding:16, border:"1px solid #e2a23a", borderRadius:12, background:"#fff9e9", margin:"18px 0"}}>
        <strong>Important: draft for legal review</strong>
        <p style={{marginBottom:0}}>This page is a product and compliance checklist, not a legal opinion or a declaration that GBKAI is authorized to operate in every country. Country-specific terms must be reviewed and approved by qualified local counsel before the country is enabled for transactions or rewards.</p>
      </div>

      <label htmlFor="country" style={{display:"block", fontWeight:700, marginBottom:8}}>Select country</label>
      <select id="country" value={country} onChange={e => {setCountry(e.target.value); setAccepted(false);}} style={{width:"100%", padding:12, border:"1px solid #b8c2cf", borderRadius:8, background:"white", fontSize:16}}>
        {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
      <section style={{border:"1px solid #d8dee8", borderRadius:12, padding:18, marginTop:16}}>
        <div style={{display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap"}}>
          <h2 style={{fontSize:22, margin:0}}>{selected.name} addendum</h2>
          <span style={{fontSize:13, fontWeight:700, padding:"4px 9px", borderRadius:20, background:"#fff0d6", color:"#7b4b00"}}>{selected.status}</span>
        </div>
        <p><strong>Display currency:</strong> {selected.currency}. The displayed currency is informational; actual payment and conversion depend on the merchant and supported payment provider.</p>
        <h3>Before country activation</h3>
        <ul>{selected.notes.map(note => <li key={note} style={{marginBottom:8}}>{note}</li>)}</ul>
      </section>

      <h2 style={{fontSize:22, marginTop:28}}>Core platform terms — draft</h2>
      <ol>
        <li><strong>Platform role.</strong> GBKAI helps users discover products and services and connect with merchants. Unless expressly stated in a separate signed agreement, the seller is responsible for its goods/services, descriptions, fulfillment, warranties and applicable taxes.</li>
        <li><strong>Accurate listings.</strong> Merchants must provide accurate identity, contact, price, availability, delivery/service, refund and other legally required information. Prohibited or unlawful offers must not be listed.</li>
        <li><strong>Payments.</strong> Payment methods vary by country and merchant. An order is not confirmed as paid until a trusted payment confirmation or approved verification process succeeds. A QR scan, screenshot, redirect, or customer-entered reference number alone is not proof of payment.</li>
        <li><strong>GBK rewards.</strong> Rewards are conditional promotional benefits subject to the displayed offer, eligibility rules, available balance, fraud checks and successful verification/settlement. Reward percentages, token value, availability and transferability are not guaranteed. Rewards are not a promise of investment return.</li>
        <li><strong>Wallet and blockchain.</strong> Users are responsible for their wallet, private keys, network selection and transaction review. Blockchain transactions may be irreversible and network fees may apply. GBKAI must not claim custody or control of a user's wallet unless the actual service and legal documents expressly say so.</li>
        <li><strong>Privacy.</strong> Collect only data needed for the stated service, explain the purposes and retention, secure it, and obtain any consent required by applicable law. A separate privacy notice and country-specific data-transfer review are required before launch.</li>
        <li><strong>Complaints and refunds.</strong> Provide a visible support contact and order reference. Merchant refunds, platform complaints and reward reversals must be handled under the applicable transaction terms and mandatory local law. These terms do not remove non-waivable consumer rights.</li>
        <li><strong>Changes and availability.</strong> Features, merchants, payment options and rewards may vary by country. The platform may suspend suspicious or unsupported transactions for security, compliance or technical reasons, while preserving rights required by law.</li>
      </ol>

      <h2 style={{fontSize:22, marginTop:28}}>Acceptance</h2>
      <label style={{display:"flex", gap:10, alignItems:"flex-start", padding:12, border:"1px solid #d8dee8", borderRadius:10}}>
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{marginTop:6, width:18, height:18}} />
        <span>I have read this draft for {selected.name}. I understand that the country-specific terms require legal review and that this checkbox alone does not certify compliance or activate a country.</span>
      </label>
      <p style={{fontSize:13, color:"#596579", marginTop:16}}>Version: draft 1.0 · Last updated: 16 October 2026 · This page is a starting point for legal review. Add the platform operator's legal name, registered address, support/grievance contact, governing-law details and final country-specific clauses before production acceptance.</p>
      <a href="/" style={{display:"inline-block", marginTop:12, padding:"10px 16px", borderRadius:8, background:"#172033", color:"white", textDecoration:"none"}}>Return to GBK Loyalty</a>
    </main>
  );
}
