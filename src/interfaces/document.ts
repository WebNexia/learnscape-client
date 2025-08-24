export interface Price {
	currency: string;
	amount: string;
}

export interface Document {
	_id: string;
	name: string;
	orgId: string;
	userId: string;
	documentUrl: string;
	imageUrl: string;
	prices: Price[];
	description: string;
	createdAt: string;
	updatedAt: string;
	clonedFromId: string;
	clonedFromTitle: string;
	usedInLessons: string[];
	usedInCourses: string[];
	samplePageImageUrl: string;
	isOnLandingPage: boolean;
	isArchived: boolean;
	createdBy: string;
	updatedBy: string;
	createdByName: string;
	updatedByName: string;
	createdByImageUrl: string;
	updatedByImageUrl: string;
	createdByRole: string;
	updatedByRole: string;
	pageCount: number;
}
