export interface Event {
	_id: string;
	title: string;
	description: string;
	orgId: string;
	courseId?: string;
	learnerId?: string;
	learnerUsername?: string;
	courseTitle?: string;
	start: Date | null;
	end: Date | null;
	location: string;
	createdBy: string;
	isActive: boolean;
	eventLinkUrl: string;
	username: string;
	isAllDay: boolean;
	createdAt: string;
	updatedAt: string;
}
