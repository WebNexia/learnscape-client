import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';
import { useLocation } from 'react-router-dom';

import { OrganisationContext } from './OrganisationContextProvider';
import { CalendarGridEvent, Event } from '../interfaces/event';

export const CALENDAR_EVENTS_LIST_QUERY = 'view=calendar&limit=1000';

const buildCalendarMonthUrl = (baseUrl: string, orgId: string, year: number, month: number) =>
	`${baseUrl}/events/organisation/${orgId}?year=${year}&month=${month}&${CALENDAR_EVENTS_LIST_QUERY}`;

const toGridEventFields = (source: {
	_id: string;
	title: string;
	start: Date | string | null;
	end: Date | string | null;
	isAllDay: boolean;
	isPublic: boolean;
	createdBy: string;
}): CalendarGridEvent => ({
	_id: source._id,
	title: source.title,
	start: source.start == null ? '' : typeof source.start === 'string' ? source.start : source.start.toISOString(),
	end: source.end == null ? '' : typeof source.end === 'string' ? source.end : source.end.toISOString(),
	isAllDay: source.isAllDay,
	isPublic: source.isPublic,
	createdBy: source.createdBy,
});

const mergeUniqueCalendarEvents = (...eventLists: CalendarGridEvent[][]): CalendarGridEvent[] => {
	const eventById = new Map<string, CalendarGridEvent>();
	eventLists.flat().forEach((event) => eventById.set(event._id, event));
	return Array.from(eventById.values());
};
import { useAuth } from '../hooks/useAuth';
import { Roles, isLearnerRole } from '../interfaces/enums';
import { UserAuthContext } from './UserAuthContextProvider';

interface EventsContextTypes {
	sortedEventsData: CalendarGridEvent[];
	isLoading: boolean;

	sortEventsData: (property: keyof CalendarGridEvent, order: 'asc' | 'desc') => void;

	addNewEvent: (newEvent: any) => void;
	removeEvent: (id: string) => void;
	updateEvent: (singleEvent: Event) => void;

	// Month-based calendar functionality
	fetchMonthEvents: (year: number, month: number) => Promise<void>;
	loadedMonths: string[];
	refreshCalendarData: () => void;
	enableEventsFetch: () => void;
	disableEventsFetch: () => void;
}

interface EventsContextProviderProps {
	children: ReactNode;
}

export const EventsContext = createContext<EventsContextTypes>({
	sortedEventsData: [],
	isLoading: false,
	sortEventsData: () => {},
	addNewEvent: () => {},
	removeEvent: () => {},
	updateEvent: () => {},
	// Month-based calendar functionality
	fetchMonthEvents: async () => {},
	loadedMonths: [],
	refreshCalendarData: () => {},
	enableEventsFetch: () => {},
	disableEventsFetch: () => {},
});

