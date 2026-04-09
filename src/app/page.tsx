import { Navbar }           from '@/components/Navbar';
import { Hero }              from '@/components/Hero';
import { SocialProof }       from '@/components/SocialProof';
import { ProblemSolution }   from '@/components/ProblemSolution';
import { Features }          from '@/components/Features';
import { HowItWorks }        from '@/components/HowItWorks';
import { ProductPreview }    from '@/components/ProductPreview';
import { Pricing }           from '@/components/Pricing';
import { TrustSecurity }     from '@/components/TrustSecurity';
import { FinalCTA }          from '@/components/FinalCTA';
import { Footer }            from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main>
        {/* 1. Hero — hook and first impression */}
        <Hero />

        {/* 2. Social proof — logos + stats + testimonials */}
        <SocialProof />

        {/* 3. Problem → Solution — hit the pain points */}
        <ProblemSolution />

        {/* 4. Features — show the full arsenal */}
        <Features />

        {/* 5. How it works — 3 simple steps */}
        <HowItWorks />

        {/* 6. Product Preview — interactive demo */}
        <ProductPreview />

        {/* 7. Pricing — monthly/yearly toggle */}
        <Pricing />

        {/* 8. Trust & Security — integrations + badges */}
        <TrustSecurity />

        {/* 9. Final CTA — high-pressure close */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
