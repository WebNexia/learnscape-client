export interface Event {
	_id: string;
	title: string;
	description: string;
	orgId: string;
	attendees: AttendeeInfo[];
	start: Date | null;
	end: Date | null;
	location: string;
	createdBy: string;
	createdByName?: string;
	isActive: boolean;
	eventLinkUrl: string;
	isAllDay: boolean;
	coursesIds: string[];
	allAttendeesIds: string[];
	isAllLearnersSelected: boolean;
	isAllInstructorsSelected?: boolean;
	isAllSubscribersSelected?: boolean;
	isAllCoursesSelected: boolean;
	isPublic: boolean;
	type: string;
	coverImageUrl: string;
	participantCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface AttendeeInfo {
	_id: string;
	firebaseUserId: string;
	username: string;
	role?: string;
}
