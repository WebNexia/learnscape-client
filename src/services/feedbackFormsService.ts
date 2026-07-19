import axiosInstance from '../utils/axiosInstance';
import { FeedbackForm } from '../interfaces/feedbackForm';
import { FeedbackFormTemplate } from '../interfaces/feedbackFormTemplate';
import { FeedbackFormSubmission, FeedbackFormSubmissionSummary } from '../interfaces/feedbackFormSubmission';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export const feedbackFormsService = {
	// Forms
	getAllFeedbackForms: async (filters?: { courseId?: string; consultationId?: string; orgId?: string; useForConsultation?: boolean }): Promise<FeedbackForm[]> => {
		const params = new URLSearchParams();
		if (filters?.courseId) params.append('courseId', filters.courseId);
		if (filters?.consultationId) params.append('consultationId', filters.consultationId);
		if (filters?.orgId) params.append('orgId', filters.orgId);
		if (filters?.useForConsultation === true) params.append('useForConsultation', 'true');
		const response = await axiosInstance.get(`${base_url}/feedback-forms?${params.toString()}`);
		return response.data.data;
	},

	getFeedbackFormById: async (id: string): Promise<FeedbackForm> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/${id}`);
		return response.data.data;
	},

	getPublicFeedbackForm: async (formId: string): Promise<FeedbackForm> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/public/${formId}`);
		return response.data.data;
	},

	/** @deprecated Use getPublicFeedbackForm */
	getFeedbackFormByPublicLink: async (formId: string): Promise<FeedbackForm> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/public/${formId}`);
		return response.data.data;
	},

	createFeedbackForm: async (formData: Partial<FeedbackForm>): Promise<FeedbackForm> => {
		const response = await axiosInstance.post(`${base_url}/feedback-forms`, formData);
		return response.data.data;
	},

	updateFeedbackForm: async (id: string, formData: Partial<FeedbackForm>): Promise<FeedbackForm> => {
		const response = await axiosInstance.patch(`${base_url}/feedback-forms/${id}`, formData);
		return response.data.data;
	},

	deleteFeedbackForm: async (id: string): Promise<void> => {
		await axiosInstance.delete(`${base_url}/feedback-forms/${id}`);
	},

	publishFeedbackForm: async (id: string): Promise<FeedbackForm> => {
		const response = await axiosInstance.post(`${base_url}/feedback-forms/${id}/publish`);
		return response.data.data;
	},

	unpublishFeedbackForm: async (id: string): Promise<FeedbackForm> => {
		const response = await axiosInstance.post(`${base_url}/feedback-forms/${id}/unpublish`);
		return response.data.data;
	},

	duplicateFeedbackForm: async (id: string): Promise<FeedbackForm> => {
		const response = await axiosInstance.post(`${base_url}/feedback-forms/${id}/duplicate`);
		return response.data.data;
	},

	// Submissions
	getFormSubmissions: async (formId: string): Promise<FeedbackFormSubmission[]> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/${formId}/submissions`);
		return response.data.data;
	},

	getFormSubmissionSummaries: async (formId: string): Promise<FeedbackFormSubmissionSummary[]> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/${formId}/submissions`, {
			params: { summary: true },
		});
		return response.data.data;
	},

	getSubmissionById: async (submissionId: string): Promise<FeedbackFormSubmission> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/submissions/${submissionId}`);
		return response.data.data;
	},

	deleteSubmission: async (submissionId: string): Promise<void> => {
		await axiosInstance.delete(`${base_url}/feedback-forms/submissions/${submissionId}`);
	},

	submitFeedbackForm: async (
		formId: string,
		submissionData: {
			responses: Array<{ fieldId: string; value: any }>;
			userName?: string;
			userEmail?: string;
			userId?: string;
			recaptchaToken?: string | null;
			consultationId?: string;
			consultationAppointmentId?: string;
		}
	): Promise<{ submission: FeedbackFormSubmission; sendConfirmationEmail?: boolean }> => {
		const response = await axiosInstance.post(`${base_url}/feedback-forms/public/${formId}/submit`, submissionData);
		return {
			submission: response.data.data,
			sendConfirmationEmail: response.data.sendConfirmationEmail,
		};
	},

	/** Link a consultation-booking form submission to an appointment after payment (set guest name/email). */
	linkSubmissionToAppointment: async (
		submissionId: string,
		payload: {
			firstName: string;
			lastName: string;
			userEmail: string;
			consultationAppointmentId: string;
		}
	): Promise<void> => {
		await axiosInstance.patch(
			`${base_url}/feedback-forms/public/submissions/${submissionId}/link-appointment`,
			{
				firstName: payload.firstName,
				lastName: payload.lastName,
				userEmail: payload.userEmail,
				consultationAppointmentId: payload.consultationAppointmentId,
			}
		);
	},

	exportSubmissions: async (formId: string): Promise<Blob> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/${formId}/submissions/export`, {
			responseType: 'blob',
		});
		return response.data;
	},

	// Analytics
	getFormAnalytics: async (formId: string): Promise<any> => {
		const response = await axiosInstance.get(`${base_url}/feedback-forms/${formId}/analytics`);
		return response.data.data;
	},

	// Templates
	getAllTemplates: async (category?: string): Promise<FeedbackFormTemplate[]> => {
		const params = new URLSearchParams();
		if (category) params.append('category', category);
		const response = await axiosInstance.get(`${base_url}/feedback-form-templates?${params.toString()}`);
		return response.data.data;
	},

	getTemplateById: async (id: string): Promise<FeedbackFormTemplate> => {
		const response = await axiosInstance.get(`${base_url}/feedback-form-templates/${id}`);
		return response.data.data;
	},

	createTemplate: async (templateData: Partial<FeedbackFormTemplate>): Promise<FeedbackFormTemplate> => {
		const response = await axiosInstance.post(`${base_url}/feedback-form-templates`, templateData);
		return response.data.data;
	},

	updateTemplate: async (id: string, templateData: Partial<FeedbackFormTemplate>): Promise<FeedbackFormTemplate> => {
		const response = await axiosInstance.patch(`${base_url}/feedback-form-templates/${id}`, templateData);
		return response.data.data;
	},

	deleteTemplate: async (id: string): Promise<void> => {
		await axiosInstance.delete(`${base_url}/feedback-form-templates/${id}`);
	},

	createFormFromTemplate: async (
		templateId: string,
		formData: {
			courseId: string;
			title: string;
			description?: string;
			allowAnonymous?: boolean;
			allowMultipleSubmissions?: boolean;
			submissionDeadline?: string;
			showResultsToSubmitters?: boolean;
		}
	): Promise<FeedbackForm> => {
		const response = await axiosInstance.post(`${base_url}/feedback-form-templates/${templateId}/create-form`, formData);
		return response.data.data;
	},
};
