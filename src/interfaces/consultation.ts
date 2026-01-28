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
