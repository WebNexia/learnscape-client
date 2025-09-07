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

	const fetchResources = async () => {
		if (!orgId) return { data: [], total: 0 };

		try {
			// Fetch documents for landing page resources with pagination
			const response = await axios.get(`${base_url}/documents/landing/${orgId}?page=${currentPage}&limit=50`);
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
	} = useQuery(['landingPageResources', orgId, currentPage], fetchResources, {
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
		}
	}, [resourcesData, currentPage]);

	const loadMore = () => {
		if (resourcesData && allResources && allResources.length < resourcesData.total) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	// Calculate if there are more resources to load
	const hasMore = resourcesData ? allResources.length < resourcesData.total : false;
	const total = resourcesData?.total || 0;

	// Debug logging
	console.log('Resources hasMore calculation:', {
		allResourcesLength: allResources.length,
		totalFromAPI: resourcesData?.total,
		hasMore,
		currentPage,
	});

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
			}}>
			{props.children}
		</LandingPageResourcesContext.Provider>
	);
};

export default LandingPageResourcesContextProvider;
