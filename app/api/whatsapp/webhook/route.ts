import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // Keep webhook handling safe and non-blocking. Delivery/read events can be
    // persisted to Supabase in a later step without exposing the Cloud API token.
    console.log("WhatsApp Cloud API webhook", JSON.stringify(payload));
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
