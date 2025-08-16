import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const UploadLimitContext = createContext<UploadLimitContextType | undefined>(undefined);

interface UploadLimitProviderProps {
	children: ReactNode;
}

export const UploadLimitProvider: React.FC<UploadLimitProviderProps> = ({ children }) => {
	const { user, userId } = useContext(UserAuthContext);
	const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [lastFetchTime, setLastFetchTime] = useState<number>(0);
	const [isFetching, setIsFetching] = useState<boolean>(false);

	const fetchUploadStats = async (forceRefresh = false) => {
		if (!userId) {
			return;
		}

		// Prevent multiple simultaneous requests
		if (isFetching) {
			return;
		}

		// Cache for 30 seconds to prevent excessive API calls
		const now = Date.now();
		if (!forceRefresh && uploadInfo && now - lastFetchTime < 30000) {
			return;
		}

		setIsFetching(true);
		setLoading(true);
		setError(null);

		try {
			const response = await axios.get('/users/upload-counts');
			setUploadInfo(response.data.uploadInfo);
			setLastFetchTime(now);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch upload statistics');
		} finally {
			setLoading(false);
			setIsFetching(false);
		}
	};

	const refreshUploadStats = async () => {
		await fetchUploadStats(true);
	};

	// Check if user can upload audio
	const checkCanUploadAudio = (): boolean => {
		if (!uploadInfo || user?.role === 'admin') return true;
		return uploadInfo.audioUploads.remaining > 0;
	};

	// Check if user can upload images
	const checkCanUploadImage = (): boolean => {
		if (!uploadInfo || user?.role === 'admin') return true;
		return uploadInfo.imageUploads.remaining > 0;
	};

	// Get remaining audio uploads
	const getRemainingAudioUploads = (): number => {
		if (!uploadInfo || user?.role === 'admin') return 10;
		return uploadInfo.audioUploads.remaining;
	};

	// Get remaining image uploads
	const getRemainingImageUploads = (): number => {
		if (!uploadInfo || user?.role === 'admin') return 50;
		return uploadInfo.imageUploads.remaining;
	};

	// Get current audio count
	const getCurrentAudioCount = (): number => {
		if (!uploadInfo || user?.role === 'admin') return 0;
		return uploadInfo.audioUploads.currentCount;
	};

	// Get current image count
	const getCurrentImageCount = (): number => {
		if (!uploadInfo || user?.role === 'admin') return 0;
		return uploadInfo.imageUploads.currentCount;
	};

	// Get audio limit
	const getAudioLimit = (): number => {
		if (!uploadInfo || user?.role === 'admin') return 10;
		return uploadInfo.audioUploads.limit;
	};

	// Get image limit
	const getImageLimit = (): number => {
		if (!uploadInfo || user?.role === 'admin') return 50;
		return uploadInfo.imageUploads.limit;
	};

	// Get formatted reset time (next day at user's timezone midnight)
	const getFormattedResetTime = (): string => {
		if (!user?.countryCode) return 'midnight UTC';

		const timezoneOffsets: { [key: string]: string } = {
			TR: 'midnight (UTC+3)',
			US: 'midnight (UTC-5)',
			GB: 'midnight (UTC+0)',
			DE: 'midnight (UTC+1)',
			FR: 'midnight (UTC+1)',
			IT: 'midnight (UTC+1)',
			ES: 'midnight (UTC+1)',
			CA: 'midnight (UTC-5)',
			AU: 'midnight (UTC+10)',
		};

		return timezoneOffsets[user.countryCode] || 'midnight UTC';
	};

	// Fetch upload stats on mount and when user changes
	useEffect(() => {
		if (userId) {
			fetchUploadStats();
		}
	}, [userId]);

	// Periodic refresh every 5 minutes to handle stale data
	useEffect(() => {
		if (!userId) return;

		let interval: NodeJS.Timeout;

		// Only refresh when page is visible and user is active
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Page is hidden, clear interval
				if (interval) clearInterval(interval);
			} else {
				// Page is visible, start interval
				interval = setInterval(
					async () => {
						try {
							await fetchUploadStats(true); // Force refresh
						} catch (error) {
							console.warn('Failed to refresh upload stats:', error);
							// Don't throw error, just log it
						}
					},
					5 * 60 * 1000
				); // 5 minutes
			}
		};

		// Start interval if page is visible
		if (!document.hidden) {
			interval = setInterval(
				async () => {
					try {
						await fetchUploadStats(true); // Force refresh
					} catch (error) {
						console.warn('Failed to refresh upload stats:', error);
					}
				},
				5 * 60 * 1000
			); // 5 minutes
		}

		// Listen for visibility changes
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (interval) clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [userId]);

	const value: UploadLimitContextType = {
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
	};

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
