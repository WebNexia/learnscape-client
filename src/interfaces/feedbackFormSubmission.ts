import { FeedbackFormFieldType } from './feedbackForm';

export interface FeedbackFormSubmissionResponse {
	fieldId: string;
	value: string | number | string[] | Date | null; // Can be string, number, array, Date, etc.
	fieldType: FeedbackFormFieldType; // For reference: 'text', 'textarea', 'rating', etc.
}

export interface FeedbackFormSubmission {
	_id: string;
	formId: string;
	courseId: string;
	orgId: string;

	// Submitter Info
	userId?: string | { _id: string; firstName?: string; lastName?: string; email?: string; username?: string; imageUrl?: string }; // Optional if allowAnonymous, can be populated
	userName?: string; // Cached for anonymous submissions
	userEmail?: string; // Optional
	isAnonymous?: boolean;

	// Submission Data
	responses: FeedbackFormSubmissionResponse[];

	// Metadata
	submittedAt?: string;
	ipAddress?: string; // For tracking (optional)
	userAgent?: string; // For tracking (optional)

	// Timestamps
	createdAt?: string;
	updatedAt?: string;
}
