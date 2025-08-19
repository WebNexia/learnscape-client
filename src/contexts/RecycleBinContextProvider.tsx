import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ArchivedCourse } from '../interfaces/course';
import { OrganisationContext } from './OrganisationContextProvider';
import axios from '@utils/axiosInstance';

interface RecycleBinContextTypes {
	// Courses data
	archivedCourses: ArchivedCourse[];
	setArchivedCourses: React.Dispatch<React.SetStateAction<ArchivedCourse[]>>;
	totalItems: number;
	setTotalItems: React.Dispatch<React.SetStateAction<number>>;
	currentPage: number;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	loadedPages: number[];
	setLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;

	// Search data
	searchResults: ArchivedCourse[];
	setSearchResults: React.Dispatch<React.SetStateAction<ArchivedCourse[]>>;
	searchResultsTotalItems: number;
	setSearchResultsTotalItems: React.Dispatch<React.SetStateAction<number>>;
	searchResultsPage: number;
	setSearchResultsPage: React.Dispatch<React.SetStateAction<number>>;
	isSearchActive: boolean;
	setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;

	// Search state
	searchValue: string;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	filterValue: string;
	setFilterValue: React.Dispatch<React.SetStateAction<string>>;
	searchedValue: string;
	setSearchedValue: React.Dispatch<React.SetStateAction<string>>;

	// Loading and error states
	loading: boolean;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	error: string | null;
	setError: React.Dispatch<React.SetStateAction<string | null>>;

	// Functions
	fetchArchivedCourses: (page?: number, search?: string, filter?: string) => Promise<void>;
	clearSearchData: () => void;
}

const RecycleBinContext = createContext<RecycleBinContextTypes>({
	archivedCourses: [],
	setArchivedCourses: () => {},
	totalItems: 0,
	setTotalItems: () => {},
	currentPage: 1,
	setCurrentPage: () => {},
	loadedPages: [],
	setLoadedPages: () => {},
	searchResults: [],
	setSearchResults: () => {},
	searchResultsTotalItems: 0,
	setSearchResultsTotalItems: () => {},
	searchResultsPage: 1,
	setSearchResultsPage: () => {},
	isSearchActive: false,
	setIsSearchActive: () => {},
	searchValue: '',
	setSearchValue: () => {},
	filterValue: '',
	setFilterValue: () => {},
	searchedValue: '',
	setSearchedValue: () => {},
	loading: false,
	setLoading: () => {},
	error: null,
	setError: () => {},
	fetchArchivedCourses: async () => {},
	clearSearchData: () => {},
});

interface RecycleBinContextProviderProps {
	children: ReactNode;
}

export const RecycleBinContextProvider = ({ children }: RecycleBinContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	// Courses data
	const [archivedCourses, setArchivedCourses] = useState<ArchivedCourse[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	// Search data
	const [searchResults, setSearchResults] = useState<ArchivedCourse[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	// Search state
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');

	// Loading and error states
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchArchivedCourses = async (page: number = 1, search?: string, filter?: string) => {
		if (!orgId) return;

		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			params.append('page', page.toString());
			params.append('limit', '200');

			if (search && search.trim()) {
				params.append('search', search.trim());
			}

			if (filter && filter.trim()) {
				params.append('filter', filter.trim());
			}

			const response = await axios.get(`${base_url}/courses/organisation/${orgId}/archived?${params.toString()}`);

			if (search || filter) {
				// Search/filter results
				setSearchResults(response.data.data || []);
				setSearchResultsTotalItems(response.data.totalItems || 0);
				setSearchResultsPage(page);
				setIsSearchActive(true);
			} else {
				// Regular archived courses - append for progressive pagination
				if (page === 1) {
					// First page - replace all data
					setArchivedCourses(response.data.data || []);
					setLoadedPages([1]);
				} else {
					// Additional pages - append data
					setArchivedCourses((prev) => [...prev, ...(response.data.data || [])]);
					setLoadedPages((prev) => [...prev, page]);
				}
				setTotalItems(response.data.totalItems || 0);
				setCurrentPage(page);
				setIsSearchActive(false);
			}
		} catch (error: any) {
			console.error('RecycleBin: Error fetching archived courses:', error);
			setError(error.response?.data?.message || 'Failed to fetch archived courses');
		} finally {
			setLoading(false);
		}
	};

	const clearSearchData = () => {
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchResults([]);
		setSearchResultsTotalItems(0);
		setSearchResultsPage(1);
		setIsSearchActive(false);
		setCurrentPage(1);
		setError(null);
	};

	// Initial fetch when orgId changes
	useEffect(() => {
		if (orgId) {
			fetchArchivedCourses(1);
		}
	}, [orgId]);

	const value: RecycleBinContextTypes = {
		archivedCourses,
		setArchivedCourses,
		totalItems,
		setTotalItems,
		currentPage,
		setCurrentPage,
		loadedPages,
		setLoadedPages,
		searchResults,
		setSearchResults,
		searchResultsTotalItems,
		setSearchResultsTotalItems,
		searchResultsPage,
		setSearchResultsPage,
		isSearchActive,
		setIsSearchActive,
		searchValue,
		setSearchValue,
		filterValue,
		setFilterValue,
		searchedValue,
		setSearchedValue,
		loading,
		setLoading,
		error,
		setError,
		fetchArchivedCourses,
		clearSearchData,
	};

	return <RecycleBinContext.Provider value={value}>{children}</RecycleBinContext.Provider>;
};

export const useRecycleBin = () => {
	const context = useContext(RecycleBinContext);
	if (!context) {
		throw new Error('useRecycleBin must be used within a RecycleBinContextProvider');
	}
	return context;
};
