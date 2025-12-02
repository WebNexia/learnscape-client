import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '@utils/axiosInstance';

// Generic types for better type safety and future compatibility
export interface FilterSearchEntity {
	_id: string;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: any;
}

export interface FilterSearchPagination {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface FilterSearchResponse<T> {
	data: T[];
	totalItems: number;
	pagination?: FilterSearchPagination;
}

// Comprehensive options interface for maximum flexibility
export interface UseFilterSearchOptions<T extends FilterSearchEntity> {
	// API endpoint configuration
	getEndpoint: () => string;

	// Pagination settings
	limit: number;
	pageSize: number;

	// Context data integration
	contextData: T[] | null;
	setContextPageNumber?: (page: number) => void;
	fetchMoreContextData: (startPage: number, endPage: number) => Promise<void>;
	contextLoadedPages: number[];
	contextTotalItems: number;

	// Sorting configuration
	defaultOrderBy?: keyof T | string;
	defaultOrder?: 'asc' | 'desc';

	// Advanced options for future compatibility
	enableAutoSearch?: boolean; // For future debounced search
	enableCaching?: boolean; // For future cache integration
	customSearchParams?: Record<string, any> | ((currentFilterValue?: string) => Record<string, any>); // For custom parameters
	onSearchStart?: () => void; // Callback hooks
	onSearchComplete?: (results: T[]) => void;
	onSearchError?: (error: Error) => void;
	onFilterChange?: (filterValue: string) => void;
}

// Comprehensive return interface
export interface UseFilterSearchReturn<T extends FilterSearchEntity> {
	// Search state
	searchValue: string;
	setSearchValue: (value: string) => void;
	filterValue: string;
	setFilterValue: (value: string) => void;

	// Search results state
	searchResults: T[];
	isSearchActive: boolean;
	searchResultsPage: number;
	searchResultsLoadedPages: number[];
	searchResultsTotalItems: number;
	searchButtonClicked: boolean;
	searchedValue: string;

	// Sort state
	orderBy: keyof T | string;
	setOrderBy: (value: keyof T | string) => void;
	order: 'asc' | 'desc';
	setOrder: (value: 'asc' | 'desc') => void;

	// Display data (search results or context data)
	displayData: T[];
	numberOfPages: number;
	currentPage: number;

	// Actions
	handleSearch: () => Promise<void>;
	handleFilterChange: (newFilterValue: string) => Promise<void>;
	handlePageChange: (newPage: number) => Promise<void>;
	handleSort: (property: keyof T | string) => void;

	// Reset functions
	resetSearch: () => void;
	resetFilter: () => void;
	resetAll: () => void;

	// Advanced functions for future use
	refreshSearch: () => Promise<void>; // Re-run current search
	getSearchParams: () => URLSearchParams; // Get current search parameters
	removeFromSearchResults: (itemId: string) => void; // Remove item from search results
	isLoading: boolean; // Loading state
	error: string | null; // Error state

