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
	isActive: boolean;
	eventLinkUrl: string;
	isAllDay: boolean;
	coursesIds: string[];
	allAttendeesIds: string[];
	isAllLearnersSelected: boolean;
	isAllCoursesSelected: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AttendeeInfo {
	_id: string;
	firebaseUserId: string;
	username: string;
}
