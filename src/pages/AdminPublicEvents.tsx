import {
	Box,
	FormControl,
	InputAdornment,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	Divider,
	DialogContent,
	Link,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import { Download, Search, Visibility } from '@mui/icons-material';
import CreateLessonDialog from '../components/forms/newLesson/CreateLessonDialog';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateTimeFormatter } from '../utils/dateFormatter';
import { EventsContext } from '../contexts/EventsContextProvider';
import { Event } from '../interfaces/event';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import axios from '@utils/axiosInstance';

const AdminPublicEvents = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { sortedEventsData, fetchEvents, sortEventsData } = useContext(EventsContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [publicEventsPageNumber, setPublicEventsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState<boolean>(false);

	const pageSize = 50;

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

	const filteredPublicEvents = sortedEventsData
		.filter((event) => event.isPublic)
		.filter((event) => {
			if (searchValue) {
				const lowerSearch = searchValue.toLowerCase();
				return event?.title?.toLowerCase().includes(lowerSearch);
			}
			if (filterValue) {
				if (filterValue === 'webinar' && event.type === 'Webinar') return true;
				if (filterValue === 'guest talk' && event.type === 'Guest Talk') return true;
				if (filterValue === 'workshop' && event.type === 'Workshop') return true;
				if (filterValue === 'training' && event.type === 'Training') return true;
				if (filterValue === 'meeting' && event.type === 'Meeting') return true;
				if (filterValue === 'other' && event.type === 'Other') return true;
				if (filterValue === 'upcoming events' && !!event.start && new Date(event.start) > new Date()) return true;
				if (filterValue === 'past events' && !!event.start && new Date(event.start) < new Date()) return true;
			}
			return !searchValue && !filterValue;
		});

	const publicEventsNumberOfPages = Math.ceil(filteredPublicEvents.length / pageSize);

	const paginatedPublicEvents = filteredPublicEvents.slice((publicEventsPageNumber - 1) * pageSize, publicEventsPageNumber * pageSize);

	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof Event>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Event) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortEventsData(property, isAsc ? 'desc' : 'asc');
	};

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			fetchEvents(1);
		}
	}, []);

	useEffect(() => {
		setPublicEventsPageNumber(1);
	}, []);

	const handleDownloadParticipants = async (eventId: string, eventTitle: string) => {
		try {
			const response = await axios.get(`${base_url}/eventRegistrations/event/${eventId}/excel`, { responseType: 'blob' });

			// Get filename from Content-Disposition header if available
			let filename = `${eventTitle}_participants.xlsx`;
			const disposition = response.headers['content-disposition'];
			if (disposition && disposition.indexOf('filename=') !== -1) {
				filename = disposition.split('filename=')[1].replace(/['"]/g, '').trim();
			}

			// Create a blob URL and trigger download
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<DashboardPagesLayout pageName='Public Events' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={(e) => {
									setSearchValue('');
									setFilterValue(e.target.value);
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									textTransform: 'capitalize',
								}}>
								<MenuItem
									disabled
									value='filter'
									selected
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										fontStyle: 'italic',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Filter Events
								</MenuItem>
								<MenuItem
									value=''
									selected
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									All Events
								</MenuItem>
								{['Webinar', 'Guest Talk', 'Workshop', 'Training', 'Meeting', 'Other'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
								<MenuItem
									disabled
									value='types'
									selected
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										textTransform: 'inherit',
										fontWeight: 'lighter',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									----- Filter by Time -----
								</MenuItem>
								{['Upcoming Events', 'Past Events'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{ alignSelf: 'flex-start', width: isVerySmallScreen ? '7rem' : isMobileSize ? '15rem' : '17.5rem' }}>
						<CustomTextField
							value={searchValue}
							placeholder={isVerySmallScreen ? 'Search in Title' : 'Search Event in Title'}
							onChange={(e) => {
								setSearchValue(e.target.value);
								setFilterValue('filter');
								if (e.target.value === '') {
									setFilterValue('');
								}
							}}
							sx={{ backgroundColor: '#fff' }}
							required={false}
							InputProps={{
								endAdornment: (
									<InputAdornment position='end'>
										<Search
											sx={{
												mr: '-0.5rem',
											}}
											fontSize={isMobileSize ? 'small' : 'medium'}
										/>
									</InputAdornment>
								),
							}}
						/>
					</Box>
				</Box>
			</Box>
			<CreateLessonDialog isNewLessonModalOpen={isNewLessonModalOpen} createNewLesson={true} setIsNewLessonModalOpen={setIsNewLessonModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<Event>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'title', label: 'Title' },
							{ key: 'type', label: 'Type' },
							{ key: 'start', label: 'Start' },
							{ key: 'end', label: 'End' },
							{ key: 'participantCount', label: 'Participants(#)' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedPublicEvents &&
							paginatedPublicEvents?.map((event: Event) => {
								return (
									<TableRow key={event._id}>
										<CustomTableCell value={event.title} />
										<CustomTableCell value={event.type} />
										<CustomTableCell value={dateTimeFormatter(event.start)} />
										<CustomTableCell value={dateTimeFormatter(event.end)} />
										<CustomTableCell value={event.participantCount} />
										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='View Details'
												onClick={() => {
													setSelectedEvent(event);
													setEventDetailsModalOpen(true);
												}}
												icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<CustomActionBtn
												title='Download List of Participants'
												onClick={() => handleDownloadParticipants(event._id, event.title)}
												icon={<Download fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={publicEventsNumberOfPages} page={publicEventsPageNumber} onChange={setPublicEventsPageNumber} />
			</Box>

			<CustomDialog openModal={eventDetailsModalOpen} closeModal={() => setEventDetailsModalOpen(false)} title='Event Details' maxWidth='sm'>
				<DialogContent>
					{selectedEvent ? (
						<Box>
							<Typography variant='h6' gutterBottom>
								{selectedEvent.title}
							</Typography>
							<Divider sx={{ mb: 2 }} />
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Type:</b> {selectedEvent.type}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Start:</b> {dateTimeFormatter(selectedEvent.start)}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>End:</b> {dateTimeFormatter(selectedEvent.end)}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Location:</b> {selectedEvent.location || '-'}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Description:</b> {selectedEvent.description || '-'}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Event Link:</b>{' '}
								{selectedEvent.eventLinkUrl ? (
									<Link href={selectedEvent.eventLinkUrl} target='_blank' rel='noopener noreferrer' sx={{ textDecoration: 'underline' }}>
										{selectedEvent.eventLinkUrl}
									</Link>
								) : (
									'-'
								)}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Created At:</b> {dateTimeFormatter(selectedEvent.createdAt)}
							</Typography>
							<Typography variant='body2' sx={{ mb: '0.75rem' }}>
								<b>Last Updated At:</b> {dateTimeFormatter(selectedEvent.updatedAt)}
							</Typography>
						</Box>
					) : (
						<Typography>No event selected.</Typography>
					)}
				</DialogContent>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default AdminPublicEvents;
