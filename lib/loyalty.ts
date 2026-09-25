const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yjwgnapymqetxvksqacd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Y3n5bVO3xveBnyt4LKbCPg_f5ilMSuz";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://loyalty.gbkai.com";

const authHeaders = (accessToken?: string) => ({
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

export type LoyaltySession = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
};


const BSC_CHAIN_ID = "0x38";
const BSC_RPC = "https://bsc-dataseed.bnbchain.org";
const BSC_EXPLORER = "https://bscscan.com";
const WALLETCONNECT_PROJECT_ID = "19d21bb0657b8a691c0ea8f4976ce26e";

async function switchToBsc(provider: any) {
  const current = await provider.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === BSC_CHAIN_ID) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_CHAIN_ID }] });
  } catch (e: any) {
    if (e?.code === 4902 || /unrecognized|not added|unknown chain/i.test(String(e?.message || ""))) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BSC_CHAIN_ID,
          chainName: "BNB Smart Chain",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [BSC_RPC],
          blockExplorerUrls: [BSC_EXPLORER],
        }],
      });
    } else throw e;
  }
}

export async function connectEvmWallet(): Promise<string> {
  if (typeof window === "undefined") throw new Error("Wallet connection is available in the browser only.");
  const w = window as any;
  const candidates: any[] = [];
  const add = (p: any) => { if (p && !candidates.includes(p)) candidates.push(p); };
  if (Array.isArray(w.ethereum?.providers)) w.ethereum.providers.forEach(add);
  add(w.ethereum);

  let lastError: any = null;
  for (const provider of candidates) {
    try {
      let accounts = await provider.request({ method: "eth_accounts" });
      if (!accounts?.length) accounts = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) continue;
      await switchToBsc(provider);
      return String(accounts[0]);
    } catch (e) {
      lastError = e;
    }
  }

  try {
    const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
    const mod = await dynamicImport("https://esm.sh/@walletconnect/ethereum-provider");
    const EthereumProvider = mod.default || mod.EthereumProvider;
    if (!EthereumProvider) throw new Error("Wallet selector unavailable.");
    const provider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [56],
      optionalChains: [56],
      showQrModal: true,
      qrModalOptions: { enableMobileFullScreen: true },
      metadata: {
        name: "GBK AI Loyalty",
        description: "GBK AI Loyalty on BNB Smart Chain",
        url: "https://loyalty.gbkai.com",
        icons: ["https://loyalty.gbkai.com/favicon.svg"],
      },
    });
    if (!(provider as any).session) await provider.connect();
    const accounts = await provider.request({ method: "eth_accounts" });
    if (!accounts?.length) throw new Error("Wallet connection was not completed.");
    await switchToBsc(provider);
    return String(accounts[0]);
  } catch (e: any) {
    throw e || lastError || new Error("Wallet connection failed.");
  }
}

export async function signInAnonymously(): Promise<LoyaltySession> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.msg || data.error_description || data.error || "Wallet account creation failed");
  if (!data.access_token) throw new Error("Anonymous wallet sign-in is not enabled in Supabase.");
  localStorage.setItem("gbk_loyalty_session", JSON.stringify(data));
  return data;
}

export async function signIn(email: string, password: string): Promise<LoyaltySession> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
  localStorage.setItem("gbk_loyalty_session", JSON.stringify(data));
  return data;
}

export async function signUp(email: string, password: string, fullName: string): Promise<LoyaltySession | null> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName },
      gotrue_meta_security: {},
      redirect_to: `${SITE_URL}/`,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.msg || data.error_description || data.error || "Sign up failed");
  if (data.access_token) {
    localStorage.setItem("gbk_loyalty_session", JSON.stringify(data));
    return data;
  }
  return null;
}

export async function resendConfirmation(email: string): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      type: "signup",
      email,
      redirect_to: `${SITE_URL}/`,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.msg || data.error_description || data.error || "Unable to resend confirmation email");
}

export function getStoredSession(): LoyaltySession | null {
  try { return JSON.parse(localStorage.getItem("gbk_loyalty_session") || "null"); } catch { return null; }
}

export function signOut() { localStorage.removeItem("gbk_loyalty_session"); }

async function refreshStoredSession(session: LoyaltySession): Promise<LoyaltySession> {
  if (!session.refresh_token) throw new Error("Session expired. Please reconnect your wallet.");
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) throw new Error(data.error_description || data.msg || "Session expired. Please reconnect your wallet.");
  localStorage.setItem("gbk_loyalty_session", JSON.stringify(data));
  return data;
}

export async function loyaltyApi(session: LoyaltySession, action: string, payload: Record<string, unknown> = {}) {
  let activeSession = session;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/loyalty-api`, {
      method: "POST",
      headers: authHeaders(activeSession.access_token),
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return data;
    if (r.status === 401 && attempt === 0) {
      activeSession = await refreshStoredSession(activeSession);
      continue;
    }
    throw new Error(data.error || "GBK Loyalty request failed");
  }
  throw new Error("GBK Loyalty request failed");
}
