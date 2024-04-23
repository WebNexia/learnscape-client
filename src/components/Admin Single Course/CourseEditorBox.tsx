import { Alert, Box, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';
import CustomSubmitButton from '../forms/Custom Buttons/CustomSubmitButton';
import { FormEvent, useContext } from 'react';
import CustomCancelButton from '../forms/Custom Buttons/CustomCancelButton';
import { Edit } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import { ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import { BaseChapter } from '../../interfaces/chapter';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { CoursesContext } from '../../contexts/CoursesContextProvider';

interface CourseEditorBoxProps {
	singleCourse?: SingleCourse;
	chapters: BaseChapter[];
	isEditMode: boolean;
	isActive?: boolean;
	isMissingFieldMsgOpen: boolean;
	isNoChapterMsgOpen: boolean;
	resetChanges: boolean;
	isFree: boolean;
	notSavedChapterIds: string[];
	setChapters: React.Dispatch<React.SetStateAction<BaseChapter[]>>;
	setNotSavedChapterIds: React.Dispatch<React.SetStateAction<string[]>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	setResetChanges: React.Dispatch<React.SetStateAction<boolean>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	handleCourseUpdate: (event: React.FormEvent<Element>) => void;
	setIsNoChapterMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CourseEditorBox = ({
	singleCourse,
	chapters,
	isEditMode,
	isActive,
	isMissingFieldMsgOpen,
	isNoChapterMsgOpen,
	resetChanges,
	isFree,
	notSavedChapterIds,
	setChapters,
	setNotSavedChapterIds,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	setResetChanges,
	setIsChapterUpdated,
	handleCourseUpdate,
	setIsNoChapterMsgOpen,
}: CourseEditorBoxProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const vertical = 'top';
	const horizontal = 'center';

	const { courseId } = useParams();
	const { updateCourse } = useContext(CoursesContext);

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);

		setIsChapterUpdated((prevData) => {
			return prevData.map((data) => ({ ...data, isUpdated: false }));
		});

		try {
			if (notSavedChapterIds.length !== 0) {
				await Promise.all(
					notSavedChapterIds?.map(async (id) => {
						await axios.delete(`${base_url}/chapters/${id}`);
					})
				);
			}

			if (singleCourse) {
				const updatedChapterIds = singleCourse.chapterIds.filter((chapterId) => !notSavedChapterIds.includes(chapterId));
				const updatedChapters = singleCourse.chapters.filter((chapter) => {
					if (!notSavedChapterIds.includes(chapter._id)) {
						return chapter;
					}
				});

				await axios.patch(`${base_url}/courses/${courseId}`, {
					...singleCourse,
					chapterIds: updatedChapterIds,
					chapters: updatedChapters,
				});

				updateCourse({
					...singleCourse,
					chapterIds: updatedChapterIds,
					chapters: updatedChapters,
				});

				setChapters(updatedChapters);
			}

			setNotSavedChapterIds([]);
			setResetChanges(!resetChanges);
		} catch (error) {
			console.log(error);
		}
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
									!chapters.some((chapter) => chapter.title === '')
								) {
									setIsEditMode(false);
									handleCourseUpdate(e as FormEvent<Element>);
								} else {
									setIsMissingField(true);
									setIsMissingFieldMsgOpen(true);
								}
								setNotSavedChapterIds([]);
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
