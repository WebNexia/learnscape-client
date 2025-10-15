import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../customFields/CustomTextField';
import { Tooltip } from '@mui/material';
import { Box, FormControlLabel, Checkbox, Typography } from '@mui/material';
import CustomDialogActions from '../../layouts/dialog/CustomDialogActions';
import { useContext, useState, useEffect } from 'react';
import { Instructor, Price, SingleCourse } from '../../../interfaces/course';
import { useAuth } from '../../../hooks/useAuth';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CreateCourseDialogProps {
	closeNewCourseModal: () => void;
	isCourseCreateModalOpen: boolean;
}

const CreateCourseDialog = ({ closeNewCourseModal, isCourseCreateModalOpen }: CreateCourseDialogProps) => {
	const { isInstructor } = useAuth();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { user } = useAuth();
	const { addNewCourse } = useContext(CoursesContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [GBP, setGBP] = useState<Price | null>(null);
	const [USD, setUSD] = useState<Price | null>(null);
	const [EUR, setEUR] = useState<Price | null>(null);
	const [TRY, setTRY] = useState<Price | null>(null);

	const [checked, setChecked] = useState<boolean>(false);
	const [isExternal, setIsExternal] = useState<boolean>(false);

	// Reset form when dialog opens
	useEffect(() => {
		if (isCourseCreateModalOpen) {
			setTitle('');
			setDescription('');
			setChecked(false);
			setIsExternal(false);
			setGBP({ amount: '', currency: 'gbp' });
			setUSD({ amount: '', currency: 'usd' });
			setEUR({ amount: '', currency: 'eur' });
			setTRY({ amount: '', currency: 'try' });
		}
	}, [isCourseCreateModalOpen]);

	const createCourse = async (): Promise<void> => {
		// For instructors, allow creating courses without prices
		// For admins, always include prices
		const prices: Price[] = isInstructor
			? []
			: [
					{ amount: checked ? 'Free' : GBP?.amount!, currency: 'gbp' },
					{ amount: checked ? 'Free' : USD?.amount!, currency: 'usd' },
					{ amount: checked ? 'Free' : EUR?.amount!, currency: 'eur' },
					{ amount: checked ? 'Free' : TRY?.amount!, currency: 'try' },
				];
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}`, {
				title: title.trim(),
				description: description.trim(),
				prices,
				startingDate: '',
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: `${(user?.firstName ?? '').charAt(0).toUpperCase()}${(user?.firstName ?? '').slice(1)} ${(user?.lastName ?? '').charAt(0).toUpperCase()}${(user?.lastName ?? '').slice(1)}`,
					userId: user?._id,
					imageUrl: user?.imageUrl,
					email: user?.email,
				},
			});

			// Notify context provider to update courses with the new course
			addNewCourse({
				_id: response.data._id,
				title: title.trim(),
				description: description.trim(),
				prices,
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				createdAt: response.data.createdAt,
				updatedAt: response.data.updatedAt,
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: user?.firstName.toUpperCase() + ' ' + user?.lastName.toUpperCase(),
					userId: user?._id!,
					imageUrl: user?.imageUrl!,
					email: user?.email!,
				} as Instructor,
			} as SingleCourse);
		} catch (error) {
			console.error('Create course error:', error);
		}
	};

	return (
		<CustomDialog openModal={isCourseCreateModalOpen} closeModal={closeNewCourseModal} title='Create New Course' maxWidth='sm'>
			<form
				onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					createCourse();
					closeNewCourseModal();
				}}
				style={{ display: 'flex', flexDirection: 'column', marginTop: '-1rem' }}>
				<CustomTextField
					fullWidth={false}
					label='Title'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					sx={{ margin: '1rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
					}}
					InputProps={{ inputProps: { maxLength: 50 } }}
				/>
				<Typography sx={{ fontSize: '0.7rem', margin: '0 2rem', textAlign: 'right' }}>{title.length}/50 Characters</Typography>

				<CustomTextField
					fullWidth={false}
					label='Description'
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					sx={{ margin: '1rem 2rem' }}
					InputLabelProps={{
						sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
					}}
					InputProps={{ inputProps: { maxLength: 500 } }}
					multiline
					rows={5}
					resizable
				/>
				<Typography sx={{ fontSize: '0.7rem', margin: '0 2rem', textAlign: 'right' }}>{description.length}/500 Characters</Typography>

				{!isInstructor && (
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Box sx={{ margin: '1rem 2rem 1rem 2rem', flex: 2 }}>
							<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
									Prices
								</Typography>
								<Tooltip title='Check to make this course free in all currencies.' placement='top' arrow>
									<FormControlLabel
										control={
											<Checkbox
												checked={checked}
												onChange={(e) => {
													setChecked(e.target.checked);
													setTRY((prevData) => ({ ...prevData!, amount: '' }));
													setEUR((prevData) => ({ ...prevData!, amount: '' }));
													setUSD((prevData) => ({ ...prevData!, amount: '' }));
													setGBP((prevData) => ({ ...prevData!, amount: '' }));
												}}
												sx={{
													'& .MuiSvgIcon-root': {
														fontSize: isMobileSize ? '0.9rem' : '1rem',
													},
												}}
											/>
										}
										label='Free Course'
										sx={{
											'mr': '0rem',
											'& .MuiFormControlLabel-label': {
												fontSize: isMobileSize ? '0.65rem' : '0.75rem',
											},
										}}
									/>
								</Tooltip>
							</Box>

							<CustomTextField
								label='GBP'
								value={checked ? '' : GBP?.amount}
								onChange={(e) => setGBP((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
								}}
							/>
							<CustomTextField
								label='USD'
								value={checked ? '' : USD?.amount}
								onChange={(e) => setUSD((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
								}}
							/>
							<CustomTextField
								label='EUR'
								value={checked ? '' : EUR?.amount}
								onChange={(e) => setEUR((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
								}}
							/>
							<CustomTextField
								label='TRY'
								value={checked ? '' : TRY?.amount}
								onChange={(e) => setTRY((prevData) => ({ ...prevData!, amount: e.target.value }))}
								type='number'
								disabled={checked}
								sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
								}}
							/>
						</Box>
					</Box>
				)}

				<Box sx={{ margin: '0 2rem', display: 'flex', alignItems: 'center' }}>
					<Tooltip title='This course will be managed outside the platform.' placement='top' arrow>
						<FormControlLabel
							control={
								<Checkbox
									checked={isExternal}
									onChange={(e) => {
										setIsExternal(e.target.checked);
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '1rem' : '1.25rem',
										},
									}}
								/>
							}
							label='External Course'
							sx={{
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								},
							}}
						/>
					</Tooltip>
				</Box>

				<CustomDialogActions onCancel={closeNewCourseModal} actionSx={{ width: '95%', margin: '0.75rem auto' }} />
			</form>
		</CustomDialog>
	);
};

export default CreateCourseDialog;
