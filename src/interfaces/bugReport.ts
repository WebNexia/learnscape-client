export interface BugReport {
	_id?: string;
	firstName: string;
	lastName: string;
	email: string;
	description: string;
	userId?: string;
	orgId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateBugReportRequest {
	firstName: string;
	lastName: string;
	email: string;
	description: string;
	recaptchaToken?: string;
}
