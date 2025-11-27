import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import axios from '@utils/axiosInstance';
import { UserAuthContext } from './UserAuthContextProvider';

interface UploadInfo {
	audioUploads: {
		currentCount: number;
		limit: number;
		remaining: number;
	};
	imageUploads: {
		currentCount: number;
		limit: number;
		remaining: number;
	};
}

interface UploadLimitContextType {
	uploadInfo: UploadInfo | null;
	loading: boolean;
	error: string | null;
	refreshUploadStats: () => Promise<void>;
	checkCanUploadAudio: () => boolean;
	checkCanUploadImage: () => boolean;
	getRemainingAudioUploads: () => number;
	getRemainingImageUploads: () => number;
	getCurrentAudioCount: () => number;
	getCurrentImageCount: () => number;
	getAudioLimit: () => number;
	getImageLimit: () => number;
	getFormattedResetTime: () => string;
	// New optimistic update methods
	incrementAudioUpload: () => void;
	incrementImageUpload: () => void;
}

const UploadLimitContext = createContext<UploadLimitContextType | undefined>(undefined);

interface UploadLimitProviderProps {
	children: ReactNode;
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
	let timeout: NodeJS.Timeout;
	return ((...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as T;
};

export const UploadLimitProvider: React.FC<UploadLimitProviderProps> = ({ children }) => {
	const { user, userId } = useContext(UserAuthContext);
	const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [lastFetchTime, setLastFetchTime] = useState<number>(0);
	const [isFetching, setIsFetching] = useState<boolean>(false);
	const [errorCount, setErrorCount] = useState<number>(0);

	const fetchUploadStats = useCallback(
		async (forceRefresh = false) => {
			if (!userId) {
				return;
			}

			// Prevent multiple simultaneous requests
			if (isFetching) {
				return;
			}

			// Cache for 30 seconds to prevent excessive API calls (unless force refresh)
			const now = Date.now();
			if (!forceRefresh && now - lastFetchTime < 30000) {
				return;
			}

			setIsFetching(true);
			setLoading(true);
			setError(null);

			try {
				const response = await axios.get('/users/upload-counts');
				const newUploadInfo = response.data.uploadInfo;

				// No need to apply pending increments since backend handles counting atomically
				setUploadInfo(newUploadInfo);
				setLastFetchTime(now);
				setErrorCount(0); // Reset error count on success
			} catch (err: any) {
				const newErrorCount = errorCount + 1;
				setErrorCount(newErrorCount);
				setError(err.response?.data?.message || 'Failed to fetch upload statistics');

				// Trigger fallback refresh after 3 failures
				if (newErrorCount >= 3) {
					console.warn('Multiple API failures detected, scheduling fallback refresh in 60 seconds');
					setTimeout(() => {
						fetchUploadStats(true); // Force refresh after 60 seconds
					}, 60000);
				}
			} finally {
				setLoading(false);
				setIsFetching(false);
			}
		},
		[userId, lastFetchTime, isFetching, errorCount]
	);

	// Debounced refresh to prevent rapid API calls
	const debouncedRefresh = useMemo(() => debounce(fetchUploadStats, 1000), [fetchUploadStats]);

	const refreshUploadStats = useCallback(async () => {
		await fetchUploadStats(true);
	}, [fetchUploadStats]);

	// Optimistic update methods - simplified since backend handles counting atomically
	const incrementAudioUpload = useCallback(() => {
		setUploadInfo((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				audioUploads: {
					...prev.audioUploads,
					currentCount: prev.audioUploads.currentCount + 1,
					remaining: Math.max(0, prev.audioUploads.remaining - 1),
				},
			};
		});

		// Background sync to get accurate counts from server
		debouncedRefresh();
	}, [debouncedRefresh]);

	const incrementImageUpload = useCallback(() => {
		setUploadInfo((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				imageUploads: {
					...prev.imageUploads,
					currentCount: prev.imageUploads.currentCount + 1,
					remaining: Math.max(0, prev.imageUploads.remaining - 1),
				},
			};
		});

		// Background sync to get accurate counts from server
		debouncedRefresh();
	}, [debouncedRefresh]);

