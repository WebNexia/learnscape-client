import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminQuizSubmissionsContextTypes {
	quizSubmissions: QuizSubmission[];
	sortQuizSubmissionsData: (property: keyof QuizSubmission, order: 'asc' | 'desc') => QuizSubmission[];
	addNewQuizSubmission: (newQuizSubmission: any) => void;
	updateQuizSubmissionPublishing: (id: string) => void;
	removeQuizSubmission: (id: string) => void;
	updateQuizSubmissions: (singleQuizSubmission: QuizSubmission) => void;
	totalItems: number;
	loadedPages: number[];
	quizSubmissionsPageNumber: number;
	setQuizSubmissionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchQuizSubmissions: (page: number) => Promise<QuizSubmission[]>;
	fetchMoreQuizSubmissions: (startBatch: number, endBatch: number) => Promise<void>;
}

interface AdminQuizSubmissionsContextProviderProps {
	children: ReactNode;
}

export const AdminQuizSubmissionsContext = createContext<AdminQuizSubmissionsContextTypes>({
	quizSubmissions: [],
	sortQuizSubmissionsData: () => [],
	addNewQuizSubmission: () => {},
	updateQuizSubmissionPublishing: () => {},
	removeQuizSubmission: () => {},
	updateQuizSubmissions: () => {},
	totalItems: 0,
	loadedPages: [],
	quizSubmissionsPageNumber: 1,
	setQuizSubmissionsPageNumber: () => {},
	fetchQuizSubmissions: async () => [],
	fetchMoreQuizSubmissions: async () => {},
});

const AdminQuizSubmissionsContextProvider = (props: AdminQuizSubmissionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated } = useAuth();
	const queryClient = useQueryClient();

	const location = useLocation();
	const isAdminRoute = location.pathname.startsWith('/admin');

	// Local state for pagination
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [quizSubmissionsPageNumber, setQuizSubmissionsPageNumber] = useState<number>(1);

	const fetchQuizSubmissions = async (page: number = 1): Promise<QuizSubmission[]> => {
		if (!orgId) return [];

		try {
			const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?page=${page}&limit=150`);
			const quizSubmissionsData = response.data.data;

			// React Query cache'i güncelle - page-based caching
			queryClient.setQueryData(['adminQuizSubmissions', orgId, quizSubmissionsPageNumber], quizSubmissionsData);

			setTotalItems(response.data.totalItems);
			setLoadedPages((prev) => [...prev, page]);

			return quizSubmissionsData;
		} catch (error) {
			throw error;
		}
	};

	const fetchMoreQuizSubmissions = async (startBatch: number, endBatch: number): Promise<void> => {
		if (!orgId) return;

		try {
			const promises = [];
			for (let page = startBatch; page <= endBatch; page++) {
				promises.push(axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?page=${page}&limit=150`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			// Update React Query cache
			queryClient.setQueryData(['adminQuizSubmissions', orgId], (oldData: any) => {
				return oldData ? [...oldData, ...allData] : allData;
			});

			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
		} catch (error) {
			console.error('Error fetching more quiz submissions:', error);
			throw error;
		}
	};

	// Use useQuery to fetch quiz submissions by orgId (admin only)
	const {
		data: quizSubmissionsData,
		isLoading,
		isError,
	} = useQuery(
		['adminQuizSubmissions', orgId],
		() => fetchQuizSubmissions(1), // Always fetch first page initially
		{
			enabled: !!orgId && isAuthenticated && isAdminRoute,
			staleTime: 5 * 60 * 1000, // 5 minutes
			cacheTime: 10 * 60 * 1000, // 10 minutes
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		}
	);

	const sortQuizSubmissionsData = (property: keyof QuizSubmission, order: 'asc' | 'desc'): QuizSubmission[] => {
		// Sort React Query data and return sorted copy
		const sortedQuizSubmissionsDataCopy = [...(quizSubmissionsData || [])].sort((a: QuizSubmission, b: QuizSubmission) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		return sortedQuizSubmissionsDataCopy;
	};

	const addNewQuizSubmission = (newQuizSubmission: any) => {
		// Update React Query cache
		queryClient.setQueryData(['adminQuizSubmissions', orgId], (oldData: any) => {
			return oldData ? [newQuizSubmission, ...oldData] : [newQuizSubmission];
		});

		// Update totalItems
		setTotalItems((prev) => prev + 1);
	};

	const updateQuizSubmissionPublishing = (id: string) => {
		// Update React Query cache
		queryClient.setQueryData(['adminQuizSubmissions', orgId], (oldData: any) => {
			return oldData?.map((submission: QuizSubmission) => {
				if (submission._id === id) {
					return { ...submission, isChecked: !submission.isChecked };
				}
				return submission;
			});
		});
	};

	const updateQuizSubmissions = (singleQuizSubmission: QuizSubmission) => {
		// Update React Query cache
		queryClient.setQueryData(['adminQuizSubmissions', orgId], (oldData: any) => {
			return oldData?.map((submission: QuizSubmission) => {
				if (singleQuizSubmission._id === submission._id) {
					return singleQuizSubmission;
				}
				return submission;
			});
		});
	};

	const removeQuizSubmission = (id: string) => {
		// Update React Query cache
		queryClient.setQueryData(['adminQuizSubmissions', orgId], (oldData: any) => {
			return oldData?.filter((data: QuizSubmission) => data._id !== id);
		});

		// Update totalItems
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	// useEffect ile quizSubmissionsData değiştiğinde local state'i güncelle
	useEffect(() => {
		if (quizSubmissionsData) {
			// Don't override totalItems from server - only set loadedPages
			// setTotalItems(quizSubmissionsData.length); // ❌ This breaks pagination

			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
		}
	}, [quizSubmissionsData]);

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<AdminQuizSubmissionsContext.Provider
			value={{
				quizSubmissions: quizSubmissionsData || [], // Use React Query data
				sortQuizSubmissionsData,
				addNewQuizSubmission,
				removeQuizSubmission,
				updateQuizSubmissionPublishing,
				updateQuizSubmissions,
				totalItems,
				loadedPages,
				quizSubmissionsPageNumber,
				setQuizSubmissionsPageNumber,
				fetchQuizSubmissions,
				fetchMoreQuizSubmissions,
			}}>
			{props.children}
		</AdminQuizSubmissionsContext.Provider>
	);
};

export default AdminQuizSubmissionsContextProvider;
