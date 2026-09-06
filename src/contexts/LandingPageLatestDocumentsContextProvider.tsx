import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { Document } from '../interfaces/document';
import { useLocation } from 'react-router-dom';

interface LandingPageLatestDocumentsContextTypes {
	latestDocuments: Document[];
	loading: boolean;
	error: string | null;
}

interface LandingPageLatestDocumentsContextProviderProps {
	children: ReactNode;
}

export const LandingPageLatestDocumentsContext = createContext<LandingPageLatestDocumentsContextTypes>({
	latestDocuments: [],
	loading: false,
	error: null,
});

const LandingPageLatestDocumentsContextProvider = (props: LandingPageLatestDocumentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	const isHomePage = location.pathname === '/';

	const fetchLatestDocuments = async () => {
		if (!orgId) return [];

		try {
			const response = await axios.get(`${base_url}/documents/landing/${orgId}?limit=3`);
			return response.data.data || [];
		} catch (error: unknown) {
			console.error('Error fetching latest documents:', error);
			throw error;
		}
	};

	const {
		data: latestDocumentsData,
		isLoading,
		isError,
	} = useQuery(['landingPageLatestDocuments', orgId], fetchLatestDocuments, {
		enabled: !!orgId && isHomePage,
		staleTime: 60 * 60 * 1000,
		cacheTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const latestDocuments = latestDocumentsData || [];
	const loading = isLoading;
	const error = isError ? 'Failed to fetch latest documents' : null;

	return (
		<LandingPageLatestDocumentsContext.Provider
			value={{
				latestDocuments,
				loading,
				error,
			}}>
			{props.children}
		</LandingPageLatestDocumentsContext.Provider>
	);
};

export default LandingPageLatestDocumentsContextProvider;
