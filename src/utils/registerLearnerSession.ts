import axios from './axiosInstance';
import { clearForceNewLearnerSession, setLearnerSessionId } from './learnerSession';

let registerInFlight: Promise<string> | null = null;

export async function registerLearnerSessionOnServer(): Promise<string> {
	if (!registerInFlight) {
		registerInFlight = (async () => {
			const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
			const response = await axios.post(`${baseUrl}/users/learner-session`);
			const sessionId = response.data.sessionId as string;
			setLearnerSessionId(sessionId);
			clearForceNewLearnerSession();
			return sessionId;
		})().finally(() => {
			registerInFlight = null;
		});
	}

	return registerInFlight;
}
