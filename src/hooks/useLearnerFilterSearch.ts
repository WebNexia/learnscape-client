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

	// Setters
	setSearchValue: (value: string) => void;
	setFilterValue: (value: string) => void;

	// Computed values
	filteredData: T[];
	totalItems: number;
	isSearchActive: boolean;

	// Actions
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

	// Memoized filtered data
	const filteredData = useMemo(() => {
		if (!data) return [];

		let filtered = [...data];

		// Apply custom filter first (e.g., active courses only)
		if (customFilterFn) {
			filtered = filtered.filter((item) => customFilterFn(item, filterValue));
		}

		// Apply search filter on the already filtered data
		if (searchValue.trim()) {
			const searchLower = searchValue.toLowerCase();
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
	}, [data, searchValue, filterValue, searchFields, customFilterFn]);

	const totalItems = filteredData.length;
	const isSearchActive = !!searchValue.trim();

	const resetSearch = () => setSearchValue('');
	const resetFilter = () => setFilterValue('');
	const resetAll = () => {
		setSearchValue('');
		setFilterValue('');
	};

	return {
		searchValue,
		filterValue,
		setSearchValue,
		setFilterValue,
		filteredData,
		totalItems,
		isSearchActive,
		resetSearch,
		resetFilter,
		resetAll,
	};
}
