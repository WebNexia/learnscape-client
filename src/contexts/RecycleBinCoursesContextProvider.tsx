import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from '@utils/axiosInstance';
import { ArchivedCourse } from '../interfaces/course';
import { OrganisationContext } from './OrganisationContextProvider';

interface RecycleBinCoursesContextTypes {
	// State
	archivedCourses: ArchivedCourse[];
	totalItems: number;
	currentPage: number;
	loadedPages: number[];
	searchResults: ArchivedCourse[];
	searchResultsTotalItems: number;
	searchResultsPage: number;
	searchResultsLoadedPages: number[];
	isSearchActive: boolean;
	searchValue: string;
	filterValue: string;
	searchedValue: string;
	searchButtonClicked: boolean;
	loading: boolean;
	error: string | null;

	// Setters
	setArchivedCourses: React.Dispatch<React.SetStateAction<ArchivedCourse[]>>;
	setTotalItems: React.Dispatch<React.SetStateAction<number>>;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	setLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;
	setSearchResults: React.Dispatch<React.SetStateAction<ArchivedCourse[]>>;
	setSearchResultsTotalItems: React.Dispatch<React.SetStateAction<number>>;
	setSearchResultsPage: React.Dispatch<React.SetStateAction<number>>;
	setSearchResultsLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;
	setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	setFilterValue: React.Dispatch<React.SetStateAction<string>>;
	setSearchedValue: React.Dispatch<React.SetStateAction<string>>;
	setSearchButtonClicked: React.Dispatch<React.SetStateAction<boolean>>;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	setError: React.Dispatch<React.SetStateAction<string | null>>;

	// Functions
	fetchArchivedCourses: (page: number, search?: string, filter?: string) => Promise<void>;
	clearSearchData: () => void;
}

const RecycleBinCoursesContext = createContext<RecycleBinCoursesContextTypes | undefined>(undefined);

export const useRecycleBinCourses = () => {
	const context = useContext(RecycleBinCoursesContext);
	if (!context) {
		throw new Error('useRecycleBinCourses must be used within a RecycleBinCoursesProvider');
	}
	return context;
};

interface RecycleBinCoursesProviderProps {
	children: React.ReactNode;
}

export const RecycleBinCoursesProvider: React.FC<RecycleBinCoursesProviderProps> = ({ children }) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	// State
	const [archivedCourses, setArchivedCourses] = useState<ArchivedCourse[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [searchResults, setSearchResults] = useState<ArchivedCourse[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchArchivedCourses = useCallback(
		async (page: number, search?: string, filter?: string) => {
			try {
				setLoading(true);
				setError(null);

				// Check if orgId is available
				if (!orgId) {
					setError('Organization ID not found');
					setLoading(false);
					return;
				}

				const params = new URLSearchParams({
					page: page.toString(),
					limit: '200',
				});

				if (search && search.trim()) {
					params.append('search', search.trim());
				}

				if (filter && filter.trim()) {
					params.append('filter', filter.trim());
				}

				const response = await axios.get(`${base_url}/courses/organisation/${orgId}/archived?${params.toString()}`);

				if (response.data.status === 200) {
					const { data, totalItems: total } = response.data;

					if (page === 1) {
						// First page - replace data
						setArchivedCourses(data);
						setTotalItems(total);
						setLoadedPages([1]);
					} else {
						// Subsequent pages - append data
						setArchivedCourses((prev) => [...prev, ...data]);
						setLoadedPages((prev) => [...prev, page]);
					}
				}
			} catch (error) {
				console.error('Error fetching archived courses:', error);
				setError('Failed to fetch archived courses');
			} finally {
				setLoading(false);
			}
		},
		[base_url, orgId]
	);

	const clearSearchData = useCallback(() => {
		setSearchResults([]);
		setSearchResultsTotalItems(0);
		setSearchResultsPage(1);
		setSearchResultsLoadedPages([]);
		setIsSearchActive(false);
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
	}, []);

	const value: RecycleBinCoursesContextTypes = {
		// State
		archivedCourses,
		totalItems,
		currentPage,
		loadedPages,
		searchResults,
		searchResultsTotalItems,
		searchResultsPage,
		searchResultsLoadedPages,
		isSearchActive,
		searchValue,
		filterValue,
		searchedValue,
		searchButtonClicked,
		loading,
		error,

		// Setters
		setArchivedCourses,
		setTotalItems,
		setCurrentPage,
		setLoadedPages,
		setSearchResults,
		setSearchResultsTotalItems,
		setSearchResultsPage,
		setSearchResultsLoadedPages,
		setIsSearchActive,
		setSearchValue,
		setFilterValue,
		setSearchedValue,
		setSearchButtonClicked,
		setLoading,
		setError,

		// Functions
		fetchArchivedCourses,
		clearSearchData,
	};

	return <RecycleBinCoursesContext.Provider value={value}>{children}</RecycleBinCoursesContext.Provider>;
};
