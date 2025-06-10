import { createContext, ReactNode, useContext, useState } from 'react';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { ContactRequest } from '../interfaces/contactRequest';

interface ContactRequestsContextTypes {
	contactRequests: ContactRequest[];
	loading: boolean;
	error: string | null;
	fetchContactRequests: (page: number) => Promise<void>;
	refreshData: () => void;
	sortContactRequests: (property: keyof ContactRequest, order: 'asc' | 'desc') => void;
	removeRequest: (requestId: string) => void;
	numberOfPages: number;
	requestsPageNumber: number;
	setRequestsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
}

interface ContactRequestsContextProviderProps {
	children: ReactNode;
}

export const ContactRequestsContext = createContext<ContactRequestsContextTypes>({
	contactRequests: [],
	loading: false,
	error: null,
	fetchContactRequests: async () => {},
	refreshData: () => {},
	sortContactRequests: () => {},
	removeRequest: () => {},
	numberOfPages: 1,
	requestsPageNumber: 1,
	setRequestsPageNumber: () => {},
	setNumberOfPages: () => {},
});

const ContactRequestsContextProvider = (props: ContactRequestsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [requestsPageNumber, setRequestsPageNumber] = useState<number>(1);

	const fetchContactRequests = async (page: number) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/contact-requests/organisation/${orgId}?page=${page}&limit=100`);
			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: ContactRequest, b: ContactRequest) => b.createdAt.localeCompare(a.createdAt));
			setContactRequests(sortedDataCopy);
			// Update to use the pagination data from the response
			setNumberOfPages(response.data.pagination.totalPages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const { isLoading, isError } = useQuery(['contactRequests', orgId, requestsPageNumber], () => fetchContactRequests(requestsPageNumber), {
		enabled: !!orgId && !isLoaded,
		// keepPreviousData: true,
	});

	const sortContactRequests = (property: keyof ContactRequest, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...contactRequests].sort((a: ContactRequest, b: ContactRequest) => {
			const aValue = a[property];
			const bValue = b[property];

			if (aValue === undefined || bValue === undefined) return 0;

			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setContactRequests(sortedDataCopy);
	};

	const refreshData = () => {
		setIsLoaded(false);
	};

	const removeRequest = (requestId: string) => {
		setContactRequests((prev) => prev.filter((request) => request._id !== requestId));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<ContactRequestsContext.Provider
			value={{
				contactRequests,
				loading: isLoading,
				error: isError ? 'Failed to fetch info requests' : null,
				fetchContactRequests,
				refreshData,
				sortContactRequests,
				removeRequest,
				numberOfPages,
				requestsPageNumber,
				setRequestsPageNumber,
				setNumberOfPages,
			}}>
			{props.children}
		</ContactRequestsContext.Provider>
	);
};

export default ContactRequestsContextProvider;
