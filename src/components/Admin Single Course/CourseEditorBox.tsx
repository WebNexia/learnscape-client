import { Alert, Box, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import CustomSubmitButton from '../forms/Custom Buttons/CustomSubmitButton';
import { FormEvent } from 'react';
import CustomCancelButton from '../forms/Custom Buttons/CustomCancelButton';
import { Edit } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import { ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import { BaseChapter } from '../../interfaces/chapter';

interface CourseEditorBoxProps {
	singleCourse?: SingleCourse;
	chapters: BaseChapter[];
	allChaptersBeforeSave: BaseChapter[];
	isEditMode: boolean;
	isActive?: boolean;
	isMissingFieldMsgOpen: boolean;
	isNoChapterMsgOpen: boolean;
	resetChanges: boolean;
	isFree: boolean;
	setChapters: React.Dispatch<React.SetStateAction<BaseChapter[]>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	setResetChanges: React.Dispatch<React.SetStateAction<boolean>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	handleCourseUpdate: (event: React.FormEvent<Element>) => void;
	setIsNoChapterMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setAllChaptersBeforeSave: React.Dispatch<React.SetStateAction<BaseChapter[]>>;
	setNewChaptersToCreate: React.Dispatch<React.SetStateAction<BaseChapter[]>>;
	setDeletedChapterIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const CourseEditorBox = ({
	singleCourse,
	chapters,
	allChaptersBeforeSave,
	isEditMode,
	isActive,
	isMissingFieldMsgOpen,
	isNoChapterMsgOpen,
	resetChanges,
	isFree,
	setAllChaptersBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	setResetChanges,
	handleCourseUpdate,
	setIsNoChapterMsgOpen,
	setNewChaptersToCreate,
	setDeletedChapterIds,
}: CourseEditorBoxProps) => {
	const vertical = 'top';
	const horizontal = 'center';

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);
		setAllChaptersBeforeSave(chapters);
		setResetChanges(!resetChanges);
		setNewChaptersToCreate([]);
		setDeletedChapterIds([]);
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
					src={singleCourse?.imageUrl}
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
									!allChaptersBeforeSave.some((chapter) => chapter.title === '')
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
