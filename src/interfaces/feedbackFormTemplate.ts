import { FeedbackFormField, FeedbackFormFieldType } from './feedbackForm';

export interface FeedbackFormTemplate {
	_id: string;
	orgId: string;
	createdBy: string;

	// Template Details
	name: string;
	description?: string;
	category?: string; // 'session-feedback', 'course-evaluation', 'custom'

	// Template Fields (same structure as FeedbackForm.fields)
	fields: FeedbackFormField[];

	// Usage
	usageCount?: number; // How many forms created from this template

	// Access Control
	isPublic?: boolean; // Available to all org users
	isDefault?: boolean; // System default templates

	// Metadata
	isActive?: boolean;

	// Timestamps
	createdAt?: string;
	updatedAt?: string;
}
