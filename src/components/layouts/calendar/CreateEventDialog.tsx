import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, InputAdornment, Typography } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Cancel, Search } from '@mui/icons-material';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { AttendeeInfo, Event } from '../../../interfaces/event';
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useContext, useState } from 'react';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { User } from '../../../interfaces/user';
import theme from '../../../themes';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { UsersContext } from '../../../contexts/UsersContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import axios from 'axios';
import { EventsContext } from '../../../contexts/EventsContextProvider';
import { truncateText } from '../../../utils/utilText';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { SingleCourse } from '../../../interfaces/course';
import { db } from '../../../firebase';

interface CreateEventDialogProps {
	newEvent: Event;
	newEventModalOpen: boolean;
	filteredUsers: User[];
	filteredCourses: SingleCourse[];
	isAllLearnersSelected: boolean;
	isAllCoursesSelected: boolean;
	setNewEvent: React.Dispatch<React.SetStateAction<Event>>;
	setNewEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
	setFilteredCourses: React.Dispatch<React.SetStateAction<SingleCourse[]>>;
	setIsAllLearnersSelected: React.Dispatch<React.SetStateAction<boolean>>;
	setIsAllCoursesSelected: React.Dispatch<React.SetStateAction<boolean>>;
	filterUsers: (searchQuery: string) => void;
	filterCourses: (searchQuery: string) => void;
}

