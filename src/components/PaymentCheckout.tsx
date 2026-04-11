'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, AlertCircle } from 'lucide-react';

export interface PaymentOption {
  id: string;
  name: string;
  amount: number;
  currency: string;
  provider: 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE' | 'PAYPAL' | 'SOFORT' | 'CRYPTO';
  description: string;
  features?: string[];
}

export interface PaymentCheckoutProps {
  options: PaymentOption[];
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export const PaymentCheckout = ({ options, onSuccess, onError }: PaymentCheckoutProps) => {
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(options[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePayment = async () => {
    if (!selectedOption) {
      setError('Please select a payment option');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create payment
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          amount: selectedOption.amount,
          currency: selectedOption.currency,
          provider: selectedOption.provider,
          description: selectedOption.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment creation failed');
      }

      const data = await response.json();
      const paymentId = data.id;

      // Handle provider-specific flows
      switch (selectedOption.provider) {
        case 'STRIPE':
          // Redirect to Stripe checkout or show embedded form
          if (data.clientSecret) {
            // Use Stripe client secret for payment
            window.location.href = data.redirectUrl || `/payments/stripe/${paymentId}`;
          }
          break;

        case 'PAYSTACK':
          // Redirect to Paystack
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
          break;

        case 'FLUTTERWAVE':
          // Show Flutterwave payment modal or redirect
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
          break;

        case 'PAYPAL':
          // Redirect to PayPal
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
          break;

        case 'SOFORT':
        case 'CRYPTO':
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
          break;
      }

      onSuccess?.(paymentId);
      setSuccessMessage('Payment processing started...');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Payment Options */}
      <div className="grid gap-4 mb-8">
        {options.map((option) => (
          <motion.div
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOption(option)}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedOption?.id === option.id
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-black/10 dark:border-white/10 hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{option.name}</h3>
                <p className="text-sm text-black/60 dark:text-white/60">{option.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {option.amount.toFixed(2)} {option.currency.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Features */}
            {option.features && option.features.length > 0 && (
              <div className="space-y-2">
                {option.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selection Indicator */}
            {selectedOption?.id === option.id && (
              <motion.div
                layoutId="selection-indicator"
                className="absolute top-4 right-4"
              >
                <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-lg bg-red-100/10 border border-red-500/50 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-600 dark:text-red-400">Payment Error</p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-lg bg-green-100/10 border border-green-500/50 flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-green-500" />
          <p className="font-medium text-green-600 dark:text-green-400">{successMessage}</p>
        </motion.div>
      )}

      {/* Payment Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePayment}
        disabled={isProcessing || !selectedOption}
        className="w-full px-6 py-3 font-semibold text-white text-center transition-all rounded-lg bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay ${selectedOption?.currency.toUpperCase()} ${selectedOption?.amount.toFixed(2)}`}
      </motion.button>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10">
        <p className="text-sm text-black/60 dark:text-white/60 mb-4 text-center">
          Available payment methods
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-center">
          <div className="p-2 rounded border border-black/10 dark:border-white/10">Stripe</div>
          <div className="p-2 rounded border border-black/10 dark:border-white/10">Paystack</div>
          <div className="p-2 rounded border border-black/10 dark:border-white/10">Flutterwave</div>
          <div className="p-2 rounded border border-black/10 dark:border-white/10">PayPal</div>
          <div className="p-2 rounded border border-black/10 dark:border-white/10">Sofort</div>
          <div className="p-2 rounded border border-black/10 dark:border-white/10">Crypto</div>
        </div>
      </div>
    </div>
  );
};
