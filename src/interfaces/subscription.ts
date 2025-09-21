export interface SubscriptionPlan {
	type: 'monthly' | 'yearly';
	prices: SubscriptionPrice[];
	userCurrency: string;
	userPrice: SubscriptionPrice;
	savings?: {
		amount: number;
		percentage: number;
		currency: string;
	};
}

export interface SubscriptionPrice {
	currency: string;
	amount: number;
}

export interface SubscriptionPlans {
	monthly: SubscriptionPlan;
	yearly: SubscriptionPlan;
}

export interface UserSubscription {
	_id: string;
	userId:
		| string
		| {
				_id: string;
				firstName?: string;
				lastName?: string;
				email?: string;
				username?: string;
		  };
	orgId: string;

	prices: SubscriptionPrice[];
	subscriptionType: 'monthly' | 'yearly';
	currentCurrency: string;
	currentAmount: number;
	stripeSubscriptionId: string;
	stripePriceId?: string;
	stripeCustomerId?: string;
	status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'trialing';
	currentPeriodStart: string;
	currentPeriodEnd: string;
	nextBillingDate?: string;
	accessType: 'platform';
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface SubscriptionBenefits {
	title: string;
	description: string;
	features: string[];
	icon: string;
}

export interface SubscriptionFormData {
	subscriptionType: 'monthly' | 'yearly';
	promoCode: string;
	email: string;
	firstName: string;
	lastName: string;
	agreed: boolean;
}

export interface SubscriptionResponse {
	status: number;
	message: string;
	data: {
		clientSecret: string;
		stripeSubscriptionId: string;
		isReactivation: boolean;
		isStripeConnect: boolean;
	};
}

export interface PromoCodeResponse {
	discountAmount: number;
	usersUsed: string[];
	_id: string;
}