const EventsContextProvider = (props: EventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isAuthenticated, hasAdminAccess, isLearner, isInstructor } = useAuth();
	const location = useLocation();
	const queryClient = useQueryClient();

	const isCalendarRoute = location.pathname?.includes('/calendar') || location.pathname?.includes('/events');
	// Month-based calendar state
	const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
	const [isEnabled, setIsEnabled] = useState<boolean>(true); // Start enabled to prevent flash

	// Function to handle sorting
	const sortEventsData = (property: keyof CalendarGridEvent, order: 'asc' | 'desc') => {
		const currentData = (queryClient.getQueryData(['calendarEvents', orgId]) as CalendarGridEvent[]) || [];
		const sortedDataCopy = [...(currentData || [])]?.sort((a: CalendarGridEvent, b: CalendarGridEvent) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		return sortedDataCopy;
	};

	// Function to update events with new event data
	const addNewEvent = async (newEvent: any) => {
		// Update calendar events cache
		queryClient.setQueryData(['calendarEvents', orgId], (oldData: CalendarGridEvent[] | undefined) => {
			const gridFields = toGridEventFields(newEvent);
			return oldData ? [gridFields, ...oldData] : [gridFields];
		});

		// Also update AdminPublicEvents cache to keep them in sync
		queryClient.setQueryData(['allPublicEvents', orgId], (oldData: Event[] | undefined) => {
			return oldData ? [newEvent, ...oldData] : [newEvent];
		});
	};

	const updateEvent = async (singleEvent: Event) => {
		// Update calendar events cache
		queryClient.setQueryData(['calendarEvents', orgId], (oldData: CalendarGridEvent[] | undefined) => {
			const gridFields = toGridEventFields(singleEvent);
			return (
				oldData?.map((event) => {
					if (singleEvent._id === event._id) {
						return gridFields;
					}
					return event;
				}) || []
			);
		});

		// Also update AdminPublicEvents cache to keep them in sync
		queryClient.setQueryData(['allPublicEvents', orgId], (oldData: Event[] | undefined) => {
			return (
				oldData?.map((event) => {
					if (singleEvent._id === event._id) {
						return singleEvent;
					}
					return event;
				}) || []
			);
		});
	};

	const removeEvent = async (id: string) => {
		// Update calendar events cache
		queryClient.setQueryData(['calendarEvents', orgId], (oldData: CalendarGridEvent[] | undefined) => {
			return oldData?.filter((data) => data._id !== id) || [];
		});

		// Also update AdminPublicEvents cache to keep them in sync
		queryClient.setQueryData(['allPublicEvents', orgId], (oldData: Event[] | undefined) => {
			return oldData?.filter((data) => data._id !== id) || [];
		});
	};

	// Month-based calendar functions
	const fetchMonthEvents = async (year: number, month: number) => {
		if (!orgId) return;

		const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

		// Skip if already loaded
		if (loadedMonths?.includes(monthKey)) return;

		try {
			const response = await axios.get(buildCalendarMonthUrl(base_url, orgId, year, month));

			const eventsData = response.data.data as CalendarGridEvent[];

			const currentData = (queryClient.getQueryData(['calendarEvents', orgId]) as CalendarGridEvent[]) || [];
			queryClient.setQueryData(['calendarEvents', orgId], mergeUniqueCalendarEvents(currentData, eventsData));

			// Mark month as loaded
			setLoadedMonths((prev) => [...prev, monthKey]);
		} catch (error) {
			console.error('Error fetching month events:', error);
			throw error;
		}
	};

	const fetchInitialMonths = async () => {
		if (!orgId) return;

		const currentDate = new Date();
		const currentYear = currentDate.getFullYear();
		const currentMonth = currentDate.getMonth() + 1;

		// Fetch previous, current, and next month
		const monthsToFetch = [
			{ year: currentYear, month: currentMonth - 1 },
			{ year: currentYear, month: currentMonth },
			{ year: currentYear, month: currentMonth + 1 },
		];

		// Handle year boundary
		if (currentMonth === 1) {
			monthsToFetch[0] = { year: currentYear - 1, month: 12 };
		}
		if (currentMonth === 12) {
			monthsToFetch[2] = { year: currentYear + 1, month: 1 };
		}

		try {
			// Fetch all three months in parallel with proper error handling
			const promises = monthsToFetch?.map(({ year, month }) => axios.get(buildCalendarMonthUrl(base_url, orgId, year, month)));

			const responses = await Promise.all(promises);

			// Combine all events
			const allEvents = responses.flatMap((response) => response.data.data);

			// Remove duplicates
			const uniqueEvents = mergeUniqueCalendarEvents(allEvents);

			// Update React Query cache
			queryClient.setQueryData(['calendarEvents', orgId], uniqueEvents);

			// Mark months as loaded
			const monthKeys = monthsToFetch?.map(({ year, month }) => `${year}-${month.toString().padStart(2, '0')}`) || [];
			setLoadedMonths(monthKeys);

			return uniqueEvents; // Return the events for React Query
		} catch (error) {
			console.error('❌ Error fetching initial months:', error);
			throw error;
		}
	};

	const refreshCalendarData = async () => {
		setLoadedMonths([]);
		await queryClient.invalidateQueries(['calendarEvents', orgId], {
			refetchActive: true,
			refetchInactive: true,
		});
	};

	// Use month-based fetching for calendar routes
	const { data: eventsData, isLoading: isCalendarLoading } = useQuery(['calendarEvents', orgId], fetchInitialMonths, {
		enabled: isEnabled && !!orgId && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && isCalendarRoute,
		staleTime: !isLearnerRole(user?.role) ? 0 : 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: hasAdminAccess,
		refetchOnMount: !isLearnerRole(user?.role),
	});

	// Get events data from React Query data
	const sortedEventsData: CalendarGridEvent[] = eventsData || [];

	const enableEventsFetch = () => setIsEnabled(true);
	const disableEventsFetch = () => setIsEnabled(false);

	return (
		<EventsContext.Provider
			value={{
				sortedEventsData,
				isLoading: isCalendarLoading || (isEnabled && !sortedEventsData),
				sortEventsData,
				addNewEvent,
				removeEvent,
				updateEvent,
				fetchMonthEvents,
				loadedMonths,
				refreshCalendarData,
				enableEventsFetch,
				disableEventsFetch,
			}}>
			<DataFetchErrorBoundary context='Events'>{props.children}</DataFetchErrorBoundary>
		</EventsContext.Provider>
	);
};

export default EventsContextProvider;
