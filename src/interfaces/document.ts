import { PromoBanner } from '../utils/promoBanner';

export interface Price {
	currency: string;
	amount: string;
}

/** Ordered blocks for the public document / book detail page */
export type DocumentDetailBlock =
	| {
			type: 'section';
			title: string;
			body: string;
			/** Client-only stable key for TinyMCE remount */
			rowKey?: string;
	  }
	| {
			type: 'image';
			imageUrl: string;
			caption?: string;
			rowKey?: string;
	  }
	| {
			type: 'bullets';
			title: string;
			items: string[];
			rowKey?: string;
	  }
	| {
			type: 'cta';
			body: string;
			rowKey?: string;
	  };

export interface Document {
	_id: string;
	name: string;
	orgId: string;
	userId: string;
	documentUrl: string;
	/** Companion file sent with the purchase email. Not shown on the public page. */
	answerKeyUrl?: string;
	imageUrl: string;
	prices: Price[];
	processingFeePercent?: number | null;
	description: string;
	createdAt: string;
	updatedAt: string;
	clonedFromId: string;
	clonedFromTitle: string;
	usedInLessons: string[];
	usedInCourses: string[];
	samplePageImageUrls: string[];
	/** @deprecated Prefer detailBlocks; kept for older records */
	detailIntroText?: string;
	/** @deprecated Prefer detailBlocks image type; kept for older records */
	detailImageUrls?: string[];
	/** Ordered marketing blocks for the public detail page */
	detailBlocks?: DocumentDetailBlock[];
	isOnLandingPage: boolean;
	/** Announcement modal on this book's public detail page. */
	promoBanner?: PromoBanner;
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
