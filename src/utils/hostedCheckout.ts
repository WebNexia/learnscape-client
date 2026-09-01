export const CHECKOUT_RETURN_STORAGE_KEY = 'learnscape.checkoutReturn';
export const PENDING_CART_CHECKOUT_KEY = 'learnscape.pendingCartCheckout';

export type CourseCheckoutReturnContext = {
	kind: 'course';
	source: 'landing' | 'app';
	courseId: string;
	courseTitle?: string;
	fromHomePage?: boolean;
};

export type CartCheckoutReturnContext = {
	kind: 'cart';
	sessionId?: string;
	appointmentIds: string[];
	formLinks: Array<{ formSubmissionId?: string; appointmentId?: string }>;
	firstName: string;
	lastName: string;
	email: string;
	agreeMarketing: boolean;
	orgId?: string;
};

export type CheckoutReturnContext = CourseCheckoutReturnContext | CartCheckoutReturnContext;

export function saveCheckoutReturnContext(context: CheckoutReturnContext): void {
	try {
		sessionStorage.setItem(CHECKOUT_RETURN_STORAGE_KEY, JSON.stringify(context));
	} catch {
		// ignore quota / private mode
	}
}

export function readCheckoutReturnContext(): CheckoutReturnContext | null {
	try {
		const raw = sessionStorage.getItem(CHECKOUT_RETURN_STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as CheckoutReturnContext;
	} catch {
		return null;
	}
}

export function clearCheckoutReturnContext(): void {
	try {
		sessionStorage.removeItem(CHECKOUT_RETURN_STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function savePendingCartCheckout(context: CartCheckoutReturnContext): void {
	try {
		localStorage.setItem(PENDING_CART_CHECKOUT_KEY, JSON.stringify(context));
	} catch {
		// ignore
	}
}

export function readPendingCartCheckout(): CartCheckoutReturnContext | null {
	try {
		const raw = localStorage.getItem(PENDING_CART_CHECKOUT_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as CartCheckoutReturnContext;
	} catch {
		return null;
	}
}

export function clearPendingCartCheckout(): void {
	try {
		localStorage.removeItem(PENDING_CART_CHECKOUT_KEY);
	} catch {
		// ignore
	}
}

export function redirectToHostedCheckout(url: string): void {
	window.location.href = url;
}
