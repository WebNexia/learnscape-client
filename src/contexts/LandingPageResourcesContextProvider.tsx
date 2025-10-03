import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { Document } from '../interfaces/document';
import { useLocation } from 'react-router-dom';

interface LandingPageResourcesContextTypes {
	resources: Document[];
	loading: boolean;
	error: string | null;
	total: number;
	hasMore: boolean;
	loadMore: () => void;
	// Search and filter functionality
	searchValue: string;
	setSearchValue: (value: string) => void;
	activeFilter: string;
	setActiveFilter: (filter: string) => void;
	searchedValue: string;
	onSearch: (searchTerm?: string) => void;
	onReset: () => void;
	onRemoveSearch: () => void;
	isSearching: boolean;
}

interface LandingPageResourcesContextProviderProps {
	children: ReactNode;
}

export const LandingPageResourcesContext = createContext<LandingPageResourcesContextTypes>({
	resources: [],
	loading: false,
	error: null,
	total: 0,
	hasMore: false,
	loadMore: () => {},
	searchValue: '',
	setSearchValue: () => {},
	activeFilter: '',
	setActiveFilter: () => {},
	searchedValue: '',
	onSearch: () => {},
	onReset: () => {},
	onRemoveSearch: () => {},
	isSearching: false,
});

const LandingPageResourcesContextProvider = (props: LandingPageResourcesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	// Check if we're on the resources page only
	const isResourcesPage = location.pathname === '/resources';

	// State for pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [allResources, setAllResources] = useState<Document[]>([]);

	// State for search and filters
	const [searchValue, setSearchValue] = useState('');
	const [activeFilter, setActiveFilter] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [isSearching, setIsSearching] = useState(false);

	const getUserCurrency = () => {
		// Get user's country from URL or default to US
		const country = new URLSearchParams(location.search).get('country') || 'US';

		switch (country.toUpperCase()) {
			case 'GB':
				return 'gbp';
			case 'TR':
				return 'try';
			case 'EU':
				return 'eur';
			default:
				return 'usd';
		}
	};

	const fetchResources = async () => {
		if (!orgId) return { data: [], total: 0 };

		try {
			// Build query parameters
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '50',
				currency: getUserCurrency(),
			});

			// Add search parameter if provided
			if (searchedValue.trim()) {
				params.append('search', searchedValue.trim());
			}

			// Add filter parameter if provided
			if (activeFilter) {
				params.append('filters', activeFilter);
			}

			const response = await axios.get(`${base_url}/documents/landing/${orgId}?${params.toString()}`);
			return response.data;
		} catch (error: any) {
			console.error('Error fetching resources:', error);
			throw error;
		}
	};

	const {
		data: resourcesData,
		isLoading,
		isError,
	} = useQuery(['landingPageResources', orgId, currentPage, searchedValue, activeFilter, location.search], fetchResources, {
		enabled: !!orgId && isResourcesPage,
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: false, // No refetch on window focus
		refetchOnMount: false, // No refetch on component remount
	});

	// Update allResources when resourcesData changes
	useEffect(() => {
		if (resourcesData) {
			if (currentPage === 1) {
				// First page - replace all resources
				setAllResources(resourcesData.data || []);
			} else {
				// Subsequent pages - append resources
				setAllResources((prev) => [...prev, ...(resourcesData.data || [])]);
			}
			// Set isSearching to false when data is loaded
			setIsSearching(false);
		}
	}, [resourcesData, currentPage]);

	const loadMore = () => {
		if (resourcesData && allResources && allResources.length < resourcesData.total) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	// Search and reset functions
	const onSearch = (searchTerm?: string) => {
		const termToSearch = searchTerm || searchValue;

		// If there's no search term, don't trigger search
		if (!termToSearch.trim()) {
			return;
		}

		// If the search term is the same as the current searched value, don't trigger search again
		if (termToSearch.trim() === searchedValue) {
			return;
		}

		setIsSearching(true);
		setSearchedValue(termToSearch.trim()); // Store the searched value
		// Don't clear searchValue - keep it in input like admin pages
		setCurrentPage(1); // Reset to first page
		setAllResources([]); // Clear existing resources
		// The useQuery will automatically refetch due to dependency changes
	};

	const onReset = () => {
		setSearchValue('');
		setActiveFilter('');
		setSearchedValue('');
		setIsSearching(false);
		setCurrentPage(1);
		// Don't clear allResources immediately - let the new query results replace them
		// The useQuery will automatically refetch due to dependency changes
	};

	const onRemoveSearch = () => {
		setSearchValue(''); // Clear the search input
		setSearchedValue(''); // Clear the searched value
		setCurrentPage(1);
		setAllResources([]);
		// The useQuery will automatically refetch due to dependency changes
	};

	// Calculate if there are more resources to load
	const hasMore = resourcesData ? allResources.length < resourcesData.total : false;
	const total = resourcesData?.total || 0;

	// Get resources data
	const resources = allResources;
	const loading = isLoading;
	const error = isError ? 'Failed to fetch resources' : null;

	return (
		<LandingPageResourcesContext.Provider
			value={{
				resources,
				loading,
				error,
				total,
				hasMore,
				loadMore,
				searchValue,
				setSearchValue,
				activeFilter,
				setActiveFilter,
				searchedValue,
				onSearch,
				onReset,
				onRemoveSearch,
				isSearching,
			}}>
			{props.children}
		</LandingPageResourcesContext.Provider>
	);
};

export default LandingPageResourcesContextProvider;
