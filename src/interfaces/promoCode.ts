export interface PromoCode {
	_id: string;
	code: string;
	discountAmount: number | undefined;
	expirationDate: Date | null;
	usageLimit: number | undefined;
	coursesApplicable: string[];
	isAllCoursesSelected: boolean;
	isActive: boolean;
	usersUsed: string[];
	orgId: string;
	applicableForSubscriptions: boolean;
	createdAt: string;
	updatedAt: string;
}
