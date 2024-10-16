import React, { useContext, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { Box } from '@mui/material';
import { EventsContext } from '../contexts/EventsContextProvider';
import { Event } from '../interfaces/event';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { User } from '../interfaces/user';
import { Roles } from '../interfaces/enums';
import CreateEventDialog from '../components/layouts/calendar/CreateEventDialog';
import EventDetailsDialog from '../components/layouts/calendar/EventDetailsDialog';
import EditEventDialog from '../components/layouts/calendar/EditEventDialog';
import { UsersContext } from '../contexts/UsersContextProvider';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';

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
	const { sortedEventsData } = useContext(EventsContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { sortedUsersData } = useContext(UsersContext);
	const { sortedCoursesData } = useContext(CoursesContext);

	const [eventsData, setEventsData] = useState<Event[]>([]);
	const [newEventModalOpen, setNewEventModalOpen] = useState<boolean>(false);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState<boolean>(false);

	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [filteredCourses, setFilteredCourses] = useState<SingleCourse[]>([]);

	const [editEventModalOpen, setEditEventModalOpen] = useState<boolean>(false);

	const [isEventDeleted, setIsEventDeleted] = useState<boolean>(false);

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
		attendees: [],
		createdBy: user?._id || '',
		createdAt: '',
		updatedAt: '',
		coursesIds: [],
		allAttendeesIds: [],
		isAllLearnersSelected: false,
		isAllCoursesSelected: false,
	});

	useEffect(() => {
		setFilteredUsers([]);
	}, []);

	useEffect(() => {
		if (sortedEventsData) {
			const transformedEvents = sortedEventsData.map((event) => {
				const startDate = new Date(event.start!);
				let endDate = new Date(event.end!);
				const isAllDayEvent = event.isAllDay || false;

				if (isAllDayEvent) {
					endDate.setHours(23, 59, 59);
				}

				return {
					...event,
					start: startDate,
					end: endDate,
					isAllDay: isAllDayEvent,
				};
			});

			setEventsData(transformedEvents);
		}
	}, [sortedEventsData, isEventDeleted]);

	useEffect(() => {
		if (selectedEvent && selectedEvent._id) {
			if (user?.role === Roles.USER) {
				setEventDetailsModalOpen(true);
			} else {
				setEditEventModalOpen(true);
			}
		}
	}, [selectedEvent, user?.role]);

	const eventStyleGetter = (event: Event) => {
		const backgroundColor = event.isAllDay ? 'lightblue' : '#ffb7b2';
		return {
			style: { backgroundColor, borderRadius: '0.35rem', color: '#333', border: 'none', display: 'block' },
		};
	};

	const handleSelectSlot = React.useCallback(
		({ start, end }: SlotInfo) => {
			if (user?.role === Roles.ADMIN) {
				const isMonthView = start.getHours() === 0 && end.getHours() === 0;
				const startTime = isMonthView ? new Date(start.setHours(16, 0, 0, 0)) : start;
				const endTime = isMonthView ? new Date(start.setHours(17, 0, 0, 0)) : end;

				setNewEvent((prevEvent) => ({ ...prevEvent, start: startTime, end: endTime }));
				setNewEventModalOpen(true);
			}
		},
		[user?.role]
	);

	const handleEventSelect = (event: Event) => {
		setIsEventDeleted(false);
		if (!event._id) {
			console.error('Event ID is undefined. Event not selected properly.');
			return; // Exit early if the event has no ID
		}

		setSelectedEvent(event);

		if (user?.role === Roles.USER) {
			setEventDetailsModalOpen(true);
		} else {
			setEditEventModalOpen(true);
		}
	};

	const filterUsers = (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setFilteredUsers([]);
			return; // Exit early if there's no search query
		}

		const searchResults = sortedUsersData.filter(
			(mappedUser) =>
				(mappedUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
					mappedUser.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
				!newEvent.attendees.some((attendee) => attendee._id === mappedUser._id)
		);

		setFilteredUsers(searchResults);
	};

	const filterCourses = (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setFilteredCourses([]);
			return; // Exit early if there's no search query
		}

		const searchResults = sortedCoursesData.filter(
			(course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()) && !newEvent.coursesIds.some((id) => id === course._id)
		);

		setFilteredCourses(searchResults);
	};

	return (
		<DashboardPagesLayout pageName='Calendar'>
			<Box sx={{ display: 'flex', padding: '3rem' }}>
				<Calendar
					localizer={localizer}
					events={eventsData}
					startAccessor='start'
					endAccessor='end'
					selectable={true}
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
				/>
			</Box>

			<CreateEventDialog
				newEvent={newEvent}
				newEventModalOpen={newEventModalOpen}
				filteredUsers={filteredUsers}
				filteredCourses={filteredCourses}
				setFilteredUsers={setFilteredUsers}
				setFilteredCourses={setFilteredCourses}
				setNewEvent={setNewEvent}
				setNewEventModalOpen={setNewEventModalOpen}
				filterUsers={filterUsers}
				filterCourses={filterCourses}
			/>

			<EventDetailsDialog
				eventDetailsModalOpen={eventDetailsModalOpen}
				selectedEvent={selectedEvent}
				setEventDetailsModalOpen={setEventDetailsModalOpen}
			/>

			<EditEventDialog
				setIsEventDeleted={setIsEventDeleted}
				editEventModalOpen={editEventModalOpen}
				selectedEvent={selectedEvent}
				filteredUsers={filteredUsers}
				filteredCourses={filteredCourses}
				setFilteredUsers={setFilteredUsers}
				setFilteredCourses={setFilteredCourses}
				setEditEventModalOpen={setEditEventModalOpen}
				setSelectedEvent={setSelectedEvent}
				filterUsers={filterUsers}
				filterCourses={filterCourses}
			/>

			<CustomDialog title='Edit Event'></CustomDialog>
		</DashboardPagesLayout>
	);
};

export default EventCalendar;