	// Cleanup function
	cleanupSearchState: () => void; // Clean up all search state
}

// Main hook implementation with comprehensive functionality
export const useFilterSearch = <T extends FilterSearchEntity>({
	getEndpoint,
	limit,
	contextData,
	setContextPageNumber,
	fetchMoreContextData,
	contextLoadedPages,
	contextTotalItems,
	pageSize,
	defaultOrderBy = 'updatedAt',
	defaultOrder = 'desc',
	enableAutoSearch = false,
	enableCaching = false,
	customSearchParams = {},
	onSearchStart,
	onSearchComplete,
	onSearchError,
	onFilterChange,
}: UseFilterSearchOptions<T>): UseFilterSearchReturn<T> => {
	const location = useLocation();
	// Search and filter state
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	// Search results state
	const [searchResults, setSearchResults] = useState<T[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	// Sort state
	const [orderBy, setOrderBy] = useState<keyof T | string>(defaultOrderBy);
	const [order, setOrder] = useState<'asc' | 'desc'>(defaultOrder);

	// Loading and error state
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Internal page tracking for context data pagination
	const [currentContextPage, setCurrentContextPage] = useState<number>(1);

	// Use search results if active, otherwise use context data with pagination
	const displayData = isSearchActive
		? searchResults.slice((searchResultsPage - 1) * pageSize, searchResultsPage * pageSize)
		: contextData
			? contextData.slice((currentContextPage - 1) * pageSize, currentContextPage * pageSize)
			: [];

	// For pagination, use total items from server when not searching
	const numberOfPages = Math.ceil(
		(isSearchActive ? searchResultsTotalItems || searchResults.length || 0 : contextTotalItems || contextData?.length || 0) / pageSize
	);

	// Build search parameters helper
	const buildSearchParams = useCallback(() => {
		const params = new URLSearchParams({
			limit: limit.toString(),
		});

		// Add search value if exists
		if (searchValue && searchValue.trim()) {
			params.append('search', searchValue.trim());
		}

		// Add filter if exists
		if (filterValue && filterValue.trim()) {
			params.append('filter', filterValue.trim());
		}

		// Add sorting
		if (orderBy) {
			params.append('sortBy', orderBy.toString());
		}
		if (order) {
			params.append('sortOrder', order);
		}

		// Add custom parameters
		const customParams = typeof customSearchParams === 'function' ? customSearchParams(filterValue) : customSearchParams;
		Object.entries(customParams || {}).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				params.append(key, value.toString());
			}
		});

		return params;
	}, [searchValue, filterValue, orderBy, order, limit, customSearchParams]);

	// Handle search
	const handleSearch = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			onSearchStart?.();

			// Reset to first page when searching
			setContextPageNumber?.(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());

				const params = buildSearchParams();
				params.set('page', '1'); // Explicitly set page to 1 for initial search
				const endpoint = getEndpoint();
				const separator = endpoint.includes('?') ? '&' : '?';
				const response = await axios.get(`${endpoint}${separator}${params.toString()}`);

				const results = response.data.data as T[];
				setSearchResults(results);
				setSearchResultsTotalItems(response.data.totalItems || results.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);

				onSearchComplete?.(results);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
				setSearchedValue('');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Search failed';
			setError(errorMessage);
			onSearchError?.(err instanceof Error ? err : new Error(errorMessage));
			console.error('Search error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [searchValue, buildSearchParams, getEndpoint, setContextPageNumber, onSearchStart, onSearchComplete, onSearchError]);

	// Handle filter changes
	const handleFilterChange = useCallback(
		async (newFilterValue: string) => {
			setFilterValue(newFilterValue);
			onFilterChange?.(newFilterValue);

			// Auto-search when filter is selected
			if (newFilterValue && newFilterValue.trim()) {
				setIsLoading(true);
				setError(null);
				setContextPageNumber?.(1);
				setSearchResultsPage(1);
				setIsSearchActive(true);
				setSearchResultsLoadedPages([]);

				try {
					// Build params with the new filter value for custom parameters
					const params = new URLSearchParams({
						limit: limit.toString(),
						page: '1', // Explicitly set page to 1 when filter changes
					});
					if (searchValue && searchValue.trim()) {
						params.append('search', searchValue.trim());
					}
					params.set('filter', newFilterValue.trim());
					if (orderBy) {
						params.append('sortBy', orderBy.toString());
					}
					if (order) {
						params.append('sortOrder', order);
					}

					// Add custom parameters with the new filter value
					const customParams = typeof customSearchParams === 'function' ? customSearchParams(newFilterValue.trim()) : customSearchParams;
					Object.entries(customParams || {}).forEach(([key, value]) => {
						if (value !== undefined && value !== null) {
							params.append(key, value.toString());
						}
					});

					const endpoint = getEndpoint();
					const separator = endpoint.includes('?') ? '&' : '?';
					const fullUrl = `${endpoint}${separator}${params.toString()}`;
					const response = await axios.get(fullUrl);
					const results = response.data.data as T[];
					setSearchResults(results);
					setSearchResultsTotalItems(response.data.totalItems || results.length);
					setSearchResultsLoadedPages([1]);
					setSearchButtonClicked(true); // Add this line
					onSearchComplete?.(results);
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : 'Filter search failed';
					setError(errorMessage);
					onSearchError?.(err instanceof Error ? err : new Error(errorMessage));
					console.error('Filter search error:', err);
				} finally {
					setIsLoading(false);
				}
			} else {
				// If filter is cleared but search value exists, auto-search with search value
				if (searchValue && searchValue.trim()) {
					handleSearch();
				} else {
					// Clear search results and go back to context data
					setSearchResults([]);
					setSearchResultsLoadedPages([]);
					setSearchResultsTotalItems(0);
					setIsSearchActive(false);
					setSearchResultsPage(1);
				}
			}
		},
		[searchValue, buildSearchParams, getEndpoint, setContextPageNumber, handleSearch, onFilterChange, onSearchComplete, onSearchError]
	);

	// Fetch more search results - matches the exact pattern from pages
	const fetchMoreSearchResults = useCallback(
		async (page: number, searchParams?: URLSearchParams) => {
			try {
				setIsLoading(true);

				// Use provided params or build new ones
				const params = searchParams || buildSearchParams();
				params.set('page', page.toString());

				const endpoint = getEndpoint();
				const separator = endpoint.includes('?') ? '&' : '?';
				const response = await axios.get(`${endpoint}${separator}${params.toString()}`);

				if (page === 1) {
					// First page - replace all data
					setSearchResults(response.data.data);
					setSearchResultsLoadedPages([1]);
				} else {
					// Subsequent pages - append data
					setSearchResults((prev) => {
						const newData = [...prev, ...response.data.data];
						return newData;
					});
					setSearchResultsLoadedPages((prev) => [...prev, page]);
				}

				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Fetch more search results failed';
				setError(errorMessage);
				console.error('Fetch more search results error:', err);
			} finally {
				setIsLoading(false);
			}
		},
		[buildSearchParams, getEndpoint]
	);

	// Handle page changes - matches exact pattern from pages
	const handlePageChange = useCallback(
		async (newPage: number) => {
			// Set appropriate page number based on search state
			if (isSearchActive) {
				setSearchResultsPage(newPage);
			} else {
				// Update internal page tracking for context data
				setCurrentContextPage(newPage);
			}

			// If in search mode, handle search results pagination
			if (isSearchActive) {
				// Check if we need to fetch a new chunk (API page) for search results
				const requiredRecords = newPage * pageSize;
				const currentLoadedRecords = searchResults.length;

				// Only fetch if we need data from a new chunk (API page)
				if (requiredRecords > currentLoadedRecords) {
					// Build search parameters
					const params = buildSearchParams();

					// Calculate which API pages we need to fetch
					const currentLoadedPages = searchResultsLoadedPages && searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
					const targetApiPage = Math.ceil(requiredRecords / limit);

					// Only fetch if we need a new API page
					if (currentLoadedPages < targetApiPage) {
						// Fetch all missing API pages in sequence
						for (let page = currentLoadedPages + 1; page <= targetApiPage; page++) {
							if (!searchResultsLoadedPages?.includes(page)) {
								await fetchMoreSearchResults(page, params);
							}
						}
					}
				}
			} else {
				// Check if we need to fetch a new chunk (API page) for context
				const requiredRecords = newPage * pageSize;
				const currentLoadedRecords = contextData ? contextData.length : 0;

				// Only fetch if we need data from a new chunk (API page)
				if (requiredRecords > currentLoadedRecords && newPage <= numberOfPages) {
					// Calculate which API pages we need to fetch
					const currentLoadedPages = contextLoadedPages && contextLoadedPages.length > 0 ? Math.max(...contextLoadedPages) : 0;
					const targetApiPage = Math.ceil(requiredRecords / limit);

					// Only fetch if we need a new API page
					if (currentLoadedPages < targetApiPage) {
						// Fetch all missing pages from currentLoadedPages + 1 to targetApiPage (gap-filling)
						await fetchMoreContextData(currentLoadedPages + 1, targetApiPage);
					}
				}
			}
		},
		[
			isSearchActive,
			searchResults,
			searchResultsLoadedPages,
			contextData,
			contextLoadedPages,
			pageSize,
			limit,
			numberOfPages,
			setContextPageNumber,
			fetchMoreContextData,
			buildSearchParams,
			fetchMoreSearchResults,
		]
	);

	// Handle sorting
	const handleSort = useCallback(
		(property: keyof T | string) => {
			const isAsc = orderBy === property && order === 'asc';
			setOrder(isAsc ? 'desc' : 'asc');
			setOrderBy(property);
		},
		[orderBy, order, isSearchActive, handleSearch]
	);

	// Reset functions
	const resetSearch = useCallback(() => {
		setSearchValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
		setError(null);

		// If filter is still active, keep filter results
		if (filterValue && filterValue.trim()) {
			// Re-trigger filter search without search value
			const params = new URLSearchParams({
				limit: limit.toString(),
				filter: filterValue.trim(),
			});
			if (orderBy) params.append('sortBy', orderBy.toString());
			if (order) params.append('sortOrder', order);

			// Add custom parameters
			const customParams = typeof customSearchParams === 'function' ? customSearchParams(filterValue.trim()) : customSearchParams;
			Object.entries(customParams || {}).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					params.append(key, value.toString());
				}
			});

			// Make API call to get filtered results
			const endpoint = getEndpoint();
			const separator = endpoint.includes('?') ? '&' : '?';
			axios
				.get(`${endpoint}${separator}${params.toString()}`)
				.then((response) => {
					const results = response.data.data as T[];
					setSearchResults(results);
					setSearchResultsTotalItems(response.data.totalItems || results.length);
					setSearchResultsLoadedPages([1]);
					setIsSearchActive(true);
					setSearchResultsPage(1);
				})
				.catch((error) => {
					console.error('Filter search error:', error);
					// If filter search fails, clear everything
					setSearchResults([]);
					setSearchResultsLoadedPages([]);
					setSearchResultsTotalItems(0);
					setIsSearchActive(false);
					setSearchResultsPage(1);
				});
		} else {
			// No filter, clear everything
			setSearchResults([]);
			setSearchResultsLoadedPages([]);
			setSearchResultsTotalItems(0);
			setIsSearchActive(false);
			setSearchResultsPage(1);
		}
	}, [filterValue, limit, orderBy, order, getEndpoint]);

	const resetFilter = useCallback(() => {
		setFilterValue('');
		if (searchValue && searchValue.trim()) {
			// Re-trigger search without filter value
			const params = new URLSearchParams({
				limit: limit.toString(),
				search: searchValue.trim(),
			});
			if (orderBy) params.append('sortBy', orderBy.toString());
			if (order) params.append('sortOrder', order);

			// Make API call to get search results
			const endpoint = getEndpoint();
			const separator = endpoint.includes('?') ? '&' : '?';
			axios
				.get(`${endpoint}${separator}${params.toString()}`)
				.then((response) => {
					const results = response.data.data as T[];
					setSearchResults(results);
					setSearchResultsTotalItems(response.data.totalItems || results.length);
					setSearchResultsLoadedPages([1]);
					setIsSearchActive(true);
					setSearchResultsPage(1);
					// Don't set searchButtonClicked - user didn't click search button
				})
				.catch((error) => {
					console.error('Search error:', error);
					// If search fails, clear everything
					setSearchResults([]);
					setSearchResultsLoadedPages([]);
					setSearchResultsTotalItems(0);
					setIsSearchActive(false);
					setSearchResultsPage(1);
				});
		} else {
			setSearchResults([]);
			setSearchResultsLoadedPages([]);
			setSearchResultsTotalItems(0);
			setIsSearchActive(false);
			setSearchResultsPage(1);
		}
	}, [searchValue, limit, orderBy, order, getEndpoint]);

	const resetAll = useCallback(() => {
		// Clear search and filter values
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);

		// Clear search results but keep context data visible
		setSearchResults([]);
		setSearchResultsLoadedPages([]);
		setSearchResultsTotalItems(0);
		setIsSearchActive(false);
		setSearchResultsPage(1);
		setError(null);

		// Reset sorting
		setOrderBy(defaultOrderBy);
		setOrder(defaultOrder);
	}, [defaultOrderBy, defaultOrder]);

	// Advanced functions for future use
	const refreshSearch = useCallback(async () => {
		if (isSearchActive) {
			await handleSearch();
		}
	}, [isSearchActive, handleSearch]);

	const getSearchParams = useCallback(() => {
		return buildSearchParams();
	}, [buildSearchParams]);

	// Cleanup search state function - matches exact pattern from pages
	const cleanupSearchState = useCallback(() => {
		setSearchResults([]);
		setSearchResultsLoadedPages([]);
		setSearchResultsTotalItems(0);
		setIsSearchActive(false);
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
		setError(null);
	}, []);

	// Cleanup on component unmount
	useEffect(() => {
		return () => {
			cleanupSearchState();
		};
	}, [cleanupSearchState]);

	// Function to remove an item from search results without clearing search state
	const removeFromSearchResults = useCallback(
		(itemId: string) => {
			if (isSearchActive) {
				setSearchResults((prev) => prev.filter((item) => item._id !== itemId));
				setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
			}
		},
		[isSearchActive]
	);

	// Cleanup when navigating away from page
	useEffect(() => {
		return () => {
			cleanupSearchState();
		};
	}, [location.pathname, cleanupSearchState]);

	return {
		// Search state
		searchValue,
		setSearchValue,
		filterValue,
		setFilterValue,

		// Search results state
		searchResults,
		isSearchActive,
		searchResultsPage,
		searchResultsLoadedPages,
		searchResultsTotalItems,
		searchButtonClicked,
		searchedValue,

		// Sort state
		orderBy,
		setOrderBy,
		order,
		setOrder,

		// Display data
		displayData,
		numberOfPages,
		currentPage: isSearchActive ? searchResultsPage : currentContextPage,

		// Actions
		handleSearch,
		handleFilterChange,
		handlePageChange,
		handleSort,

		// Reset functions
		resetSearch,
		resetFilter,
		resetAll,

		// Advanced functions
		refreshSearch,
		getSearchParams,
		removeFromSearchResults,
		isLoading,
		error,

		// Cleanup function
		cleanupSearchState,
	};
};

// Backward compatibility alias
export const useFilterSearchSimple = useFilterSearch;
