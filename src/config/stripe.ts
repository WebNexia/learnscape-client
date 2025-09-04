import { loadStripe } from '@stripe/stripe-js';

// Get the publishable key from environment variables
// In production, this should be set in your environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_test_key_here';

// Load Stripe instance
export const stripePromise = loadStripe(stripePublishableKey);

// Export the publishable key for reference
export const STRIPE_PUBLISHABLE_KEY = stripePublishableKey;
