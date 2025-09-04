import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { OrganisationContext } from './OrganisationContextProvider';
import { Event } from '../interfaces/event';
import { useLocation } from 'react-router-dom';

interface LandingPageUpcomingPublicEventsContextTypes {
	upcomingEvents: Event[];
	loading: boolean;
	error: string | null;
}

interface LandingPageUpcomingPublicEventsContextProviderProps {
	children: ReactNode;
}

export const LandingPageUpcomingPublicEventsContext = createContext<LandingPageUpcomingPublicEventsContextTypes>({
	upcomingEvents: [],
	loading: false,
	error: null,
});

const LandingPageUpcomingPublicEventsContextProvider = (props: LandingPageUpcomingPublicEventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const location = useLocation();

	// Check if we're on the home page only (where upcoming events are displayed)
	const isHomePage = location.pathname === '/';

	const fetchUpcomingEvents = async () => {
		if (!orgId) return [];

		try {
			// Fetch upcoming events within next 30 days, limit to 50 for landing page
			const response = await axios.get(`${base_url}/events/public/${orgId}?upcomingOnly=true&page=1&limit=100`);
			return response.data.data || [];
		} catch (error: any) {
			console.error('Error fetching upcoming events:', error);
			throw error;
		}
	};

	const {
		data: upcomingEventsData,
		isLoading,
		isError,
	} = useQuery(['landingPageUpcomingEvents', orgId], fetchUpcomingEvents, {
		enabled: !!orgId && isHomePage,
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: false, // No refetch on window focus
		refetchOnMount: false, // No refetch on component remount
	});

	// Get upcoming events data
	const upcomingEvents = upcomingEventsData || [];
	const loading = isLoading;
	const error = isError ? 'Failed to fetch upcoming events' : null;

	return (
		<LandingPageUpcomingPublicEventsContext.Provider
			value={{
				upcomingEvents,
				loading,
				error,
			}}>
			{props.children}
		</LandingPageUpcomingPublicEventsContext.Provider>
	);
};

export default LandingPageUpcomingPublicEventsContextProvider;
