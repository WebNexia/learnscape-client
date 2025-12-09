import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, FileCopy, Info, KeyboardBackspaceOutlined, RateReview, Insights } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import useImageUpload from '../../hooks/useImageUpload';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent, useContext, useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import axios from '@utils/axiosInstance';
import { CoursesContext } from '../../contexts/CoursesContextProvider';
import { useStickyPaper } from '../../hooks/useStickyPaper';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CoursesInfoModal from '../layouts/courses/CoursesInfoModal';
import CloneCourseDialog from '../layouts/courses/CloneCourseDialog';
import { useAuth } from '../../hooks/useAuth';

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

	const { hasAdminAccess } = useAuth();

	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { courseId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { resetImageUpload } = useImageUpload();

	const { isSticky, paperRef } = useStickyPaper(isMobileSize);

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

	const cloneCourse = async () => {
		setIsCloning(true);
		try {
			const response = await axios.post(`${base_url}/courses/${courseId}/clone`, { courseId });
			setIsCloneCourseDialogOpen(false);

			addNewCourse({
				_id: response.data.clonedCourse._id,
				title: response.data.clonedCourse.title,
				instructor: response.data.clonedCourse.instructor,
				clonedFromId: response.data.clonedCourse.clonedFromId,
				clonedFromTitle: response.data.clonedCourse.clonedFromTitle,
				courseManagement: response.data.clonedCourse.courseManagement,
				isActive: response.data.clonedCourse.isActive,
				createdAt: response.data.clonedCourse.createdAt,
				updatedAt: response.data.clonedCourse.updatedAt,
				createdBy: response.data.clonedCourse.createdBy,
				updatedBy: response.data.clonedCourse.updatedBy,
				createdByName: response.data.clonedCourse.createdByName,
				updatedByName: response.data.clonedCourse.updatedByName,
				createdByImageUrl: response.data.clonedCourse.createdByImageUrl,
				updatedByImageUrl: response.data.clonedCourse.updatedByImageUrl,
				createdByRole: response.data.clonedCourse.createdByRole,
				updatedByRole: response.data.clonedCourse.updatedByRole,
			} as unknown as SingleCourse);

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
				backgroundColor: hasAdminAccess ? theme.bgColor?.adminPaper : theme.bgColor?.instructorPaper,
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
						flex: { sm: 1, md: 1, lg: 2 },
						padding: isSticky ? (isMobileSize ? '0.25rem 0.25rem' : '0.5rem 1rem') : '0.5rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={
								<KeyboardBackspaceOutlined sx={{ fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined }} fontSize='small' />
							}
							sx={{
								'color': theme.textColor?.common.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
								'fontSize': isSticky ? { xs: '0.65rem', sm: '0.85rem' } : undefined,
							}}
							onClick={() => {
								if (hasAdminAccess) {
									navigate(`/admin/courses`);
								} else {
									navigate(`/instructor/courses`);
								}
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isSticky ? 'Courses' : 'Back to courses'}
						</Button>
					</Box>
					{!isMobileSize && (
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								paddingLeft: isSticky ? '0' : '0.5rem',
								gap: 1,
							}}>
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

							{/* Analytics icon next to status info */}
							{!singleCourseBeforeSave?.courseManagement?.isExternal && (
								<Tooltip title='Course Analytics' placement='top' arrow>
									<IconButton
										size='small'
										sx={{ color: theme.textColor?.common.main }}
										onClick={() => {
											if (!courseId) return;
											const basePath = hasAdminAccess ? '/admin' : '/instructor';
											navigate(`${basePath}/course-analytics/course/${courseId}`);
										}}>
										<Insights fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					)}
					{isMobileSize && (
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								paddingLeft: '0.25rem',
							}}>
							{!singleCourseBeforeSave?.courseManagement?.isExternal && (
								<Tooltip title='Course Analytics' placement='top' arrow>
									<IconButton
										size='small'
										sx={{ color: theme.textColor?.common.main }}
										onClick={() => {
											if (!courseId) return;
											const basePath = hasAdminAccess ? '/admin' : '/instructor';
											navigate(`${basePath}/course-analytics/course/${courseId}`);
										}}>
										<Insights fontSize='small' />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					)}
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: { sm: 4, md: 2, lg: 3 },
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
										fontSize: isSticky
											? singleCourseBeforeSave?.title && singleCourseBeforeSave?.title?.length > 40
												? { xs: '0.65rem', sm: '0.75rem' }
												: { xs: '0.7rem', sm: '0.8rem' }
											: singleCourseBeforeSave?.title && singleCourseBeforeSave?.title?.length > 40
												? '0.9rem'
												: '1rem',
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
									<Alert
										severity='error'
										variant='filled'
										sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
										Add at least one published lesson to publish the course
									</Alert>
								</Snackbar>

								<Snackbar
									open={isCourseCloned}
									autoHideDuration={2250}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '5rem' }}
									onClose={() => setIsCourseCloned(false)}>
									<Alert
										severity='success'
										variant='filled'
										sx={{
											width: isMobileSize ? '60%' : '100%',
											color: theme.textColor?.common.main,
											fontSize: isMobileSize ? '0.75rem' : undefined,
										}}>
										Course is cloned successfully!
									</Alert>
								</Snackbar>

								<Snackbar
									open={isMissingFieldMsgOpen}
									autoHideDuration={3000}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '5rem' }}
									onClose={() => setIsMissingFieldMsgOpen(false)}>
									<Alert
										severity='error'
										variant='filled'
										sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
									<Box sx={{ ml: isSticky ? '0.25rem' : '0.5rem' }}>
										{hasAdminAccess && (
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
													<Edit
														sx={{
															color: 'white',
															fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined,
															ml: isSticky ? '-0.25rem' : '0rem',
														}}
														fontSize='small'
													/>
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
												sx={{ padding: isSticky ? '0 0rem' : '0 0.25rem', ml: isSticky ? '-0.25rem' : '-0.5rem' }}
												onClick={() => {
													setIsCourseInfoDialogOpen(true);
												}}>
												<Info sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
											</IconButton>
										</Tooltip>
										<Tooltip title='Check-out Feedback' placement='top' arrow>
											<IconButton
												sx={{ padding: isSticky ? '0 0rem' : '0 0.25rem', ml: isSticky ? '0.5rem' : '0.25rem' }}
												onClick={() => {
													navigate(`/admin/feedbacks?courseId=${courseId}`);
												}}>
												<RateReview sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								)}
							</Box>

							<CloneCourseDialog
								isCloneCourseDialogOpen={isCloneCourseDialogOpen}
								setIsCloneCourseDialogOpen={setIsCloneCourseDialogOpen}
								isCloning={isCloning}
								cloneCourse={cloneCourse}
							/>
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
