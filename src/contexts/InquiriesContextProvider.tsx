// InquiriesContextProvider.tsx
import { createContext, ReactNode, useContext } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Inquiry } from '../interfaces/inquiry';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';

interface InquiriesContextTypes {
	inquiries: Inquiry[];
	loading: boolean;
	error: string | null;
	fetchInquiries: (page?: number) => Promise<Inquiry[]>;
	fetchMoreInquiries: (startPage: number, endPage: number) => Promise<void>;
	sortInquiries: (property: keyof Inquiry, order: 'asc' | 'desc') => Inquiry[];
	removeInquiry: (inquiryId: string) => void;
	inquiriesPageNumber: number;
	setInquiriesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
}

interface InquiriesContextProviderProps {
	children: ReactNode;
}

export const InquiriesContext = createContext<InquiriesContextTypes>({} as InquiriesContextTypes);

const InquiriesContextProvider = ({ children }: InquiriesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();

	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
	const {
		data: inquiries,
		isLoading,
		isError,
		fetchEntities: fetchInquiries,
		fetchMoreEntities: fetchMoreInquiries,
		removeEntity: removeInquiry,
		sortEntities: sortInquiries,
		pageNumber: inquiriesPageNumber,
		setPageNumber: setInquiriesPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Inquiry>({
		orgId,
		baseUrl: `${base_url}/inquiries/organisation/${orgId}`,
		entityKey: 'allInquiries',
		enabled: isAuthenticated && isAdmin && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

	return (
		<InquiriesContext.Provider
			value={{
				inquiries,
				loading: isLoading,
				error: isError ? 'Failed to fetch inquiries' : null,
				fetchInquiries,
				fetchMoreInquiries,
				sortInquiries,
				removeInquiry,
				inquiriesPageNumber,
				setInquiriesPageNumber,
				totalItems,
				loadedPages,
			}}>
			{children}
		</InquiriesContext.Provider>
	);
};

export default InquiriesContextProvider;

// import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
// import axios from '@utils/axiosInstance';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { useQuery, useQueryClient } from 'react-query';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { Inquiry } from '../interfaces/inquiry';
// import { useAuth } from '../hooks/useAuth';
// import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';

// interface InquiriesContextTypes {
// 	inquiries: Inquiry[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchInquiries: (page: number) => Promise<void>;
// 	fetchMoreInquiries: (startPage: number, endPage: number) => Promise<void>;

// 	sortInquiries: (property: keyof Inquiry, order: 'asc' | 'desc') => void;
// 	removeInquiry: (inquiryId: string) => void;
// 	inquiriesPageNumber: number;
// 	setInquiriesPageNumber: React.Dispatch<React.SetStateAction<number>>;
// 	totalItems: number;
// 	loadedPages: number[];
// }

// interface InquiriesContextProviderProps {
// 	children: ReactNode;
// }

// export const InquiriesContext = createContext<InquiriesContextTypes>({
// 	inquiries: [],
// 	loading: false,
// 	error: null,
// 	fetchInquiries: async () => {},
// 	fetchMoreInquiries: async () => {},

// 	sortInquiries: () => {},
// 	removeInquiry: () => {},
// 	inquiriesPageNumber: 1,
// 	setInquiriesPageNumber: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// });

// const InquiriesContextProvider = (props: InquiriesContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin } = useAuth();
// 	const [inquiriesPageNumber, setInquiriesPageNumber] = useState<number>(1);
// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);
// 	const location = useLocation();
// 	const queryClient = useQueryClient();
// 	const fetchInquiries = async (page: number) => {
// 		if (!orgId) return;
// 		try {
// 			// Fetch initial 500 records
// 			const url = `${base_url}/inquiries/organisation/${orgId}?page=${page}&limit=300`;
// 			const response = await axios.get(url);
// 			const sortedDataCopy = [...response.data.data].sort((a: Inquiry, b: Inquiry) => b.createdAt.localeCompare(a.createdAt));

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['inquiries', orgId, inquiriesPageNumber], sortedDataCopy);

// 			// Local state'i güncelle (pagination için)
// 			setTotalItems(response.data.totalItems);
// 			setLoadedPages([1]);

// 			return response.data.data;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchMoreInquiries = async (startPage: number, endPage: number) => {
// 		if (!orgId) return;
// 		try {
// 			// Calculate which pages we need to fetch
// 			const pagesToFetch: number[] = [];
// 			for (let page = startPage; page <= endPage; page++) {
// 				if (!loadedPages.includes(page)) {
// 					pagesToFetch.push(page);
// 				}
// 			}

// 			if (pagesToFetch && pagesToFetch.length === 0) return; // Already loaded

// 			// Fetch missing pages
// 			let newInquiries: Inquiry[] = [];
// 			for (const page of pagesToFetch) {
// 				const url = `${base_url}/inquiries/organisation/${orgId}?page=${page}&limit=300`;

// 				const response = await axios.get(url);
// 				newInquiries = [...newInquiries, ...response.data.data];
// 			}

// 			// Combine with existing data, remove duplicates, and sort
// 			const combinedData = [...(inquiriesData || []), ...newInquiries];
// 			const uniqueData = combinedData.filter((inquiry, index, self) => index === self.findIndex((i) => i._id === inquiry._id));
// 			const sortedData = uniqueData.sort((a: Inquiry, b: Inquiry) => b.createdAt.localeCompare(a.createdAt));

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['inquiries', orgId, inquiriesPageNumber], sortedData);

// 			setLoadedPages((prev) => Array.from(new Set([...prev, ...pagesToFetch])));
// 		} catch (error) {
// 			console.error('Error fetching more inquiries:', error);
// 		}
// 	};

// 	const {
// 		data: inquiriesData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['inquiries', orgId, inquiriesPageNumber], () => fetchInquiries(inquiriesPageNumber), {
// 		enabled: !!orgId && isAuthenticated && isAdmin && !isLandingPageRoute,
// 		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: false, // No refetch on component remount
// 	});

// 	// useEffect ile inquiriesData değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (inquiriesData) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(inquiriesData.length); // ❌ This breaks pagination

// 			setLoadedPages((prev) => (prev && prev.length === 0 ? [1] : prev));
// 		}
// 	}, [inquiriesData]);

// 	const sortInquiries = (property: keyof Inquiry, order: 'asc' | 'desc') => {
// 		const sortedDataCopy = [...(inquiriesData || [])].sort((a: Inquiry, b: Inquiry) => {
// 			const aValue = a[property];
// 			const bValue = b[property];

// 			if (aValue === undefined || bValue === undefined) return 0;

// 			if (order === 'asc') {
// 				return aValue > bValue ? 1 : -1;
// 			} else {
// 				return aValue < bValue ? 1 : -1;
// 			}
// 		});

// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['inquiries', orgId, inquiriesPageNumber], sortedDataCopy);
// 	};

// 	const removeInquiry = (inquiryId: string) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['inquiries', orgId, inquiriesPageNumber], (oldData: any) => {
// 			return oldData?.filter((inquiry: Inquiry) => inquiry._id !== inquiryId);
// 		});

// 		setTotalItems((prev) => Math.max(0, prev - 1));
// 	};

// 	if (isLoading) {
// 		return <Loading />;
// 	}

// 	if (isError) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<InquiriesContext.Provider
// 			value={{
// 				inquiries: inquiriesData || [], // React Query data kullan
// 				loading: isLoading,
// 				error: isError ? 'Failed to fetch inquiries' : null,
// 				fetchInquiries,
// 				fetchMoreInquiries,

// 				sortInquiries,
// 				removeInquiry,
// 				inquiriesPageNumber,
// 				setInquiriesPageNumber,
// 				totalItems,
// 				loadedPages,
// 			}}>
// 			{props.children}
// 		</InquiriesContext.Provider>
// 	);
// };

// export default InquiriesContextProvider;
