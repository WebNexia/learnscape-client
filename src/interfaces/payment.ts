export interface Payment {
	_id: string;
	firstName: string;
	lastName: string;
	paymentId: string;
	amount: number;
	currency: string;
	status: string;
	orgId: string;
	userId: string;
	username: string;
	courseId: string;
	courseTitle: string;
	transactionDetails?: TransactionDetails;
	isRefunded?: boolean;
	refundId?: string;
	createdAt: string;
	updatedAt: string;
}

interface TransactionDetails {
	paymentGateway?: string;
	transactionId?: string;
	status?: string;
	amount?: number;
	currency?: string;
}
