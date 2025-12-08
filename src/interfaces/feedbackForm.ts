export type FeedbackFormFieldType = 'text' | 'textarea' | 'rating' | 'multiple-choice' | 'checkbox' | 'date';

export interface FeedbackFormField {
	fieldId: string;
	type: FeedbackFormFieldType;
	label: string;
	placeholder?: string;
	required?: boolean;
	options?: string[]; // For multiple-choice, checkbox
	minRating?: number; // For rating type
	maxRating?: number; // For rating type
	order: number;
}

export interface FeedbackForm {
	_id: string;
	courseId?: string;
	orgId: string;
	createdBy: string;
	updatedBy?: string;

	// Form Details
	title: string;
	description?: string;
	templateId?: string; // Optional - if created from template

	// Form Configuration
	fields: FeedbackFormField[];

	// Publishing
	isPublished?: boolean;
	publishedAt?: string;
	unpublishedAt?: string;

	// Access Control
	publicLink?: string; // Generated unique link: /feedback-form/{publicLink}
	allowAnonymous?: boolean; // Allow submissions without login

	// Settings
	allowMultipleSubmissions?: boolean;
	submissionDeadline?: string; // Optional deadline
	showResultsToSubmitters?: boolean;

	// Metadata
	submissionCount?: number; // Cached count
	isActive?: boolean;
	isArchived?: boolean;
	archivedAt?: string;

	// Timestamps
	createdAt?: string;
	updatedAt: string;
}
