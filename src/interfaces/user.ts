export interface User {
	_id: string;
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	phone: string;
	firebaseUserId: string;
	role: string;
	orgId: string;
	imageUrl: string;
	isActive: boolean;
	hasRegisteredCourse: boolean;
	createdAt: string;
	updatedAt: string;
	countryCode: string;
	isEmailVerified: boolean;
	zoomHostUser?: string;
	// Subscription fields
	isSubscribed: boolean;
	subscriptionType: 'monthly' | 'yearly' | null;
	subscriptionExpiry: string | null;
	subscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled' | 'canceled_at_period_end' | 'trialing';
	subscriptionValidUntil: string | null;
	accessLevel: 'limited' | 'subscription' | 'full';
}

export interface AdminUser {
	_id: string;
	username: string;
	firebaseUserId: string;
	role: string;
}
