import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { Event } from '../interfaces/event';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface PublicEventsContextTypes {
	publicEvents: Event[];
	loading: boolean;
	error: string | null;
	fetchPublicEvents: (page: number) => Promise<void>;
	fetchMorePublicEvents: (startPage: number, endPage: number) => Promise<void>;
	refreshData: () => void;
	sortPublicEventsData: (property: keyof Event, order: 'asc' | 'desc') => void;
	numberOfPages: number;
	publicEventsPageNumber: number;
	setPublicEventsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
}

interface PublicEventsContextProviderProps {
	children: ReactNode;
}

export const PublicEventsContext = createContext<PublicEventsContextTypes>({
	publicEvents: [],
	loading: false,
	error: null,
	fetchPublicEvents: async () => {},
	fetchMorePublicEvents: async () => {},
	refreshData: () => {},
	sortPublicEventsData: () => {},
	numberOfPages: 1,
	publicEventsPageNumber: 1,
	setPublicEventsPageNumber: () => {},
	setNumberOfPages: () => {},
	totalItems: 0,
	loadedPages: [],
});

const PublicEventsContextProvider = (props: PublicEventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated } = useAuth();
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

	// For landing pages, use default orgId if OrganisationContext doesn't provide one
	const effectiveOrgId = isLandingPageRoute && !orgId ? import.meta.env.VITE_ORG_ID : orgId;

	const [publicEvents, setPublicEvents] = useState<Event[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [publicEventsPageNumber, setPublicEventsPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const fetchPublicEvents = async (page: number = 1) => {
		if (!effectiveOrgId) return;
		try {
			// For landing page, fetch upcoming events only; for admin pages, fetch all public events
			const upcomingOnly = isLandingPageRoute ? 'true' : 'false';
			// Landing page: limit 50 upcoming events, Admin page: limit 200 total events
			const limit = isLandingPageRoute ? '50' : '200';
			const response = await axios.get(`${base_url}/events/public/${effectiveOrgId}?upcomingOnly=${upcomingOnly}&page=${page}&limit=${limit}`);

			const eventsData = response.data.data;
			setPublicEvents(eventsData);
			setTotalItems(response.data.totalItems);
			setNumberOfPages(Math.ceil(response.data.totalItems / 50)); // 50 per page display
			setLoadedPages([page]);
			setIsLoaded(true);
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMorePublicEvents = async (startPage: number, endPage: number) => {
		if (!effectiveOrgId) return;
		try {
			// Find which pages we need to fetch
			const pagesToFetch = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}

			if (pagesToFetch.length === 0) return; // Already loaded

			// Fetch missing pages
			let newEvents: Event[] = [];
			const upcomingOnly = isLandingPageRoute ? 'true' : 'false';
			const limit = isLandingPageRoute ? '50' : '200';
			for (const page of pagesToFetch) {
				const response = await axios.get(`${base_url}/events/public/${effectiveOrgId}?upcomingOnly=${upcomingOnly}&page=${page}&limit=${limit}`);
				newEvents = [...newEvents, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and maintain server order
			const combinedData = [...publicEvents, ...newEvents];
			const uniqueData = combinedData.filter((event, index, self) => index === self.findIndex((e) => e._id === event._id));
			// Don't re-sort - maintain the order from server (which is already sorted by backend)
			setPublicEvents(uniqueData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);
		} catch (error) {
			console.error('Error fetching more public events:', error);
		}
	};

	const { isLoading, isError } = useQuery(
		['allPublicEvents', effectiveOrgId, publicEventsPageNumber],
		() => fetchPublicEvents(publicEventsPageNumber),
		{
			enabled: !!effectiveOrgId && !isLoaded && (isLandingPageRoute || isAuthenticated),
		}
	);

	// Function to handle sorting
	const sortPublicEventsData = (property: keyof Event, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...publicEvents].sort((a: Event, b: Event) => {
			const aValue = a[property] ?? '';
			const bValue = b[property] ?? '';
			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setPublicEvents(sortedDataCopy);
	};

	const refreshData = () => {
		setIsLoaded(false);
		setLoadedPages([]);
		fetchPublicEvents(1);
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<PublicEventsContext.Provider
			value={{
				publicEvents,
				loading: isLoading,
				error: isError ? 'Error loading public events' : null,
				fetchPublicEvents,
				fetchMorePublicEvents,
				refreshData,
				sortPublicEventsData,
				numberOfPages,
				publicEventsPageNumber,
				setPublicEventsPageNumber,
				setNumberOfPages,
				totalItems,
				loadedPages,
			}}>
			{props.children}
		</PublicEventsContext.Provider>
	);
};

export default PublicEventsContextProvider;
