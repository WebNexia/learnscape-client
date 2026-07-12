import React, { createContext, useContext, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { UserAuthContext } from './UserAuthContextProvider';
import { shouldFetchUploadCounts } from '../utils/uploadCountsDataRoutes';

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
	incrementAudioUpload: () => void;
	incrementImageUpload: () => void;
}

const UploadLimitContext = createContext<UploadLimitContextType | undefined>(undefined);

interface UploadLimitProviderProps {
	children: ReactNode;
}

const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
	let timeout: ReturnType<typeof setTimeout>;
	return ((...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as T;
};

const UPLOAD_COUNTS_KEY = 'uploadCounts';

function uploadCountsQueryKey(userId: string) {
	return [UPLOAD_COUNTS_KEY, userId] as const;
}

function formatQueryError(queryError: unknown): string {
	if (queryError == null) return 'Failed to fetch upload statistics';
	const ax = queryError as { response?: { data?: { message?: string } }; message?: string };
	return ax.response?.data?.message || ax.message || 'Failed to fetch upload statistics';
}

export const UploadLimitProvider: React.FC<UploadLimitProviderProps> = ({ children }) => {
	const { userId } = useContext(UserAuthContext);
	const { pathname } = useLocation();
	const queryClient = useQueryClient();

	const uploadInfoRef = useRef<UploadInfo | null>(null);

	const queryKey = useMemo(() => uploadCountsQueryKey(userId), [userId]);

	const { data: uploadInfo = null, isLoading: loading, error: queryError, refetch } = useQuery(
		queryKey,
		async () => {
			const response = await axios.get('/users/upload-counts');
			return response.data.uploadInfo as UploadInfo;
		},
		{
			enabled: !!userId && shouldFetchUploadCounts(pathname),
			staleTime: 30 * 1000,
			cacheTime: 10 * 60 * 1000,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			retry: 1,
		}
	);

	uploadInfoRef.current = uploadInfo;

	const error = queryError ? formatQueryError(queryError) : null;

	useEffect(() => {
		if (!userId) {
			queryClient.removeQueries({ queryKey: [UPLOAD_COUNTS_KEY], exact: false });
		}
	}, [userId, queryClient]);

	const debouncedInvalidate = useMemo(
		() =>
			debounce(() => {
				if (userId) {
					void queryClient.invalidateQueries(uploadCountsQueryKey(userId));
				}
			}, 1000),
		[queryClient, userId]
	);

	const refreshUploadStats = useCallback(async () => {
		if (!userId) return;
		await refetch();
	}, [userId, refetch]);

	const incrementAudioUpload = useCallback(() => {
		if (!userId) return;
		queryClient.setQueryData<UploadInfo | undefined>(uploadCountsQueryKey(userId), (prev) => {
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
		debouncedInvalidate();
	}, [queryClient, userId, debouncedInvalidate]);

	const incrementImageUpload = useCallback(() => {
		if (!userId) return;
		queryClient.setQueryData<UploadInfo | undefined>(uploadCountsQueryKey(userId), (prev) => {
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
		debouncedInvalidate();
	}, [queryClient, userId, debouncedInvalidate]);

	const checkCanUploadAudio = useCallback((): boolean => {
		if (!uploadInfo) return true;
		return uploadInfo.audioUploads.remaining > 0;
	}, [uploadInfo]);

	const checkCanUploadImage = useCallback((): boolean => {
		if (!uploadInfo) return true;
		return uploadInfo.imageUploads.remaining > 0;
	}, [uploadInfo]);

	const getRemainingAudioUploads = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.audioUploads.remaining;
	}, [uploadInfo]);

	const getRemainingImageUploads = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.imageUploads.remaining;
	}, [uploadInfo]);

	const getCurrentAudioCount = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.audioUploads.currentCount;
	}, [uploadInfo]);

	const getCurrentImageCount = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.imageUploads.currentCount;
	}, [uploadInfo]);

	const getAudioLimit = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.audioUploads.limit;
	}, [uploadInfo]);

	const getImageLimit = useCallback((): number => {
		if (!uploadInfo) return 0;
		return uploadInfo.imageUploads.limit;
	}, [uploadInfo]);

	const getFormattedResetTime = useCallback((): string => {
		return 'midnight UTC';
	}, []);

	const shouldRefreshPeriodically = (): boolean => {
		const info = uploadInfoRef.current;
		if (!info) return true;
		return info.audioUploads.remaining <= 2 || info.imageUploads.remaining <= 2;
	};

	useEffect(() => {
		if (!userId) return;

		let interval: ReturnType<typeof setInterval> | undefined;

		const startInterval = () => {
			if (interval) return;
			interval = setInterval(() => {
				if (shouldRefreshPeriodically()) {
					void refetch();
				}
			}, 2 * 60 * 1000);
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (interval) {
					clearInterval(interval);
					interval = undefined;
				}
			} else if (shouldRefreshPeriodically()) {
				startInterval();
			}
		};

		if (!document.hidden && shouldRefreshPeriodically()) {
			startInterval();
		}

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (interval) clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [userId, refetch]);

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
