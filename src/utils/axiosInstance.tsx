import axios from 'axios';
import { getAuth } from 'firebase/auth';

const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add Firebase ID token before every request
axiosInstance.interceptors.request.use(async (config) => {
	const auth = getAuth();
	const user = auth.currentUser;

	if (user) {
		const token = await user.getIdToken();
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

export default axiosInstance;
