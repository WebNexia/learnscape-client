import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface CommunityContextTypes {
	sortedTopicsData: CommunityTopic[];
	isLoading: boolean;
	sortTopicsData: (property: keyof CommunityTopic, order: 'asc' | 'desc') => CommunityTopic[];
	addNewTopic: (newTopic: CommunityTopic) => void;
	removeTopic: (id: string) => void;
	updateTopics: (singleTopic: Partial<CommunityTopic>) => void;
	topicsPageNumber: number;
	setTopicsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchTopics: (page: number) => Promise<CommunityTopic[]>;
	fetchMoreTopics: (startPage: number, endPage: number) => Promise<void>;
	totalItems: number;
	loadedPages: number[];
	enableCommunityFetch: () => void;
	disableCommunityFetch: () => void;
	refreshCommunityData: () => void;
}

interface CommunityContextProviderProps {
	children: ReactNode;
}

export const CommunityContext = createContext<CommunityContextTypes>({
	sortedTopicsData: [],
	isLoading: false,
	sortTopicsData: () => [],
	addNewTopic: () => {},
	removeTopic: () => {},
	updateTopics: () => {},
	topicsPageNumber: 1,
	setTopicsPageNumber: () => {},
	fetchTopics: async () => [],
	fetchMoreTopics: async () => {},
	totalItems: 0,
	loadedPages: [],
	enableCommunityFetch: () => {},
	disableCommunityFetch: () => {},
	refreshCommunityData: () => {},
});

const CommunityContextProvider = (props: CommunityContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner, isInstructor } = useAuth();
	const location = useLocation();
	const queryClient = useQueryClient();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname?.includes('/userCourseId/'));

	const [topicsPageNumber, setTopicsPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [isEnabled, setIsEnabled] = useState<boolean>(true); // Start enabled to prevent flash

	const fetchTopics = async (page: number) => {
		if (!orgId) return [];

		try {
			const response = await axios.get(`${base_url}/communityTopics/organisation/${orgId}?page=${page}&limit=100`);

			// Update totalItems from server response
			const totalFromResponse = response.data.totalTopics || response.data.totalItems || response.data.data.length;
			setTotalItems(totalFromResponse);

			// Update loadedPages to track which pages we've fetched
			if (!loadedPages?.includes(page)) {
				setLoadedPages((prev) => [...prev, page]);
			}

			return response.data.data;
		} catch (error: any) {
			throw error;
		}
	};

	const fetchMoreTopics = async (startPage: number, endPage: number) => {
		if (!orgId) return;

		try {
			// Fetch all batches from startPage to endPage
			const promises = [];
			for (let page = startPage; page <= endPage; page++) {
				promises.push(axios.get(`${base_url}/communityTopics/organisation/${orgId}?page=${page}&limit=100`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			// Update React Query cache with new data
			const currentData = (queryClient.getQueryData(['allTopics', orgId]) as CommunityTopic[]) || [];
			queryClient.setQueryData(['allTopics', orgId], [...currentData, ...allData]);

			// Update loadedPages to track which pages we've fetched
			const newLoadedPages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
			setLoadedPages((prev) => [...prev, ...newLoadedPages]);
		} catch (error) {
			console.error('Error fetching more topics:', error);
			throw error;
		}
	};

	const { data: topicsData, isLoading } = useQuery(['allTopics', orgId], () => fetchTopics(1), {
		enabled: isEnabled && !!orgId && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute,
		staleTime: 0, // Data is always stale - refetch when returning to page
		cacheTime: 5 * 60 * 1000, // 5 minutes - data stays in cache
		refetchOnWindowFocus: true, // Refetch on window focus
		refetchOnMount: true, // Refetch on component remount
	});

	// Progressive pagination gap-filling (batched)
	useEffect(() => {
		if (loadedPages && loadedPages.length > 0 && orgId) {
			const sortedPages = [...(loadedPages || [])]?.sort((a, b) => a - b) || [];
			const maxPage = Math.max(...sortedPages);

			let missingStart: number | null = null;

			for (let page = 1; page <= maxPage; page++) {
				if (!loadedPages?.includes(page)) {
					if (missingStart === null) {
						missingStart = page; // start of a gap
					}
				} else if (missingStart !== null) {
					// end of gap -> fetch missing range
					fetchMoreTopics(missingStart, page - 1);
					missingStart = null;
				}
			}

			// if gap continues till the end
			if (missingStart !== null) {
				fetchMoreTopics(missingStart, maxPage);
			}
		}
	}, [loadedPages, orgId]);

	// React Query data değiştiğinde local state'i güncelle
	useEffect(() => {
		if (topicsData && topicsData.length > 0) {
			// Eğer loadedPages boşsa ilk page'i ekle
			setLoadedPages((prev) => (prev && prev.length === 0 ? [1] : prev));
		}
	}, [topicsData]);

	// Function to handle sorting
	const sortTopicsData = (property: keyof CommunityTopic, order: 'asc' | 'desc') => {
		// React Query data'yı sort et, local state'e set etme
		const sortedDataCopy = [...(topicsData || [])]?.sort((a: CommunityTopic, b: CommunityTopic) => {
			const aValue = a[property] ?? '';
			const bValue = b[property] ?? '';
			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		// Local state'e set etme, sadece sort edilmiş data'yı return et
		return sortedDataCopy;
	};

	// Function to update sortedTopicsData with new topic data
	const addNewTopic = (newTopic: CommunityTopic) => {
		queryClient.setQueryData(['allTopics', orgId], (oldData: CommunityTopic[] | undefined) => {
			return oldData ? [newTopic, ...oldData] : [newTopic];
		});
		// Also update totalItems
		setTotalItems((prev) => prev + 1);
	};

	const updateTopics = (singleTopic: Partial<CommunityTopic>) => {
		queryClient.setQueryData(['allTopics', orgId], (oldData: CommunityTopic[] | undefined) => {
			return (
				oldData?.map((topic) => {
					if (singleTopic._id === topic._id) {
						return { ...topic, ...singleTopic };
					}
					return topic;
				}) || []
			);
		});
	};

	const removeTopic = (id: string) => {
		queryClient.setQueryData(['allTopics', orgId], (oldData: CommunityTopic[] | undefined) => {
			return oldData?.filter((data) => data._id !== id) || [];
		});
		// Also update totalItems
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	// Get sorted topics data from React Query
	const sortedTopicsData = topicsData || [];

	const enableCommunityFetch = useCallback(() => setIsEnabled(true), []);
	const disableCommunityFetch = useCallback(() => setIsEnabled(false), []);
	const refreshCommunityData = useCallback(() => {
		// Invalidate and refetch the query
		queryClient.invalidateQueries(['allTopics', orgId]);
		// Reset pagination state
		setTopicsPageNumber(1);
		setLoadedPages([]);
	}, [orgId, queryClient]);

	return (
		<CommunityContext.Provider
			value={{
				sortedTopicsData,
				isLoading: isLoading || (isEnabled && !sortedTopicsData),
				sortTopicsData,
				addNewTopic,
				removeTopic,
				updateTopics,
				topicsPageNumber,
				setTopicsPageNumber,
				fetchTopics,
				fetchMoreTopics,
				totalItems,
				loadedPages,
				enableCommunityFetch,
				disableCommunityFetch,
				refreshCommunityData,
			}}>
			<DataFetchErrorBoundary context='Community'>{props.children}</DataFetchErrorBoundary>
		</CommunityContext.Provider>
	);
};

export default CommunityContextProvider;
