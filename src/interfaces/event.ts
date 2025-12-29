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
	// Zoom fields
	zoomMeetingId?: string;
	zoomMeetingPassword?: string;
	zoomMeetingNumber?: string;
	zoomJoinUrl?: string;
	isZoomMeeting?: boolean; // Frontend-only: checkbox state
	// Zoom recordings
	hasRecordings?: boolean; // Frontend-only: indicates if recordings exist
	// YouTube recording
	youtubeVideoId?: string; // YouTube video ID if recording was uploaded to YouTube
}

export interface AttendeeInfo {
	_id: string;
	firebaseUserId: string;
	username: string;
	role?: string;
}