const CreateEventDialog = ({
	newEvent,
	newEventModalOpen,
	filteredUsers,
	filteredCourses,
	isAllLearnersSelected,
	isAllCoursesSelected,
	setNewEvent,
	setNewEventModalOpen,
	setFilteredUsers,
	setFilteredCourses,
	setIsAllLearnersSelected,
	setIsAllCoursesSelected,
	filterUsers,
	filterCourses,
}: CreateEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { sortedUsersData } = useContext(UsersContext);
	const { sortedCoursesData } = useContext(CoursesContext);
	const { addNewEvent } = useContext(EventsContext);

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

	// const [allCoursesParticipantsInfo, setAllCoursesParticipantsInfo] = useState<AttendeeInfo[]>([]);

	// Handle form submission to create new event
	const handleAddEvent = async () => {
		const allFirebaseUserIds: string[] = sortedUsersData
			?.filter((filteredUser) => filteredUser._id !== user?._id)
			?.map((mappedUser) => mappedUser.firebaseUserId);

		const participants = [...newEvent.attendees]; // Start with selected attendees
		let allParticipantsIds: string[] = [];
		let allCoursesParticipantsInfo: AttendeeInfo[] = [];

		if (newEvent.isAllLearnersSelected) {
			// Handle All Learners selection
			setNewEvent((prevData) => ({ ...prevData, allAttendeesIds: [], coursesIds: [], attendees: [] }));
			allCoursesParticipantsInfo = [];
		} else if (newEvent.isAllCoursesSelected) {
			// Handle All Courses selection
			try {
				const res = await axios.get(`${base_url}/usercourses/participants/organisation/${orgId}`);

				allCoursesParticipantsInfo = [...res.data.participants, ...participants];
				allParticipantsIds = [...res.data.participants, ...participants]?.map((participant: AttendeeInfo) => participant._id);
			} catch (error) {
				console.log(error);
			}
		} else if (newEvent.coursesIds.length > 0) {
			// Use local array to accumulate course participants
			const courseParticipants: AttendeeInfo[] = [];

			await Promise.all(
				newEvent.coursesIds.map(async (courseId) => {
					try {
						const res = await axios.get(`${base_url}/userCourses/course/${courseId}`);
						courseParticipants.push(...res.data.users); // Collect participants directly
					} catch (error) {
						console.log(error);
					}
				})
			);

			// Combine and deduplicate all participants locally
			const combinedParticipants = Array.from(new Map([...courseParticipants, ...participants].map((user) => [user._id, user])).values());

			allCoursesParticipantsInfo = combinedParticipants; // Update state once with final list
			allParticipantsIds = combinedParticipants.map((participant) => participant._id);
		} else {
			// If no special selection, update with direct attendees
			const uniqueParticipants = Array.from(new Map([...participants].map((user) => [user._id, user])).values());

			allCoursesParticipantsInfo = uniqueParticipants;
			const allParticipantsIds = uniqueParticipants.map((participant) => participant._id);
			setNewEvent((prevData) => ({ ...prevData, allAttendeesIds: allParticipantsIds }));
		}

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
			attendees: newEvent.attendees,
			allAttendeesIds: allParticipantsIds,
			isAllLearnersSelected,
			isAllCoursesSelected,
			coursesIds: newEvent.coursesIds,
			createdBy: user?._id!,
		};

		try {
			const res = await axios.post(`${base_url}/events`, event);

			addNewEvent({ ...event, _id: res.data.data._id });

			const startDate = newEvent?.start?.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
			const startTime = newEvent?.start?.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			});

			const notificationData = {
				title: 'Event Added',
				message: `${user?.username} added a new event to your calendar: "${truncateText(
					newEvent.title,
					20
				)}". It is scheduled for ${startDate} at ${startTime} `,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'NewEvent',
				userImageUrl: user?.imageUrl,
			};

			if (newEvent.isAllLearnersSelected) {
				for (const id of allFirebaseUserIds) {
					const notificationRef = collection(db, 'notifications', id, 'userNotifications');
					await addDoc(notificationRef, notificationData);
				}
			} else {
				for (const participant of allCoursesParticipantsInfo) {
					const notificationRef = collection(db, 'notifications', participant.firebaseUserId, 'userNotifications');
					await addDoc(notificationRef, notificationData);
				}
			}
		} catch (error) {
			console.log(error);
		}

		resetNewEventForm();
	};

	const resetNewEventForm = () => {
		setNewEvent(() => ({
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
			createdBy: '',
			createdAt: '',
			updatedAt: '',
			coursesIds: [],
			allAttendeesIds: [],
			isAllLearnersSelected: false,
			isAllCoursesSelected: false,
		}));

		setSearchLearnerValue('');
		setSearchCourseValue('');
		setIsAllCoursesSelected(false);
		setIsAllLearnersSelected(false);
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
				<DialogContent sx={{ mt: '-0.5rem' }}>
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

					{newEvent.attendees.length > 0 && (
						<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{newEvent.attendees?.map((attendee) => {
								return (
									<Box
										key={attendee._id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											border: 'solid lightgray 0.1rem',
											padding: '0 0.25rem',
											height: '1.75rem',
											borderRadius: '0.25rem',
											margin: '0.35rem 0.35rem 0 0',
										}}>
										<Typography sx={{ fontSize: '0.85rem' }}>{attendee.username}</Typography>
										<IconButton
											onClick={() => {
												const updatedAttendees = newEvent.attendees.filter((filteredAttendee) => attendee._id !== filteredAttendee._id);

												setNewEvent((prevData) => ({ ...prevData, attendees: updatedAttendees }));
											}}>
											<Cancel sx={{ fontSize: '0.95rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<CustomTextField
								label=''
								value={searchLearnerValue}
								disabled={isAllLearnersSelected}
								placeholder={isAllLearnersSelected ? '' : 'Search Learner'}
								onChange={(e) => {
									setSearchLearnerValue(e.target.value);
									filterUsers(e.target.value);
								}}
								sx={{ width: '80%', backgroundColor: isAllLearnersSelected ? 'transparent' : '#fff' }}
								required={false}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search
												sx={{
													mr: '-0.5rem',
												}}
											/>
										</InputAdornment>
									),
								}}
							/>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '20%', mb: '0.85rem' }}>
								<FormControlLabel
									labelPlacement='start'
									control={
										<Checkbox
											checked={isAllLearnersSelected}
											onChange={(e) => {
												setIsAllLearnersSelected(e.target.checked);
												setNewEvent((prevData) => ({ ...prevData, isAllLearnersSelected: e.target.checked }));

												if (e.target.checked) {
													setNewEvent((prevData) => ({ ...prevData, attendees: [], coursesIds: [], allAttendeesIds: [] }));
													setIsAllCoursesSelected(false);
												}
											}}
											sx={{
												'& .MuiSvgIcon-root': {
													fontSize: '1.25rem', // Adjust the checkbox icon size
												},
											}}
										/>
									}
									label='All Learners'
									sx={{
										mt: '0rem',
										'& .MuiFormControlLabel-label': {
											fontSize: '0.7rem', // Adjust the label font size
										},
									}}
								/>
							</Box>
						</Box>

						{filteredUsers.length !== 0 && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'flex-start',
									alignItems: 'flex-start',
									width: '60%',
									maxHeight: '10rem',
									overflowY: 'auto',
									overflowX: 'hidden',
									margin: '-1rem auto 1.5rem auto',
									border: 'solid 0.05rem lightgray',
									position: 'absolute',
									top: '3.25rem',
									left: 0,
									zIndex: 3,
									backgroundColor: theme.bgColor?.common,
									boxShadow: '0.15rem 0.2rem 0.3rem 0rem rgba(0,0,0,0.1)',
								}}>
								{filteredUsers
									?.filter((filteredUser) => filteredUser.firebaseUserId !== user?.firebaseUserId)
									?.map((mappedUser) => (
										<Box
											key={mappedUser.firebaseUserId}
											sx={{
												display: 'flex',
												justifyContent: 'flex-start',
												alignItems: 'center',
												width: '100%',
												padding: '0.5rem',
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
												setNewEvent((prevData) => {
													const updatedAttendees = [...prevData.attendees];
													updatedAttendees.push({
														_id: mappedUser._id,
														firebaseUserId: mappedUser.firebaseUserId,
														username: mappedUser.username,
													});
													return { ...prevData, attendees: updatedAttendees };
												});
												setSearchLearnerValue('');
												setFilteredUsers([]);
											}}>
											<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
												<img
													src={mappedUser.imageUrl}
													alt='profile_img'
													style={{
														height: '2rem',
														width: '2rem',
														borderRadius: '100%',
														border: 'solid lightgray 0.1rem',
													}}
												/>
											</Box>
											<Box>
												<Typography className='username' sx={{ fontSize: '0.85rem' }}>
													{mappedUser.username}
												</Typography>
											</Box>
										</Box>
									))}
							</Box>
						)}
					</Box>

					{newEvent.coursesIds.length > 0 && (
						<Box sx={{ display: 'flex', margin: '0.75rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{newEvent.coursesIds?.map((id) => {
								const course = sortedCoursesData.find((course) => course._id === id);
								return (
									<Box
										key={course?._id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											border: 'solid lightgray 0.1rem',
											padding: '0 0.25rem',
											height: '1.75rem',
											borderRadius: '0.25rem',
											margin: '0.35rem 0.35rem 0 0',
										}}>
										<Typography sx={{ fontSize: '0.85rem' }}>{truncateText(course?.title!, 20)}</Typography>
										<IconButton
											onClick={() => {
												const updatedCourses = newEvent.coursesIds.filter((filteredCourseId) => course?._id !== filteredCourseId);

												setNewEvent((prevData) => ({ ...prevData, coursesIds: updatedCourses }));
											}}>
											<Cancel sx={{ fontSize: '0.95rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
							<CustomTextField
								label=''
								value={searchCourseValue}
								disabled={isAllLearnersSelected || isAllCoursesSelected}
								placeholder={isAllLearnersSelected || isAllCoursesSelected ? '' : 'Search Course'}
								onChange={(e) => {
									setSearchCourseValue(e.target.value);
									filterCourses(e.target.value);
								}}
								sx={{ width: '80%', backgroundColor: isAllLearnersSelected || isAllCoursesSelected ? 'transparent' : '#fff' }}
								required={false}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search
												sx={{
													mr: '-0.5rem',
												}}
											/>
										</InputAdornment>
									),
								}}
							/>
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '20%', mb: '0.85rem' }}>
								<FormControlLabel
									disabled={isAllLearnersSelected}
									labelPlacement='start'
									control={
										<Checkbox
											checked={isAllCoursesSelected}
											onChange={(e) => {
												setIsAllCoursesSelected(e.target.checked);
												setNewEvent((prevData) => ({ ...prevData, isAllCoursesSelected: e.target.checked }));
												if (e.target.checked) {
													setNewEvent((prevData) => ({ ...prevData, coursesIds: [] }));
												}
											}}
											sx={{
												'& .MuiSvgIcon-root': {
													fontSize: '1.25rem', // Adjust the checkbox icon size
												},
											}}
										/>
									}
									label='All Courses'
									sx={{
										'& .MuiFormControlLabel-label': {
											fontSize: '0.7rem', // Adjust the label font size
										},
									}}
								/>
							</Box>
						</Box>

						{filteredCourses.length !== 0 && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'flex-start',
									alignItems: 'flex-start',
									width: '60%',
									maxHeight: '10rem',
									overflowY: 'auto',
									overflowX: 'hidden',
									margin: '-1rem auto 1.5rem auto',
									border: 'solid 0.05rem lightgray',
									position: 'absolute',
									top: '3.25rem',
									left: 0,
									zIndex: 3,
									backgroundColor: theme.bgColor?.common,
								}}>
								{filteredCourses?.map((course) => (
									<Box
										key={course._id}
										sx={{
											display: 'flex',
											justifyContent: 'flex-start',
											alignItems: 'center',
											width: '100%',
											padding: '0.5rem',
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
											setNewEvent((prevData) => {
												const updatedCoursesIds = [...prevData.coursesIds];
												updatedCoursesIds.push(course._id);
												return { ...prevData, coursesIds: updatedCoursesIds };
											});
											setSearchCourseValue('');
											setFilteredCourses([]);
										}}>
										{course.imageUrl && (
											<Box sx={{ borderRadius: '100%', marginRight: '1rem' }}>
												<img
													src={course.imageUrl}
													alt='img'
													style={{
														height: '2rem',
														width: '2rem',
														borderRadius: '100%',
														border: 'solid lightgray 0.1rem',
													}}
												/>
											</Box>
										)}
										<Box>
											<Typography className='username' sx={{ fontSize: '0.85rem' }}>
												{truncateText(course.title, 30)}
											</Typography>
										</Box>
									</Box>
								))}
							</Box>
						)}
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
