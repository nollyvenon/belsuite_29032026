import { Navbar } from '@/src/components/Navbar';
import { Hero } from '@/src/components/Hero';
import { SocialProof } from '@/src/components/SocialProof';
import { ProblemSolution } from '@/src/components/ProblemSolution';
import { Features } from '@/src/components/Features';
import { HowItWorks } from '@/src/components/HowItWorks';
import { Pricing } from '@/src/components/Pricing';
import { FinalCTA } from '@/src/components/FinalCTA';
import { Footer } from '@/src/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-primary selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
