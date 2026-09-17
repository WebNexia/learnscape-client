export interface Payment {
	_id: string;
	firstName: string;
	lastName: string;
	paymentId: string;
	invoiceNumber?: string;
	amount: number;
	currency: string;
	amountReceivedInGbp: number;
	status: string;
	orgId: string;
	userId: string;
	username: string;
	courseId: string;
	courseTitle: string;
	documentId: string;
	documentName: string;
	consultationId?: string;
	consultationTitle?: string;
	clubId?: string;
	clubTitle?: string;
	paymentType: string;
	email: string;
	transactionDetails?: TransactionDetails;
	isRefunded?: boolean;
	refundId?: string;
	createdAt: string;
	updatedAt: string;
	ownerIncome?: number; // Owner's commission income
	superAdminIncome?: number; // Super-admin's share income
	commissionRate?: number; // Commission rate (0.15 for 15%)
	commissionType?: string; // 'percentage' or 'fixed'
	/** Stripe test-mode payment (livemode false). Only these can be hard-deleted. */
	isTestPayment?: boolean;
	/** Server-computed: safe to hard-delete (test payment / local sk_test_ legacy). */
	canDelete?: boolean;
}

interface TransactionDetails {
	paymentGateway?: string;
	transactionId?: string;
	status?: string;
	amount?: number;
	currency?: string;
}
