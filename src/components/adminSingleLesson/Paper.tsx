import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { Edit, KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../interfaces/lessons';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';

interface LessonPaperProps {
	userId?: string;
	singleLesson: Lesson;
	isActive: boolean;
	singleLessonBeforeSave: Lesson;
	isEditMode: boolean;
	isMissingFieldMsgOpen: boolean;
	resetChanges: boolean;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	setResetChanges: React.Dispatch<React.SetStateAction<boolean>>;
	handleLessonUpdate: (event: React.FormEvent<Element>) => void;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
	resetImageUpload: () => void;
	resetVideoUpload: () => void;
	resetEnterImageVideoUrl: () => void;
}

const LessonPaper = ({
	userId,
	singleLesson,
	isActive,
	singleLessonBeforeSave,
	isEditMode,
	isMissingFieldMsgOpen,
	resetChanges,
	setSingleLessonBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	setIsMissingField,
	handlePublishing,
	setResetChanges,
	handleLessonUpdate,
	setIsLessonUpdated,
	setIsQuestionUpdated,
	resetImageUpload,
	resetVideoUpload,
	resetEnterImageVideoUrl,
}: LessonPaperProps) => {
	const navigate = useNavigate();
	const vertical = 'top';
	const horizontal = 'center';
	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '6rem',
				mt: '2.25rem',
				backgroundColor: theme.palette.primary.main,
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
						flexDirection: 'column',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						flex: 2,
						padding: '0.5rem',
					}}>
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
								navigate(`/admin/lessons/user/${userId}`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to lessons
						</Button>
					</Box>
					<Box sx={{ width: '100%' }}>
						<Typography
							variant='h6'
							sx={{
								textTransform: 'capitalize',
								color: theme.textColor?.common.main,
								padding: '0.5rem',
							}}>
							{singleLessonBeforeSave?.type}
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
								<Typography variant='h4' sx={{ color: theme.textColor?.common.main }}>
									{singleLessonBeforeSave?.title}
								</Typography>
							</Box>
							<Box>
								<Typography variant='body2' sx={{ color: theme.textColor?.common.main, ml: '0.5rem' }}>
									{isActive ? '(Published)' : '(Unpublished)'}
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
												if (singleLessonBeforeSave?.title.trim() !== '' && singleLessonBeforeSave?.title !== '') {
													setIsEditMode(false);
													handleLessonUpdate(e as FormEvent<Element>);
													resetImageUpload();
													resetVideoUpload();
													resetEnterImageVideoUrl();
												} else {
													setIsMissingField(true);
													setIsMissingFieldMsgOpen(true);
												}
												window.scrollTo({ top: 0, behavior: 'smooth' });
											}}>
											Save
										</CustomSubmitButton>
										<CustomCancelButton
											onClick={() => {
												setIsEditMode(false);
												setIsLessonUpdated(false);
												setResetChanges(!resetChanges);
												setSingleLessonBeforeSave(singleLesson);
												setIsQuestionUpdated((prevData: QuestionUpdateTrack[]) => {
													prevData = prevData?.map((data) => {
														return { ...data, isUpdated: false };
													});
													return prevData;
												});
												resetImageUpload();
												resetVideoUpload();
												resetEnterImageVideoUrl();
											}}
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
											{isActive ? 'Unpublish' : 'Publish'}
										</CustomSubmitButton>
										<Tooltip title='Edit Lesson' placement='top'>
											<IconButton
												sx={{ padding: '0 0.75rem' }}
												onClick={() => {
													setIsEditMode(true);
													resetImageUpload();
													resetVideoUpload();
													resetEnterImageVideoUrl();
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

export default LessonPaper;
