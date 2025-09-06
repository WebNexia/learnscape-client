// AdminPublicEventsContextProvider.tsx
import { createContext, ReactNode, useContext } from 'react';
import { useLocation } from 'react-router-dom';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';

import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';

import { Event } from '../interfaces/event';
import { useAuth } from '../hooks/useAuth';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { Roles } from '../interfaces/enums';

interface AdminPublicEventsContextTypes {
	publicEvents: Event[];
	loading: boolean;
	error: string | null;
	fetchPublicEvents: (page?: number) => Promise<Event[]>;
	fetchMorePublicEvents: (startPage: number, endPage: number) => Promise<void>;
	sortPublicEventsData: (property: keyof Event, order: 'asc' | 'desc') => Event[];
	totalItems: number;
	loadedPages: number[];
	publicEventsPageNumber: number;
	setPublicEventsPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

interface AdminPublicEventsContextProviderProps {
	children: ReactNode;
}

export const AdminPublicEventsContext = createContext<AdminPublicEventsContextTypes>({} as AdminPublicEventsContextTypes);

const AdminPublicEventsContextProvider = ({ children }: AdminPublicEventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const location = useLocation();

	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

	const {
		data: publicEvents,
		isLoading,
		isError,
		fetchEntities: fetchPublicEvents,
		fetchMoreEntities: fetchMorePublicEvents,
		sortEntities: sortPublicEventsData,
		pageNumber: publicEventsPageNumber,
		setPageNumber: setPublicEventsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Event>({
		orgId,
		baseUrl: `${base_url}/events/public/${orgId}?upcomingOnly=false`,
		entityKey: 'allPublicEvents',
		enabled: isAuthenticated && isAdmin && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

	return (
		<AdminPublicEventsContext.Provider
			value={{
				publicEvents,
				loading: isLoading,
				error: isError ? 'Error loading public events' : null,
				fetchPublicEvents,
				fetchMorePublicEvents,
				sortPublicEventsData,
				totalItems,
				loadedPages,
				publicEventsPageNumber,
				setPublicEventsPageNumber,
			}}>
			{children}
		</AdminPublicEventsContext.Provider>
	);
};

export default AdminPublicEventsContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { Event } from '../interfaces/event';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { useAuth } from '../hooks/useAuth';
// import { useLocation } from 'react-router-dom';

// interface AdminPublicEventsContextTypes {
// 	publicEvents: Event[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchPublicEvents: (page: number) => Promise<void>;
// 	fetchMorePublicEvents: (startPage: number, endPage: number) => Promise<void>;
// 	sortPublicEventsData: (property: keyof Event, order: 'asc' | 'desc') => void;
// 	addNewEvent: (newEvent: Event) => void;
// 	updateEvent: (singleEvent: Event) => void;
// 	removeEvent: (id: string) => void;
// 	totalItems: number;
// 	loadedPages: number[];
// 	publicEventsPageNumber: number;
// 	setPublicEventsPageNumber: React.Dispatch<React.SetStateAction<number>>;
// }

// interface AdminPublicEventsContextProviderProps {
// 	children: ReactNode;
// }

// export const AdminPublicEventsContext = createContext<AdminPublicEventsContextTypes>({
// 	publicEvents: [],
// 	loading: false,
// 	error: null,
// 	fetchPublicEvents: async () => {},
// 	fetchMorePublicEvents: async () => {},
// 	sortPublicEventsData: () => {},
// 	addNewEvent: () => {},
// 	updateEvent: () => {},
// 	removeEvent: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// 	publicEventsPageNumber: 1,
// 	setPublicEventsPageNumber: () => {},
// });

// const AdminPublicEventsContextProvider = (props: AdminPublicEventsContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin } = useAuth();
// 	const location = useLocation();
// 	const queryClient = useQueryClient();

// 	const isLandingPageRoute =
// 		location.pathname === '/' ||
// 		location.pathname === '/landing-page-courses' ||
// 		location.pathname === '/resources' ||
// 		location.pathname === '/contact-us' ||
// 		location.pathname === '/about-us' ||
// 		location.pathname === '/auth' ||
// 		// Only consider course preview pages as landing pages, not enrolled course pages
// 		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

// 	// State for pagination
// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);
// 	const [publicEventsPageNumber, setPublicEventsPageNumber] = useState<number>(1);

// 	const fetchPublicEvents = async (page: number = 1) => {
// 		if (!orgId) return;

// 		try {
// 			const response = await axios.get(`${base_url}/events/public/${orgId}?upcomingOnly=false&page=${page}&limit=200`);

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['allPublicEvents', orgId], response.data.data);

// 			setTotalItems(response.data.totalItems || response.data.data.length);
// 			setLoadedPages((prev) => [...prev, page]); // Mevcut page'leri koru, yenisini ekle
// 			return response.data.data;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchMorePublicEvents = async (startPage: number, endPage: number) => {
// 		if (!orgId) return;

// 		try {
// 			// Fetch all batches from startPage to endPage
// 			const promises = [];
// 			for (let page = startPage; page <= endPage; page++) {
// 				promises.push(axios.get(`${base_url}/events/public/${orgId}?upcomingOnly=false&page=${page}&limit=200`));
// 			}

// 			const responses = await Promise.all(promises);
// 			const allData = responses.flatMap((response) => response.data.data);

// 			// Update React Query cache with new data
// 			const currentData = (queryClient.getQueryData(['allPublicEvents', orgId]) as Event[]) || [];
// 			queryClient.setQueryData(['allPublicEvents', orgId], [...currentData, ...allData]);

// 			// Update loadedPages to track which pages we've fetched
// 			const newLoadedPages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
// 			setLoadedPages((prev) => [...prev, ...newLoadedPages]);
// 		} catch (error) {
// 			console.error('Error fetching more public events:', error);
// 			throw error;
// 		}
// 	};

// 	const {
// 		data: publicEventsData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['allPublicEvents', orgId], () => fetchPublicEvents(1), {
// 		enabled: !!orgId && isAuthenticated && isAdmin && !isLandingPageRoute,
// 		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: false, // No refetch on component remount
// 	});

// 	// Progressive pagination için aradaki boşlukları doldur
// 	useEffect(() => {
// 		if (loadedPages.length > 0 && orgId) {
// 			const sortedPages = [...loadedPages].sort((a, b) => a - b);
// 			const maxPage = Math.max(...sortedPages);

// 			// Aradaki boşlukları bul ve yükle
// 			for (let page = 1; page <= maxPage; page++) {
// 				if (!loadedPages.includes(page)) {
// 					console.log(`🔄 Loading missing page ${page} for progressive pagination`);
// 					fetchPublicEvents(page);
// 				}
// 			}
// 		}
// 	}, [loadedPages, orgId]);

// 	// React Query data değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (publicEventsData && publicEventsData.length > 0) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(publicEventsData.length); // ❌ This breaks pagination

// 			// Eğer loadedPages boşsa ilk page'i ekle
// 			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
// 		}
// 	}, [publicEventsData]);

// 	// Function to handle sorting
// 	const sortPublicEventsData = (property: keyof Event, order: 'asc' | 'desc') => {
// 		// React Query data'yı sort et, local state'e set etme
// 		const sortedDataCopy = [...(publicEventsData || [])].sort((a: Event, b: Event) => {
// 			const aValue = a[property] ?? '';
// 			const bValue = b[property] ?? '';
// 			if (order === 'asc') {
// 				return aValue > bValue ? 1 : -1;
// 			} else {
// 				return aValue < bValue ? 1 : -1;
// 			}
// 		});
// 		// Local state'e set etme, sadece sort edilmiş data'yı return et
// 		return sortedDataCopy;
// 	};

// 	// CRUD functions to keep data in sync with Calendar
// 	const addNewEvent = (newEvent: Event) => {
// 		queryClient.setQueryData(['allPublicEvents', orgId], (oldData: Event[] | undefined) => {
// 			return oldData ? [newEvent, ...oldData] : [newEvent];
// 		});
// 		// Also update totalItems
// 		setTotalItems((prev) => prev + 1);
// 	};

// 	const updateEvent = (singleEvent: Event) => {
// 		queryClient.setQueryData(['allPublicEvents', orgId], (oldData: Event[] | undefined) => {
// 			return (
// 				oldData?.map((event) => {
// 					if (singleEvent._id === event._id) {
// 						return singleEvent;
// 					}
// 					return event;
// 				}) || []
// 			);
// 		});
// 	};

// 	const removeEvent = (id: string) => {
// 		queryClient.setQueryData(['allPublicEvents', orgId], (oldData: Event[] | undefined) => {
// 			return oldData?.filter((data) => data._id !== id) || [];
// 		});
// 		// Also update totalItems
// 		setTotalItems((prev) => Math.max(0, prev - 1));
// 	};

// 	if (isLoading) {
// 		return <Loading />;
// 	}

// 	if (isError) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<AdminPublicEventsContext.Provider
// 			value={{
// 				publicEvents: publicEventsData || [], // React Query data kullan
// 				loading: isLoading,
// 				error: isError ? 'Error loading public events' : null,
// 				fetchPublicEvents,
// 				fetchMorePublicEvents,
// 				sortPublicEventsData,
// 				addNewEvent,
// 				updateEvent,
// 				removeEvent,
// 				totalItems, // Backend'den gerçek total
// 				loadedPages, // Progressive pagination için
// 				publicEventsPageNumber,
// 				setPublicEventsPageNumber,
// 			}}>
// 			{props.children}
// 		</AdminPublicEventsContext.Provider>
// 	);
// };

// export default AdminPublicEventsContextProvider;
