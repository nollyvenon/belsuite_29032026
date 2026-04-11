'use client';

import Link from 'next/link';

const QUESTIONS = [
  {
    q: 'How long does setup take?',
    a: 'Under 2 minutes. Connect your email, add your first lead, and Belsuite handles the rest.',
  },
  {
    q: 'Can I integrate with my existing tools?',
    a: 'Yes. Belsuite supports Slack, Zapier, webhooks, email, SMS, Stripe, and more.',
  },
  {
    q: 'Do you offer a money-back guarantee?',
    a: 'Yes. Start with the free trial and evaluate the platform before committing.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. The app uses workspace isolation, authenticated APIs, and production billing and integration flows.',
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-orange-600 mb-3">FAQ</p>
          <h1 className="text-4xl md:text-6xl font-black mb-4">Answers for teams evaluating Belsuite</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Short answers, clear expectations, and no clutter.</p>
        </div>

        <div className="space-y-4">
          {QUESTIONS.map((item) => (
            <div key={item.q} className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-orange-50/50 dark:bg-orange-900/10">
              <h2 className="text-xl font-bold mb-2">{item.q}</h2>
              <p className="text-gray-600 dark:text-gray-300">{item.a}</p>
            </div>
          ))}
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
