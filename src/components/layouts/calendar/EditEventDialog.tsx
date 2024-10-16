import { Box, Checkbox, DialogContent, FormControlLabel, IconButton, InputAdornment, Typography } from '@mui/material';
import { AttendeeInfo, Event } from '../../../interfaces/event';
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
import theme from '../../../themes';
import { truncateText } from '../../../utils/utilText';
import { SingleCourse } from '../../../interfaces/course';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../firebase';

interface EditEventDialogProps {
	setIsEventDeleted: React.Dispatch<React.SetStateAction<boolean>>;
	editEventModalOpen: boolean;
	selectedEvent: Event | null;
	filteredUsers: User[];
	filteredCourses: SingleCourse[];
	setEditEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>;
	setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
	setFilteredCourses: React.Dispatch<React.SetStateAction<SingleCourse[]>>;
	filterUsers: (searchQuery: string) => void;
	filterCourses: (searchQuery: string) => void;
}
const EditEventDialog = ({
	setIsEventDeleted,
	editEventModalOpen,
	selectedEvent,
	filteredUsers,
	filteredCourses,
	setEditEventModalOpen,
	setSelectedEvent,
	setFilteredUsers,
	setFilteredCourses,
	filterUsers,
	filterCourses,
}: EditEventDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { sortedUsersData } = useContext(UsersContext);
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { sortedCoursesData } = useContext(CoursesContext);
	const { updateEvent, removeEvent } = useContext(EventsContext);

	const [deleteEventModalOpen, setDeleteEventModalOpen] = useState<boolean>(false);

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

	const editEvent = async () => {
		const participants = [...(selectedEvent?.attendees || [])]; // Start with selected attendees
		let allParticipantsIds: string[] = [];
		let allCoursesParticipantsInfo: AttendeeInfo[] = [];

		if (selectedEvent?.isAllLearnersSelected) {
			setSelectedEvent((prevData) => {
				if (prevData) {
					return { ...prevData, allAttendeesIds: [], coursesIds: [], attendees: [] };
				}
				return prevData;
			});

			allCoursesParticipantsInfo = sortedUsersData
				?.filter((filteredUser) => filteredUser._id !== user?._id)
				.map((mappedUser) => ({ _id: mappedUser._id, username: mappedUser.username, firebaseUserId: mappedUser.firebaseUserId }));
		} else if (selectedEvent?.isAllCoursesSelected) {
			// Handle All Courses selection
			try {
				const res = await axios.get(`${base_url}/usercourses/participants/organisation/${orgId}`);

				allCoursesParticipantsInfo = Array.from(new Map([...res.data.participants, ...participants].map((user) => [user._id, user])).values());
				allParticipantsIds = [...res.data.participants, ...participants]?.map((participant: AttendeeInfo) => participant._id);

				setSelectedEvent((prevData) => {
					if (prevData) {
						return { ...prevData, allAttendeesIds: allParticipantsIds };
					}
					return prevData;
				});
			} catch (error) {
				console.log(error);
			}
		} else if (selectedEvent?.coursesIds && selectedEvent?.coursesIds.length > 0) {
			// Use local array to accumulate course participants
			const courseParticipants: AttendeeInfo[] = [];

			await Promise.all(
				selectedEvent?.coursesIds?.map(async (courseId) => {
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

			setSelectedEvent((prevData) => {
				if (prevData) {
					return { ...prevData, allAttendeesIds: allParticipantsIds };
				}
				return prevData;
			});
		} else {
			// If no special selection, update with direct attendees
			const uniqueParticipants = Array.from(new Map([...participants].map((user) => [user._id, user])).values());

			allCoursesParticipantsInfo = uniqueParticipants;
			const allParticipantsIds = uniqueParticipants.map((participant) => participant._id);

			setSelectedEvent((prevData) => {
				if (prevData) {
					return { ...prevData, allAttendeesIds: allParticipantsIds };
				}
				return prevData;
			});
		}

		try {
			await axios.patch(`${base_url}/events/${selectedEvent?._id}`, selectedEvent);
			if (selectedEvent) updateEvent(selectedEvent);

			const startDate = selectedEvent?.start?.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
			const startTime = selectedEvent?.start?.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
			});

			const notificationData = {
				title: 'Event Added',
				message: `${user?.username} added a new event to your calendar: "${truncateText(
					selectedEvent?.title!,
					20
				)}". It is scheduled for ${startDate} at ${startTime} `,
				isRead: false,
				timestamp: serverTimestamp(),
				type: 'NewEvent',
				userImageUrl: user?.imageUrl,
				eventId: selectedEvent?._id,
			};

			// Step 1: Collect all firebaseUserId of participants who might need a notification
			const participantIds = allCoursesParticipantsInfo.map((participant) => participant.firebaseUserId);

			// Step 2: Fetch all existing notifications for the event in a single batch
			const notificationSnapshots = await Promise.all(
				participantIds.map((firebaseUserId) =>
					getDocs(query(collection(db, 'notifications', firebaseUserId, 'userNotifications'), where('eventId', '==', selectedEvent?._id)))
				)
			);

			// Step 3: Identify participants who have not yet received the notification
			const unnotifiedParticipants = allCoursesParticipantsInfo.filter((_, index) => notificationSnapshots[index].empty);

			// Step 4: Send notifications only to unnotified participants
			await Promise.all(
				unnotifiedParticipants.map((participant) => {
					const notificationRef = collection(db, 'notifications', participant.firebaseUserId, 'userNotifications');
					return addDoc(notificationRef, notificationData);
				})
			);

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
				setFilteredUsers([]);
				setFilteredCourses([]);
				setSearchLearnerValue('');
				setSearchCourseValue('');
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

					{selectedEvent?.attendees && selectedEvent?.attendees.length > 0 && (
						<Box sx={{ display: 'flex', margin: '1.5rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{selectedEvent.attendees?.map((attendee) => {
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
												const updatedAttendees = selectedEvent.attendees.filter((filteredAttendee) => attendee._id !== filteredAttendee._id);

												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, attendees: updatedAttendees };
													}
													return prevData;
												});
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
								placeholder={selectedEvent?.isAllLearnersSelected ? '' : 'Search Learner'}
								onChange={(e) => {
									setSearchLearnerValue(e.target.value);
									filterUsers(e.target.value);
								}}
								sx={{ width: '80%', backgroundColor: selectedEvent?.isAllLearnersSelected ? 'transparent' : '#fff' }}
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
											checked={selectedEvent?.isAllLearnersSelected}
											onChange={(e) => {
												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, isAllLearnersSelected: e.target.checked };
													}
													return prevData;
												});

												if (e.target.checked) {
													setSelectedEvent((prevData) => {
														if (prevData) {
															return { ...prevData, attendees: [], coursesIds: [], allAttendeesIds: [], isAllCoursesSelected: false };
														}
														return prevData;
													});
												}
											}}
											sx={{
												'& .MuiSvgIcon-root': {
													fontSize: '1.25rem',
												},
											}}
										/>
									}
									label='All Learners'
									sx={{
										mt: '0rem',
										'& .MuiFormControlLabel-label': {
											fontSize: '0.7rem',
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
									maxHeight: '15rem',
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
												setSelectedEvent((prevData) => {
													if (prevData) {
														const updatedAttendees = [...prevData.attendees];
														updatedAttendees.push({
															_id: mappedUser._id,
															firebaseUserId: mappedUser.firebaseUserId,
															username: mappedUser.username,
														});
														return { ...prevData, attendees: updatedAttendees };
													}
													return prevData;
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

					{selectedEvent?.coursesIds && selectedEvent.coursesIds.length > 0 && (
						<Box sx={{ display: 'flex', margin: '0.75rem 0 0.75rem 0', flexWrap: 'wrap' }}>
							{selectedEvent.coursesIds?.map((id) => {
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
												const updatedCoursesIds = selectedEvent.coursesIds.filter((filteredCourseId) => course?._id !== filteredCourseId);

												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, coursesIds: updatedCoursesIds };
													}
													return prevData;
												});
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
								disabled={selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected}
								placeholder={selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected ? '' : 'Search Course'}
								onChange={(e) => {
									setSearchCourseValue(e.target.value);
									filterCourses(e.target.value);
								}}
								sx={{
									width: '80%',
									backgroundColor: selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected ? 'transparent' : '#fff',
								}}
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
									disabled={selectedEvent?.isAllLearnersSelected}
									labelPlacement='start'
									control={
										<Checkbox
											checked={selectedEvent?.isAllCoursesSelected}
											onChange={(e) => {
												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, isAllCoursesSelected: e.target.checked };
													}
													return prevData;
												});

												if (e.target.checked) {
													setSelectedEvent((prevData) => {
														if (prevData) {
															return { ...prevData, coursesIds: [] };
														}
														return prevData;
													});
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
											setSelectedEvent((prevData) => {
												if (prevData) {
													const updatedCoursesIds = [...prevData.coursesIds];
													updatedCoursesIds.push(course._id);
													return { ...prevData, coursesIds: updatedCoursesIds };
												}
												return prevData;
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
							setFilteredUsers([]);
							setFilteredCourses([]);
							setSearchLearnerValue('');
							setSearchCourseValue('');
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
