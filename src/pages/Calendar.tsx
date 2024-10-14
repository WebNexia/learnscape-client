import { useContext, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { Box, DialogActions, DialogContent, Link, Typography } from '@mui/material';
import { EventsContext } from '../contexts/EventsContextProvider';
import { Event } from '../interfaces/event';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import axios from 'axios';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';
import CreateEventDialog from '../components/layouts/calendar/CreateEventDialog';
import EventDetailsDialog from '../components/layouts/calendar/EventDetailsDialog';
import EditEventDialog from '../components/layouts/calendar/EditEventDialog';

const locales = {
	'en-US': enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

const EventCalendar = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { sortedEventsData, addNewEvent } = useContext(EventsContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const [eventsData, setEventsData] = useState<Event[]>([]);
	const [newEventModalOpen, setNewEventModalOpen] = useState<boolean>(false);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState<boolean>(false);

	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [searchValue, setSearchValue] = useState<string>('');

	const [selectedUsername, setSelectedUsername] = useState<string>('');

	const [editEventModalOpen, setEditEventModalOpen] = useState<boolean>(false);

	const [newEvent, setNewEvent] = useState<Event>({
		_id: '',
		title: '',
		description: '',
		start: null,
		end: null,
		eventLinkUrl: '',
		location: '',
		isAllDay: false,
		isActive: true,
		orgId,
		courseId: '',
		learnerId: '',
		createdBy: user?._id || '',
		createdAt: '',
		updatedAt: '',
		username: '',
	});

	useEffect(() => {
		// Transform your data to include the end date and convert to Date objects
		const transformedEvents = sortedEventsData.map((event) => {
			const startDate = new Date(event.start!);
			let endDate = new Date(event.end!);

			// Check if the event is full-day
			const isAllDayEvent = event.isAllDay || false;

			if (isAllDayEvent) {
				// Set end date to the same day for full-day events (optional: to the end of the day)
				endDate.setHours(23, 59, 59);
			}

			return {
				...event,
				start: startDate,
				end: endDate,
				allDay: isAllDayEvent,
			};
		});

		setEventsData(transformedEvents);
	}, [sortedEventsData]);

	const eventStyleGetter = (event: Event) => {
		const backgroundColor = event.isAllDay ? 'lightblue' : '#ffb7b2';
		return {
			style: { backgroundColor, borderRadius: '0.35rem', color: '#333', border: 'none', display: 'block' },
		};
	};

	const handleSelectSlot = ({ start, end }: SlotInfo) => {
		// Set default start and end for month view (full-day)
		const isMonthView = start.getHours() === 0 && end.getHours() === 0;

		const startTime = isMonthView ? new Date(start.setHours(0, 0, 0, 0)) : start;
		const endTime = isMonthView ? new Date(start.setHours(23, 59, 59, 999)) : end;

		setNewEvent({ ...newEvent, start: startTime, end: endTime });
		setNewEventModalOpen(true);
	};

	// Handle form submission to create new event
	const handleAddEvent = async () => {
		const event = {
			title: newEvent.title,
			description: newEvent.description,
			start: newEvent.start,
			end: newEvent.end,
			eventLinkUrl: newEvent.eventLinkUrl,
			location: newEvent.location,
			isAllDay: newEvent.isAllDay,
			isActive: true,
			orgId,
			courseId: newEvent.courseId,
			learnerId: newEvent.learnerId,
			createdBy: user?._id,
		};

		try {
			await axios.post(`${base_url}/events`, event);

			addNewEvent({ ...event, username: user?.username });
		} catch (error) {
			console.log(error);
		}
	};

	const handleEventSelect = (event: Event) => {
		setSelectedEvent(event);
		if (user?.role === Roles.USER) {
			setEventDetailsModalOpen(true);
		} else {
			setEditEventModalOpen(true);
		}
	};

	return (
		<DashboardPagesLayout pageName='Calendar'>
			<Box sx={{ display: 'flex', padding: '3rem' }}>
				<Calendar
					localizer={localizer}
					events={eventsData}
					startAccessor='start'
					endAccessor='end'
					style={{
						height: '78vh',
						fontFamily: 'poppins',
						fontSize: '0.85rem',
						width: '80vw',
						backgroundColor: '#fff',
						padding: '0.5rem',
						borderRadius: '0.5rem',
						border: 'solid lightgray 0.1rem',
						boxShadow: '0 0.2rem 0.5rem 0.1rem rgba(0,0,0,0.2)',
						flexGrow: 1,
					}}
					eventPropGetter={eventStyleGetter}
					onSelectSlot={handleSelectSlot}
					onSelectEvent={handleEventSelect}
					selectable
				/>
			</Box>

			<CreateEventDialog
				newEvent={newEvent}
				searchValue={searchValue}
				newEventModalOpen={newEventModalOpen}
				selectedUsername={selectedUsername}
				filteredUsers={filteredUsers}
				setFilteredUsers={setFilteredUsers}
				setNewEvent={setNewEvent}
				setSearchValue={setSearchValue}
				setNewEventModalOpen={setNewEventModalOpen}
				setSelectedUsername={setSelectedUsername}
				handleAddEvent={handleAddEvent}
			/>

			<EventDetailsDialog
				eventDetailsModalOpen={eventDetailsModalOpen}
				selectedEvent={selectedEvent}
				setEventDetailsModalOpen={setEventDetailsModalOpen}
			/>

			<EditEventDialog />

			<CustomDialog title='Edit Event'></CustomDialog>
		</DashboardPagesLayout>
	);
};

export default EventCalendar;
