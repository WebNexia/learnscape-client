import { ChapterLessonData } from '../pages/AdminCourseEditPage';
import { Document } from './document';

/** evergreen: start lessons right after enroll. cohort: lessons stay locked until course startingDate. */
export type CourseAccessTiming = 'evergreen' | 'cohort';

/**
 * Ownership proof sent with landing page enrollment, which runs without a session.
 * The server accepts the account email for free courses and a Stripe payment
 * reference for paid ones.
 */
export interface CourseEnrollmentProof {
	email?: string;
	paymentIntentId?: string;
}

/** Public LP detail: heading + rich HTML (limits in `landingPageCourseLimits`). */
export interface CourseLandingPageSection {
	title: string;
	body: string;
	/** Client-only list key; not sent to the API. */
	rowKey?: string;
}

export interface BaseCourse {
	_id: string;
	title: string;
	description: string;
	prices: Price[];
	/** Display-only list / "normal" prices. Checkout still uses `prices`. */
	originalPrices?: Price[];
	imageUrl: string;
	/** Landing page course detail: optional intro/trailer video (YouTube / Vimeo URL). */
	introVideoUrl?: string;
	/** Optional blocks below banner on public LP course detail (title + HTML body). */
	landingPageSections?: CourseLandingPageSection[];
	isActive: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
	isExpired: boolean;
	capacity?: number | null;
	isCapacityFull?: boolean;
	isRegistrationClosedByAdmin?: boolean;
	/** Hidden from LP and regular learners; only test-learner accounts can take the course. */
	isTestCourse?: boolean;
	activeEnrollmentCount?: number;
	clonedFromId?: string;
	clonedFromTitle?: string;
	cohortOfCourseId?: string;
	versionNote?: string;
	createdBy?: string;
	createdByName?: string;
	createdByImageUrl?: string;
	createdByRole?: string;
	updatedByName?: string;
	updatedByImageUrl?: string;
	updatedByRole?: string;
	publishedAt: string | null;
	instructor: Instructor;
	courseManagement: CourseManagement;
	/** Defaults to evergreen when omitted (legacy API payloads). */
	courseAccessTiming?: CourseAccessTiming;
}

export interface Course extends BaseCourse {
	lessonCount: number;
	startingDate: Date;
	format: string;
	durationWeeks: number;
	durationHours: number;
}

export interface FilteredCourse extends BaseCourse {
	chapterIds: any;
}

export interface UserCourseByUserId extends BaseCourse {
	chapterIds: string[];
}

export interface CourseGroup {
	_id?: string;
	name: string;
	capacity?: number;
	description?: string;
	enrolledCount?: number;
	remainingSeats?: number | null;
	isFull?: boolean;
}

export interface SingleCourse extends BaseCourse {
	startingDate: Date | null;
	format: string;
	durationWeeks: number | null;
	durationHours: number | null;
	chapterIds: string[];
	chapters: ChapterLessonData[];
	/** Total lessons in course outline (learner courses list includes this when chapters are omitted) */
	lessonCount?: number;
	orgId: string;
	documentIds: string[];
	documents: Document[];
	firstLessonId: string;
	groups?: CourseGroup[];
	videoURLs?: { url: string; title: string }[];
}

export interface Price {
	currency: 'gbp' | 'usd' | 'eur' | 'try';
	amount: string;
}

export interface Instructor {
	name: string;
	userId: string;
	imageUrl: string;
	email: string;
	bio: string;
	expertise: string[];
	title: string;
	linkedInUrl: string;
	website: string;
}

export interface CourseManagement {
	isExternal: boolean;
	externalProvider?: string;
	externalUrl?: string;
	externalNotes?: string;
}

export interface ArchivedCourse extends SingleCourse {
	archivedAt: string;
	archivedBy: string;
	archivedByName: string;
}
