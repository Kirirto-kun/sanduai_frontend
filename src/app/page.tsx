export default function Home() {
  return (
    <main className="min-h-screen pb-10 pt-6">
      <div className="mx-auto max-w-5xl">
        {/* Hero + язык */}
        {/* @ts-expect-error Server Component importing client components is allowed in Next app router */}
        <LandingPage />
      </div>
    </main>
  );
}

import { HeroSection } from "./components/landing/HeroSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { LibrarySection } from "./components/landing/LibrarySection";
import { MediaSection } from "./components/landing/MediaSection";
import { BenefitsSection } from "./components/landing/BenefitsSection";
import { FooterSection } from "./components/landing/FooterSection";

function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <LibrarySection />
      <MediaSection />
      <BenefitsSection />
      <FooterSection />
    </>
  );
}

