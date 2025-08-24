import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Event } from '../interfaces/event';
import { useAuth } from '../hooks/useAuth';

interface EventsContextTypes {
	sortedEventsData: Event[];

	sortEventsData: (property: keyof Event, order: 'asc' | 'desc') => void;

	addNewEvent: (newEvent: any) => void;
	removeEvent: (id: string) => void;
	updateEvent: (singleEvent: Event) => void;

	// Month-based calendar functionality
	fetchMonthEvents: (year: number, month: number) => Promise<void>;
	loadedMonths: string[];
	refreshCalendarData: () => void;
}

interface EventsContextProviderProps {
	children: ReactNode;
}

export const EventsContext = createContext<EventsContextTypes>({
	sortedEventsData: [],
	sortEventsData: () => {},
	addNewEvent: () => {},
	removeEvent: () => {},
	updateEvent: () => {},
	// Month-based calendar functionality
	fetchMonthEvents: async () => {},
	loadedMonths: [],
	refreshCalendarData: () => {},
});

const EventsContextProvider = (props: EventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const location = useLocation();

	const isCalendarRoute = location.pathname.includes('/calendar');
	const [sortedEventsData, setSortedEventsData] = useState<Event[]>([]);

	// Month-based calendar state
	const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
	const [isCalendarLoaded, setIsCalendarLoaded] = useState<boolean>(false);

	// Function to handle sorting
	const sortEventsData = (property: keyof Event, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedEventsData].sort((a: Event, b: Event) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setSortedEventsData(sortedDataCopy);
	};
	// Function to update sortedEventsData with new event data
	const addNewEvent = async (newEvent: any) => {
		setSortedEventsData((prevSortedData) => [newEvent, ...prevSortedData]);
	};

	const updateEvent = async (singleEvent: Event) => {
		const updatedEventList = sortedEventsData?.map((event) => {
			if (singleEvent._id === event._id) {
				return singleEvent;
			}
			return event;
		});
		setSortedEventsData(updatedEventList);
	};

	const removeEvent = async (id: string) => {
		setSortedEventsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	// Month-based calendar functions
	const fetchMonthEvents = async (year: number, month: number) => {
		if (!orgId) return;

		const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

		// Skip if already loaded
		if (loadedMonths.includes(monthKey)) return;

		try {
			const response = await axios.get(`${base_url}/events/organisation/${orgId}?year=${year}&month=${month}&limit=1000`);

			const eventsData = response.data.data;

			// Add new events to existing calendar events, remove duplicates
			setSortedEventsData((prev) => {
				const combined = [...prev, ...eventsData];
				const unique = combined.filter((event, index, self) => index === self.findIndex((e) => e._id === event._id));
				return unique;
			});

			// Mark month as loaded
			setLoadedMonths((prev) => [...prev, monthKey]);
			setIsCalendarLoaded(true);
		} catch (error) {
			setIsCalendarLoaded(true);
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
			// Fetch all three months in parallel
			const promises = monthsToFetch.map(({ year, month }) =>
				axios.get(`${base_url}/events/organisation/${orgId}?year=${year}&month=${month}&limit=1000`)
			);

			const responses = await Promise.all(promises);

			// Combine all events
			const allEvents = responses.flatMap((response) => response.data.data);

			// Remove duplicates
			const uniqueEvents = allEvents.filter((event, index, self) => index === self.findIndex((e) => e._id === event._id));

			setSortedEventsData(uniqueEvents);

			// Mark months as loaded
			const monthKeys = monthsToFetch.map(({ year, month }) => `${year}-${month.toString().padStart(2, '0')}`);
			setLoadedMonths(monthKeys);
			setIsCalendarLoaded(true);
		} catch (error) {
			setIsCalendarLoaded(true);
			throw error;
		}
	};

	const refreshCalendarData = () => {
		setIsCalendarLoaded(false);
		setLoadedMonths([]);
		setSortedEventsData([]);
		fetchInitialMonths();
	};

	// Use month-based fetching for calendar routes
	const { isLoading: isCalendarLoading, isError: isCalendarError } = useQuery(['calendarEvents', orgId], fetchInitialMonths, {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && isCalendarRoute && !isCalendarLoaded,
	});

	if (isCalendarLoading) {
		return <Loading />;
	}

	if (isCalendarError) {
		return <LoadingError />;
	}

	return (
		<EventsContext.Provider
			value={{
				sortedEventsData,
				sortEventsData,
				addNewEvent,
				removeEvent,
				updateEvent,
				fetchMonthEvents,
				loadedMonths,
				refreshCalendarData,
			}}>
			{props.children}
		</EventsContext.Provider>
	);
};

export default EventsContextProvider;
