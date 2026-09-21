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
	packCount?: number;
	/** Remaining sellable session rights in the current purchase window */
	availableTicketCount?: number;
	seatPool?: number;
	purchaseSessions?: ClubPurchaseSession[];
	/** Ordered marketing blocks for the public club detail page */
	detailBlocks?: DocumentDetailBlock[];
	createdAt?: string;
	updatedAt?: string;
}

export interface ClubPurchaseSession {
	_id: string;
	startsAt: string;
	durationMinutes: number;
	capacity: number;
	seatsLeft: number;
	seatsTaken?: number;
	isFull?: boolean;
	monthKey: string;
	monthLabel: string;
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
	expiresAt?: string | null;
}

export interface ClubTicketLookupResult {
	ticket: ClubTicketPublic;
	club: { title: string };
	sessions: Array<{
		_id: string;
		startsAt: string;
		durationMinutes: number;
		isFull?: boolean;
		alreadyRegistered?: boolean;
		zoomJoinUrl?: string;
	}>;
}
