import type { DocumentDetailBlock } from './document';

export interface ClubPrice {
	currency: string;
	amount: string;
}

export interface ClubPack {
	_id: string;
	clubId: string;
	orgId: string;
	sessionCount: number;
	label?: string;
	prices: ClubPrice[];
	isActive: boolean;
}

export interface ClubSchedule {
	daysOfWeek: number[];
	startTime: string;
	durationMinutes: number;
	timezone: string;
}

export interface Club {
	_id: string;
	title: string;
	description?: string;
	coverImageUrl?: string;
	isActive: boolean;
	orgId: string;
	schedule: ClubSchedule;
	scheduleSummary?: string;
	defaultCapacity: number;
	hostUserId?: string;
	packs?: ClubPack[];
	/** Ordered marketing blocks for the public club detail page */
	detailBlocks?: DocumentDetailBlock[];
	createdAt?: string;
	updatedAt?: string;
}

export interface ClubSession {
	_id: string;
	clubId: string;
	startsAt: string;
	durationMinutes: number;
	capacity: number;
	status: 'scheduled' | 'cancelled';
	seatsTaken?: number;
	seatsLeft?: number;
	isFull?: boolean;
	alreadyRegistered?: boolean;
	zoomJoinUrl?: string;
	zoomStartUrl?: string;
}

export interface ClubTicketPublic {
	code: string;
	guestName: string;
	guestEmail: string;
	sessionsTotal: number;
	sessionsRemaining: number;
	status: string;
	clubId: string;
}

export interface ClubTicketLookupResult {
	ticket: ClubTicketPublic;
	club: { _id: string; title: string; description?: string; scheduleSummary?: string };
	sessions: ClubSession[];
}
