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
import { Event } from '../../../interfaces/event';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Cancel, Search } from '@mui/icons-material';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import theme from '../../../themes';
import { User } from '../../../interfaces/user';
import { useContext, useState } from 'react';
import { UsersContext } from '../../../contexts/UsersContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { EventsContext } from '../../../contexts/EventsContextProvider';
import axios from 'axios';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';

interface EditEventDialogProps {
	editEventModalOpen: boolean;
	selectedEvent: Event | null;
	searchValue: string;
	isAllUsersSelected: boolean;
	learnerFirebaseId: string;
	filteredUsersModalOpen: boolean;
	filteredUsers: User[];
	setEditEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	setIsAllUsersSelected: React.Dispatch<React.SetStateAction<boolean>>;
	setLearnerFirebaseId: React.Dispatch<React.SetStateAction<string>>;
	setFilteredUsersModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
	filterUsers: () => Promise<void>;
}
const EditEventDialog = ({
	editEventModalOpen,
	selectedEvent,
	searchValue,
	isAllUsersSelected,
	learnerFirebaseId,
	filteredUsersModalOpen,
	filteredUsers,
	setEditEventModalOpen,
	setSelectedEvent,
	setSearchValue,
	setIsAllUsersSelected,
	setLearnerFirebaseId,
	setFilteredUsersModalOpen,
	setFilteredUsers,
	filterUsers,
}: EditEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { sortedUsersData } = useContext(UsersContext);
	const { user } = useContext(UserAuthContext);
	const { sortedCoursesData } = useContext(CoursesContext);
	const { updateEvent, removeEvent } = useContext(EventsContext);

	const [deleteEventModalOpen, setDeleteEventModalOpen] = useState<boolean>(false);

	const editEvent = async () => {
		try {
			await axios.patch(`${base_url}/events/${selectedEvent?._id}`, selectedEvent);
			if (selectedEvent) updateEvent(selectedEvent);

			setEditEventModalOpen(false);
		} catch (error) {
			console.log(error);
		}
	};

	const deleteEvent = async () => {
		try {
			await axios.delete(`${base_url}/events/${selectedEvent?._id}`);
			if (selectedEvent?._id) removeEvent(selectedEvent?._id);
			setEditEventModalOpen(false);
			setDeleteEventModalOpen(false);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<CustomDialog
			openModal={editEventModalOpen}
			closeModal={() => {
				setEditEventModalOpen(false);
			}}
			title='Edit Event'
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					editEvent();
				}}>
				<DialogContent sx={{ mt: '-1rem' }}>
					<CustomTextField
						label='Title'
						value={selectedEvent?.title}
						onChange={(e) =>
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, title: e.target.value };
								}
								return prevData;
							})
						}
					/>
					<CustomTextField
						label='Description'
						multiline
						rows={3}
						required={false}
						value={selectedEvent?.description}
						onChange={(e) =>
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, description: e.target.value };
								}
								return prevData;
							})
						}
					/>

					<Box sx={{ display: 'flex', mb: '0.85rem' }}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateTimePicker
								label='Start Time'
								value={selectedEvent?.start ? dayjs(selectedEvent.start) : null}
								onChange={(newValue: Dayjs | null) => {
									setSelectedEvent((prevData) => {
										if (prevData) {
											return { ...prevData, start: newValue ? newValue.toDate() : null };
										}
										return prevData;
									});
								}}
								slotProps={{
									textField: {
										fullWidth: true,
										variant: 'outlined',
										required: true,
									},
								}}
								sx={{ backgroundColor: '#fff', mr: '0.5rem' }}
								disabled={selectedEvent?.isAllDay}
							/>
						</LocalizationProvider>

						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateTimePicker
								label='End Time'
								value={selectedEvent?.end ? dayjs(selectedEvent?.end) : null}
								onChange={(newValue: Dayjs | null) => {
									setSelectedEvent((prevData) => {
										if (prevData) {
											return { ...prevData, end: newValue ? newValue.toDate() : null };
										}
										return prevData;
									});
								}}
								slotProps={{
									textField: {
										fullWidth: true,
										variant: 'outlined',
									},
								}}
								sx={{ backgroundColor: '#fff' }}
								disabled={selectedEvent?.isAllDay}
							/>
						</LocalizationProvider>
					</Box>
					<CustomTextField
						label='Event Link'
						value={selectedEvent?.eventLinkUrl}
						onChange={(e) =>
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, eventLinkUrl: e.target.value };
								}
								return prevData;
							})
						}
						required={false}
					/>

					<CustomTextField
						label='Location'
						value={selectedEvent?.location}
						onChange={(e) =>
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, location: e.target.value };
								}
								return prevData;
							})
						}
						required={false}
					/>

					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
							<CustomTextField
								label=''
								value={searchValue}
								disabled={!!selectedEvent?.learnerId || !!selectedEvent?.courseId}
								placeholder={selectedEvent?.learnerId || selectedEvent?.courseId ? '' : 'Search Learner'}
								onChange={(e) => {
									setSearchValue(e.target.value);
									setFilteredUsers([]);
								}}
								sx={{ backgroundColor: !!selectedEvent?.courseId ? 'transparent' : '#fff' }}
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
													disabled={!!selectedEvent?.learnerUsername || !!selectedEvent?.courseId || !searchValue}>
													<Search />
												</IconButton>
											</Tooltip>
										</InputAdornment>
									),
								}}
							/>
							{selectedEvent?.learnerUsername && (
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
									<Typography sx={{ fontSize: '0.85rem' }}>{selectedEvent?.learnerUsername}</Typography>
									<IconButton
										onClick={() => {
											setSelectedEvent((prevData) => {
												if (prevData) {
													return { ...prevData, learnerId: '', learnerUsername: '' };
												}
												return prevData;
											});
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
														setSelectedEvent((prevData) => {
															if (prevData) {
																return { ...prevData, learnerId: mappedUser._id, learnerUsername: mappedUser.username };
															}
															return prevData;
														});
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
							<InputLabel
								id='course-label'
								sx={{ fontSize: '0.8rem', color: !!selectedEvent?.learnerUsername || !!selectedEvent?.learnerId ? 'lightgray' : 'gray' }}>
								Select Course
							</InputLabel>
							<Select
								labelId='course-label'
								label='Select Course'
								size='medium'
								fullWidth
								disabled={!!selectedEvent?.learnerUsername || !!selectedEvent?.learnerId}
								value={selectedEvent?.courseTitle}
								sx={{ fontSize: '0.85rem', backgroundColor: selectedEvent?.learnerId ? 'transparent' : '#fff' }}
								onChange={(e) => {
									const selectedCourseId = sortedCoursesData.find((course) => course.title === e.target.value)?._id;
									setSelectedEvent((prevData) => {
										if (prevData) {
											return { ...prevData, courseId: selectedCourseId ? selectedCourseId : '', courseTitle: e.target.value };
										}
										return prevData;
									});
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
								checked={selectedEvent?.isAllDay}
								onChange={(e) => {
									const isAllDay = e.target.checked;
									setSelectedEvent((prevData) => {
										if (prevData) {
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
										}
										return prevData;
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
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0.75rem' }}>
					<Box sx={{ marginBottom: '1.5rem' }}>
						<CustomDeleteButton type='button' onClick={() => setDeleteEventModalOpen(true)}>
							Delete Event
						</CustomDeleteButton>
					</Box>
					<CustomDialogActions
						onCancel={() => {
							setEditEventModalOpen(false);
						}}
						submitBtnText='Update'
					/>
				</Box>
				<CustomDialog
					openModal={deleteEventModalOpen}
					closeModal={() => setDeleteEventModalOpen(false)}
					title='Delete Event'
					content='Are you sure you want to delete the event?'
					maxWidth='sm'>
					<CustomDialogActions deleteBtn onCancel={() => setDeleteEventModalOpen(false)} onDelete={deleteEvent} />
				</CustomDialog>
			</form>
		</CustomDialog>
	);
};

export default EditEventDialog;
