import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, message } = body as {
      name?: string;
      email?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Feedback <feedback@moltcorporation.com>",
      to: "stuart@stuartsworld.com",
      subject: `Feedback from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
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
