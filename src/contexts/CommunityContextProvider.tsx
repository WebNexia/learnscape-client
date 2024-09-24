import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { CommunityTopic } from '../interfaces/communityTopics';

interface CommunityContextTypes {
	sortedTopicsData: CommunityTopic[];
	sortTopicsData: (property: keyof CommunityTopic, order: 'asc' | 'desc') => void;
	addNewTopic: (newTopic: any) => void;
	removeTopic: (id: string) => void;
	updateTopics: (singleTopic: CommunityTopic) => void;
	numberOfPages: number;
	topicsPageNumber: number;
	setTopicsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchTopics: (page: number) => void;
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
});

const CommunityContextProvider = (props: CommunityContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedTopicsData, setSortedTopicsData] = useState<CommunityTopic[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [topicsPageNumber, setTopicsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchTopics = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/communityTopics/organisation/${orgId}?page=${page}&limit=50`);

			// Initial sorting when fetching data
			const sortedTopicsDataCopy = [...response.data.data].sort((a: CommunityTopic, b: CommunityTopic) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedTopicsData(sortedTopicsDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(['allTopics', orgId, topicsPageNumber], () => fetchTopics(topicsPageNumber), {
		enabled: !!orgId && !isLoaded,
	});

	// Function to handle sorting
	const sortTopicsData = (property: keyof CommunityTopic, order: 'asc' | 'desc') => {
		const sortedTopicsDataCopy = [...sortedTopicsData].sort((a: CommunityTopic, b: CommunityTopic) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedTopicsData(sortedTopicsDataCopy);
	};
	// Function to update sortedTopicsData with new document data
	const addNewTopic = (newTopic: any) => {
		setSortedTopicsData((prevSortedData) => [newTopic, ...prevSortedData]);
	};

	const updateTopics = (singleTopic: CommunityTopic) => {
		const updatedTopicList = sortedTopicsData?.map((document) => {
			if (singleTopic._id === document._id) {
				return singleTopic;
			}
			return document;
		});
		setSortedTopicsData(updatedTopicList);
	};

	const removeTopic = (id: string) => {
		setSortedTopicsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
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
			}}>
			{props.children}
		</CommunityContext.Provider>
	);
};

export default CommunityContextProvider;
