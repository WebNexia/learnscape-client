import {
	Box,
	Checkbox,
	DialogActions,
	DialogContent,
	FormControl,
	FormControlLabel,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	Tooltip,
	Typography,
} from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Cancel, Search } from '@mui/icons-material';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { Event } from '../../../interfaces/event';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useContext } from 'react';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { User } from '../../../interfaces/user';
import theme from '../../../themes';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { UsersContext } from '../../../contexts/UsersContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import axios from 'axios';
import { EventsContext } from '../../../contexts/EventsContextProvider';

interface CreateEventDialogProps {
	newEvent: Event;
	searchValue: string;
	newEventModalOpen: boolean;
	filteredUsers: User[];
	isAllUsersSelected: boolean;
	learnerFirebaseId: string;
	filteredUsersModalOpen: boolean;
	setNewEvent: React.Dispatch<React.SetStateAction<Event>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	setNewEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
	setIsAllUsersSelected: React.Dispatch<React.SetStateAction<boolean>>;
	setLearnerFirebaseId: React.Dispatch<React.SetStateAction<string>>;
	setFilteredUsersModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	filterUsers: () => Promise<void>;
}

const CreateEventDialog = ({
	newEvent,
	searchValue,
	newEventModalOpen,
	filteredUsers,
	isAllUsersSelected,
	learnerFirebaseId,
	filteredUsersModalOpen,
	setNewEvent,
	setSearchValue,
	setNewEventModalOpen,
	setFilteredUsers,
	setIsAllUsersSelected,
	setLearnerFirebaseId,
	setFilteredUsersModalOpen,
	filterUsers,
}: CreateEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { sortedCoursesData } = useContext(CoursesContext);
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { sortedUsersData } = useContext(UsersContext);
	const { addNewEvent } = useContext(EventsContext);

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

	const resetNewEventForm = () => {
		setNewEvent({
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
			learnerUsername: '',
			courseTitle: '',
			createdBy: user?._id || '',
			createdAt: '',
			updatedAt: '',
			username: '',
		});
		setSearchValue('');
	};

	return (
		<CustomDialog
			openModal={newEventModalOpen}
			closeModal={() => {
				setNewEventModalOpen(false);
				resetNewEventForm();
			}}
			title='Create Event'
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleAddEvent();
					setNewEventModalOpen(false);
					resetNewEventForm();
				}}>
				<DialogContent sx={{ mt: '-1rem' }}>
					<CustomTextField
						label='Title'
						value={newEvent.title}
						onChange={(e) => setNewEvent((prevData) => ({ ...prevData, title: e.target.value }))}
					/>

					<CustomTextField
						label='Description'
						multiline
						rows={3}
						required={false}
						value={newEvent.description}
						onChange={(e) => setNewEvent((prevData) => ({ ...prevData, description: e.target.value }))}
					/>

					<Box sx={{ display: 'flex', mb: '0.85rem' }}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateTimePicker
								label='Start Time'
								value={newEvent.start ? dayjs(newEvent.start) : null}
								onChange={(newValue: Dayjs | null) => {
									setNewEvent((prevData) => ({
										...prevData,
										start: newValue ? newValue.toDate() : null,
									}));
								}}
								slotProps={{
									textField: {
										fullWidth: true,
										variant: 'outlined',
										required: true,
									},
								}}
								sx={{ backgroundColor: '#fff', mr: '0.5rem' }}
								disabled={newEvent.isAllDay}
							/>
						</LocalizationProvider>

						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateTimePicker
								label='End Time'
								value={newEvent.end ? dayjs(newEvent.end) : null}
								onChange={(newValue: Dayjs | null) => {
									setNewEvent((prevData) => ({
										...prevData,
										end: newValue ? newValue.toDate() : null,
									}));
								}}
								slotProps={{
									textField: {
										fullWidth: true,
										variant: 'outlined',
									},
								}}
								sx={{ backgroundColor: '#fff' }}
								disabled={newEvent.isAllDay}
							/>
						</LocalizationProvider>
					</Box>

					<CustomTextField
						label='Event Link'
						value={newEvent.eventLinkUrl}
						onChange={(e) => setNewEvent((prevData) => ({ ...prevData, eventLinkUrl: e.target.value }))}
						required={false}
					/>

					<CustomTextField
						label='Location'
						value={newEvent.location}
						onChange={(e) => setNewEvent((prevData) => ({ ...prevData, location: e.target.value }))}
						required={false}
					/>

					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
							<CustomTextField
								label=''
								value={searchValue}
								disabled={!!newEvent.learnerId || !!newEvent.courseId}
								placeholder={newEvent.learnerId || newEvent.courseId ? '' : 'Search Learner'}
								onChange={(e) => {
									setSearchValue(e.target.value);
									setFilteredUsers([]);
								}}
								sx={{ backgroundColor: !!newEvent.courseId ? 'transparent' : '#fff' }}
								required={false}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Tooltip title='Search' placement='top'>
												<IconButton
													onClick={() => {
														if (searchValue) {
															filterUsers();
														}
													}}
													sx={{
														mr: '-0.75rem',
														':hover': {
															backgroundColor: 'transparent',
														},
													}}
													disabled={!!newEvent.courseId || !!newEvent.courseTitle}>
													<Search />
												</IconButton>
											</Tooltip>
										</InputAdornment>
									),
								}}
							/>
							{newEvent.learnerId && (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										position: 'absolute',
										left: '0.75rem',
										bottom: '1.1rem',
										border: 'solid lightgray 0.1rem',
										padding: '0 0.25rem',
										height: '1.75rem',
										borderRadius: '0.25rem',
									}}>
									<Typography sx={{ fontSize: '0.85rem' }}>{newEvent.learnerUsername}</Typography>
									<IconButton
										onClick={() => {
											setNewEvent((prevData) => ({ ...prevData, learnerId: '', learnerUsername: '' }));
										}}>
										<Cancel sx={{ fontSize: '0.95rem' }} />
									</IconButton>
								</Box>
							)}
						</Box>

						<CustomDialog
							openModal={filteredUsersModalOpen}
							closeModal={() => {
								setFilteredUsersModalOpen(false);
								setSearchValue('');
								setIsAllUsersSelected(false);
							}}
							maxWidth='sm'
							title='Filtered User(s)'
							content='Click to select'>
							<DialogContent>
								{filteredUsers.length !== 0 && (
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											alignItems: 'flex-start',
											width: '85%',
											height: 'auto',
											margin: '-1rem auto 1.5rem auto',
											border: 'solid 0.05rem lightgray',
											overflow: 'auto',
										}}>
										{filteredUsers
											?.filter((filteredUser) => filteredUser.firebaseUserId !== user?.firebaseUserId)
											?.map((mappedUser, index) => (
												<Box
													key={mappedUser.firebaseUserId}
													sx={{
														display: 'flex',
														justifyContent: 'flex-start',
														alignItems: 'center',
														width: '100%',
														padding: '0.5rem',
														paddingTop: index === 0 ? '1.25rem' : '',
														paddingBottom: index === filteredUsers.length - 1 ? '1.25rem' : '',
														transition: '0.5s',
														borderRadius: '0.25rem',
														':hover': {
															backgroundColor: theme.bgColor?.primary,
															color: '#fff',
															cursor: 'pointer',
															'& .username': {
																color: '#fff',
															},
														},
													}}
													onClick={() => {
														setNewEvent((prevData) => ({ ...prevData, learnerId: mappedUser._id, learnerUsername: mappedUser.username }));
														setLearnerFirebaseId(mappedUser.firebaseUserId);
														setFilteredUsersModalOpen(false);
														setSearchValue('');
													}}>
													<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
														<img
															src={mappedUser.imageUrl}
															alt='profile_img'
															style={{
																height: '2.5rem',
																width: '2.5rem',
																borderRadius: '100%',
																border: 'solid lightgray 0.1rem',
															}}
														/>
													</Box>
													<Box>
														<Typography className='username' variant='body2'>
															{mappedUser.username}
														</Typography>
													</Box>
												</Box>
											))}
									</Box>
								)}
								<Box sx={{ width: '100%', textAlign: 'center' }}>
									<Typography
										onClick={() => {
											if (!isAllUsersSelected) {
												const allOtherUsers = sortedUsersData.filter((mappedUser) => user?._id !== mappedUser._id);
												setFilteredUsers(allOtherUsers);
												setIsAllUsersSelected(true);
											} else {
												filterUsers();
												setIsAllUsersSelected(false);
											}
										}}
										sx={{
											fontSize: '0.85rem',
											cursor: 'pointer',
											':hover': {
												textDecoration: 'underline',
											},
										}}>
										{!isAllUsersSelected ? 'See All Users' : 'Back to Search'}
									</Typography>
								</Box>
							</DialogContent>
							<DialogActions>
								<Box sx={{ display: 'flex', justifyContent: 'center', margin: '0 1rem 1rem 1rem' }}>
									<CustomCancelButton
										onClick={() => {
											setSearchValue('');
											setIsAllUsersSelected(false);
											setFilteredUsersModalOpen(false);
										}}>
										Close
									</CustomCancelButton>
								</Box>
							</DialogActions>
						</CustomDialog>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<FormControl fullWidth>
							<InputLabel id='course-label' sx={{ fontSize: '0.8rem' }}>
								Select Course
							</InputLabel>
							<Select
								labelId='course-label'
								label='Select Course'
								size='medium'
								fullWidth
								disabled={!!newEvent.learnerUsername}
								value={newEvent.courseTitle}
								sx={{ fontSize: '0.85rem', backgroundColor: !!newEvent.learnerUsername ? 'transparent' : '#fff' }}
								onChange={(e) => {
									const selectedCourseId = sortedCoursesData.find((course) => course.title === e.target.value)?._id;
									setNewEvent((prevData) => ({ ...prevData, courseId: selectedCourseId ? selectedCourseId : '', courseTitle: e.target.value }));
								}}
								MenuProps={{
									PaperProps: {
										style: {
											maxHeight: 250,
										},
									},
								}}>
								<MenuItem value=''>
									<Typography sx={{ fontSize: '0.8rem', color: 'gray', fontStyle: 'italic' }}>Clear Selection</Typography>
								</MenuItem>
								{sortedCoursesData?.map((course) => {
									return (
										<MenuItem key={course._id} value={course.title}>
											<Typography sx={{ fontSize: '0.85rem' }}>{course.title}</Typography>
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
					</Box>
					<FormControlLabel
						control={
							<Checkbox
								checked={newEvent.isAllDay}
								onChange={(e) => {
									const isAllDay = e.target.checked;
									setNewEvent((prevData) => {
										let updatedStart = prevData.start;
										let updatedEnd = prevData.end;

										// If "All Day" is checked, set start and end to cover the full day
										if (isAllDay && updatedStart && updatedEnd) {
											updatedStart = new Date(updatedStart.setHours(0, 0, 0, 0));
											updatedEnd = new Date(updatedStart); // Start with the same day
											updatedEnd.setHours(23, 59, 59, 999);
										}

										return {
											...prevData,
											isAllDay,
											start: updatedStart,
											end: updatedEnd,
										};
									});
								}}
								sx={{
									'& .MuiSvgIcon-root': {
										fontSize: '1.25rem', // Adjust the checkbox icon size
									},
								}}
							/>
						}
						label='All Day'
						sx={{
							mt: '0.5rem',
							'& .MuiFormControlLabel-label': {
								fontSize: '0.8rem', // Adjust the label font size
							},
						}}
					/>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						setNewEventModalOpen(false);
						resetNewEventForm();
					}}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateEventDialog;
