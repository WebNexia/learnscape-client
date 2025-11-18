import CustomDialogActions from '../../components/layouts/dialog/CustomDialogActions';
import CustomTextField from '../../components/forms/customFields/CustomTextField';
import CustomDialog from '../../components/layouts/dialog/CustomDialog';
import { SingleCourse } from '../../interfaces/course';
import { useContext, useState, useEffect } from 'react';
import { Box, TextField, Snackbar, Alert } from '@mui/material';
import UserSearchSelect from '../../components/UserSearchSelect';
import axios from '@utils/axiosInstance';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import theme from '../../themes';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import HandleImageUploadURL from '../../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import { validateImageUrl } from '../../utils/urlValidation';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { NotificationType } from '../../interfaces/enums';
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

interface EditInstructorDialogProps {
	isEditInstructorDialogOpen: boolean;
	setIsEditInstructorDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
	singleCourse: SingleCourse | undefined;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
}

const EditInstructorDialog = ({
	isEditInstructorDialogOpen,
	setIsEditInstructorDialogOpen,
	singleCourse,
	setSingleCourse,
}: EditInstructorDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const { updateCourse } = useContext(CoursesContext);

	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess } = useAuth();

	const [searchValue, setSearchValue] = useState<string>('');
	const [singleCourseCopy, setSingleCourseCopy] = useState<SingleCourse | undefined>(singleCourse);

	const [isUserSelected, setIsUserSelected] = useState<boolean>(false);
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	useEffect(() => {
		if (isEditInstructorDialogOpen) {
			setSingleCourseCopy(singleCourse);
		}
	}, [isEditInstructorDialogOpen]);

	// URL validation function
	const validateImageUrlOnChange = async (url: string): Promise<void> => {
		if (!url.trim()) return; // Don't validate empty URLs

		try {
			const validation = await validateImageUrl(url.trim());
			if (!validation.isValid) {
				setUrlErrorMessage(`Image URL: ${validation.error}`);
				setIsUrlErrorOpen(true);
			}
		} catch (error) {
			console.error('URL validation error:', error);
		}
	};

	const handleInstructorUpdate = async () => {
		// Validate image URL before proceeding
		if (singleCourseCopy?.instructor?.imageUrl?.trim()) {
			const imageValidation = await validateImageUrl(singleCourseCopy.instructor.imageUrl.trim());
			if (!imageValidation.isValid) {
				setUrlErrorMessage(`Image URL: ${imageValidation.error}`);
				setIsUrlErrorOpen(true);
				return; // Don't close dialog, just return
			}
		}

		try {
			const response = await axios.patch(`${base_url}/courses/${singleCourseCopy?._id}`, {
				instructor: singleCourseCopy?.instructor,
			});

			const responseUpdatedData = response.data.data;

			updateCourse(responseUpdatedData as SingleCourse);
			setSingleCourse(singleCourseCopy);

			// Check if instructor was changed and send notification to new instructor
			if (
				singleCourseCopy?.instructor?.userId &&
				singleCourse?.instructor?.userId?.toString() !== singleCourseCopy.instructor.userId.toString() &&
				hasAdminAccess
			) {
				try {
					// Get the new instructor's data - API returns array, so get first element
					const instructorResponse = await axios.get(`${base_url}/users/${singleCourseCopy.instructor.userId}`);
					const instructorData = instructorResponse.data.data;

					// Handle both array and object responses
					const newInstructor = Array.isArray(instructorData) ? instructorData[0] : instructorData;

					if (newInstructor && newInstructor.firebaseUserId) {
						const adminName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'Admin';
						const notificationData = {
							title: 'Assigned as Course Instructor',
							message: `${adminName} has assigned you as the instructor for the course: "${singleCourseCopy.title}".`,
							isRead: false,
							timestamp: serverTimestamp(),
							type: NotificationType.COURSE_INSTRUCTOR_ASSIGNMENT,
							userImageUrl: user?.imageUrl || '',
							courseId: singleCourseCopy._id,
						};

						// Use batch operation with content-based deduplication (non-blocking)
						const batch = writeBatch(db);
						const notificationDocRef = doc(
							db,
							'notifications',
							newInstructor.firebaseUserId,
							'userNotifications',
							`instructor-assignment-${singleCourseCopy._id}`
						);
						batch.set(notificationDocRef, notificationData, { merge: true });

						// Non-blocking notification - course assignment success is not dependent on notification success
						batch.commit().catch((error) => {
							console.warn('Failed to send instructor assignment notification:', error);
						});
					}
				} catch (notificationError) {
					console.error('Failed to send instructor assignment notification:', notificationError);
					// Don't fail the course update if notification fails
				}
			}

			setIsEditInstructorDialogOpen(false); // Only close dialog on successful save
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<CustomDialog
			openModal={isEditInstructorDialogOpen}
			closeModal={() => {
				setIsEditInstructorDialogOpen(false);
				setSingleCourseCopy(singleCourse);
				setIsUrlErrorOpen(false);
			}}
			title='Edit Instructor'
			maxWidth='sm'>
			<form
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					if (!(document.activeElement?.getAttribute('aria-autocomplete') === 'list')) {
						handleInstructorUpdate();
					}
				}}
				style={{ display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', mb: '0.75rem', mt: '-0.5rem' }}>
					{hasAdminAccess && (
						<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
							<CustomTextField
								fullWidth={false}
								label='Name'
								value={singleCourseCopy?.instructor?.name}
								disabled={!hasAdminAccess}
								onChange={(e) => {
									setSingleCourseCopy((prevData) => {
										if (!prevData) return prevData;
										return {
											...prevData,
											instructor: {
												...prevData.instructor,
												name: e.target.value,
												imageUrl: '',
												email: '',
												userId: '',
											},
										};
									});
									setIsUserSelected(false);
								}}
								sx={{ margin: '1rem 0rem 0rem 2rem', width: '100%' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{
									inputProps: {
										maxLength: 100,
									},
								}}
							/>
							<CustomTextField
								fullWidth={false}
								type='email'
								label='Email Address'
								value={singleCourseCopy?.instructor?.email}
								disabled={isUserSelected || !!singleCourseCopy?.instructor?.userId}
								onChange={(e) =>
									setSingleCourseCopy((prevData) => {
										if (!prevData) return prevData;
										return {
											...prevData,
											instructor: {
												...prevData.instructor,
												email: e.target.value,
											},
										};
									})
								}
								sx={{ margin: '1rem 2rem 0rem 1rem', width: '100%' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								required={false}
								InputProps={{
									inputProps: {
										maxLength: 254,
									},
								}}
							/>
						</Box>
					)}
					{hasAdminAccess && (
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 4rem 0rem 2rem' }}>
							<Box sx={{ width: '100%', mr: '3rem' }}>
								<HandleImageUploadURL
									label={isMobileSize ? 'Image' : 'Instructor Image'}
									disabled={isUserSelected || !!singleCourseCopy?.instructor?.userId}
									onImageUploadLogic={(url) => {
										if (singleCourseCopy) {
											setSingleCourseCopy({
												...singleCourseCopy,
												instructor: {
													...singleCourseCopy.instructor,
													imageUrl: url,
												},
											});
										}
										// Validate URL immediately after upload
										validateImageUrlOnChange(url);
									}}
									onChangeImgUrl={(e) => {
										if (singleCourseCopy) {
											setSingleCourseCopy({
												...singleCourseCopy,
												instructor: {
													...singleCourseCopy.instructor,
													imageUrl: e.target.value,
												},
											});
										}
										// Validate URL on change (debounced)
										validateImageUrlOnChange(e.target.value);
									}}
									imageUrlValue={singleCourseCopy?.instructor?.imageUrl || ''}
									imageFolderName='InstructorImages'
									enterImageUrl={enterImageUrl}
									setEnterImageUrl={setEnterImageUrl}
								/>
							</Box>

							<img
								src={singleCourseCopy?.instructor?.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
								alt='img'
								style={{ width: '4.25rem', height: '4.25rem', borderRadius: '50%', objectFit: 'cover' }}
							/>
						</Box>
					)}
				</Box>

				{hasAdminAccess && (
					<UserSearchSelect
						value={searchValue}
						onChange={setSearchValue}
						fromEditInstructorDialog={true}
						userRole='admin'
						allowCurrentUser={true}
						onSelect={(selectedUser) => {
							setSingleCourseCopy((prevData) => {
								if (!prevData) return prevData;
								return {
									...prevData,
									instructor: {
										...prevData.instructor,
										name:
											(selectedUser?.firstName?.charAt(0).toUpperCase() || '') +
											(selectedUser?.firstName?.slice(1) || '') +
											' ' +
											(selectedUser?.lastName?.charAt?.(0)?.toUpperCase?.() || '') +
											(selectedUser?.lastName?.slice(1) || ''),
										userId: selectedUser?.firebaseUserId,
										email: selectedUser?.email || '',
										imageUrl: selectedUser?.imageUrl,
									},
								};
							});

							setSearchValue('');
							setIsUserSelected(true);
						}}
						sx={{ width: '90%' }}
						listSx={{ width: '90%', margin: '-1rem auto 1rem auto', zIndex: 1000 }}
					/>
				)}

				<CustomTextField
					fullWidth={false}
					label='Bio'
					placeholder='Enter bio (max 200 characters)'
					value={singleCourseCopy?.instructor?.bio}
					onChange={(e) =>
						setSingleCourseCopy((prevData) => {
							if (!prevData) return prevData;
							return {
								...prevData,
								instructor: {
									...prevData.instructor,
									bio: e.target.value,
								},
							};
						})
					}
					sx={{ margin: '-0.5rem 2rem 0.5rem 2rem' }}
					multiline
					InputLabelProps={{
						sx: { fontSize: '0.8rem' },
					}}
					InputProps={{ inputProps: { maxLength: 200 } }}
					required={false}
				/>

				<CustomTextField
					fullWidth={false}
					label='Title'
					value={singleCourseCopy?.instructor?.title}
					onChange={(e) =>
						setSingleCourseCopy((prevData) => {
							if (!prevData) return prevData;
							return {
								...prevData,
								instructor: {
									...prevData.instructor,
									title: e.target.value,
								},
							};
						})
					}
					sx={{ margin: '0.5rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: '0.8rem' },
					}}
					required={false}
					InputProps={{
						inputProps: {
							maxLength: 50,
						},
					}}
				/>

				<Box>
					<Autocomplete
						multiple
						freeSolo
						options={[]}
						value={singleCourseCopy?.instructor?.expertise?.slice(0, 5) || []}
						isOptionEqualToValue={(option, value) => {
							if (typeof option === 'string' && typeof value === 'string') {
								return option === value;
							}
							return false;
						}}
						onChange={(_, newValue) => {
							const limitedValue = newValue?.slice(0, 5) || [];
							setSingleCourseCopy((prevData) => {
								if (!prevData) return prevData;
								return {
									...prevData,
									instructor: {
										...prevData.instructor,
										expertise: limitedValue,
									},
								};
							});
						}}
						renderTags={(value, getTagProps) =>
							value?.map((option, index) => {
								const { key, ...chipProps } = getTagProps({ index });
								return (
									<Chip
										key={key}
										variant='outlined'
										sx={{
											'borderRadius': '0.75rem',
											'fontSize': '0.75rem',
											'& .MuiChip-deleteIcon': {
												fontSize: '1rem',
												margin: '0 2px 0 -6px',
											},
										}}
										label={option}
										{...chipProps}
									/>
								);
							})
						}
						renderInput={(params) => (
							<TextField
								{...params}
								variant='outlined'
								label='Expertise'
								placeholder='Add expertise (Enter to add)'
								size='small'
								helperText={singleCourseCopy?.instructor?.expertise?.length === 5 ? 'Maximum 5 expertise items allowed' : ''}
								sx={{
									'margin': '0.5rem 2rem',
									'backgroundColor': theme.bgColor?.common,
									'& .MuiInputBase-root': {
										resize: 'none',
									},
									'& .MuiInputBase-input': {
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									},
									'& .MuiInputBase-input::placeholder': {
										fontSize: '0.75rem',
									},
								}}
								inputProps={{
									...params.inputProps,
									maxLength: 50,
								}}
								InputLabelProps={{
									sx: { fontSize: '0.75rem' },
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
										e.preventDefault();
										const input = e.target as HTMLInputElement;
										const value = input.value.trim();
										if (value && (!singleCourseCopy?.instructor?.expertise || singleCourseCopy.instructor.expertise.length < 5)) {
											setSingleCourseCopy((prevData) => {
												if (!prevData) return prevData;
												return {
													...prevData,
													instructor: {
														...prevData.instructor,
														expertise: [...(prevData.instructor?.expertise || []), value],
													},
												};
											});
											input.value = '';
										}
									}
								}}
							/>
						)}
						sx={{ margin: '0.5rem 0rem', width: isMobileSize ? '85%' : '89%' }}
					/>
				</Box>

				<CustomTextField
					fullWidth={false}
					label='LinkedIn URL'
					value={singleCourseCopy?.instructor?.linkedInUrl}
					onChange={(e) =>
						setSingleCourseCopy((prevData) => {
							if (!prevData) return prevData;
							return {
								...prevData,
								instructor: {
									...prevData.instructor,
									linkedInUrl: e.target.value,
								},
							};
						})
					}
					sx={{ margin: '0.5rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: '0.8rem' },
					}}
					required={false}
				/>

				<CustomTextField
					fullWidth={false}
					label='Website'
					value={singleCourseCopy?.instructor?.website}
					onChange={(e) =>
						setSingleCourseCopy((prevData) => {
							if (!prevData) return prevData;
							return {
								...prevData,
								instructor: {
									...prevData.instructor,
									website: e.target.value,
								},
							};
						})
					}
					sx={{ margin: '0.5rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: '0.8rem' },
					}}
					required={false}
					InputProps={{
						inputProps: {
							maxLength: 250,
						},
					}}
				/>

				<CustomDialogActions
					onCancel={() => {
						setIsEditInstructorDialogOpen(false);
						setSingleCourseCopy(singleCourse);
						setIsUrlErrorOpen(false);
					}}
					submitBtnText='Save'
					actionSx={{ width: '95%', margin: '0.75rem auto' }}
				/>
			</form>

			{/* URL validation error SnackBar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>
		</CustomDialog>
	);
};

export default EditInstructorDialog;
