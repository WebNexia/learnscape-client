export interface ConsultationPrice {
	currency: string;
	amount: string;
}

export interface Consultation {
	_id: string;
	title: string;
	description?: string;
	duration: number; // in minutes (30, 45, 60, 75, 90)
	prices: ConsultationPrice[];
	isActive: boolean;
	orgId: string;
	createdBy: string | {
		_id: string;
		firstName: string;
		lastName: string;
		imageUrl?: string;
		email?: string;
	};
	updatedBy?: string | {
		_id: string;
		firstName: string;
		lastName: string;
		imageUrl?: string;
		email?: string;
	};
	coverImageUrl?: string;
	tags?: string[];
	feedbackFormId?: string;
	feedbackForm?: import('./feedbackForm').FeedbackForm; // Populated when present
	requireFormSubmission?: boolean; // When true, booking flow requires form submission
	meetingType?: 'video';
	createdAt: string;
	updatedAt: string;
}

export interface ConsultationSlot {
	_id: string;
	consultationId: string;
	slotStart: string; // ISO date string
	duration: number; // in minutes
	availableConsultantIds?: string[] | Array<{
		_id: string;
		firstName: string;
		lastName: string;
		imageUrl?: string;
		email?: string;
	}>;
	createdBy: string | {
		_id: string;
		firstName: string;
		lastName: string;
		imageUrl?: string;
		email?: string;
	};
	orgId: string;
	appointmentRef?: string | {
		_id: string;
		guestName?: string;
		guestEmail?: string;
		appointmentDate: string;
		status: string;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export interface ConsultationAppointment {
	_id: string;
	consultationId: string | { _id: string; title?: string; duration?: number; description?: string; prices?: ConsultationPrice[] };
	slotRef?: string | { _id: string; slotStart?: string; duration?: number };
	appointmentDate: string;
	duration: number;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	guestName?: string;
	guestEmail: string;
	guestPhone?: string;
	paymentRef?: string | { _id: string; amount?: number; currency?: string; status?: string; paymentId?: string };
	paymentStatus?: string;
	adminNotes?: string;
	notesAddedAt?: string;
	notesAddedBy?: string | { _id: string; firstName?: string; lastName?: string };
	meetingType?: string;
	zoomMeetingId?: string;
	zoomJoinUrl?: string;
	zoomStartUrl?: string;
	zoomMeetingPassword?: string;
	zoomMeetingNumber?: string;
	assignedConsultantId: string | { _id: string; firstName?: string; lastName?: string; imageUrl?: string; email?: string };
	orgId: string;
	createdAt: string;
	updatedAt: string;
}
