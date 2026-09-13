import axios from '@utils/axiosInstance';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export const clubsService = {
	getPublicClubs: async (orgId: string, options?: { qaPreview?: boolean }) => {
		const params = options?.qaPreview ? { qaPreview: '1' } : undefined;
		const res = await axios.get(`${base_url}/clubs/public/${orgId}`, { params });
		return res.data.data;
	},
	getPublicClub: async (orgId: string, clubId: string, options?: { qaPreview?: boolean }) => {
		const params = options?.qaPreview ? { qaPreview: '1' } : undefined;
		const res = await axios.get(`${base_url}/clubs/public/${orgId}/${clubId}`, { params });
		return res.data.data;
	},
	checkout: async (
		orgId: string,
		clubId: string,
		body: {
			sessionCount: number;
			currency: string;
			amount: number;
			firstName: string;
			lastName: string;
			email: string;
			guestPhone?: string;
			cancelUrl?: string;
			qaPreview?: boolean;
		},
	) => {
		const res = await axios.post(`${base_url}/clubs/public/${orgId}/${clubId}/checkout`, body);
		return res.data;
	},
	lookupTicket: async (code: string, email: string, options?: { qaPreview?: boolean }) => {
		const res = await axios.post(`${base_url}/clubs/public/ticket/lookup`, {
			code,
			email,
			...(options?.qaPreview ? { qaPreview: true } : {}),
		});
		return res.data.data;
	},
	redeemTicket: async (
		code: string,
		email: string,
		clubSessionId: string,
		options?: { qaPreview?: boolean },
	) => {
		const res = await axios.post(`${base_url}/clubs/public/ticket/redeem`, {
			code,
			email,
			clubSessionId,
			...(options?.qaPreview ? { qaPreview: true } : {}),
		});
		return res.data.data;
	},
	getAdminClubs: async (orgId: string, params?: Record<string, string | number>) => {
		const res = await axios.get(`${base_url}/clubs/organisation/${orgId}`, { params });
		return res.data;
	},
	getClubAdmin: async (clubId: string) => {
		const res = await axios.get(`${base_url}/clubs/${clubId}`);
		return res.data.data;
	},
	createClub: async (body: Record<string, unknown>) => {
		const res = await axios.post(`${base_url}/clubs`, body);
		return res.data.data;
	},
	updateClub: async (id: string, body: Record<string, unknown>) => {
		const res = await axios.patch(`${base_url}/clubs/${id}`, body);
		return res.data.data;
	},
	deleteClub: async (id: string) => {
		await axios.delete(`${base_url}/clubs/${id}`);
	},
	createPack: async (clubId: string, body: Record<string, unknown>) => {
		const res = await axios.post(`${base_url}/clubs/${clubId}/packs`, body);
		return res.data.data;
	},
	updatePack: async (clubId: string, packId: string, body: Record<string, unknown>) => {
		const res = await axios.patch(`${base_url}/clubs/${clubId}/packs/${packId}`, body);
		return res.data.data;
	},
	deletePack: async (clubId: string, packId: string) => {
		await axios.delete(`${base_url}/clubs/${clubId}/packs/${packId}`);
	},
	getSessions: async (clubId: string) => {
		const res = await axios.get(`${base_url}/clubs/${clubId}/sessions`);
		return res.data.data;
	},
	createSession: async (clubId: string, body: Record<string, unknown>) => {
		const res = await axios.post(`${base_url}/clubs/${clubId}/sessions`, body);
		return res.data.data;
	},
	bulkCreateSessions: async (clubId: string, body: { weeks?: number; capacity?: number }) => {
		const res = await axios.post(`${base_url}/clubs/${clubId}/sessions/bulk`, body);
		return res.data;
	},
	updateSession: async (clubId: string, sessionId: string, body: Record<string, unknown>) => {
		const res = await axios.patch(`${base_url}/clubs/${clubId}/sessions/${sessionId}`, body);
		return res.data.data;
	},
	deleteSession: async (clubId: string, sessionId: string) => {
		const res = await axios.delete(`${base_url}/clubs/${clubId}/sessions/${sessionId}`);
		return res.data;
	},
	getTickets: async (orgId: string, params?: Record<string, string>) => {
		const res = await axios.get(`${base_url}/clubs/organisation/${orgId}/tickets`, { params });
		return res.data.data;
	},
	createTicket: async (
		orgId: string,
		body: {
			clubId: string;
			guestName: string;
			guestEmail: string;
			guestPhone?: string;
			sessionsTotal: number;
			sendEmail?: boolean;
		},
	) => {
		const res = await axios.post(`${base_url}/clubs/organisation/${orgId}/tickets`, body);
		return res.data.data;
	},
	deleteTicket: async (ticketId: string) => {
		await axios.delete(`${base_url}/clubs/tickets/${ticketId}`);
	},
	getRegistrations: async (sessionId: string) => {
		const res = await axios.get(`${base_url}/clubs/sessions/${sessionId}/registrations`);
		return res.data.data;
	},
	cancelRegistration: async (registrationId: string) => {
		const res = await axios.patch(`${base_url}/clubs/registrations/${registrationId}/cancel`);
		return res.data;
	},
};
