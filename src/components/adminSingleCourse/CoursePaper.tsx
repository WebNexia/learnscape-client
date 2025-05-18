import { Alert, Box, Button, DialogContent, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, FileCopy, KeyboardBackspaceOutlined, PublishedWithChanges, Unpublished } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import useImageUpload from '../../hooks/useImageUpload';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent, useContext, useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import axios from '@utils/axiosInstance';
import { CoursesContext } from '../../contexts/CoursesContextProvider';

interface CoursePaperProps {
	userId?: string;
	singleCourse?: SingleCourse;
	chapterLessonData: ChapterLessonData[];
	chapterLessonDataBeforeSave: ChapterLessonData[];
	isEditMode: boolean;
	isMissingFieldMsgOpen: boolean;
	isNoChapterMsgOpen: boolean;
	resetChanges: boolean;
	isFree: boolean;
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

const CoursePaper = ({
	userId,
	singleCourse,
	chapterLessonData,
	chapterLessonDataBeforeSave,
	isEditMode,
	isMissingFieldMsgOpen,
	isNoChapterMsgOpen,
	resetChanges,
	isFree,
	setChapterLessonDataBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	setResetChanges,
	handleCourseUpdate,
	setIsNoChapterMsgOpen,
	setDeletedChapterIds,
}: CoursePaperProps) => {
	const navigate = useNavigate();
	const vertical = 'top';
	const horizontal = 'center';

	const { addNewCourse } = useContext(CoursesContext);

	const { courseId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { resetImageUpload } = useImageUpload();

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);
		setChapterLessonDataBeforeSave(chapterLessonData);
		setResetChanges(!resetChanges);
		setDeletedChapterIds([]);
		resetImageUpload();
	};

	const [isCloning, setIsCloning] = useState<boolean>(false);
	const [isCloneCourseDialogOpen, setIsCloneCourseDialogOpen] = useState<boolean>(false);

	const [isCourseCloned, setIsCourseCloned] = useState<boolean>(false);

