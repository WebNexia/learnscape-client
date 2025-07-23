import { useState, useEffect, useContext } from 'react';
import axios from '@utils/axiosInstance';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

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

interface UseUploadLimitReturn {
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

const useUploadLimit = (): UseUploadLimitReturn => {
	const { user, userId } = useContext(UserAuthContext);
	const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchUploadStats = async () => {
		if (!userId) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await axios.get('/users/upload-counts');
			setUploadInfo(response.data.uploadInfo);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to fetch upload statistics');
		} finally {
			setLoading(false);
		}
	};

	const refreshUploadStats = async () => {
		await fetchUploadStats();
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

	return {
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
};

export default useUploadLimit;