	// Check if user can upload audio
	const checkCanUploadAudio = useCallback((): boolean => {
		if (!uploadInfo) return true; // Allow if no data yet
		return uploadInfo.audioUploads.remaining > 0;
	}, [uploadInfo]);

	// Check if user can upload images
	const checkCanUploadImage = useCallback((): boolean => {
		if (!uploadInfo) return true; // Allow if no data yet
		return uploadInfo.imageUploads.remaining > 0;
	}, [uploadInfo]);

	// Get remaining audio uploads
	const getRemainingAudioUploads = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.audioUploads.remaining;
	}, [uploadInfo]);

	// Get remaining image uploads
	const getRemainingImageUploads = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.imageUploads.remaining;
	}, [uploadInfo]);

	// Get current audio count
	const getCurrentAudioCount = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.audioUploads.currentCount;
	}, [uploadInfo]);

	// Get current image count
	const getCurrentImageCount = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.imageUploads.currentCount;
	}, [uploadInfo]);

	// Get audio limit
	const getAudioLimit = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.audioUploads.limit;
	}, [uploadInfo]);

	// Get image limit
	const getImageLimit = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.imageUploads.limit;
	}, [uploadInfo]);

	// Get formatted reset time (resets daily at UTC midnight via cron job)
	const getFormattedResetTime = useCallback((): string => {
		return 'midnight UTC';
	}, []);

	// Smart periodic refresh - only when limits are low
	const shouldRefreshPeriodically = useCallback((): boolean => {
		if (!uploadInfo) return true;
		return uploadInfo.audioUploads.remaining <= 2 || uploadInfo.imageUploads.remaining <= 2;
	}, [uploadInfo]);

	// Fetch upload stats on mount and when user changes
	useEffect(() => {
		if (userId) {
			fetchUploadStats();
		}
	}, [userId, fetchUploadStats]);

	// Smart periodic refresh - only when needed
	useEffect(() => {
		if (!userId) return;

		let interval: NodeJS.Timeout;

		const startInterval = () => {
			interval = setInterval(
				async () => {
					// Only refresh if limits are low
					if (shouldRefreshPeriodically()) {
						await fetchUploadStats(true); // Force refresh - error handling is now built-in
					}
				},
				2 * 60 * 1000 // Reduced to 2 minutes, but only when needed
			);
		};

		// Only refresh when page is visible and user is active
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Page is hidden, clear interval
				if (interval) clearInterval(interval);
			} else {
				// Page is visible, start interval if needed
				if (shouldRefreshPeriodically()) {
					startInterval();
				}
			}
		};

		// Start interval if page is visible and refresh is needed
		if (!document.hidden && shouldRefreshPeriodically()) {
			startInterval();
		}

		// Listen for visibility changes
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (interval) clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [userId, shouldRefreshPeriodically, fetchUploadStats]);

	const value: UploadLimitContextType = useMemo(
		() => ({
			uploadInfo,
			loading,
			error,
			refreshUploadStats,
			checkCanUploadAudio,
			checkCanUploadImage,
			getRemainingAudioUploads,
			getRemainingImageUploads,
			getCurrentAudioCount,
			getCurrentImageCount,
			getAudioLimit,
			getImageLimit,
			getFormattedResetTime,
			incrementAudioUpload,
			incrementImageUpload,
		}),
		[
			uploadInfo,
			loading,
			error,
			refreshUploadStats,
			checkCanUploadAudio,
			checkCanUploadImage,
			getRemainingAudioUploads,
			getRemainingImageUploads,
			getCurrentAudioCount,
			getCurrentImageCount,
			getAudioLimit,
			getImageLimit,
			getFormattedResetTime,
			incrementAudioUpload,
			incrementImageUpload,
		]
	);

	return <UploadLimitContext.Provider value={value}>{children}</UploadLimitContext.Provider>;
};

export const useUploadLimit = (): UploadLimitContextType => {
	const context = useContext(UploadLimitContext);
	if (context === undefined) {
		throw new Error('useUploadLimit must be used within an UploadLimitProvider');
	}
	return context;
};

export default useUploadLimit;
