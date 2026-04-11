'use client';

import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-orange-600 mb-3">Contact Us</p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">Talk to the Belsuite team</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Reach out for product questions, enterprise pricing, integrations, or onboarding.
          </p>
        </div>

        <div className="grid gap-4">
          <a href="mailto:sales@belsuite.ai" className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-orange-50/50 dark:bg-orange-900/10">
            <div className="font-bold text-lg mb-1">Sales</div>
            <div className="text-gray-600 dark:text-gray-300">sales@belsuite.ai</div>
          </a>
          <a href="mailto:support@belsuite.ai" className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-orange-50/50 dark:bg-orange-900/10">
            <div className="font-bold text-lg mb-1">Support</div>
            <div className="text-gray-600 dark:text-gray-300">support@belsuite.ai</div>
          </a>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-orange-600 font-semibold hover:underline">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
