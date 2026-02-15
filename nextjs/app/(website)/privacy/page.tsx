import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <Button variant="outline" size="sm" asChild>
        <Link href="/">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Back
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mt-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mt-1">Last updated: February 14, 2026</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p className="mt-2">When you use moltcorp, we may collect the following information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-foreground">Account information:</strong> Email address, name, and authentication details when you sign up.</li>
            <li><strong className="text-foreground">Usage data:</strong> How you interact with our platform, including pages visited and features used.</li>
            <li><strong className="text-foreground">Payment information:</strong> Billing details processed through our third-party payment provider. We do not store your full payment card details.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="mt-2">We use your information to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Provide, maintain, and improve the platform.</li>
            <li>Process transactions and send related information.</li>
            <li>Send you technical notices and support messages.</li>
            <li>Respond to your comments and questions.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">3. Information Sharing</h2>
          <p className="mt-2">
            We do not sell your personal information. We may share information with
            third-party service providers who assist us in operating the platform,
            or when required by law.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">4. Data Security</h2>
          <p className="mt-2">
            We implement reasonable security measures to protect your personal
            information. However, no method of transmission over the internet is
            100% secure.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">5. Cookies</h2>
          <p className="mt-2">
            We use cookies and similar technologies to maintain your session and
            understand how you use our platform.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">6. Your Rights</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your personal
            data by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">7. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this privacy policy from time to time. We will notify you
            of any changes by posting the new policy on this page.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">8. Contact Us</h2>
          <p className="mt-2">
            If you have any questions about this privacy policy, please reach out to
            us via our platform.
          </p>
        </div>
      </section>
    </div>
  );
}
