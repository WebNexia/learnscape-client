import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { Edit, KeyboardBackspaceOutlined, PublishedWithChanges, Unpublished } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import useImageUpload from '../../hooks/useImageUpload';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent, useContext } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';

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

	const { resetImageUpload } = useImageUpload();
	const { user } = useContext(UserAuthContext);

	const handleCancel = async (): Promise<void> => {
		setIsEditMode(false);
		setChapterLessonDataBeforeSave(chapterLessonData);
		setResetChanges(!resetChanges);
		setDeletedChapterIds([]);
		resetImageUpload();
	};

	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '6rem',
				marginTop: '2.25rem',
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
								color: theme.textColor?.common.main,
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
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
									autoHideDuration={2000}
									anchorOrigin={{ vertical, horizontal }}
									sx={{ mt: '14rem' }}
									onClose={() => setIsNoChapterMsgOpen(false)}>
									<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
										Add chapter(s) to publish
									</Alert>
								</Snackbar>

								<Snackbar
									open={isMissingFieldMsgOpen}
									autoHideDuration={3000}
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
											sx={{ padding: '0 0.75rem' }}
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
										<Tooltip title='Edit Course' placement='top'>
											<IconButton
												sx={{ padding: '0 0.75rem' }}
												onClick={() => {
													setIsEditMode(true);
												}}>
												<Edit sx={{ color: 'white' }} fontSize='small' />
											</IconButton>
										</Tooltip>
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePaper;
