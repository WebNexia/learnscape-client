// PromoCodesContextProvider.tsx
import { ReactNode, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { PromoCode } from '../interfaces/promoCode';
import { Roles } from '../interfaces/enums';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';

interface PromoCodesContextTypes {
	promoCodes: PromoCode[];
	loading: boolean;
	error: string | null;
	sortPromoCodesData: (property: keyof PromoCode, order: 'asc' | 'desc') => PromoCode[];
	addNewPromoCode: (newPromoCode: PromoCode) => void;
	removePromoCode: (id: string) => void;
	updatePromoCode: (promoCode: PromoCode) => void;
	totalItems: number;
	loadedPages: number[];
	promoCodesPageNumber: number;
	setPromoCodesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPromoCodes: (page?: number) => Promise<PromoCode[]>;
	fetchMorePromoCodes: (startPage: number, endPage: number) => Promise<void>;
}

interface PromoCodesContextProviderProps {
	children: ReactNode;
}

export const PromoCodesContext = createContext<PromoCodesContextTypes>({} as PromoCodesContextTypes);

const PromoCodesContextProvider = ({ children }: PromoCodesContextProviderProps) => {
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
		(location.pathname.startsWith('/course/') && !location.pathname?.includes('/userCourseId/'));

	const {
		data: promoCodes,
		isLoading,
		isError,
		sortEntities: sortPromoCodesData,
		addEntity: addNewPromoCode,
		updateEntity: updatePromoCode,
		removeEntity: removePromoCode,
		pageNumber: promoCodesPageNumber,
		setPageNumber: setPromoCodesPageNumber,
		totalItems,
		loadedPages,
		fetchEntities: fetchPromoCodes,
		fetchMoreEntities: fetchMorePromoCodes,
	} = usePaginatedEntity<PromoCode>({
		orgId,
		baseUrl: `${base_url}/promocodes/organisation/${orgId}`,
		entityKey: 'promoCodes',
		enabled: isAuthenticated && isAdmin && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

	return (
		<PromoCodesContext.Provider
			value={{
				promoCodes,
				loading: isLoading,
				error: isError ? 'Failed to fetch promo codes' : null,
				sortPromoCodesData,
				addNewPromoCode,
				updatePromoCode,
				removePromoCode,
				totalItems,
				loadedPages,
				promoCodesPageNumber,
				setPromoCodesPageNumber,
				fetchPromoCodes,
				fetchMorePromoCodes,
			}}>
			{children}
		</PromoCodesContext.Provider>
	);
};

export default PromoCodesContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import { useLocation } from 'react-router-dom';

// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { PromoCode } from '../interfaces/promoCode';
// import { useAuth } from '../hooks/useAuth';

// interface PromoCodesContextTypes {
// 	promoCodes: PromoCode[];
// 	sortPromoCodesData: (property: keyof PromoCode, order: 'asc' | 'desc') => void;
// 	addNewPromoCode: (newPromoCode: any) => void;
// 	removePromoCode: (id: string) => void;
// 	updatePromoCode: (singlePromoCode: PromoCode) => void;
// 	totalItems: number;
// 	loadedPages: number[];
// 	promoCodesPageNumber: number;
// 	setPromoCodesPageNumber: React.Dispatch<React.SetStateAction<number>>;
// 	fetchPromoCodes: (page: number) => Promise<{ data: PromoCode[]; totalItems: number }>;
// 	fetchMorePromoCodes: (startBatch: number, endBatch: number) => Promise<void>;
// }

// interface PromoCodesContextProviderProps {
// 	children: ReactNode;
// }

// export const PromoCodesContext = createContext<PromoCodesContextTypes>({
// 	promoCodes: [],
// 	sortPromoCodesData: () => {},
// 	addNewPromoCode: () => {},
// 	removePromoCode: () => {},
// 	updatePromoCode: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// 	promoCodesPageNumber: 1,
// 	setPromoCodesPageNumber: () => {},
// 	fetchPromoCodes: () => Promise.resolve({ data: [], totalItems: 0 }),
// 	fetchMorePromoCodes: () => Promise.resolve(),
// });

// const PromoCodesContextProvider = (props: PromoCodesContextProviderProps) => {
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
// 		(location.pathname.startsWith('/course/') && !location.pathname?.includes('/userCourseId/'));

// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);
// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [promoCodesPageNumber, setPromoCodesPageNumber] = useState<number>(1);

// 	const fetchPromoCodes = async (page: number = 1): Promise<{ data: PromoCode[]; totalItems: number }> => {
// 		if (!orgId) return { data: [], totalItems: 0 };

// 		try {
// 			const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?page=${page}&limit=200`);
// 			return {
// 				data: response.data.data,
// 				totalItems: response.data.totalItems || response.data.data.length,
// 			};
// 		} catch (error) {
// 			console.error('Error fetching promoCodes:', error);
// 			throw error;
// 		}
// 	};

// 	const fetchMorePromoCodes = async (startBatch: number, endBatch: number): Promise<void> => {
// 		if (!orgId) return;

// 		try {
// 			const promises = [];
// 			for (let page = startBatch; page <= endBatch; page++) {
// 				promises.push(axios.get(`${base_url}/promoCodes/organisation/${orgId}?page=${page}&limit=200`));
// 			}

// 			const responses = await Promise.all(promises);
// 			const allData = responses.flatMap((response) => response.data.data);

// 			// Update React Query cache with new data
// 			const currentData = (queryClient.getQueryData(['allPromoCodes', orgId]) as PromoCode[]) || [];
// 			queryClient.setQueryData(['allPromoCodes', orgId], [...currentData, ...allData]);

// 			// Update loadedPages to track which pages we've fetched
// 			const newLoadedPages = Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i);
// 			setLoadedPages((prev) => [...prev, ...newLoadedPages]);
// 		} catch (error) {
// 			console.error('Error fetching more promoCodes:', error);
// 			throw error;
// 		}
// 	};

// 	const {
// 		data: promoCodesResponse,
// 		isLoading,
// 		isError,
// 	} = useQuery(['allPromoCodes', orgId], () => fetchPromoCodes(1), {
// 		enabled: !!orgId && isAuthenticated && isAdmin && !isLandingPageRoute,
// 		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: false, // No refetch on component remount
// 	});

// 	// Extract promoCodes data from response
// 	const promoCodesData = promoCodesResponse?.data || [];

// 	// Update state when data changes (same pattern as other contexts)
// 	useEffect(() => {
// 		if (promoCodesResponse) {
// 			setTotalItems(promoCodesResponse.totalItems);
// 			setLoadedPages([1]); // First page is loaded
// 		}
// 	}, [promoCodesResponse]);

// 	// Function to handle sorting
// 	const sortPromoCodesData = (property: keyof PromoCode, order: 'asc' | 'desc') => {
// 		// React Query data'yı sort et, local state'e set etme
// 		const sortedDataCopy = [...(promoCodesData || [])].sort((a: PromoCode, b: PromoCode) => {
// 			if (order === 'asc') {
// 				return a[property]! > b[property]! ? 1 : -1;
// 			} else {
// 				return a[property]! < b[property]! ? 1 : -1;
// 			}
// 		});
// 		// Local state'e set etme, sadece sort edilmiş data'yı return et
// 		return sortedDataCopy;
// 	};

// 	// Function to update promoCodes with new promoCode data
// 	const addNewPromoCode = (newPromoCode: any) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allPromoCodes', orgId], (oldData: any) => {
// 			return oldData ? [newPromoCode, ...oldData] : [newPromoCode];
// 		});
// 	};

// 	const updatePromoCode = (singlePromoCode: PromoCode) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allPromoCodes', orgId], (oldData: any) => {
// 			return oldData?.map((code: PromoCode) => (code._id === singlePromoCode._id ? singlePromoCode : code));
// 		});
// 	};

// 	const removePromoCode = (id: string) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allPromoCodes', orgId], (oldData: any) => {
// 			return oldData?.filter((code: PromoCode) => code._id !== id);
// 		});
// 	};

// 	if (isLoading) {
// 		return <Loading />;
// 	}

// 	if (isError) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<PromoCodesContext.Provider
// 			value={{
// 				promoCodes: promoCodesData || [],
// 				sortPromoCodesData,
// 				addNewPromoCode,
// 				removePromoCode,
// 				updatePromoCode,
// 				totalItems,
// 				loadedPages,
// 				promoCodesPageNumber,
// 				setPromoCodesPageNumber,
// 				fetchPromoCodes,
// 				fetchMorePromoCodes,
// 			}}>
// 			{props.children}
// 		</PromoCodesContext.Provider>
// 	);
// };

// export default PromoCodesContextProvider;
