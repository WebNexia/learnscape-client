import {
	Box,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	IconButton,
	InputAdornment,
	MenuItem,
	Select,
	SelectChangeEvent,
	Tooltip,
	Typography,
} from '@mui/material';
import { AttendeeInfo, Event } from '../../../interfaces/event';
import CustomDialog from '../dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { Cancel, Search } from '@mui/icons-material';
import { User } from '../../../interfaces/user';
import { useContext, useState, useRef, useEffect } from 'react';
import { UsersContext } from '../../../contexts/UsersContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { EventsContext } from '../../../contexts/EventsContextProvider';

import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import theme from '../../../themes';
import { truncateText } from '../../../utils/utilText';
import { SingleCourse } from '../../../interfaces/course';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import HandleImageUploadURL from '../../forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../../forms/uploadImageVideoDocument/ImageThumbnail';

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
	filterUsers: (searchQuery: string, action: string) => void;
	filterCourses: (searchQuery: string, action: string) => void;
}

const getDateTimeFormat = (locale: string) => {
	switch (locale.toLowerCase()) {
		case 'en-gb':
			return 'DD/MM/YYYY HH:mm';
		case 'tr':
		case 'tr-tr':
			return 'DD.MM.YYYY HH:mm';
		case 'de':
		case 'de-de':
			return 'DD.MM.YYYY HH:mm';
		default:
			return 'MM/DD/YYYY hh:mm A'; // fallback to US
	}
};

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

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [deleteEventModalOpen, setDeleteEventModalOpen] = useState<boolean>(false);

	const [searchLearnerValue, setSearchLearnerValue] = useState<string>('');
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');

	const [isEventUpdated, setIsEventUpdated] = useState<boolean>(false);
	const [enterCoverImageUrl, setEnterCoverImageUrl] = useState<boolean>(true);

	const originalIsPublic = useRef<boolean>(false);

	// Store the original isPublic value when the dialog was opened
	useEffect(() => {
		if (editEventModalOpen && selectedEvent) {
			originalIsPublic.current = selectedEvent.isPublic;
		}
	}, [editEventModalOpen]);

	useEffect(() => {
		let locale = navigator.language;
		// Map known browser locales to Dayjs locales
		if (locale.toLowerCase() === 'en-gb') {
			locale = 'en-gb';
		} else if (locale.toLowerCase() === 'tr' || locale.toLowerCase() === 'tr-tr') {
			locale = 'tr';
		} // Add more mappings as needed
		dayjs.locale(locale);
	}, []);

	const editEvent = async () => {
		// Use the original isPublic value from when the dialog was opened
		const wasPublic = originalIsPublic.current;
		const previousAttendeeIds = selectedEvent?.allAttendeesIds || [];
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
						return { ...prevData, allAttendeesIds: allParticipantsIds, isAllCoursesSelected: true };
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

			allParticipantsIds = uniqueParticipants.map((participant) => participant._id);

			setSelectedEvent((prevData) => {
				if (prevData) {
					return { ...prevData, allAttendeesIds: allParticipantsIds };
				}
				return prevData;
			});
		}

		try {
			if (isEventUpdated) {
				await axios.patch(`${base_url}/events/${selectedEvent?._id}`, {
					...selectedEvent,
					allAttendeesIds: allParticipantsIds,
					type: !selectedEvent?.isPublic ? '' : selectedEvent?.type,
					coverImageUrl: !selectedEvent?.isPublic ? '' : selectedEvent?.coverImageUrl,
				});
				if (selectedEvent)
					updateEvent({
						...selectedEvent,
						allAttendeesIds: allParticipantsIds,
						type: !selectedEvent?.isPublic ? '' : selectedEvent?.type,
						coverImageUrl: !selectedEvent?.isPublic ? '' : selectedEvent?.coverImageUrl,
					});
			} else {
				setIsEventUpdated(false);
				setEditEventModalOpen(false);
				return;
			}

			const startDate = selectedEvent?.start?.toLocaleDateString(navigator.language || undefined, {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				timeZoneName: 'short',
			});
			const startTime = selectedEvent?.start?.toLocaleTimeString(navigator.language || undefined, {
				hour: '2-digit',
				minute: '2-digit',
				timeZoneName: 'short',
			});

			// Notify all users only if event is being made public now
			if (!wasPublic && selectedEvent?.isPublic) {
				const allFirebaseUserIds: string[] = sortedUsersData
					?.filter((filteredUser) => filteredUser._id !== user?._id)
					?.map((mappedUser) => mappedUser.firebaseUserId);

				const adminName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'Admin';
				const publicEventNotification = {
					title: 'New Public Event',
					message: `${adminName} has added a public event: "${selectedEvent.title}". It will take place on ${startDate} at ${startTime}.`,
					isRead: false,
					timestamp: serverTimestamp(),
					type: 'PublicEvent',
					userImageUrl: user?.imageUrl,
					eventId: selectedEvent._id,
				};

				for (const id of allFirebaseUserIds) {
					const notificationRef = collection(db, 'notifications', id, 'userNotifications');
					await addDoc(notificationRef, publicEventNotification);
				}
			}

			// Notify newly added participants
			const newAttendeeIds = allParticipantsIds;
			const newlyAddedIds = newAttendeeIds.filter((id) => !previousAttendeeIds.includes(id));
			const adminName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'Admin';
			for (const participant of allCoursesParticipantsInfo) {
				if (newlyAddedIds.includes(participant._id)) {
					const notificationRef = collection(db, 'notifications', participant.firebaseUserId, 'userNotifications');
					await addDoc(notificationRef, {
						title: 'Added to Event',
						message: `${adminName} has added you to the event: "${truncateText(selectedEvent?.title || '', 20)}". The event will start on ${startDate} at ${startTime}.`,
						isRead: false,
						timestamp: serverTimestamp(),
						type: 'AddToEvent',
						userImageUrl: user?.imageUrl,
						eventId: selectedEvent?._id,
					});
				}
			}

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
				setIsEventUpdated(false);
			}}
			title='Edit Event'
			maxWidth='sm'>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					editEvent();
				}}>
				<DialogContent sx={{ mt: '-1rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Tooltip title='Max 40 characters' placement='top' arrow>
							<CustomTextField
								label='Title'
								value={selectedEvent?.title}
								onChange={(e) => {
									setSelectedEvent((prevData) => {
										if (prevData) {
											return { ...prevData, title: e.target.value };
										}
										return prevData;
									});
									setIsEventUpdated(true);
								}}
								InputProps={{ inputProps: { maxLength: 40 } }}
								sx={{ flex: 3 }}
							/>
						</Tooltip>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={selectedEvent?.isPublic}
									onChange={(e) => {
										setSelectedEvent((prevData) => {
											if (prevData) {
												return { ...prevData, isPublic: e.target.checked, type: '' };
											}
											return prevData;
										});
										setIsEventUpdated(true);
										if (e.target.checked) {
											setSelectedEvent((prevData) => {
												if (prevData) {
													return {
														...prevData,
														attendees: [],
														coursesIds: [],
														allAttendeesIds: [],
														isAllCoursesSelected: false,
														isAllLearnersSelected: false,
													};
												}
												return prevData;
											});
										}
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '0.9rem' : '1.25rem',
										},
									}}
								/>
							}
							label='Public Event'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.6rem' : '0.7rem',
								},
								'mb': '0.85rem',
								'flex': 1,
								'ml': '1.65rem',
							}}
						/>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<CustomTextField
							label='Description'
							multiline
							rows={3}
							required={false}
							value={selectedEvent?.description}
							onChange={(e) => {
								setSelectedEvent((prevData) => {
									if (prevData) {
										return { ...prevData, description: e.target.value };
									}
									return prevData;
								});
								setIsEventUpdated(true);
							}}
							InputProps={{ inputProps: { maxLength: 75 } }}
							sx={{ flex: 3, mr: selectedEvent?.isPublic ? '1rem' : '0rem' }}
							placeholder='Enter a description for the event (max 75 characters)'
						/>
						{selectedEvent?.isPublic && (
							<FormControl sx={{ flex: 1, mb: '0.5rem' }}>
								<Select
									displayEmpty
									value={selectedEvent?.type}
									onChange={(e: SelectChangeEvent) => {
										setSelectedEvent((prevData) => {
											if (prevData) {
												return { ...prevData, type: e.target.value };
											}
											return prevData;
										});
										setIsEventUpdated(true);
									}}
									size='small'
									required
									sx={{ backgroundColor: theme.bgColor?.common, fontSize: '0.8rem' }}>
									<MenuItem
										value=''
										selected
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.8rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Select Type
									</MenuItem>
									{['Webinar', 'Guest Talk', 'Workshop', 'Training', 'Meeting', 'Other']?.map((type) => (
										<MenuItem value={type} key={type} sx={{ fontSize: '0.8rem' }}>
											{type}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Box>

					{selectedEvent?.isPublic && (
						<Box sx={{ display: 'flex', mt: '1rem', mb: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<Box sx={{ flex: 1 }}>
								<HandleImageUploadURL
									label='Cover Image'
									onImageUploadLogic={(url) => {
										if (selectedEvent) {
											setSelectedEvent({ ...selectedEvent, coverImageUrl: url });
										}
										setIsEventUpdated(true);
									}}
									onChangeImgUrl={(e) => {
										if (selectedEvent) {
											setSelectedEvent({ ...selectedEvent, coverImageUrl: e.target.value });
										}
										setIsEventUpdated(true);
									}}
									imageUrlValue={selectedEvent?.coverImageUrl || ''}
									imageFolderName='EventImages'
									enterImageUrl={enterCoverImageUrl}
									setEnterImageUrl={setEnterCoverImageUrl}
								/>
							</Box>
							<Box sx={{ ml: '3rem' }}>
								<ImageThumbnail
									imgSource={selectedEvent?.coverImageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Cover+Image'}
									removeImage={() => {
										if (selectedEvent) {
											setSelectedEvent({ ...selectedEvent, coverImageUrl: '' });
										}
										setIsEventUpdated(true);
									}}
									boxStyle={{ width: '8rem', height: '8rem' }}
									imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
								/>
							</Box>
						</Box>
					)}

					<Box sx={{ display: 'flex', mb: '0.85rem', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', flex: 4, justifyContent: 'space-between', mr: '0.5rem' }}>
							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateTimePicker
									label='Start Time'
									value={selectedEvent?.start ? dayjs(selectedEvent.start) : null}
									onChange={(newValue: Dayjs | null) => {
										setIsEventUpdated(true);
										setSelectedEvent((prevData) => {
											if (prevData) {
												const updatedStart = newValue ? newValue.toDate() : null;
												let updatedEnd = prevData?.end;

												// Check if the new start time is after the current end time
												if (updatedStart && updatedEnd && updatedStart >= updatedEnd) {
													// Set the end time to 1 hour after the new start time
													updatedEnd = new Date(updatedStart);
													updatedEnd.setHours(updatedStart.getHours() + 1);
												}

												return {
													...prevData,
													start: updatedStart,
													end: updatedEnd,
												};
											}
											return prevData;
										});
									}}
									slotProps={{
										textField: {
											fullWidth: true,
											variant: 'outlined',
											required: true,
											InputProps: {
												sx: { fontSize: isMobileSize ? '0.75rem' : '0.85rem' }, // Set font size
											},
										},
									}}
									sx={{ backgroundColor: '#fff', mr: '0.5rem' }}
									disabled={selectedEvent?.isAllDay}
									format={getDateTimeFormat(navigator.language)}
								/>
							</LocalizationProvider>

							<LocalizationProvider dateAdapter={AdapterDayjs}>
								<DateTimePicker
									label='End Time'
									value={selectedEvent?.end ? dayjs(selectedEvent?.end) : null}
									onChange={(newValue: Dayjs | null) => {
										setIsEventUpdated(true);
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
											InputProps: {
												sx: { fontSize: isMobileSize ? '0.75rem' : '0.85rem' }, // Set font size
											},
										},
									}}
									sx={{ backgroundColor: '#fff' }}
									disabled={selectedEvent?.isAllDay}
									format={getDateTimeFormat(navigator.language)}
								/>
							</LocalizationProvider>
						</Box>
						<FormControlLabel
							labelPlacement='start'
							control={
								<Checkbox
									checked={selectedEvent?.isAllDay}
									onChange={(e) => {
										setIsEventUpdated(true);

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
											fontSize: isVerySmallScreen ? '0.9rem' : '1.25rem', // Adjust the checkbox icon size
										},
									}}
								/>
							}
							label='All Day'
							sx={{
								'mt': '0.5rem',
								'& .MuiFormControlLabel-label': {
									fontSize: isVerySmallScreen ? '0.7rem' : '0.8rem', // Adjust the label font size
								},
							}}
						/>
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
										<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{attendee.username}</Typography>
										<IconButton
											onClick={() => {
												setIsEventUpdated(true);
												const updatedAttendees = selectedEvent.attendees.filter((filteredAttendee) => attendee._id !== filteredAttendee._id);

												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, attendees: updatedAttendees };
													}
													return prevData;
												});
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.85rem' : '0.95rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					{!selectedEvent?.isPublic && (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
								<CustomTextField
									label=''
									value={searchLearnerValue}
									disabled={selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic}
									placeholder={selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic ? '' : 'Search Learner'}
									onChange={(e) => {
										setSearchLearnerValue(e.target.value);
										setSearchCourseValue('');
										setFilteredCourses([]);
										filterUsers(e.target.value, 'edit');
										setIsEventUpdated(true);
									}}
									sx={{
										flex: 3,
										backgroundColor: selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic ? 'transparent' : '#fff',
									}}
									required={false}
									InputProps={{
										endAdornment: (
											<InputAdornment position='end'>
												<Search
													sx={{
														mr: '-0.5rem',
														color: selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic ? 'lightgray' : null,
													}}
													fontSize={isMobileSize ? 'small' : 'medium'}
												/>
											</InputAdornment>
										),
									}}
								/>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '21%', mb: '0.85rem' }}>
									<FormControlLabel
										labelPlacement='start'
										disabled={selectedEvent?.isPublic}
										control={
											<Checkbox
												checked={selectedEvent?.isAllLearnersSelected}
												onChange={(e) => {
													setSearchCourseValue('');
													setSearchLearnerValue('');
													setIsEventUpdated(true);
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
														fontSize: isVerySmallScreen ? '0.9rem' : '1.25rem',
													},
												}}
											/>
										}
										label='All Learners'
										sx={{
											'mt': '0rem',
											'& .MuiFormControlLabel-label': {
												fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem',
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
													'display': 'flex',
													'justifyContent': 'flex-start',
													'alignItems': 'center',
													'width': '100%',
													'padding': '0.5rem',
													'transition': '0.5s',
													'borderRadius': '0.25rem',
													':hover': {
														'backgroundColor': theme.bgColor?.primary,
														'color': '#fff',
														'cursor': 'pointer',
														'& .username': {
															color: '#fff',
														},
													},
												}}
												onClick={() => {
													setIsEventUpdated(true);
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
												<Box sx={{ borderRadius: '100%', marginRight: isMobileSize ? '0.75rem' : '1rem' }}>
													<img
														src={mappedUser.imageUrl}
														alt='profile_img'
														style={{
															height: isMobileSize ? '1.25rem' : '2rem',
															width: isMobileSize ? '1.25rem' : '2rem',
															borderRadius: '100%',
															border: 'solid lightgray 0.1rem',
														}}
													/>
												</Box>
												<Box>
													<Typography className='username' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
														{mappedUser.username}
													</Typography>
												</Box>
											</Box>
										))}
								</Box>
							)}
						</Box>
					)}

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
										<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{truncateText(course?.title!, 20)}</Typography>
										<IconButton
											onClick={() => {
												setIsEventUpdated(true);
												const updatedCoursesIds = selectedEvent.coursesIds.filter((filteredCourseId) => course?._id !== filteredCourseId);

												setSelectedEvent((prevData) => {
													if (prevData) {
														return { ...prevData, coursesIds: updatedCoursesIds };
													}
													return prevData;
												});
											}}>
											<Cancel sx={{ fontSize: isMobileSize ? '0.85rem' : '0.95rem' }} />
										</IconButton>
									</Box>
								);
							})}
						</Box>
					)}

					{!selectedEvent?.isPublic && (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
								<CustomTextField
									label=''
									value={searchCourseValue}
									disabled={selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected || selectedEvent?.isPublic}
									placeholder={
										selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected || selectedEvent?.isPublic ? '' : 'Search Course'
									}
									onChange={(e) => {
										setSearchCourseValue(e.target.value);
										setSearchLearnerValue('');
										setFilteredUsers([]);
										filterCourses(e.target.value, 'edit');
										setIsEventUpdated(true);
									}}
									sx={{
										flex: 3,
										backgroundColor:
											selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected || selectedEvent?.isPublic ? 'transparent' : '#fff',
									}}
									required={false}
									InputProps={{
										endAdornment: (
											<InputAdornment position='end'>
												<Search
													sx={{
														mr: '-0.5rem',
														color:
															selectedEvent?.isAllLearnersSelected || selectedEvent?.isAllCoursesSelected || selectedEvent?.isPublic
																? 'lightgray'
																: null,
													}}
													fontSize={isMobileSize ? 'small' : 'medium'}
												/>
											</InputAdornment>
										),
									}}
								/>
								<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '21%', mb: '0.85rem' }}>
									<FormControlLabel
										disabled={selectedEvent?.isAllLearnersSelected || selectedEvent?.isPublic}
										labelPlacement='start'
										control={
											<Checkbox
												checked={selectedEvent?.isAllCoursesSelected}
												onChange={(e) => {
													setSearchCourseValue('');
													setIsEventUpdated(true);
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
														fontSize: isVerySmallScreen ? '0.9rem' : '1.25rem',
													},
												}}
											/>
										}
										label='All Courses'
										sx={{
											'& .MuiFormControlLabel-label': {
												fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem', // Adjust the label font size
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
										boxShadow: '0.15rem 0.2rem 0.3rem 0rem rgba(0,0,0,0.1)',
									}}>
									{filteredCourses?.map((course) => (
										<Box
											key={course._id}
											sx={{
												'display': 'flex',
												'justifyContent': 'flex-start',
												'alignItems': 'center',
												'width': '100%',
												'padding': '0.5rem',
												'transition': '0.5s',
												'borderRadius': '0.25rem',
												':hover': {
													'backgroundColor': theme.bgColor?.primary,
													'color': '#fff',
													'cursor': 'pointer',
													'& .username': {
														color: '#fff',
													},
												},
											}}
											onClick={() => {
												setIsEventUpdated(true);
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
												<Box sx={{ borderRadius: '100%', marginRight: isMobileSize ? '0.75rem' : '1rem' }}>
													<img
														src={course.imageUrl}
														alt='img'
														style={{
															height: isMobileSize ? '1.25rem' : '2rem',
															width: isMobileSize ? '1.25rem' : '2rem',
															borderRadius: '100%',
															border: 'solid lightgray 0.1rem',
														}}
													/>
												</Box>
											)}
											<Box>
												<Typography className='username' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
													{truncateText(course.title, 30)}
												</Typography>
											</Box>
										</Box>
									))}
								</Box>
							)}
						</Box>
					)}

					<CustomTextField
						label='Event Link'
						value={selectedEvent?.eventLinkUrl}
						onChange={(e) => {
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, eventLinkUrl: e.target.value };
								}
								return prevData;
							});
							setIsEventUpdated(true);
						}}
						required={false}
					/>

					<CustomTextField
						label='Location'
						value={selectedEvent?.location}
						sx={{ marginBottom: '-0.5rem' }}
						onChange={(e) => {
							setIsEventUpdated(true);
							setSelectedEvent((prevData) => {
								if (prevData) {
									return { ...prevData, location: e.target.value };
								}
								return prevData;
							});
						}}
						required={false}
						InputProps={{ inputProps: { maxLength: 150 } }}
						placeholder='Enter a location for the event (max 150 characters)'
						multiline
						rows={3}
					/>
				</DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0.75rem' }}>
					<Box sx={{ marginBottom: '1.5rem' }}>
						<CustomDeleteButton type='button' onClick={() => setDeleteEventModalOpen(true)} sx={{ height: isMobileSize ? '1.5rem' : undefined }}>
							{isVerySmallScreen ? 'Delete' : 'Delete Event'}
						</CustomDeleteButton>
					</Box>
					<CustomDialogActions
						onCancel={() => {
							setEditEventModalOpen(false);
							setFilteredUsers([]);
							setFilteredCourses([]);
							setSearchLearnerValue('');
							setSearchCourseValue('');
							setIsEventUpdated(false);
						}}
						submitBtnText='Update'
					/>
				</Box>
				<CustomDialog
					openModal={deleteEventModalOpen}
					closeModal={() => setDeleteEventModalOpen(false)}
					title='Delete Event'
					content='Are you sure you want to delete the event?'
					maxWidth='xs'>
					<CustomDialogActions deleteBtn onCancel={() => setDeleteEventModalOpen(false)} onDelete={deleteEvent} />
				</CustomDialog>
			</form>
		</CustomDialog>
	);
};

export default EditEventDialog;
