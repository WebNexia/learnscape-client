export interface PromoCode {
	_id: string;
	code: string;
	discountType: string;
	discountAmount: number | undefined;
	expirationDate: Date | null;
	usageLimit: number | undefined;
	coursesApplicable: string[];
	isAllCoursesSelected: boolean;
	isActive: boolean;
	usersUsed: string[];
	orgId: string;
	createdAt: string;
	updatedAt: string;
}
