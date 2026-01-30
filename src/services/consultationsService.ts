import axios from '@utils/axiosInstance';
import { Consultation } from '../interfaces/consultation';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export interface SlotWithConsultants {
	_id: string;
	slotStart: string;
	duration: number;
	consultants: Array<{
		_id: string;
		firstName?: string;
		lastName?: string;
		imageUrl?: string;
		email?: string;
	}>;
}

export interface CreateAppointmentBody {
	slotId: string;
	consultantId: string;
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	price: { currency: string; amount: string };
}

export interface CreateAppointmentResponse {
	appointmentId: string;
	clientSecret: string;
	paymentIntentId: string;
}

export const consultationsService = {
	getConsultationByIdPublic: async (orgId: string, consultationId: string): Promise<Consultation> => {
		const response = await axios.get(`${base_url}/consultations/public/${orgId}/${consultationId}`);
		return response.data.data;
	},

	getAvailableSlots: async (
		consultationId: string,
		params: { date?: string; startDate?: string; endDate?: string }
	): Promise<SlotWithConsultants[]> => {
		const searchParams = new URLSearchParams();
		if (params.date) searchParams.set('date', params.date);
		if (params.startDate) searchParams.set('startDate', params.startDate);
		if (params.endDate) searchParams.set('endDate', params.endDate);
		const response = await axios.get(
			`${base_url}/consultations/${consultationId}/slots${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
		);
		return response.data.data;
	},

	createAppointment: async (
		consultationId: string,
		body: CreateAppointmentBody
	): Promise<CreateAppointmentResponse> => {
		const response = await axios.post(`${base_url}/consultations/${consultationId}/appointments`, body);
		const data = response.data;
		return {
			appointmentId: data.data.appointmentId,
			clientSecret: data.data.clientSecret,
			paymentIntentId: data.data.paymentIntentId,
		};
	},

	/** Create free appointment (no payment) – for consultations with price 0 */
	createFreeAppointment: async (
		consultationId: string,
		body: { slotId: string; consultantId: string; guestName: string; guestEmail: string; guestPhone?: string }
	): Promise<{ appointmentId: string }> => {
		const response = await axios.post(`${base_url}/consultations/${consultationId}/appointments/free`, body);
		return { appointmentId: response.data.data.appointmentId };
	},
};
