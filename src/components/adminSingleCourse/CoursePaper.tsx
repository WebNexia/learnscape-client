import { Alert, Box, Button, DialogContent, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, FileCopy, Info, KeyboardBackspaceOutlined } from '@mui/icons-material';
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
import { useStickyPaper } from '../../hooks/useStickyPaper';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import CoursesInfoModal from '../layouts/courses/CoursesInfoModal';

interface CoursePaperProps {
	singleCourse?: SingleCourse;
	singleCourseBeforeSave: SingleCourse | undefined;
	chapterLessonData: ChapterLessonData[];
	chapterLessonDataBeforeSave: ChapterLessonData[];
	isEditMode: boolean;
	isMissingFieldMsgOpen: boolean;
	isNoChapterMsgOpen: boolean;
	isFree: boolean;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	handleCourseUpdate: (event: React.FormEvent<Element>) => void;
	setIsNoChapterMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setDeletedChapterIds: React.Dispatch<React.SetStateAction<string[]>>;
	hasUnsavedChanges: boolean;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleCourseBeforeSave: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
}

const CoursePaper = ({
	singleCourse,
	singleCourseBeforeSave,
	chapterLessonData,
	chapterLessonDataBeforeSave,
	isEditMode,
	isMissingFieldMsgOpen,
	isNoChapterMsgOpen,
	isFree,
	setChapterLessonDataBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	handleCourseUpdate,
	setIsNoChapterMsgOpen,
	setDeletedChapterIds,
	hasUnsavedChanges,
	setHasUnsavedChanges,
	setSingleCourseBeforeSave,
}: CoursePaperProps) => {
	const navigate = useNavigate();
	const vertical = 'top';
	const horizontal = 'center';

	const { addNewCourse } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	const { user } = useContext(UserAuthContext);

	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { courseId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { resetImageUpload } = useImageUpload();

	const { isSticky, paperRef } = useStickyPaper();

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);
		setChapterLessonDataBeforeSave(chapterLessonData);
		setDeletedChapterIds([]);
		resetImageUpload();
		setHasUnsavedChanges(false);
		setSingleCourseBeforeSave(singleCourse);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const [isCloning, setIsCloning] = useState<boolean>(false);
	const [isCloneCourseDialogOpen, setIsCloneCourseDialogOpen] = useState<boolean>(false);
	const [isCourseInfoDialogOpen, setIsCourseInfoDialogOpen] = useState<boolean>(false);
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
			} as SingleCourse);

			setIsCourseCloned(true);
		} catch (error) {
			console.log(error);
		} finally {
			setIsCloning(false);
		}
	};

	return (
		<Paper
			ref={paperRef}
			elevation={10}
			sx={{
				width: isSticky ? (isMobileSize ? '100%' : 'calc(100% - 10rem)') : '100%',
				height: isSticky ? '3rem' : '6rem',
				marginTop: isSticky ? 0 : '1.25rem',
				backgroundColor: user?.role === Roles.ADMIN ? theme.bgColor?.adminPaper : theme.bgColor?.instructorPaper,
				position: isSticky ? 'fixed' : 'relative',
				top: isSticky ? (isMobileSize ? '3.5rem' : '4rem') : 'auto', // Assuming DashboardHeader height is 64px
				left: isSticky ? (isMobileSize ? '0' : '10rem') : 'auto', // Align with main content area
				right: isSticky ? 0 : 'auto', // Align with main content area
				zIndex: isSticky ? 1000 : 'auto',
				transition: 'all 0.5s ease',
				borderRadius: isSticky ? 0 : undefined,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isSticky ? 'row' : 'column',
						justifyContent: isSticky ? 'flex-start' : 'space-between',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: { md: 2, lg: 3 },
						padding: isSticky ? '0.5rem 1rem' : '0.5rem',
					}}>
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
								'fontSize': isSticky ? { xs: '0.7rem', sm: '0.8rem' } : undefined,
							}}
							onClick={() => {
								if (user?.role === Roles.ADMIN) {
									navigate(`/admin/courses`);
								} else {
									navigate(`/instructor/courses`);
								}
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isSticky ? 'Courses' : 'Back to courses'}
						</Button>
					</Box>
					<Box sx={{ paddingLeft: isSticky ? '0' : '0.5rem' }}>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
							}}>
							{isSticky ? '(' : ''}
							{singleCourseBeforeSave?.isActive ? 'Published' : 'Unpublished'} - {singleCourseBeforeSave?.isExpired ? 'Closed' : 'Open'} -{' '}
							{singleCourseBeforeSave?.courseManagement?.isExternal ? 'External' : 'Platform'}
							{isSticky ? ')' : ''}
						</Typography>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: 2,
						padding: isSticky ? '0.5rem 1rem' : '1rem',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: isSticky ? 'row' : 'column',
							alignItems: 'center',
							justifyContent: isSticky ? 'flex-start' : 'space-between',
							height: '100%',
							width: '100%',
							gap: isSticky ? 1 : 0,
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
							<Box>
								<Typography
									variant='h6'
									sx={{
										color: theme.textColor?.common.main,
										mr: isSticky ? '0.25rem' : '0.5rem',
										fontSize: isSticky ? { xs: '0.7rem', sm: '0.8rem' } : undefined,
									}}>
									{singleCourseBeforeSave?.title}
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
											unsaved={hasUnsavedChanges}
											sx={{ fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined }}
											onClick={(e) => {
												if (
													singleCourseBeforeSave?.title.trim() !== '' &&
													singleCourseBeforeSave?.description.trim() !== '' &&
													(isFree || !singleCourseBeforeSave?.prices?.some((price) => price.amount === '')) &&
													!chapterLessonDataBeforeSave?.some((chapter) => chapter.title === '')
												) {
													handleCourseUpdate(e as FormEvent<Element>);
													setHasUnsavedChanges(false);
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
											sx={{
												color: theme.textColor?.common.main,
												borderColor: theme.textColor?.common.main,
												fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
											}}>
											Cancel
										</CustomCancelButton>
									</Box>
								) : (
									<Box sx={{ ml: '1rem' }}>
										{user?.role === Roles.ADMIN && (
											<CustomSubmitButton
												sx={{
													visibility: isEditMode ? 'hidden' : 'visible',
													padding: '0 0.75rem',
													fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
												}}
												onClick={handlePublishing}>
												{singleCourseBeforeSave?.isActive ? 'Unpublish' : 'Publish'}
											</CustomSubmitButton>
										)}
										{!singleCourseBeforeSave?.isExpired ? (
											<Tooltip title='Edit Course' placement='top' arrow>
												<IconButton
													sx={{ padding: '0 0.75rem' }}
													onClick={() => {
														setIsEditMode(true);
													}}>
													<Edit sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
												</IconButton>
											</Tooltip>
										) : (
											<Tooltip title='Clone Course' placement='top' arrow>
												<IconButton
													sx={{ padding: '0 0.75rem' }}
													onClick={() => {
														setIsCloneCourseDialogOpen(true);
													}}>
													<FileCopy sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
												</IconButton>
											</Tooltip>
										)}
										<Tooltip title='More Info' placement='top' arrow>
											<IconButton
												sx={{ padding: '0 0.75rem', ml: '-0.75rem' }}
												onClick={() => {
													setIsCourseInfoDialogOpen(true);
												}}>
												<Info sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
											</IconButton>
										</Tooltip>
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
											<Typography variant='body2' sx={{ mb: '0.25rem' }}>
												Create a new course with a copy of all its chapters, lessons, questions, and documents
											</Typography>
										</li>
										<li>
											<Typography variant='body2' sx={{ mb: '0.25rem' }}>
												Preserve the original course and its content without any changes
											</Typography>
										</li>
										<li>
											<Typography variant='body2' sx={{ mb: '0.25rem' }}>
												Allow you to safely edit the new course without affecting previous versions
											</Typography>
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
							<CoursesInfoModal
								singleCourse={singleCourseBeforeSave}
								isCourseInfoDialogOpen={isCourseInfoDialogOpen}
								setIsCourseInfoDialogOpen={setIsCourseInfoDialogOpen}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePaper;
