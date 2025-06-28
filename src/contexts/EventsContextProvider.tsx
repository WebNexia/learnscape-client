import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Event } from '../interfaces/event';
import { useAuth } from '../hooks/useAuth';

interface EventsContextTypes {
	sortedEventsData: Event[];
	sortedPublicEventsData: Event[];
	sortEventsData: (property: keyof Event, order: 'asc' | 'desc') => void;
	sortPublicEventsData: (property: keyof Event, order: 'asc' | 'desc') => void;
	addNewEvent: (newEvent: any) => void;
	removeEvent: (id: string) => void;
	updateEvent: (singleEvent: Event) => void;
	eventsNumberOfPages: number;
	eventsPageNumber: number;
	setEventsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchEvents: (page: number) => void;
	fetchPublicEvents: () => void;
}

interface EventsContextProviderProps {
	children: ReactNode;
}

export const EventsContext = createContext<EventsContextTypes>({
	sortedEventsData: [],
	sortedPublicEventsData: [],
	sortEventsData: () => {},
	sortPublicEventsData: () => {},
	addNewEvent: () => {},
	removeEvent: () => {},
	updateEvent: () => {},
	eventsNumberOfPages: 1,
	eventsPageNumber: 1,
	setEventsPageNumber: () => {},
	fetchEvents: () => {},
	fetchPublicEvents: () => {},
});

const EventsContextProvider = (props: EventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();

	const [sortedEventsData, setSortedEventsData] = useState<Event[]>([]);
	const [sortedPublicEventsData, setSortedPublicEventsData] = useState<Event[]>([]);
	const [eventsNumberOfPages, setNumberOfPages] = useState<number>(1);
	const [eventsPageNumber, setEventsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchEvents = async (page: number) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/events/organisation/${orgId}?page=${page}&limit=10000`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Event, b: Event) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedEventsData(sortedDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const { isLoading, isError, refetch } = useQuery(['allEvents', orgId, eventsPageNumber], () => fetchEvents(eventsPageNumber), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner),
	});

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
		await refetch();
	};

	const updateEvent = async (singleEvent: Event) => {
		const updatedEventList = sortedEventsData?.map((event) => {
			if (singleEvent._id === event._id) {
				return singleEvent;
			}
			return event;
		});
		setSortedEventsData(updatedEventList);
		await refetch();
	};

	const removeEvent = async (id: string) => {
		setSortedEventsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
		await refetch();
	};

	const fetchPublicEvents = async () => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/events/public/${orgId}`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Event, b: Event) =>
				(a.start ? new Date(a.start).toISOString() : '').localeCompare(b.start ? new Date(b.start).toISOString() : '')
			);
			setSortedPublicEventsData(sortedDataCopy);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	// Function to handle sorting
	const sortPublicEventsData = (property: keyof Event, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...sortedPublicEventsData].sort((a: Event, b: Event) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setSortedPublicEventsData(sortedDataCopy);
	};

	const { isLoading: isPublicEventsLoading, isError: isPublicEventsError } = useQuery(['allPublicEvents', orgId], () => fetchPublicEvents(), {
		enabled: !!orgId && !isLoaded,
	});

	if (isLoading || isPublicEventsLoading) {
		return <Loading />;
	}

	if (isError || isPublicEventsError) {
		return <LoadingError />;
	}

	return (
		<EventsContext.Provider
			value={{
				sortedEventsData,
				sortedPublicEventsData,
				sortEventsData,
				sortPublicEventsData,
				addNewEvent,
				removeEvent,
				updateEvent,
				eventsNumberOfPages,
				eventsPageNumber,
				setEventsPageNumber,
				fetchEvents,
				fetchPublicEvents,
			}}>
			{props.children}
		</EventsContext.Provider>
	);
};

export default EventsContextProvider;
