import { createContext, ReactNode, useContext, useState } from 'react';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { InfoRequest } from '../interfaces/infoRequest';

interface InfoRequestsContextTypes {
	infoRequests: InfoRequest[];
	loading: boolean;
	error: string | null;
	fetchInfoRequests: (page: number) => Promise<void>;
	refreshData: () => void;
	sortInfoRequests: (property: keyof InfoRequest, order: 'asc' | 'desc') => void;
	removeRequest: (requestId: string) => void;
	numberOfPages: number;
	requestsPageNumber: number;
	setRequestsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	setNumberOfPages: React.Dispatch<React.SetStateAction<number>>;
}

interface InfoRequestsContextProviderProps {
	children: ReactNode;
}

export const InfoRequestsContext = createContext<InfoRequestsContextTypes>({
	infoRequests: [],
	loading: false,
	error: null,
	fetchInfoRequests: async () => {},
	refreshData: () => {},
	sortInfoRequests: () => {},
	removeRequest: () => {},
	numberOfPages: 1,
	requestsPageNumber: 1,
	setRequestsPageNumber: () => {},
	setNumberOfPages: () => {},
});

const InfoRequestsContextProvider = (props: InfoRequestsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [requestsPageNumber, setRequestsPageNumber] = useState<number>(1);

	const fetchInfoRequests = async (page: number) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/course-information-requests/organisation/${orgId}?page=${page}&limit=100`);
			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: InfoRequest, b: InfoRequest) => b.createdAt.localeCompare(a.createdAt));
			setInfoRequests(sortedDataCopy);
			// Update to use the pagination data from the response
			setNumberOfPages(response.data.pagination.totalPages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const { isLoading, isError } = useQuery(['infoRequests', orgId, requestsPageNumber], () => fetchInfoRequests(requestsPageNumber), {
		enabled: !!orgId && !isLoaded,
		// keepPreviousData: true,
	});

	const sortInfoRequests = (property: keyof InfoRequest, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...infoRequests].sort((a: InfoRequest, b: InfoRequest) => {
			const aValue = a[property];
			const bValue = b[property];

			if (aValue === undefined || bValue === undefined) return 0;

			if (order === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
		setInfoRequests(sortedDataCopy);
	};

	const refreshData = () => {
		setIsLoaded(false);
	};

	const removeRequest = (requestId: string) => {
		setInfoRequests(prev => prev.filter(request => request._id !== requestId));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<InfoRequestsContext.Provider
			value={{
				infoRequests,
				loading: isLoading,
				error: isError ? 'Failed to fetch info requests' : null,
				fetchInfoRequests,
				refreshData,
				sortInfoRequests,
				removeRequest,
				numberOfPages,
				requestsPageNumber,
				setRequestsPageNumber,
				setNumberOfPages,
			}}>
			{props.children}
		</InfoRequestsContext.Provider>
	);
};

export default InfoRequestsContextProvider;
