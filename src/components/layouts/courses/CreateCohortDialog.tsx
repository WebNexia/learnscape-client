import { DialogContent, Typography, TextField, Box } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { SingleCourse } from '../../../interfaces/course';
import CustomTextField from '../../forms/customFields/CustomTextField';

interface CreateCohortDialogProps {
	isCourseCreateCohortModalOpen?: boolean[];
	index?: number;
	closeCreateCohortModal?: (index: number) => void;
	isCreatingCohort?: boolean;
	handleCreateCohort?: (courseId: string, index: number, payload: { startingDate: string; title?: string }) => Promise<void>;
	course?: SingleCourse;
	isCreateCohortDialogOpen?: boolean;
	setIsCreateCohortDialogOpen?: (value: React.SetStateAction<boolean>) => void;
	createCohort?: (payload: { startingDate: string; title?: string }) => Promise<void>;
}

const CreateCohortDialog = ({
	isCourseCreateCohortModalOpen,
	index,
	closeCreateCohortModal,
	isCreatingCohort,
	handleCreateCohort,
	course,
	isCreateCohortDialogOpen,
	setIsCreateCohortDialogOpen,
	createCohort,
}: CreateCohortDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const nextMonday = new Date();
	nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7) || 7);
	const defaultDateStr = nextMonday.toISOString().split('T')[0];

	const [startingDate, setStartingDate] = useState<string>(defaultDateStr);
	const [title, setTitle] = useState<string>('');

	const isOpen = isCourseCreateCohortModalOpen?.[index ?? 0] || isCreateCohortDialogOpen;

	useEffect(() => {
		if (isOpen) {
			const next = new Date();
			next.setDate(next.getDate() + ((8 - next.getDay()) % 7) || 7);
			setStartingDate(next.toISOString().split('T')[0]);
			setTitle('');
		}
	}, [isOpen]);

	const handleClose = () => {
		const next = new Date();
		next.setDate(next.getDate() + ((8 - next.getDay()) % 7) || 7);
		setStartingDate(next.toISOString().split('T')[0]);
		setTitle('');
		if (index !== undefined && closeCreateCohortModal) {
			closeCreateCohortModal(index);
		} else {
			setIsCreateCohortDialogOpen?.(false);
		}
	};

	const handleSubmit = () => {
		if (!startingDate || !startingDate.trim()) return;
		const payload = { startingDate: startingDate.trim(), title: title.trim() || undefined };
		if (createCohort && isCreateCohortDialogOpen) {
			createCohort(payload);
		} else if (handleCreateCohort && index !== undefined && course?._id) {
			handleCreateCohort(course._id, index, payload);
		}
	};

	return (
		<CustomDialog
			openModal={isOpen}
			closeModal={() => { if (!isCreatingCohort) handleClose(); }}
			title='New Cohort'
			maxWidth='sm'>
			<DialogContent>
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '1.5rem' }}>
					Create a new cohort with the same content. Each cohort has its own start date, enrollments, and analytics.
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
					<CustomTextField
						label='Starting date'
						type='date'
						value={startingDate}
						onChange={(e) => setStartingDate(e.target.value)}
						required
						fullWidth
						InputLabelProps={{ shrink: true }}
						InputProps={{ inputProps: { max: '2099-12-31' as unknown as string } }}
						sx={{ '& .MuiInputBase-input': { fontSize: isMobileSize ? '0.85rem' : undefined } }}
					/>
					<CustomTextField
						label='Title (optional)'
						placeholder={`${course?.title || 'Course'} (date)`}
						required={false}
						value={title}
						onChange={(e) => setTitle(e.target.value.slice(0, 50))}
						fullWidth
						InputProps={{ inputProps: { maxLength: 50 } }}
					/>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', textAlign: 'left', mt: '-1.5rem' }}>
						{title.length > 0 ? `${title.length}/50 Characters` : 'Leave empty to auto-generate from course name + date'}
					</Typography>

				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={handleClose}
				submitBtnText={isCreatingCohort ? 'Creating...' : 'Create Cohort'}
				onSubmit={handleSubmit}
				disableBtn={!startingDate?.trim() || isCreatingCohort}
				disableCancelBtn={isCreatingCohort}
				actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
			/>
		</CustomDialog>
	);
};

export default CreateCohortDialog;
