import CustomDialogActions from '../../components/layouts/dialog/CustomDialogActions';
import CustomTextField from '../../components/forms/customFields/CustomTextField';
import CustomDialog from '../../components/layouts/dialog/CustomDialog';
import { SingleCourse } from '../../interfaces/course';
import { useContext, useState, useEffect } from 'react';
import { Box, TextField } from '@mui/material';
import UserSearchSelect from '../../components/UserSearchSelect';
import { UsersContext } from '../../contexts/UsersContextProvider';
import axios from '@utils/axiosInstance';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import theme from '../../themes';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

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
	const { sortedUsersData } = useContext(UsersContext);
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const { updateCourse } = useContext(CoursesContext);

	const [searchValue, setSearchValue] = useState<string>('');
	const [singleCourseCopy, setSingleCourseCopy] = useState<SingleCourse | undefined>(singleCourse);

	const [isUserSelected, setIsUserSelected] = useState<boolean>(false);

	useEffect(() => {
		if (isEditInstructorDialogOpen) {
			setSingleCourseCopy(singleCourse);
		}
	}, [isEditInstructorDialogOpen]);

	const handleInstructorUpdate = async () => {
		try {
			const response = await axios.patch(`${base_url}/courses/${singleCourse?._id}`, {
				instructor: singleCourse?.instructor,
			});

			const responseUpdatedData = response.data.data;

			updateCourse(responseUpdatedData as SingleCourse);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<CustomDialog
			openModal={isEditInstructorDialogOpen}
			closeModal={() => setIsEditInstructorDialogOpen(false)}
			title='Edit Instructor'
			maxWidth='sm'>
			<form
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					if (!(document.activeElement?.getAttribute('aria-autocomplete') === 'list')) {
						handleInstructorUpdate();
						setIsEditInstructorDialogOpen(false);
					}
				}}
				style={{ display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mb: '0.75rem', mt: '-0.5rem' }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', flex: 3 }}>
						<CustomTextField
							fullWidth={false}
							label='Name'
							value={singleCourse?.instructor?.name}
							onChange={(e) => {
								setSingleCourse((prevData) => {
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
							sx={{ margin: '1rem 2rem' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
						/>
						<CustomTextField
							fullWidth={false}
							type='email'
							label='Email Address'
							value={singleCourse?.instructor?.email}
							disabled={isUserSelected || !!singleCourse?.instructor?.userId}
							onChange={(e) =>
								setSingleCourse((prevData) => {
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
							sx={{ margin: '1rem 2rem' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
							required={false}
						/>
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 3 }}>
						<img
							src={singleCourse?.instructor?.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
							alt='img'
							style={{ width: '4.25rem', height: '4.25rem', borderRadius: '50%' }}
						/>
						<CustomTextField
							fullWidth={false}
							label='Image'
							value={singleCourse?.instructor?.imageUrl}
							disabled={isUserSelected || !!singleCourse?.instructor?.userId}
							onChange={(e) =>
								setSingleCourse((prevData) => {
									if (!prevData) return prevData;
									return {
										...prevData,
										instructor: {
											...prevData.instructor,
											imageUrl: e.target.value,
										},
									};
								})
							}
							sx={{ margin: '1rem 2rem', width: '80%' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
							required={false}
						/>
					</Box>
				</Box>

				<UserSearchSelect
					users={sortedUsersData}
					value={searchValue}
					onChange={setSearchValue}
					onSelect={(selectedUser) => {
						setSingleCourse((prevData) => {
							if (!prevData) return prevData;
							return {
								...prevData,
								instructor: {
									...prevData.instructor,
									name:
										selectedUser.firstName.charAt(0).toUpperCase() +
										selectedUser.firstName.slice(1) +
										' ' +
										selectedUser.lastName.charAt(0).toUpperCase() +
										selectedUser.lastName.slice(1),
									userId: selectedUser._id,
									email: selectedUser.email,
									imageUrl: selectedUser.imageUrl,
								},
							};
						});

						setSearchValue('');
						setIsUserSelected(true);
					}}
					sx={{ width: '90%' }}
					listSx={{ width: '90%', margin: '-1rem auto 1rem auto', zIndex: 1000 }}
				/>

				<CustomTextField
					fullWidth={false}
					label='Bio'
					value={singleCourse?.instructor?.bio}
					onChange={(e) =>
						setSingleCourse((prevData) => {
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
					required={false}
				/>

				<CustomTextField
					fullWidth={false}
					label='Title'
					value={singleCourse?.instructor?.title}
					onChange={(e) =>
						setSingleCourse((prevData) => {
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
				/>

				<Box>
					<Autocomplete
						multiple
						freeSolo
						options={[]}
						value={singleCourse?.instructor?.expertise || []}
						isOptionEqualToValue={(option, value) => {
							if (typeof option === 'string' && typeof value === 'string') {
								return option === value;
							}
							return false;
						}}
						onChange={(_, newValue) =>
							setSingleCourse((prevData) => {
								if (!prevData) return prevData;
								return {
									...prevData,
									instructor: {
										...prevData.instructor,
										expertise: newValue,
									},
								};
							})
						}
						renderTags={(value, getTagProps) =>
							value.map((option, index) => {
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
								InputLabelProps={{
									sx: { fontSize: '0.75rem' },
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
										e.preventDefault();
										const input = e.target as HTMLInputElement;
										const value = input.value.trim();
										if (value) {
											setSingleCourse((prevData) => {
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
						sx={{ margin: '0.5rem 0rem', width: '89%' }}
					/>
				</Box>

				<CustomTextField
					fullWidth={false}
					label='LinkedIn URL'
					value={singleCourse?.instructor?.linkedInUrl}
					onChange={(e) =>
						setSingleCourse((prevData) => {
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
					value={singleCourse?.instructor?.website}
					onChange={(e) =>
						setSingleCourse((prevData) => {
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
				/>

				<CustomDialogActions
					onCancel={() => {
						setIsEditInstructorDialogOpen(false);
						setSingleCourse(singleCourseCopy);
					}}
					submitBtnText='Save'
					actionSx={{ width: '95%', margin: '0.75rem auto' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default EditInstructorDialog;
