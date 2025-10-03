import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { QuestionInterface } from '../interfaces/question';
import { QuestionType } from '../interfaces/questionTypes';
import { OrganisationContext } from './OrganisationContextProvider';
import { useQuery } from 'react-query';

interface ArchivedQuestion extends QuestionInterface {
	archivedAt?: string;
	archivedBy?: string;
	archivedByName?: string;
}

interface RecycleBinQuestionsContextTypes {
	archivedQuestions: ArchivedQuestion[];
	totalItems: number;
	currentPage: number;
	searchResults: ArchivedQuestion[];
	searchResultsTotalItems: number;
	isSearchActive: boolean;
	searchValue: string;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	filterValue: string;
	setFilterValue: React.Dispatch<React.SetStateAction<string>>;
	searchedValue: string;
	setSearchedValue: React.Dispatch<React.SetStateAction<string>>;
	searchButtonClicked: boolean;
	setSearchButtonClicked: React.Dispatch<React.SetStateAction<boolean>>;
	fetchArchivedQuestions: (page?: number) => void;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	setSearchResults: React.Dispatch<React.SetStateAction<ArchivedQuestion[]>>;
	setSearchResultsTotalItems: React.Dispatch<React.SetStateAction<number>>;
	setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
	setArchivedQuestions: React.Dispatch<React.SetStateAction<ArchivedQuestion[]>>;
	setTotalItems: React.Dispatch<React.SetStateAction<number>>;
	loadedPages: number[];
	setLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;
	questionTypes: QuestionType[];
	snackbarOpen: boolean;
	snackbarMessage: string;
	snackbarSeverity: 'success' | 'error' | 'warning' | 'info';
	setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSnackbarMessage: React.Dispatch<React.SetStateAction<string>>;
	setSnackbarSeverity: React.Dispatch<React.SetStateAction<'success' | 'error' | 'warning' | 'info'>>;
}

interface RecycleBinQuestionsContextProviderProps {
	children: ReactNode;
}

export const RecycleBinQuestionsContext = createContext<RecycleBinQuestionsContextTypes>({
	archivedQuestions: [],
	totalItems: 0,
	currentPage: 1,
	searchResults: [],
	searchResultsTotalItems: 0,
	isSearchActive: false,
	searchValue: '',
	setSearchValue: () => {},
	filterValue: '',
	setFilterValue: () => {},
	searchedValue: '',
	setSearchedValue: () => {},
	searchButtonClicked: false,
	setSearchButtonClicked: () => {},
	fetchArchivedQuestions: () => {},
	setCurrentPage: () => {},
	setSearchResults: () => {},
	setSearchResultsTotalItems: () => {},
	setIsSearchActive: () => {},
	setArchivedQuestions: () => {},
	setTotalItems: () => {},
	loadedPages: [],
	setLoadedPages: () => {},
	questionTypes: [],
	snackbarOpen: false,
	snackbarMessage: '',
	snackbarSeverity: 'info',
	setSnackbarOpen: () => {},
	setSnackbarMessage: () => {},
	setSnackbarSeverity: () => {},
});

export const RecycleBinQuestionsProvider = ({ children }: RecycleBinQuestionsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	// Fetch question types
	const fetchQuestionTypes = async (): Promise<QuestionType[]> => {
		if (!orgId) return [];
		const response = await axios.get(`${base_url}/questiontypes/organisation/${orgId}`);
		return response.data.data;
	};

	const { data: questionTypesData } = useQuery(['allQuestionTypes', orgId], fetchQuestionTypes, {
		enabled: !!orgId,
		staleTime: 60 * 60 * 1000,
		cacheTime: 24 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const [archivedQuestions, setArchivedQuestions] = useState<ArchivedQuestion[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchResults, setSearchResults] = useState<ArchivedQuestion[]>([]);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

	const fetchArchivedQuestions = async (page: number = 1) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/questions/organisation/${orgId}/archived?page=${page}&limit=200`);

			if (response.data.status === 200) {
				const { data, totalItems: total } = response.data;

				if (page === 1) {
					// First page - replace all data
					setArchivedQuestions(data);
					setTotalItems(total);
					setLoadedPages([1]);
				} else {
					// Additional pages - append data
					setArchivedQuestions((prev) => [...prev, ...data]);
					setLoadedPages((prev) => [...prev, page]);
				}

				return data;
			}
		} catch (error) {
			console.error('Error fetching archived questions:', error);
			throw error;
		}
	};

	const contextValue: RecycleBinQuestionsContextTypes = {
		archivedQuestions,
		totalItems,
		currentPage,
		searchResults,
		searchResultsTotalItems,
		isSearchActive,
		searchValue,
		setSearchValue,
		filterValue,
		setFilterValue,
		searchedValue,
		setSearchedValue,
		searchButtonClicked,
		setSearchButtonClicked,
		fetchArchivedQuestions,
		setCurrentPage,
		setSearchResults,
		setSearchResultsTotalItems,
		setIsSearchActive,
		setArchivedQuestions,
		setTotalItems,
		loadedPages,
		setLoadedPages,
		questionTypes: questionTypesData || [],
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,
	};

	return <RecycleBinQuestionsContext.Provider value={contextValue}>{children}</RecycleBinQuestionsContext.Provider>;
};

export const useRecycleBinQuestions = () => {
	const context = useContext(RecycleBinQuestionsContext);
	if (!context) {
		throw new Error('useRecycleBinQuestions must be used within a RecycleBinQuestionsProvider');
	}
	return context;
};
