import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, InputAdornment, Typography } from '@mui/material';
import { Event } from '../../../interfaces/event';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Cancel, Search } from '@mui/icons-material';
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
	setIsEventDeleted: React.Dispatch<React.SetStateAction<boolean>>;
	editEventModalOpen: boolean;
	selectedEvent: Event | null;

	isAllLearnersSelected: boolean;
	filteredUsers: User[];
	setEditEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;

	setIsAllLearnersSelected: React.Dispatch<React.SetStateAction<boolean>>;
	setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
	filterUsers: (searchQuery: string) => void;
}
const EditEventDialog = ({
	setIsEventDeleted,
	editEventModalOpen,
	selectedEvent,

	isAllLearnersSelected,
	filteredUsers,
	setEditEventModalOpen,
	setSelectedEvent,

	setIsAllLearnersSelected,

	setFilteredUsers,
	filterUsers,
}: EditEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { sortedUsersData } = useContext(UsersContext);
	const { user } = useContext(UserAuthContext);
	const { sortedCoursesData } = useContext(CoursesContext);
	const { updateEvent, removeEvent } = useContext(EventsContext);

	const [deleteEventModalOpen, setDeleteEventModalOpen] = useState<boolean>(false);

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

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
			setIsEventDeleted(true);
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
								value={searchLearnerValue}
								onChange={(e) => {
									setSearchLearnerValue(e.target.value);
									setFilteredUsers([]);
								}}
								required={false}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search />
										</InputAdornment>
									),
								}}
							/>

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
								<Typography sx={{ fontSize: '0.85rem' }}></Typography>
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
						</Box>
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
