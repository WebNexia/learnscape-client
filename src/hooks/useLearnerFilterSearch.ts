import { useState, useMemo } from 'react';

export interface FilterOption {
	value: string;
	label: string;
}

export interface UseLearnerFilterSearchOptions<T> {
	// Data to filter
	data: T[] | null;

	// Search configuration
	searchFields: (keyof T)[];

	// Custom filter function (optional)
	customFilterFn?: (item: T, filterValue: string) => boolean;
}

export interface UseLearnerFilterSearchReturn<T> {
	// State
	searchValue: string;
	filterValue: string;
	searchedValue: string;
	searchButtonClicked: boolean;

	// Setters
	setSearchValue: (value: string) => void;
	setFilterValue: (value: string) => void;

	// Computed values
	filteredData: T[];
	totalItems: number;
	isSearchActive: boolean;

	// Actions
	handleSearch: () => void;
	resetSearch: () => void;
	resetFilter: () => void;
	resetAll: () => void;
}

export function useLearnerFilterSearch<T extends Record<string, any>>({
	data,
	searchFields,
	customFilterFn,
}: UseLearnerFilterSearchOptions<T>): UseLearnerFilterSearchReturn<T> {
	const [searchValue, setSearchValue] = useState('');
	const [filterValue, setFilterValue] = useState('');
	const [searchedValue, setSearchedValue] = useState('');
	const [searchButtonClicked, setSearchButtonClicked] = useState(false);

	// Memoized filtered data
	const filteredData = useMemo(() => {
		if (!data) return [];

		let filtered = [...data];

		// Apply custom filter first (e.g., active courses only)
		if (customFilterFn) {
			filtered = filtered.filter((item) => customFilterFn(item, filterValue));
		}

		// Apply search filter on the already filtered data (only when search button was clicked)
		if (searchButtonClicked && searchedValue.trim()) {
			const searchLower = searchedValue.toLowerCase();
			filtered = filtered.filter((item) =>
				searchFields.some((field) => {
					const fieldValue = item[field];
					if (typeof fieldValue === 'string') {
						return fieldValue.toLowerCase().includes(searchLower);
					}
					return false;
				})
			);
		}

		return filtered;
	}, [data, searchedValue, filterValue, searchFields, customFilterFn, searchButtonClicked]);

	const totalItems = filteredData.length;
	const isSearchActive = searchButtonClicked && !!searchedValue.trim();

	const handleSearch = () => {
		setSearchedValue(searchValue.trim());
		setSearchButtonClicked(true);
	};

	const resetSearch = () => {
		setSearchValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
	};

	const resetFilter = () => setFilterValue('');

	const resetAll = () => {
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
	};

	return {
		searchValue,
		filterValue,
		searchedValue,
		searchButtonClicked,
		setSearchValue,
		setFilterValue,
		filteredData,
		totalItems,
		isSearchActive,
		handleSearch,
		resetSearch,
		resetFilter,
		resetAll,
	};
}
