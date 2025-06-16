import axios from 'axios';
import { getAuth } from 'firebase/auth';

const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_SERVER_BASE_URL,
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

// Handle rate limit errors
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		console.log('Rate limit error:', error);
		if (error.response?.status === 429) {
			// Check if we're already on the rate limit error page
			if (window.location.pathname === '/rate-limit-error') {
				return Promise.reject(error);
			}

			const retryAfter = error.response.headers['retry-after'] || 900; // Default to 15 minutes if not specified
			const requestUrl = error.config.url;

			// Determine the type of rate limit
			let type = 'api';
			if (requestUrl.includes('/users/signup')) {
				type = 'signup';
			} else if (requestUrl.includes('/users/check-email-firebase')) {
				type = 'email';
			}

			// Store rate limit info in localStorage
			const rateLimitInfo = {
				type,
				retryAfter: parseInt(retryAfter),
				timestamp: Date.now(),
			};
			console.log('Setting rate limit:', rateLimitInfo);
			localStorage.setItem('rateLimitInfo', JSON.stringify(rateLimitInfo));

			// Redirect to rate limit error page
			window.location.href = '/rate-limit-error';
		}
		return Promise.reject(error);
	}
);

// Add request interceptor to check rate limit before making requests
axiosInstance.interceptors.request.use(
	(config) => {
		// Skip rate limit check for the rate limit error page itself
		if (window.location.pathname === '/rate-limit-error') {
			return config;
		}

		const rateLimitInfo = localStorage.getItem('rateLimitInfo');
		if (rateLimitInfo) {
			const info = JSON.parse(rateLimitInfo);
			const timeElapsed = (Date.now() - info.timestamp) / 1000; // in seconds
			console.log('Rate limit check:', { timeElapsed, retryAfter: info.retryAfter });

			if (timeElapsed < info.retryAfter) {
				// Rate limit is still active, redirect to error page
				window.location.href = '/rate-limit-error';
				return Promise.reject(new Error('Rate limit exceeded'));
			} else {
				// Rate limit has expired, clear the stored info
				console.log('Clearing expired rate limit');
				localStorage.removeItem('rateLimitInfo');
			}
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default axiosInstance;
