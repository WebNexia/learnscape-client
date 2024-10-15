import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Event } from '../interfaces/event';

interface EventsContextTypes {
	sortedEventsData: Event[];
	sortEventsData: (property: keyof Event, order: 'asc' | 'desc') => void;
	addNewEvent: (newEvent: any) => void;
	removeEvent: (id: string) => void;
	updateEvent: (singleEvent: Event) => void;
	eventsNumberOfPages: number;
	eventsPageNumber: number;
	setEventsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchEvents: (page: number) => void;
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
	eventsNumberOfPages: 1,
	eventsPageNumber: 1,
	setEventsPageNumber: () => {},
	fetchEvents: () => {},
});

const EventsContextProvider = (props: EventsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);

	const [sortedEventsData, setSortedEventsData] = useState<Event[]>([]);
	const [eventsNumberOfPages, setNumberOfPages] = useState<number>(1);
	const [eventsPageNumber, setEventsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchEvents = async (page: number) => {
		if (!orgId) return;
		try {
			const response = await axios.get(`${base_url}/events/organisation/${orgId}?page=${page}&limit=1000`);

			// Initial sorting when fetching data
			const sortedDataCopy = [...response.data.data].sort((a: Event, b: Event) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedEventsData(sortedDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(['allEvents', orgId, eventsPageNumber], () => fetchEvents(eventsPageNumber), {
		enabled: !!orgId && !isLoaded,
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
	const addNewEvent = (newEvent: any) => {
		setSortedEventsData((prevSortedData) => [newEvent, ...prevSortedData]);
	};

	const updateEvent = (singleEvent: Event) => {
		const updatedEventList = sortedEventsData?.map((event) => {
			if (singleEvent._id === event._id) {
				return singleEvent;
			}
			return event;
		});
		setSortedEventsData(updatedEventList);
	};

	const removeEvent = (id: string) => {
		setSortedEventsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
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
				eventsNumberOfPages,
				eventsPageNumber,
				setEventsPageNumber,
				fetchEvents,
			}}>
			{props.children}
		</EventsContext.Provider>
	);
};

export default EventsContextProvider;
