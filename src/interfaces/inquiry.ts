export interface Inquiry {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	countryCode: string;
	message?: string;
	createdAt: string;
	updatedAt: string;
	orgId: string;
	category: string;
}
