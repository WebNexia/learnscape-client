import React, { ReactNode, useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Box, CircularProgress } from '@mui/material';

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

	// Show loading indicator while Stripe.js initializes
	if (isLoading || !stripePromise) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: 120,
					py: 3,
				}}
				aria-busy='true'
				aria-label='Loading payment form'>
				<CircularProgress size={32} />
			</Box>
		);
	}

	// Use a stable key to prevent re-renders
	return (
		<Elements key='stripe-elements' stripe={stripePromise}>
			{children}
		</Elements>
	);
};

export default ConditionalStripeProvider;
