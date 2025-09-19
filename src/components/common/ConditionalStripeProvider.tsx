import React, { ReactNode, useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Singleton to prevent multiple Stripe instances
let stripePromiseInstance: any = null;
let stripeLoadPromise: Promise<any> | null = null;

interface ConditionalStripeProviderProps {
	children: ReactNode;
}

/**
 * Wraps children with Stripe Elements only when payment functionality is needed.
 * This prevents unnecessary Stripe loading on pages that don't need payments.
 */
const ConditionalStripeProvider: React.FC<ConditionalStripeProviderProps> = ({ children }) => {
	const [stripePromise, setStripePromise] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Only load Stripe when this component actually mounts
		const loadStripePromise = async () => {
			try {
				// Use singleton to prevent multiple instances
				if (!stripePromiseInstance && !stripeLoadPromise) {
					const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_test_key_here';

					// Create a single promise that all instances will wait for
					stripeLoadPromise = loadStripe(stripePublishableKey);
					stripePromiseInstance = await stripeLoadPromise;
				} else if (stripeLoadPromise) {
					// Wait for the existing load promise
					stripePromiseInstance = await stripeLoadPromise;
				}

				setStripePromise(stripePromiseInstance);
			} catch (error) {
				console.error('Failed to load Stripe:', error);
				stripeLoadPromise = null;
			} finally {
				setIsLoading(false);
			}
		};

		loadStripePromise();
	}, []);

	// Don't render Elements until Stripe is fully loaded and stable
	if (isLoading || !stripePromise) {
		return <div style={{ display: 'none' }}></div>;
	}

	// Use a stable key to prevent re-renders
	return (
		<Elements key='stripe-elements' stripe={stripePromise}>
			{children}
		</Elements>
	);
};

export default ConditionalStripeProvider;
