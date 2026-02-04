import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { Consultation } from '../interfaces/consultation';
import { useLocation } from 'react-router-dom';

interface LandingPageConsultationsContextTypes {
	consultations: Consultation[];
	loading: boolean;
	error: string | null;
	total: number;
	hasMore: boolean;
	loadMore: () => void;
}

interface LandingPageConsultationsContextProviderProps {
	children: ReactNode;
}

export const LandingPageConsultationsContext = createContext<LandingPageConsultationsContextTypes>({
	consultations: [],
	loading: false,
	error: null,
	total: 0,
	hasMore: false,
	loadMore: () => {},
});

const LandingPageConsultationsContextProvider = (props: LandingPageConsultationsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	const isConsultationsPage = location.pathname === '/landing-page-consultations';

	const [currentPage, setCurrentPage] = useState(1);
	const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);

	const fetchConsultations = async () => {
		if (!orgId) return { data: [], total: 0 };

		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '20',
			});

			const response = await axios.get(`${base_url}/consultations/public/${orgId}?${params.toString()}`);
			return response.data;
		} catch (error: unknown) {
			console.error('Error fetching consultations:', error);
			throw error;
		}
	};

	const {
		data: consultationsData,
		isLoading,
		isError,
	} = useQuery(['landingPageConsultations', orgId, currentPage], fetchConsultations, {
		enabled: !!orgId && isConsultationsPage,
		staleTime: 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	useEffect(() => {
		if (consultationsData) {
			if (currentPage === 1) {
				setAllConsultations(consultationsData.data || []);
			} else {
				setAllConsultations((prev) => [...prev, ...(consultationsData.data || [])]);
			}
		}
	}, [consultationsData, currentPage]);

	const loadMore = () => {
		const totalItems = consultationsData?.totalItems ?? 0;
		if (consultationsData && allConsultations.length < totalItems) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	const totalItems = consultationsData?.totalItems ?? 0;
	const hasMore = consultationsData ? allConsultations.length < totalItems : false;
	const total = totalItems;
	const consultations = allConsultations;
	const loading = isLoading;
	const error = isError ? 'Danışmanlık listesi yüklenemedi.' : null;

	return (
		<LandingPageConsultationsContext.Provider
			value={{
				consultations,
				loading,
				error,
				total,
				hasMore,
				loadMore,
			}}>
			{props.children}
		</LandingPageConsultationsContext.Provider>
	);
};

export default LandingPageConsultationsContextProvider;
