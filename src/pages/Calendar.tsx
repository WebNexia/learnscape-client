import { useContext, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { Box } from '@mui/material';
import CalendarSkeleton from '../components/layouts/skeleton/CalendarSkeleton';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { EventsContext } from '../contexts/EventsContextProvider';
import { Event } from '../interfaces/event';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

import { Roles } from '../interfaces/enums';
import CreateEventDialog from '../components/layouts/calendar/CreateEventDialog';
import EventDetailsDialog from '../components/layouts/calendar/EventDetailsDialog';
import EditEventDialog from '../components/layouts/calendar/EditEventDialog';

import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
	const { sortedEventsData, fetchMonthEvents, loadedMonths, enableEventsFetch, isLoading } = useContext(EventsContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isInstructor, isLearner, hasAdminAccess } = useAuth();

	const navigate = useNavigate();

	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [eventsData, setEventsData] = useState<Event[]>([]);
	const [newEventModalOpen, setNewEventModalOpen] = useState<boolean>(false);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState<boolean>(false);

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
		isPublic: false,
		type: '',
		coverImageUrl: '',
		participantCount: 0,
	});

	useEffect(() => {
		if (sortedEventsData) {
			const transformedEvents = sortedEventsData?.map((event) => {
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
				if (selectedEvent.createdBy === user?._id && (user?.hasRegisteredCourse || user?.isSubscribed)) {
					setEditEventModalOpen(true);
				} else {
					setEventDetailsModalOpen(true);
				}
			} else if (isInstructor && !selectedEvent.isPublic) {
				if (selectedEvent.createdBy === user?._id) {
					setEditEventModalOpen(true);
				} else {
					setEventDetailsModalOpen(true);
				}
			} else if (isInstructor && selectedEvent.isPublic) {
				setEventDetailsModalOpen(true);
			} else {
				setEditEventModalOpen(true);
			}
		}
	}, [selectedEvent, user?.role]);

	// Enable events fetching only once when component mounts
	useEffect(() => {
		enableEventsFetch();
	}, []); // Empty dependency array - only run once

	const eventStyleGetter = (event: Event) => {
		const backgroundColor = event.isAllDay ? 'lightblue' : '#ffb7b2';
		return {
			style: {
				backgroundColor,
				borderRadius: isMobileSize ? '0.2rem' : '0.35rem',
				color: '#333',
				border: 'none',
				display: 'block',
				fontSize: isMobileSize ? '0.6rem' : undefined,
			},
		};
	};

	const handleSelectSlot = ({ start, end }: SlotInfo) => {
		if (hasAdminAccess || isInstructor || (isLearner && (user?.hasRegisteredCourse || user?.isSubscribed))) {
			const isMonthView = start.getHours() === 0 && end.getHours() === 0;
			const startTime = isMonthView ? new Date(start.setHours(16, 0, 0, 0)) : start;
			const endTime = isMonthView ? new Date(start.setHours(17, 0, 0, 0)) : end;

			setNewEvent((prevEvent) => ({ ...prevEvent, start: startTime, end: endTime }));
			setNewEventModalOpen(true);
		}
	};

	const handleEventSelect = (event: Event) => {
		setIsEventDeleted(false);
		if (!event._id) {
			console.error('Event ID is undefined. Event not selected properly.');
			return; // Exit early if the event has no ID
		}

		setSelectedEvent(event);
	};

	// Handle calendar navigation to fetch additional months
	const handleNavigate = (newDate: Date, view: string) => {
		if (view === 'month') {
			const year = newDate.getFullYear();
			const month = newDate.getMonth() + 1;

			// Check if we need to fetch this month
			const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
			if (!loadedMonths?.includes(monthKey)) {
				fetchMonthEvents(year, month);
			}
		}
	};

	// Show loading state while events are being fetched or when data is empty and not loading yet
	if (isLoading) {
		return (
			<DashboardPagesLayout pageName='Calendar' showCopyRight={true}>
				<CalendarSkeleton />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Calendar'>
			<DashboardPagesLayout pageName='Calendar' showCopyRight={true}>
				<Box sx={{ display: 'flex', flexDirection: 'column', padding: isMobileSize ? '1rem' : '1rem 2rem 2rem 2rem' }}>
					{hasAdminAccess && (
						<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
							<CustomSubmitButton sx={{ width: 'fit-content', marginBottom: '1rem' }} onClick={() => navigate(`/admin/calendar/public-events`)}>
								Public Events
							</CustomSubmitButton>
						</Box>
					)}
					<style>
						{`
						.rbc-toolbar button {
							font-size:${isMobileSize ? '0.75rem' : '0.95rem'}; /* Modify button font size */
						}
						.rbc-toolbar-label {
							font-size:${isMobileSize ? '0.9rem' : '1rem'}; /* Modify label font size */
							margin:${isMobileSize ? '0.5rem 0rem' : '0rem'};
						}
						.rbc-month-view .rbc-date-cell {
							display: flex;
							justify-content: center;
							align-items: center;
							font-size: 14px !important;
							font-weight: bold;
							line-height: normal;
							height: 100%; /* Ensure it spans the cell */
						}

   					 `}
					</style>
					<Calendar
						localizer={localizer}
						events={eventsData}
						startAccessor='start'
						endAccessor='end'
						selectable={true}
						style={{
							height: isVerySmallScreen ? '65vh' : '78vh',
							fontFamily: 'Poppins',
							fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem',
							width: isMobileSizeSmall ? '91vw' : '76vw',
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
						onNavigate={handleNavigate}
					/>
				</Box>

				<CreateEventDialog
					newEvent={newEvent}
					newEventModalOpen={newEventModalOpen}
					setNewEvent={setNewEvent}
					setNewEventModalOpen={setNewEventModalOpen}
				/>

				<EventDetailsDialog
					eventDetailsModalOpen={eventDetailsModalOpen}
					selectedEvent={selectedEvent}
					setSelectedEvent={setSelectedEvent}
					setEventDetailsModalOpen={setEventDetailsModalOpen}
				/>

				<EditEventDialog
					setIsEventDeleted={setIsEventDeleted}
					editEventModalOpen={editEventModalOpen}
					selectedEvent={selectedEvent}
					setEditEventModalOpen={setEditEventModalOpen}
					setSelectedEvent={setSelectedEvent}
				/>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default EventCalendar;
