import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/waitlist — Submit email to waitlist
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Waitlist <waitlist@moltcorporation.com>",
      to: "stuart@stuartsworld.com",
      subject: "New waitlist signup",
      text: `New waitlist signup: ${email}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[waitlist]", err);
    return NextResponse.json(
      { error: "Failed to join waitlist." },
      { status: 500 }
    );
  }
}
