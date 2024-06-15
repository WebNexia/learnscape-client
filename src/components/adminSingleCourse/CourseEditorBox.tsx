import { Alert, Box, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { Edit } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import useImageUpload from '../../hooks/useImageUpload';

interface CourseEditorBoxProps {
	singleCourse?: SingleCourse;
	chapterLessonData: ChapterLessonData[];
	chapterLessonDataBeforeSave: ChapterLessonData[];
	isEditMode: boolean;
	isActive?: boolean;
	isMissingFieldMsgOpen: boolean;
	isNoChapterMsgOpen: boolean;
	resetChanges: boolean;
	isFree: boolean;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	setResetChanges: React.Dispatch<React.SetStateAction<boolean>>;
	handleCourseUpdate: (event: React.FormEvent<Element>) => void;
	setIsNoChapterMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setDeletedChapterIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const CourseEditorBox = ({
	singleCourse,
	chapterLessonData,
	chapterLessonDataBeforeSave,
	isEditMode,
	isActive,
	isMissingFieldMsgOpen,
	isNoChapterMsgOpen,
	resetChanges,
	isFree,
	setSingleCourse,
	setChapterLessonDataBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	setResetChanges,
	handleCourseUpdate,
	setIsNoChapterMsgOpen,
	setDeletedChapterIds,
}: CourseEditorBoxProps) => {
	const vertical = 'top';
	const horizontal = 'center';

	const { resetImageUpload } = useImageUpload();

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);
		setChapterLessonDataBeforeSave(chapterLessonData);
		setResetChanges(!resetChanges);
		setDeletedChapterIds([]);
		resetImageUpload();
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				width: '100%',
			}}>
			<Box sx={{ textAlign: 'center' }}>
				<img
					src={singleCourse?.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
					alt='course_img'
					height='125rem'
					style={{
						borderRadius: '0.2rem',
						boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
					}}
				/>
				<Typography variant='body2' sx={{ mt: '0.25rem' }}>
					Course Image
				</Typography>
				{isEditMode && singleCourse?.imageUrl && (
					<Typography
						variant='body2'
						sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
						onClick={() => {
							setSingleCourse((prevData) => {
								if (prevData !== undefined) {
									return {
										...prevData,
										imageUrl: '',
									};
								}
							});

							resetImageUpload();
						}}>
						Remove
					</Typography>
				)}
			</Box>
			<Box sx={{ display: 'flex' }}>
				<Box>
					<CustomSubmitButton
						sx={{
							visibility: isEditMode ? 'hidden' : 'visible',
						}}
						onClick={handlePublishing}>
						{isActive ? 'Unpublish' : 'Publish'}
					</CustomSubmitButton>
					<Snackbar
						open={isNoChapterMsgOpen}
						autoHideDuration={2000}
						anchorOrigin={{ vertical, horizontal }}
						sx={{ mt: '14rem' }}
						onClose={() => setIsNoChapterMsgOpen(false)}>
						<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
							Add chapter(s) to publish
						</Alert>
					</Snackbar>
				</Box>
				<Snackbar
					open={isMissingFieldMsgOpen}
					autoHideDuration={2000}
					anchorOrigin={{ vertical, horizontal }}
					sx={{ mt: '14rem' }}
					onClose={() => setIsMissingFieldMsgOpen(false)}>
					<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
						Fill the required field(s)
					</Alert>
				</Snackbar>
				{isEditMode ? (
					<Box>
						<CustomSubmitButton
							onClick={(e) => {
								if (
									singleCourse?.title.trim() !== '' &&
									singleCourse?.description.trim() !== '' &&
									(isFree || (singleCourse?.priceCurrency !== '' && singleCourse?.price !== '')) &&
									!chapterLessonDataBeforeSave.some((chapter) => chapter.title === '')
								) {
									setIsEditMode(false);
									handleCourseUpdate(e as FormEvent<Element>);
								} else {
									setIsMissingField(true);
									setIsMissingFieldMsgOpen(true);
								}
							}}>
							Save
						</CustomSubmitButton>
						<CustomCancelButton onClick={handleCancel}>Cancel</CustomCancelButton>
					</Box>
				) : (
					<Box sx={{ ml: '1rem' }}>
						<Tooltip title='Edit Course' placement='top'>
							<IconButton
								onClick={() => {
									setIsEditMode(true);
								}}>
								<Edit />
							</IconButton>
						</Tooltip>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default CourseEditorBox;
