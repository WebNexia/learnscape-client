import { Box, Table, TableBody, TableCell, TableRow, Typography, Divider, DialogContent, Link, DialogActions } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import { Download, Visibility } from '@mui/icons-material';
import CreateLessonDialog from '../components/forms/newLesson/CreateLessonDialog';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateTimeFormatter } from '../utils/dateFormatter';
import { Event } from '../interfaces/event';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import axios from '@utils/axiosInstance';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { AdminPublicEventsContext } from '../contexts/AdminPublicEventsContextProvider';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

const AdminPublicEvents = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const {
		publicEvents,
		fetchMorePublicEvents,
		loadedPages,
		publicEventsPageNumber,
		setPublicEventsPageNumber,
		enableAdminPublicEventsFetch,
		loading,
	} = useContext(AdminPublicEventsContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState<boolean>(false);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayEvents,
		numberOfPages: eventsNumberOfPages,
		searchResultsPage,
		searchResultsTotalItems,
		searchedValue,
		orderBy,
		order,
		isSearchActive,
		isLoading: isSearchLoading,
		handleSearch,
		handleFilterChange,
		handlePageChange,
		handleSort,
		resetSearch,
		resetFilter,
		resetAll,
	} = useFilterSearch<Event>({
		getEndpoint: () => `${base_url}/events/public/${orgId}?upcomingOnly=false`,
		limit: 200,
		pageSize,
		contextData: publicEvents,
		setContextPageNumber: setPublicEventsPageNumber,
		fetchMoreContextData: fetchMorePublicEvents,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'start',
		defaultOrder: 'asc',
	});

	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : publicEventsPageNumber;

	const sortedPublicEvents =
		[...(displayEvents || [])]?.sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];

	const paginatedPublicEvents = sortedPublicEvents?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);

	// Enable admin public events fetching only once when component mounts
	useEffect(() => {
		enableAdminPublicEventsFetch();
	}, []); // Empty dependency array - only run once

	useEffect(() => {
		setPublicEventsPageNumber(1);
	}, []); // Reset page number only once on mount

	const handleDownloadParticipants = async (eventId: string, eventTitle: string) => {
		try {
			const response = await axios.get(`${base_url}/eventRegistrations/event/${eventId}/excel`, { responseType: 'blob' });

			// Get filename from Content-Disposition header if available
			let filename = `${eventTitle}_participants.xlsx`;
			const disposition = response.headers['content-disposition'];
			if (disposition && disposition?.indexOf('filename=') !== -1) {
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

	// Show loading state while public events are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Public Events' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={6} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Public Events'>
			<DashboardPagesLayout pageName='Public Events' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Events' },
						...['Webinar', 'Guest Talk', 'Workshop', 'Training', 'Meeting', 'Other'].map((type) => ({
							value: type.toLowerCase(),
							label: type,
						})),
						...['Upcoming Events', 'Past Events'].map((type) => ({
							value: type.toLowerCase(),
							label: type,
						})),
					]}
					filterPlaceholder='Filter Events'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder={isVerySmallScreen ? 'Search in Title' : 'Search in Title and Description'}
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={displayEvents.length}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					isSticky={true}
				/>
				<CreateLessonDialog isNewLessonModalOpen={isNewLessonModalOpen} createNewLesson={true} setIsNewLessonModalOpen={setIsNewLessonModalOpen} />

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 1rem 2rem 1rem',
						width: '100%',
					}}>
					<Table
						sx={{
							'mb': '2rem',
							'tableLayout': 'fixed',
							'width': '100%',
							'& .MuiTableHead-root': {
								position: 'fixed',
								top: (isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim()) ? '11rem' : '8rem',
								left: isMobileSize ? 0 : '10rem',
								right: 0,
								zIndex: 99,
								backgroundColor: theme.palette.background.paper,
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
								display: 'table',
								tableLayout: 'fixed',
								width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
							},
							'& .MuiTableHead-root .MuiTableCell-root': {
								backgroundColor: theme.palette.background.paper,
								padding: '0.25rem 1rem',
							},
						}}
						size='small'
						aria-label='a dense table'>
						{((isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())) && <Box sx={{ height: '1.5rem' }}></Box>}
						<CustomTableHead<Event>
							orderBy={orderBy as keyof Event}
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
										<TableRow key={event._id} hover>
											<CustomTableCell value={event.title} />
											<CustomTableCell value={event.type} />
											<CustomTableCell value={dateTimeFormatter(event.start)} />
											<CustomTableCell value={dateTimeFormatter(event.end)} />
											<CustomTableCell value={event.participantCount ?? 0} />
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
					{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
					<CustomTablePagination count={eventsNumberOfPages} page={currentPage} onChange={handlePageChange} />
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
					<DialogActions>
						<CustomCancelButton onClick={() => setEventDetailsModalOpen(false)} sx={{ margin: '0 1rem 1rem 0' }}>
							Close
						</CustomCancelButton>
					</DialogActions>
				</CustomDialog>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminPublicEvents;
