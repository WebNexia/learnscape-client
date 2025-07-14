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
	refreshData: () => void;
	sortInquiries: (property: keyof Inquiry, order: 'asc' | 'desc') => void;
	removeInquiry: (inquiryId: string) => void;
	numberOfPages: number;
	inquiriesPageNumber: number;
	setInquiriesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
}

interface InquiriesContextProviderProps {
	children: ReactNode;
}

export const InquiriesContext = createContext<InquiriesContextTypes>({
	inquiries: [],
	loading: false,
	error: null,
	fetchInquiries: async () => {},
	refreshData: () => {},
	sortInquiries: () => {},
	removeInquiry: () => {},
	numberOfPages: 1,
	inquiriesPageNumber: 1,
	setInquiriesPageNumber: () => {},
	setNumberOfPages: () => {},
});

const InquiriesContextProvider = (props: InquiriesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const [inquiries, setInquiries] = useState<Inquiry[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [inquiriesPageNumber, setInquiriesPageNumber] = useState<number>(1);
	const location = useLocation();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		location.pathname.startsWith('/course/');

	const fetchInquiries = async (page: number) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/inquiries/organisation/${orgId}?page=${page}&limit=100`);
			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Inquiry, b: Inquiry) => b.createdAt.localeCompare(a.createdAt));
			setInquiries(sortedDataCopy);
			// Update to use the pagination data from the response
			setNumberOfPages(response.data.pagination.totalPages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
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
				refreshData,
				sortInquiries,
				removeInquiry,
				numberOfPages,
				inquiriesPageNumber,
				setInquiriesPageNumber,
				setNumberOfPages,
			}}>
			{props.children}
		</InquiriesContext.Provider>
	);
};

export default InquiriesContextProvider;
