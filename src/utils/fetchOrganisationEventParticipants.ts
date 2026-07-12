import axios from '@utils/axiosInstance';
import { AttendeeInfo } from '../interfaces/event';

export interface EventParticipantFilters {
	role?: 'instructor' | 'learner';
	group?: 'eventInstructors';
	isSubscribed?: boolean;
	subscriptionStatus?: string;
}

/** Slim org participant list for calendar bulk selections (single BE query). */
export async function fetchOrganisationEventParticipants(orgId: string, filters: EventParticipantFilters = {}): Promise<AttendeeInfo[]> {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const params = new URLSearchParams();

	if (filters.group) {
		params.set('group', filters.group);
	}
	if (filters.role) {
		params.set('role', filters.role);
	}
	if (filters.isSubscribed) {
		params.set('isSubscribed', 'true');
	}
	if (filters.subscriptionStatus) {
		params.set('subscriptionStatus', filters.subscriptionStatus);
	}

	const queryString = params.toString();
	const url = `${base_url}/users/organisation/${orgId}/event-participants${queryString ? `?${queryString}` : ''}`;
	const response = await axios.get(url);

	return (response.data.data || []).map((user: AttendeeInfo) => ({
		_id: user._id,
		username: user.username,
		firebaseUserId: user.firebaseUserId,
		role: user.role,
	}));
}
