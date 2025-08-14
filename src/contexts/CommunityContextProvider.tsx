import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';
import { useAuth } from '../hooks/useAuth';

import { useLocation } from 'react-router-dom';

interface CommunityContextTypes {
	sortedTopicsData: CommunityTopic[];
	sortTopicsData: (property: keyof CommunityTopic, order: 'asc' | 'desc') => void;
	addNewTopic: (newTopic: any) => void;
	removeTopic: (id: string) => void;
	updateTopics: (singleTopic: Partial<CommunityTopic>) => void;
	numberOfPages: number;
	topicsPageNumber: number;
	setTopicsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchTopics: (page: number) => void;
	fetchMoreTopics: (startPage: number, endPage: number) => void;
	totalItems: number;
	loadedPages: number[];
}

interface CommunityContextProviderProps {
	children: ReactNode;
}

export const CommunityContext = createContext<CommunityContextTypes>({
	sortedTopicsData: [],
	sortTopicsData: () => {},
	addNewTopic: () => {},
	removeTopic: () => {},
	updateTopics: () => {},
	numberOfPages: 1,
	topicsPageNumber: 1,
	setTopicsPageNumber: () => {},
	fetchTopics: () => {},
	fetchMoreTopics: () => {},
	totalItems: 0,
	loadedPages: [],
});

const CommunityContextProvider = (props: CommunityContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const location = useLocation();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const [sortedTopicsData, setSortedTopicsData] = useState<CommunityTopic[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [topicsPageNumber, setTopicsPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchTopics = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/communityTopics/organisation/${orgId}?page=${page}&limit=60`);

			// Initial sorting when fetching data
			const sortedTopicsDataCopy = [...response.data.data].sort((a: CommunityTopic, b: CommunityTopic) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedTopicsData(sortedTopicsDataCopy);
			setNumberOfPages(response.data.pagination.totalPages);
			setTotalItems(response.data.totalItems);
			setLoadedPages([1]);
			setIsLoaded(true);
			return response.data.data;
		} catch (error: any) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreTopics = async (startPage: number, endPage: number) => {
		if (!orgId) return;
		try {
			// Calculate which pages we need to fetch
			const pagesToFetch = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}

			if (pagesToFetch.length === 0) return; // Already loaded

			// Fetch missing pages
			let newTopics: CommunityTopic[] = [];
			for (const page of pagesToFetch) {
				const url = `${base_url}/communityTopics/organisation/${orgId}?page=${page}&limit=60`;
				const response = await axios.get(url);
				newTopics = [...newTopics, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...sortedTopicsData, ...newTopics];
			const uniqueData = combinedData.filter((topic, index, self) => index === self.findIndex((t) => t._id === topic._id));
			const sortedData = uniqueData.sort((a: CommunityTopic, b: CommunityTopic) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedTopicsData(sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more topics:', error);
		}
	};

	const { data, isLoading, isError } = useQuery(['allTopics', orgId, topicsPageNumber], () => fetchTopics(topicsPageNumber), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLoaded && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortTopicsData = (property: keyof CommunityTopic, order: 'asc' | 'desc') => {
		const sortedTopicsDataCopy = [...sortedTopicsData].sort((a: CommunityTopic, b: CommunityTopic) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setSortedTopicsData(sortedTopicsDataCopy);
	};
	// Function to update sortedTopicsData with new topic data
	const addNewTopic = (newTopic: any) => {
		setSortedTopicsData((prevSortedData) => [newTopic, ...prevSortedData]);
		setTotalItems((prevTotal) => prevTotal + 1);
	};

	const updateTopics = (singleTopic: Partial<CommunityTopic>) => {
		const updatedTopicList = sortedTopicsData?.map((topic) => {
			if (singleTopic._id === topic._id) {
				return { ...topic, ...singleTopic };
			}
			return topic;
		});
		setSortedTopicsData(updatedTopicList);
	};

	const removeTopic = (id: string) => {
		setSortedTopicsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
		setTotalItems((prevTotal) => Math.max(0, prevTotal - 1));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<CommunityContext.Provider
			value={{
				sortedTopicsData,
				sortTopicsData,
				addNewTopic,
				removeTopic,
				updateTopics,
				numberOfPages,
				topicsPageNumber,
				setTopicsPageNumber,
				fetchTopics,
				fetchMoreTopics,
				totalItems,
				loadedPages,
			}}>
			{props.children}
		</CommunityContext.Provider>
	);
};

export default CommunityContextProvider;
