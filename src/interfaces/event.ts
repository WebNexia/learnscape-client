/** Month grid payload from GET ...?view=calendar — detail via GET /events/:id */
export interface CalendarGridEvent {
	_id: string;
	title: string;
	start: string;
	end: string;
	isAllDay: boolean;
	isPublic: boolean;
	createdBy: string;
}

/** API grid row after parsing dates for react-big-calendar */
export type CalendarDisplayEvent = Omit<CalendarGridEvent, 'start' | 'end'> & {
	start: Date;
	end: Date;
};

/** Grid rows omit description; detail responses (incl. learner lean) include it */
export function isEventDetailLoaded(event: CalendarGridEvent | CalendarDisplayEvent | Partial<Event> | null): event is Event {
	return !!event?._id && typeof (event as Event).description === 'string';
}

/** @deprecated Use isEventDetailLoaded — kept for any external imports */
export function isFullCalendarEvent(event: CalendarGridEvent | Event): event is Event {
	return isEventDetailLoaded(event);
}

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
	courseGroupNames?: {
		courseId: string;
		groupNames: string[];
	}[];
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
	zoomStartUrl?: string;
	isZoomMeeting?: boolean; // Frontend-only: checkbox state
	// Zoom recordings
	hasRecordings?: boolean; // Frontend-only: indicates if recordings exist
	// YouTube recording
	youtubeVideoId?: string; // YouTube video ID if recording was uploaded to YouTube
	// Manual session recording URL (when Zoom is not configured)
	sessionRecordingUrl?: string; // Manual recording link for non-Zoom meetings
}

export interface AttendeeInfo {
	_id: string;
	firebaseUserId: string;
	username: string;
	role?: string;
}

export function searchUserToAttendeeInfo(searchUser: { _id: string; firebaseUserId: string; username: string; role?: string }): AttendeeInfo {
	return {
		_id: searchUser._id,
		firebaseUserId: searchUser.firebaseUserId,
		username: searchUser.username,
		role: searchUser.role,
	};
}
