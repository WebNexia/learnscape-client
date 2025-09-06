// QuestionsContextProvider.tsx
import { ReactNode, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { UserAuthContext } from './UserAuthContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Roles } from '../interfaces/enums';
import { QuestionInterface } from '../interfaces/question';
import { QuestionType } from '../interfaces/questionTypes';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';
import axios from '@utils/axiosInstance';
import { useQuery } from 'react-query';

interface QuestionsContextTypes {
	questions: QuestionInterface[];
	loading: boolean;
	error: string | null;
	fetchQuestions: (page?: number) => Promise<QuestionInterface[]>;
	fetchMoreQuestions: (startPage: number, endPage: number) => Promise<void>;
	sortQuestionsData: (property: keyof QuestionInterface, order: 'asc' | 'desc') => QuestionInterface[];
	addNewQuestion: (newQuestion: QuestionInterface) => void;
	updateQuestion: (question: QuestionInterface) => void;
	removeQuestion: (id: string) => void;
	questionsPageNumber: number;
	setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
	questionTypes: QuestionType[];
	fetchQuestionTypeName: (question: QuestionInterface) => string;
}

interface QuestionsContextProviderProps {
	children: ReactNode;
}

export const QuestionsContext = createContext<QuestionsContextTypes>({} as QuestionsContextTypes);

const QuestionsContextProvider = ({ children }: QuestionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const location = useLocation();

	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

	// ✅ hook for paginated questions
	const {
		data: questions,
		isLoading,
		isError,
		fetchEntities: fetchQuestions,
		fetchMoreEntities: fetchMoreQuestions,
		addEntity: addNewQuestion,
		updateEntity: updateQuestion,
		removeEntity: removeQuestion,
		sortEntities: sortQuestionsData,
		pageNumber: questionsPageNumber,
		setPageNumber: setQuestionsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<QuestionInterface>({
		orgId,
		baseUrl: `${base_url}/questions/organisation/${orgId}`,
		entityKey: 'allQuestions',
		enabled: isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	// ✅ fetch question types separately
	const fetchQuestionTypes = async (): Promise<QuestionType[]> => {
		if (!orgId) return [];
		const response = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
		return response.data.data;
	};

	const {
		data: questionTypesData,
		isLoading: allQuestionTypesLoading,
		isError: allQuestionTypesError,
	} = useQuery(['allQuestionTypes', orgId], fetchQuestionTypes, {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		staleTime: 60 * 60 * 1000,
		cacheTime: 24 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const fetchQuestionTypeName = (question: QuestionInterface): string => {
		const filteredQuestionType = questionTypesData?.filter?.((type: any) => {
			if (question !== null) {
				return type._id === question?.questionType || type.name === question?.questionType;
			}
		});
		let questionTypeName: string = '';
		if (filteredQuestionType && filteredQuestionType.length !== 0) {
			questionTypeName = filteredQuestionType[0].name;
		}
		return questionTypeName;
	};

	if ((isLoading || allQuestionTypesLoading) && isAuthenticated) return <Loading />;
	if ((isError || allQuestionTypesError) && isAuthenticated) return <LoadingError />;

	return (
		<QuestionsContext.Provider
			value={{
				questions,
				loading: isLoading,
				error: isError ? 'Failed to fetch questions' : null,
				fetchQuestions,
				fetchMoreQuestions,
				addNewQuestion,
				updateQuestion,
				removeQuestion,
				sortQuestionsData,
				questionsPageNumber,
				setQuestionsPageNumber,
				totalItems,
				loadedPages,
				questionTypes: questionTypesData || [],
				fetchQuestionTypeName,
			}}>
			{children}
		</QuestionsContext.Provider>
	);
};

export default QuestionsContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { QuestionInterface } from '../interfaces/question';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { QuestionType } from '../interfaces/questionTypes';
// import { useAuth } from '../hooks/useAuth';
// import { useLocation } from 'react-router-dom';
// import { UserAuthContext } from './UserAuthContextProvider';
// import { Roles } from '../interfaces/enums';

// interface QuestionsContextTypes {
// 	questions: QuestionInterface[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchQuestions: (page?: number) => void;
// 	fetchMoreQuestions: (startBatch: number, endBatch: number) => void;
// 	addNewQuestion: (newQuestion: any) => void;
// 	removeQuestion: (id: string) => void;
// 	updateQuestion: (question: QuestionInterface) => void;
// 	sortQuestionsData: (property: keyof QuestionInterface, order: 'asc' | 'desc') => void;
// 	totalItems: number;
// 	loadedPages: number[];
// 	questionsPageNumber: number;
// 	setQuestionsPageNumber: React.Dispatch<React.SetStateAction<number>>;
// 	questionTypes: QuestionType[];
// 	fetchQuestionTypeName: (question: QuestionInterface) => string;
// }

// interface QuestionsContextProviderProps {
// 	children: ReactNode;
// }

// export const QuestionsContext = createContext<QuestionsContextTypes>({
// 	questions: [],
// 	loading: false,
// 	error: null,
// 	fetchQuestions: () => {},
// 	fetchMoreQuestions: () => {},
// 	addNewQuestion: () => {},
// 	removeQuestion: () => {},
// 	updateQuestion: () => {},
// 	sortQuestionsData: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// 	questionsPageNumber: 1,
// 	setQuestionsPageNumber: () => {},
// 	questionTypes: [],
// 	fetchQuestionTypeName: () => '',
// });

// const QuestionsContextProvider = (props: QuestionsContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin, isLearner } = useAuth();
// 	const { user } = useContext(UserAuthContext);
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

// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);
// 	const [questionsPageNumber, setQuestionsPageNumber] = useState<number>(1);

// 	const fetchQuestions = async (page: number = 1) => {
// 		if (!orgId) return [];

// 		try {
// 			const response = await axios.get(`${base_url}/questions/organisation/${orgId}?page=${page}&limit=200`);

// 			const questionsData = response.data.data;

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['allQuestions', orgId, questionsPageNumber], questionsData);

// 			setTotalItems(response.data.totalItems);
// 			setLoadedPages((prev) => Array.from(new Set([...prev, page]))); // Mevcut page'leri koru, yenisini ekle

// 			return response.data.data;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchMoreQuestions = async (startBatch: number, endBatch: number) => {
// 		if (!orgId) return;

// 		try {
// 			// Fetch all batches from startBatch to endBatch
// 			const promises = [];
// 			for (let batch = startBatch; batch <= endBatch; batch++) {
// 				promises.push(axios.get(`${base_url}/questions/organisation/${orgId}?page=${batch}&limit=200`));
// 			}

// 			const responses = await Promise.all(promises);
// 			let allQuestions: QuestionInterface[] = [];
// 			let totalItemsCount = 0;

// 			responses.forEach((response, index) => {
// 				allQuestions.push(...response.data.data);
// 				if (index === 0) {
// 					totalItemsCount = response.data.totalItems || response.data.data.length;
// 				}
// 			});

// 			// React Query cache'i güncelle - yeni data'yı ekle
// 			queryClient.setQueryData(['allQuestions', orgId, questionsPageNumber], (oldData: any) => {
// 				return oldData ? [...oldData, ...allQuestions] : allQuestions;
// 			});

// 			// Local state'i güncelle (pagination için)
// 			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
// 			setTotalItems(totalItemsCount);
// 			return allQuestions;
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const {
// 		data: questionsData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['allQuestions', orgId, questionsPageNumber], () => fetchQuestions(questionsPageNumber), {
// 		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
// 		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: user?.role !== Roles.USER ? true : false, // No refetch on component remount
// 	});

// 	// Progressive pagination için aradaki boşlukları doldur
// 	useEffect(() => {
// 		if (loadedPages.length > 0 && orgId) {
// 			const sortedPages = [...loadedPages].sort((a, b) => a - b);
// 			const maxPage = Math.max(...sortedPages);

// 			// Aradaki boşlukları bul ve yükle
// 			for (let page = 1; page <= maxPage; page++) {
// 				if (!loadedPages.includes(page)) {
// 					fetchQuestions(page);
// 				}
// 			}
// 		}
// 	}, [loadedPages, orgId]);

// 	// React Query data değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (questionsData && questionsData.length > 0) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(questionsData.length); // ❌ This breaks pagination

// 			// Eğer loadedPages boşsa ilk page'i ekle
// 			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
// 		}
// 	}, [questionsData]);

// 	const fetchQuestionTypes = async () => {
// 		if (!orgId) return;
// 		try {
// 			const questionTypeResponse = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
// 			return questionTypeResponse.data.data; // Return the data
// 		} catch (error) {
// 			throw error;
// 		}
// 	};

// 	const fetchQuestionTypeName = (question: QuestionInterface): string => {
// 		const filteredQuestionType = questionTypesData?.filter?.((type: any) => {
// 			if (question !== null) {
// 				return type._id === question?.questionType || type.name === question?.questionType;
// 			}
// 		});
// 		let questionTypeName: string = '';
// 		if (filteredQuestionType && filteredQuestionType.length !== 0) {
// 			questionTypeName = filteredQuestionType[0].name;
// 		}
// 		return questionTypeName;
// 	};

// 	const {
// 		data: questionTypesData,
// 		isLoading: allQuestionTypesLoading,
// 		isError: allQuestionTypesError,
// 	} = useQuery('allQuestionTypes', () => fetchQuestionTypes(), {
// 		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
// 		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: false, // No refetch on component remount
// 	});

// 	// Function to handle sorting
// 	const sortQuestionsData = (property: keyof QuestionInterface, order: 'asc' | 'desc') => {
// 		// React Query data'yı sort et, local state'e set etme
// 		const sortedDataCopy = [...(questionsData || [])].sort((a: QuestionInterface, b: QuestionInterface) => {
// 			if (order === 'asc') {
// 				return a[property] > b[property] ? 1 : -1;
// 			} else {
// 				return a[property] < b[property] ? 1 : -1;
// 			}
// 		});
// 		// Local state'e set etme, sadece sort edilmiş data'yı return et
// 		return sortedDataCopy;
// 	};

// 	// Function to update sortedQuestionsData with new course data
// 	const addNewQuestion = (newQuestion: any) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allQuestions', orgId], (oldData: any) => {
// 			const newData = oldData ? [newQuestion, ...oldData] : [newQuestion];

// 			return newData;
// 		});

// 		// Local state'i de güncelle (pagination için)
// 		setTotalItems((prev) => {
// 			return prev + 1;
// 		});
// 		// Eğer loadedPages boşsa ilk page'i ekle
// 		setLoadedPages((prev) => {
// 			return prev.length === 0 ? [1] : prev;
// 		});
// 	};

// 	const updateQuestion = (updatedQuestion: QuestionInterface) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allQuestions', orgId], (oldData: any) => {
// 			return oldData?.map((question: QuestionInterface) => {
// 				if (updatedQuestion._id === question._id) {
// 					return updatedQuestion;
// 				}
// 				return question;
// 			});
// 		});
// 	};

// 	const removeQuestion = (id: string) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allQuestions', orgId], (oldData: any) => {
// 			return oldData?.filter((data: QuestionInterface) => data._id !== id);
// 		});
// 	};

// 	if (isLoading || allQuestionTypesLoading) {
// 		return <Loading />;
// 	}

// 	if (isError || allQuestionTypesError) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<QuestionsContext.Provider
// 			value={{
// 				questions: questionsData || [], // React Query data kullan
// 				loading: isLoading,
// 				error: isError ? 'Error loading questions' : null,
// 				fetchQuestions,
// 				fetchMoreQuestions,
// 				addNewQuestion,
// 				removeQuestion,
// 				updateQuestion,
// 				sortQuestionsData,
// 				totalItems, // Backend'den gelen gerçek total
// 				loadedPages, // Progressive pagination için
// 				questionsPageNumber,
// 				setQuestionsPageNumber,
// 				questionTypes: questionTypesData || [], // React Query data kullan
// 				fetchQuestionTypeName,
// 			}}>
// 			{props.children}
// 		</QuestionsContext.Provider>
// 	);
// };

// export default QuestionsContextProvider;
