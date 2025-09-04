import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LearnerQuizSubmissionsContextTypes {
	userQuizSubmissions: QuizSubmission[];
	sortedUserQuizSubmissionsData: QuizSubmission[];
	sortUserQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => void;
	isUserLoaded: boolean;
	totalItems: number;
	loadedPages: number[];
	userSubmissionsPageNumber: number;
	setUserSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchUserQuizSubmissions: (page: number) => Promise<QuizSubmission[]>;
	fetchMoreUserQuizSubmissions: (startBatch: number, endBatch: number) => Promise<void>;
}

interface LearnerQuizSubmissionsContextProviderProps {
	children: ReactNode;
}

export const LearnerQuizSubmissionsContext = createContext<LearnerQuizSubmissionsContextTypes>({
	userQuizSubmissions: [],
	sortedUserQuizSubmissionsData: [],
	sortUserQuizSubmissionsData: () => {},
	isUserLoaded: false,
	totalItems: 0,
	loadedPages: [],
	userSubmissionsPageNumber: 1,
	setUserSubmissionsPageNumber: () => {},
	fetchUserQuizSubmissions: async () => [],
	fetchMoreUserQuizSubmissions: async () => {},
});

const LearnerQuizSubmissionsContextProvider = (props: LearnerQuizSubmissionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, user } = useAuth();
	const queryClient = useQueryClient();

	const location = useLocation();
	const isLearnerRoute = !location.pathname.startsWith('/admin');

	// Local state for pagination and user data
	const [sortedUserQuizSubmissionsData, setSortedUserQuizSubmissionsData] = useState<QuizSubmission[]>([]);
	const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [userSubmissionsPageNumber, setUserSubmissionsPageNumber] = useState<number>(1);

	const fetchUserQuizSubmissions = async (page: number = 1): Promise<QuizSubmission[]> => {
		if (!orgId || !user?._id) return [];

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/user/${user._id}?page=${page}&limit=150`);

			// Update React Query cache
			queryClient.setQueryData(['learnerQuizSubmissions', orgId, user._id], (oldData: any) => {
				if (page === 1) {
					// First page - replace all data
					return response.data.data;
				} else {
					// Subsequent pages - append data
					return oldData ? [...oldData, ...response.data.data] : response.data.data;
				}
			});

			// Set totalItems from server response
			setTotalItems(response.data.totalItems);

			// Update loadedPages
			if (page === 1) {
				setLoadedPages([1]);
			} else {
				setLoadedPages((prev) => [...prev, page]);
			}

			// Set user loaded flag
			setIsUserLoaded(true);

			return response.data.data;
		} catch (error) {
			throw error;
		}
	};

	const fetchMoreUserQuizSubmissions = async (startBatch: number, endBatch: number): Promise<void> => {
		if (!orgId || !user?._id) return;

		try {
			const promises = [];
			for (let page = startBatch; page <= endBatch; page++) {
				promises.push(axios.get(`${base_url}/quizsubmissions/user/${user._id}?page=${page}&limit=150`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			// Update React Query cache
			queryClient.setQueryData(['learnerQuizSubmissions', orgId, user._id], (oldData: any) => {
				return oldData ? [...oldData, ...allData] : allData;
			});

			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
		} catch (error) {
			console.error('Error fetching more user quiz submissions:', error);
			throw error;
		}
	};

	// Use useQuery to fetch user's quiz submissions
	const {
		data: userQuizSubmissionsData,
		isLoading,
		isError,
	} = useQuery(
		['learnerQuizSubmissions', orgId, user?._id],
		() => fetchUserQuizSubmissions(1), // Always fetch first page initially
		{
			enabled: !!orgId && !!user?._id && isAuthenticated && isLearnerRoute,
			staleTime: 5 * 60 * 1000, // 5 minutes
			cacheTime: 10 * 60 * 1000, // 10 minutes
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		}
	);

	const sortUserQuizSubmissionsData = (property: keyof QuizSubmission, order: 'asc' | 'desc') => {
		const sortedQuizSubmissionsDataCopy = [...(userQuizSubmissionsData || [])].sort((a: QuizSubmission, b: QuizSubmission) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedUserQuizSubmissionsData(sortedQuizSubmissionsDataCopy);
	};

	// useEffect ile userQuizSubmissionsData değiştiğinde local state'i güncelle
	useEffect(() => {
		if (userQuizSubmissionsData) {
			// Don't override totalItems from server - only set loadedPages
			// setTotalItems(userQuizSubmissionsData.length); // ❌ This breaks pagination

			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
		}
	}, [userQuizSubmissionsData]);

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<LearnerQuizSubmissionsContext.Provider
			value={{
				userQuizSubmissions: userQuizSubmissionsData || [], // Use React Query data
				sortedUserQuizSubmissionsData,
				sortUserQuizSubmissionsData,
				isUserLoaded,
				totalItems,
				loadedPages,
				userSubmissionsPageNumber,
				setUserSubmissionsPageNumber,
				fetchUserQuizSubmissions,
				fetchMoreUserQuizSubmissions,
			}}>
			{props.children}
		</LearnerQuizSubmissionsContext.Provider>
	);
};

export default LearnerQuizSubmissionsContextProvider;
