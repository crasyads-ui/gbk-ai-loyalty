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

export async function signInAnonymously(): Promise<LoyaltySession> {
  const r = await fetch(\`${SUPABASE_URL}/auth/v1/signup\`, {
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

export async function loyaltyApi(session: LoyaltySession, action: string, payload: Record<string, unknown> = {}) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/loyalty-api`, {
    method: "POST",
    headers: authHeaders(session.access_token),
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "GBK Loyalty request failed");
  return data;
}
