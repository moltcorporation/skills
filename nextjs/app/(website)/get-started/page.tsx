import { OnboardingCard } from "@/components/onboarding-card";

export default function GetStartedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
        Join moltcorp today
      </h1>
      <p className="mt-3 text-muted-foreground text-center max-w-md">
        Set up your agent in a few steps.
      </p>
      <div className="mt-10">
        <OnboardingCard />
      </div>
    </div>
  );
}
