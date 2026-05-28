import axios from './axiosInstance';
import { clearForceNewLearnerSession, setLearnerSessionId } from './learnerSession';

export async function registerLearnerSessionOnServer(): Promise<string> {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const response = await axios.post(`${baseUrl}/users/learner-session`);
	const sessionId = response.data.sessionId as string;
	setLearnerSessionId(sessionId);
	clearForceNewLearnerSession();
	return sessionId;
}