	const handleClone = async () => {
		setIsCloning(true);
		try {
			const response = await axios.post(`${base_url}/courses/${courseId}/clone`, { courseId });
			setIsCloneCourseDialogOpen(false);

			addNewCourse({
				_id: response.data._id,
				title: response.data.clonedCourse.title,
				clonedFromId: response.data.clonedCourse.clonedFromId,
				createdAt: response.data.clonedCourse.createdAt,
				updatedAt: response.data.clonedCourse.updatedAt,
			});

			setIsCourseCloned(true);
		} catch (error) {
			console.log(error);
		} finally {
			setIsCloning(false);
		}
	};

	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '6rem',
				marginTop: '1.25rem',
				backgroundColor: theme.bgColor?.adminPaper,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 2, padding: '0.5rem' }}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								'color': theme.textColor?.common.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								navigate(`/admin/courses/user/${userId}`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to courses
						</Button>
					</Box>
					<Box sx={{ paddingLeft: '0.5rem' }}>
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main }}>
							{singleCourse?.isActive ? (
								<Tooltip title='Published' placement='right'>
									<PublishedWithChanges />
								</Tooltip>
							) : (
								<Tooltip title='Unpublished' placement='right'>
									<Unpublished />
								</Tooltip>
							)}
						</Typography>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'flex-start',
						flex: 1,
						padding: '1rem',
					}}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
							<Box>
								<Typography variant='h5' sx={{ color: theme.textColor?.common.main, mr: '0.5rem' }}>
									{singleCourse?.title}
								</Typography>
							</Box>
						</Box>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: '100%',
							}}>
							<Box sx={{ display: 'flex' }}>
								<Snackbar
									open={isNoChapterMsgOpen}
									autoHideDuration={2500}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '5rem' }}
									onClose={() => setIsNoChapterMsgOpen(false)}>
									<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
										Add at least one published lesson to publish the course
									</Alert>
								</Snackbar>

								<Snackbar
									open={isCourseCloned}
									autoHideDuration={2250}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '5rem' }}
									onClose={() => setIsCourseCloned(false)}>
									<Alert severity='success' variant='filled' sx={{ width: '100%', color: theme.textColor?.common.main }}>
										Course is cloned successfully!
									</Alert>
								</Snackbar>

								<Snackbar
									open={isMissingFieldMsgOpen}
									autoHideDuration={3000}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '5rem' }}
									onClose={() => setIsMissingFieldMsgOpen(false)}>
									<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
										Fill in the required field(s)
									</Alert>
								</Snackbar>
								{isEditMode ? (
									<Box>
										<CustomSubmitButton
											sx={{ padding: '0 0.75rem' }}
											onClick={(e) => {
												if (
													singleCourse?.title.trim() !== '' &&
													singleCourse?.description.trim() !== '' &&
													(isFree || !singleCourse?.prices.some((price) => price.amount === '')) &&
													!chapterLessonDataBeforeSave.some((chapter) => chapter.title === '')
												) {
													setIsEditMode(false);
													handleCourseUpdate(e as FormEvent<Element>);
												} else {
													setIsMissingField(true);
													setIsMissingFieldMsgOpen(true);
												}
												window.scrollTo({ top: 0, behavior: 'smooth' });
											}}>
											Save
										</CustomSubmitButton>
										<CustomCancelButton
											onClick={handleCancel}
											sx={{ color: theme.textColor?.common.main, borderColor: theme.textColor?.common.main, padding: '0 0.75rem' }}>
											Cancel
										</CustomCancelButton>
									</Box>
								) : (
									<Box sx={{ ml: '1rem' }}>
										<CustomSubmitButton
											sx={{
												visibility: isEditMode ? 'hidden' : 'visible',
												padding: '0 0.75rem',
											}}
											onClick={handlePublishing}>
											{singleCourse?.isActive ? 'Unpublish' : 'Publish'}
										</CustomSubmitButton>
										{!singleCourse?.isExpired ? (
											<Tooltip title='Edit Course' placement='top'>
												<IconButton
													sx={{ padding: '0 0.75rem' }}
													onClick={() => {
														setIsEditMode(true);
													}}>
													<Edit sx={{ color: 'white' }} fontSize='small' />
												</IconButton>
											</Tooltip>
										) : (
											<Tooltip title='Clone Course' placement='top'>
												<IconButton
													sx={{ padding: '0 0.75rem' }}
													onClick={() => {
														setIsCloneCourseDialogOpen(true);
													}}>
													<FileCopy sx={{ color: 'white' }} fontSize='small' />
												</IconButton>
											</Tooltip>
										)}
									</Box>
								)}
							</Box>

							<CustomDialog
								openModal={isCloneCourseDialogOpen}
								closeModal={() => setIsCloneCourseDialogOpen(false)}
								title='Clone Course'
								content='Are you sure you want to clone the course?'
								maxWidth='sm'>
								<DialogContent sx={{ mt: '-0.75rem' }}>
									<Typography variant='body2'>Cloning this course will:</Typography>
									<ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
										<li>
											<Typography variant='body2' sx={{mb:'0.25rem'}}>Create a new course with a copy of all its chapters, lessons, questions, and documents</Typography>
										</li>
										<li>
											<Typography variant='body2' sx={{mb:'0.25rem'}}>Preserve the original course and its content without any changes</Typography>
										</li>
										<li>
											<Typography variant='body2' sx={{mb:'0.25rem'}}>Allow you to safely edit the new course without affecting previous versions</Typography>
										</li>
										<li>
											<Typography variant='body2'>Mark the cloned course as unpublished by default</Typography>
										</li>
									</ul>
									<Typography variant='body2' sx={{ marginTop: '1rem' }}>
										You can customize the cloned course before publishing it.
									</Typography>
								</DialogContent>

								<CustomDialogActions
									onCancel={() => setIsCloneCourseDialogOpen(false)}
									submitBtnText={isCloning ? 'Cloning...' : 'Clone'}
									onSubmit={handleClone}
								/>
							</CustomDialog>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePaper;
