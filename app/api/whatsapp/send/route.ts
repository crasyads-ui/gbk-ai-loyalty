import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { to, message, previewUrl = true } = await request.json();
    const recipient = String(to || "").replace(/\\D/g, "");
    const body = String(message || "").trim();

    if (!recipient || recipient.length < 8) {
      return NextResponse.json({ error: "Valid WhatsApp number is required." }, { status: 400 });
    }
    if (!body) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";

    if (!token || !phoneNumberId) {
      return NextResponse.json({
        error: "WhatsApp Cloud API is not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to the server environment."
      }, { status: 503 });
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { preview_url: Boolean(previewUrl), body }
        }),
        cache: "no-store"
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "WhatsApp Cloud API request failed.", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message_id: data?.messages?.[0]?.id || null,
      provider: "WHATSAPP_CLOUD_API"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "WhatsApp send failed." }, { status: 500 });
  }
}
