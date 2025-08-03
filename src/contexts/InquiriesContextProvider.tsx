import { createContext, ReactNode, useContext, useState } from 'react';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { Inquiry } from '../interfaces/inquiry';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface InquiriesContextTypes {
	inquiries: Inquiry[];
	loading: boolean;
	error: string | null;
	fetchInquiries: (page: number) => Promise<void>;
	fetchMoreInquiries: (startPage: number, endPage: number) => Promise<void>;
	refreshData: () => void;
	sortInquiries: (property: keyof Inquiry, order: 'asc' | 'desc') => void;
	removeInquiry: (inquiryId: string) => void;
	numberOfPages: number;
	inquiriesPageNumber: number;
	setInquiriesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
}

interface InquiriesContextProviderProps {
	children: ReactNode;
}

export const InquiriesContext = createContext<InquiriesContextTypes>({
	inquiries: [],
	loading: false,
	error: null,
	fetchInquiries: async () => {},
	fetchMoreInquiries: async () => {},
	refreshData: () => {},
	sortInquiries: () => {},
	removeInquiry: () => {},
	numberOfPages: 1,
	inquiriesPageNumber: 1,
	setInquiriesPageNumber: () => {},
	setNumberOfPages: () => {},
	totalItems: 0,
	loadedPages: [],
});

const InquiriesContextProvider = (props: InquiriesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const [inquiries, setInquiries] = useState<Inquiry[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [inquiriesPageNumber, setInquiriesPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
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

	const fetchInquiries = async (page: number) => {
		if (!orgId) return;
		try {
			// Fetch initial 2 records
			const url = `${base_url}/inquiries/organisation/${orgId}?page=1&limit=1000`;
			console.log('Fetching initial data:', url);
			const response = await axios.get(url);
			console.log('Response:', response.data);
			const sortedDataCopy = [...response.data.data].sort((a: Inquiry, b: Inquiry) => b.createdAt.localeCompare(a.createdAt));
			setInquiries(sortedDataCopy);
			setTotalItems(response.data.pagination.totalItems);
			setNumberOfPages(Math.ceil(response.data.pagination.totalItems / 100)); // 100 per page display
			setLoadedPages([1]);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMoreInquiries = async (startPage: number, endPage: number) => {
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
			let newInquiries: Inquiry[] = [];
			for (const page of pagesToFetch) {
				const url = `${base_url}/inquiries/organisation/${orgId}?page=${page}&limit=1000`;
				console.log('Fetching more data:', url);
				const response = await axios.get(url);
				newInquiries = [...newInquiries, ...response.data.data];
			}

			// Combine with existing data, remove duplicates, and sort
			const combinedData = [...inquiries, ...newInquiries];
			const uniqueData = combinedData.filter((inquiry, index, self) => index === self.findIndex((i) => i._id === inquiry._id));
			const sortedData = uniqueData.sort((a: Inquiry, b: Inquiry) => b.createdAt.localeCompare(a.createdAt));
			setInquiries(sortedData);
			setLoadedPages([...loadedPages, ...pagesToFetch]);

			console.log(`Loaded ${newInquiries.length} new inquiries. Total: ${sortedData.length}`);
		} catch (error) {
			console.error('Error fetching more inquiries:', error);
		}
	};

	const { isLoading, isError } = useQuery(['inquiries', orgId, inquiriesPageNumber], () => fetchInquiries(inquiriesPageNumber), {
		enabled: !!orgId && isAuthenticated && isAdmin && !isLoaded && !isLandingPageRoute,
		// keepPreviousData: true,
	});

	const sortInquiries = (property: keyof Inquiry, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...inquiries].sort((a: Inquiry, b: Inquiry) => {
			const aValue = a[property];
			const bValue = b[property];

			if (aValue === undefined || bValue === undefined) return 0;

			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setInquiries(sortedDataCopy);
	};

	const refreshData = () => {
		setIsLoaded(false);
	};

	const removeInquiry = (inquiryId: string) => {
		setInquiries((prev) => prev.filter((inquiry) => inquiry._id !== inquiryId));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<InquiriesContext.Provider
			value={{
				inquiries,
				loading: isLoading,
				error: isError ? 'Failed to fetch inquiries' : null,
				fetchInquiries,
				fetchMoreInquiries,
				refreshData,
				sortInquiries,
				removeInquiry,
				numberOfPages,
				inquiriesPageNumber,
				setInquiriesPageNumber,
				setNumberOfPages,
				totalItems,
				loadedPages,
			}}>
			{props.children}
		</InquiriesContext.Provider>
	);
};

export default InquiriesContextProvider;
