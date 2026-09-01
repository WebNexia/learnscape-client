declare global {
	interface Window {
		__redirectingToRateLimit?: boolean;
	}
}

import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { InternalAxiosRequestConfig } from 'axios';
import {
	emitLearnerSessionSuperseded,
	getLearnerSessionId,
	shouldSuppressLearnerSessionSuperseded,
} from './learnerSession';

// Extend the InternalAxiosRequestConfig type to include retryCount
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
	retryCount?: number;
}

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

	const learnerSessionId = getLearnerSessionId();
	if (learnerSessionId) {
		config.headers['X-Learner-Session-Id'] = learnerSessionId;
	}

	return config;
});

// Add request interceptor to check rate limit before making requests
axiosInstance.interceptors.request.use(
	(config: CustomAxiosRequestConfig) => {
		// Skip check on rate-limit error page
		if (window.location.pathname === '/rate-limit-error') return config;

		const rateLimitInfo = localStorage.getItem('rateLimitInfo');
		if (rateLimitInfo) {
			try {
				const info = JSON.parse(rateLimitInfo);
				const timeElapsed = (Date.now() - info.timestamp) / 1000;
				if (timeElapsed < info.retryAfter) {
					window.__redirectingToRateLimit ||= false;
					if (!window.__redirectingToRateLimit) {
						window.__redirectingToRateLimit = true;
						window.location.href = '/rate-limit-error';
					}
					return Promise.reject(new Error('Rate limit exceeded'));
				}
				localStorage.removeItem('rateLimitInfo');
			} catch (e) {
				localStorage.removeItem('rateLimitInfo');
			}
		}

		config.retryCount = config.retryCount || 0;
		return config;
	},
	(error) => Promise.reject(error)
);

// Handle responses (including rate limit + retries)
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const config = error.config as CustomAxiosRequestConfig | undefined;

		if (!config) {
			return Promise.reject(error);
		}

		if (error.response?.data?.code === 'SESSION_SUPERSEDED') {
			if (!shouldSuppressLearnerSessionSuperseded()) {
				emitLearnerSessionSuperseded();
			}
			return Promise.reject(error);
		}

		// Handle rate limit errors (429) and IP blocking (403)
		if (error.response?.status === 429 || (error.response?.status === 403 && error.response?.data?.type === 'ip_blocked')) {
			if (window.location.pathname === '/rate-limit-error') {
				// Already on the error page, do not redirect or update localStorage
				return Promise.reject(error);
			}
			const retryAfterHeader = error.response.headers['retry-after'];
			const retryAfter = parseInt(retryAfterHeader, 10);
			let finalRetryAfter = Number.isFinite(retryAfter) ? retryAfter : 900;

			let type = 'api';
			if (error.response?.status === 403 && error.response?.data?.type === 'ip_blocked') {
				type = 'ip_blocked';
				// For IP blocking, use 24 hours as retry time
				finalRetryAfter = 24 * 60 * 60; // 24 hours in seconds
			} else {
				const url = error.config.url || '';
				if (url?.includes('/users/signup')) type = 'signup';
				else if (url?.includes('/users/check-email-firebase')) type = 'email';
			}

			const existing = localStorage.getItem('rateLimitInfo');
			let shouldSet = true;
			if (existing) {
				try {
					const info = JSON.parse(existing);
					const timeElapsed = (Date.now() - info.timestamp) / 1000;
					if (timeElapsed < info.retryAfter) {
						// Already rate limited, do not overwrite
						shouldSet = false;
						window.__redirectingToRateLimit ||= false;
						if (!window.__redirectingToRateLimit) {
							window.__redirectingToRateLimit = true;
							window.location.href = '/rate-limit-error';
						}
						return Promise.reject(error);
					}
				} catch (e) {
					// If parsing fails, clear and continue
					localStorage.removeItem('rateLimitInfo');
				}
			}
			if (shouldSet) {
				localStorage.setItem(
					'rateLimitInfo',
					JSON.stringify({
						type,
						retryAfter: finalRetryAfter,
						timestamp: Date.now(),
					})
				);
				window.__redirectingToRateLimit ||= false;
				if (!window.__redirectingToRateLimit) {
					window.__redirectingToRateLimit = true;
					window.location.href = '/rate-limit-error';
				}
			}
			return Promise.reject(error);
		}

		const requestUrl = `${config.baseURL || ''}${config.url || ''}`;
		const method = (config.method || 'get').toLowerCase();
		const isPaymentMutation =
			(method === 'post' || method === 'patch') && requestUrl.includes('/payments');
		const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED';

		// Never retry payment POSTs/PATCHes: reCAPTCHA tokens are one-time and 5xx retries cause 400s.
		// Never retry timeouts — a second wait on a slow TR connection makes checkout feel stuck.
		if (
			!isPaymentMutation &&
			!isTimeout &&
			typeof config.retryCount === 'number' &&
			config.retryCount < 3 &&
			(!error.response || (error.response.status >= 500 && error.response.status < 600))
		) {
			config.retryCount += 1;
			const delay = Math.pow(2, config.retryCount) * 1000;
			console.warn(`Retrying request (${config.retryCount}/3) after ${delay}ms`);
			await new Promise((resolve) => setTimeout(resolve, delay));
			return axiosInstance(config);
		}

		console.error(`Request failed after ${config.retryCount || 0} retries: ${config.url}`);
		return Promise.reject(error);
	}
);

export default axiosInstance;
