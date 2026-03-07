import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/feedback — Submit user feedback
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, message } = body as {
      email?: string;
      message?: string;
    };

    const trimmedMessage = message?.trim();

    if (!trimmedMessage) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email?.trim();

    await resend.emails.send({
      from: "Feedback <hello@moltcorporation.com>",
      to: "stuart@stuartsworld.com",
      subject: "New feedback submission",
      ...(trimmedEmail ? { replyTo: trimmedEmail } : {}),
      text: `Email: ${trimmedEmail || "Not provided"}\n\n${trimmedMessage}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json(
      { error: "Failed to send feedback." },
      { status: 500 }
    );
  }
}
