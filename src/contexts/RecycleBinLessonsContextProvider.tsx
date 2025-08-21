import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from '@utils/axiosInstance';
import { ArchivedLesson } from '../interfaces/lessons';
import { OrganisationContext } from './OrganisationContextProvider';

interface RecycleBinLessonsContextTypes {
	// State
	archivedLessons: ArchivedLesson[];
	totalItems: number;
	currentPage: number;
	loadedPages: number[];
	searchResults: ArchivedLesson[];
	searchResultsTotalItems: number;
	searchResultsPage: number;
	searchResultsLoadedPages: number[];
	isSearchActive: boolean;
	searchValue: string;
	filterValue: string;
	searchedValue: string;
	searchButtonClicked: boolean;
	error: string | null;
	snackbarOpen: boolean;
	snackbarMessage: string;
	snackbarSeverity: 'success' | 'error';

	// Setters
	setArchivedLessons: React.Dispatch<React.SetStateAction<ArchivedLesson[]>>;
	setTotalItems: React.Dispatch<React.SetStateAction<number>>;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	setLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;
	setSearchResults: React.Dispatch<React.SetStateAction<ArchivedLesson[]>>;
	setSearchResultsTotalItems: React.Dispatch<React.SetStateAction<number>>;
	setSearchResultsPage: React.Dispatch<React.SetStateAction<number>>;
	setSearchResultsLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;
	setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	setFilterValue: React.Dispatch<React.SetStateAction<string>>;
	setSearchedValue: React.Dispatch<React.SetStateAction<string>>;
	setSearchButtonClicked: React.Dispatch<React.SetStateAction<boolean>>;

	setError: React.Dispatch<React.SetStateAction<string | null>>;
	setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSnackbarMessage: React.Dispatch<React.SetStateAction<string>>;
	setSnackbarSeverity: React.Dispatch<React.SetStateAction<'success' | 'error'>>;

	// Functions
	fetchArchivedLessons: (page: number, search?: string, filter?: string) => Promise<void>;
	clearSearchData: () => void;
}

const RecycleBinLessonsContext = createContext<RecycleBinLessonsContextTypes | undefined>(undefined);

export const useRecycleBinLessons = () => {
	const context = useContext(RecycleBinLessonsContext);
	if (!context) {
		throw new Error('useRecycleBinLessons must be used within a RecycleBinLessonsProvider');
	}
	return context;
};

interface RecycleBinLessonsProviderProps {
	children: React.ReactNode;
}

export const RecycleBinLessonsProvider: React.FC<RecycleBinLessonsProviderProps> = ({ children }) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	// State
	const [archivedLessons, setArchivedLessons] = useState<ArchivedLesson[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [searchResults, setSearchResults] = useState<ArchivedLesson[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);

	const [error, setError] = useState<string | null>(null);
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const fetchArchivedLessons = useCallback(
		async (page: number, search?: string, filter?: string) => {
			try {
				setError(null);

				// Check if orgId is available
				if (!orgId) {
					setError('Organization ID not found');

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

				const response = await axios.get(`${base_url}/lessons/organisation/${orgId}/archived?${params.toString()}`);

				if (response.data.status === 200) {
					const { data, totalItems: total } = response.data;

					if (page === 1) {
						// First page - replace data
						setArchivedLessons(data);
						setTotalItems(total);
						setLoadedPages([1]);
					} else {
						// Subsequent pages - append data
						setArchivedLessons((prev) => [...prev, ...data]);
						setLoadedPages((prev) => [...prev, page]);
					}
				}
			} catch (error) {
				console.error('Error fetching archived lessons:', error);
				setError('Failed to fetch archived lessons');
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

	const value: RecycleBinLessonsContextTypes = {
		// State
		archivedLessons,
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
		error,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,

		// Setters
		setArchivedLessons,
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
		setError,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,

		// Functions
		fetchArchivedLessons,
		clearSearchData,
	};

	return <RecycleBinLessonsContext.Provider value={value}>{children}</RecycleBinLessonsContext.Provider>;
};
