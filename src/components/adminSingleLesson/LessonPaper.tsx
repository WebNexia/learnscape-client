import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { Edit, Info, KeyboardBackspaceOutlined, PublishedWithChanges, Unpublished } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../interfaces/lessons';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent, useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomDialog from '../layouts/dialog/CustomDialog';
import LessonInfoModal from '../lessons/LessonInfoModal';

interface LessonPaperProps {
	singleLesson: Lesson;
	isActive: boolean;
	singleLessonBeforeSave: Lesson;
	isEditMode: boolean;
	isMissingFieldMsgOpen: boolean;
	editorContent: string;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	handleLessonUpdate: (event: React.FormEvent<Element>) => void;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
	resetImageUpload: () => void;
	resetVideoUpload: () => void;
	resetEnterImageVideoUrl: () => void;
	setTitleError: React.Dispatch<React.SetStateAction<boolean>>;
	setInstructionError: React.Dispatch<React.SetStateAction<boolean>>;
	setQuestionError: React.Dispatch<React.SetStateAction<boolean>>;
	hasUnsavedChanges: boolean;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
	setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
}

const LessonPaper = ({
	singleLesson,
	isActive,
	singleLessonBeforeSave,
	isEditMode,
	isMissingFieldMsgOpen,
	setSingleLessonBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	handlePublishing,
	handleLessonUpdate,
	setIsLessonUpdated,
	setIsQuestionUpdated,
	resetImageUpload,
	resetVideoUpload,
	resetEnterImageVideoUrl,
	setTitleError,
	setInstructionError,
	setQuestionError,
	hasUnsavedChanges,
	setHasUnsavedChanges,
	setErrorMessage,
}: LessonPaperProps) => {
	const navigate = useNavigate();
	const vertical = 'top';
	const horizontal = 'center';

	const [isLessonInfoDialogOpen, setIsLessonInfoDialogOpen] = useState<boolean>(false);
	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '6rem',
				mt: '1.25rem',
				backgroundColor: theme.bgColor?.adminPaper,
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
								'color': theme.textColor?.common.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								navigate(`/admin/lessons`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to lessons
						</Button>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box>
							<Typography
								variant='body1'
								sx={{
									textTransform: 'capitalize',
									color: theme.textColor?.common.main,
									padding: '0 0 0.5rem 0.5rem',
								}}>
								{singleLessonBeforeSave?.type}
							</Typography>
						</Box>
						<Box sx={{ paddingLeft: '0.5rem', color: theme.textColor?.common.main }}>
							{isActive ? (
								<Tooltip title='Published' placement='right'>
									<PublishedWithChanges fontSize='small' />
								</Tooltip>
							) : (
								<Tooltip title='Unpublished' placement='right'>
									<Unpublished fontSize='small' />
								</Tooltip>
							)}
						</Box>
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
								<Typography variant='h5' sx={{ color: theme.textColor?.common.main }}>
									{singleLessonBeforeSave?.title}
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
									sx={{ mt: '5rem' }}
									onClose={() => setIsMissingFieldMsgOpen(false)}>
									<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
										Enter title to save lesson
									</Alert>
								</Snackbar>
								{isEditMode ? (
									<Box>
										<CustomSubmitButton
											unsaved={hasUnsavedChanges}
											sx={{ padding: '0 0.75rem', backgroundColor: theme.bgColor?.greenPrimary }}
											onClick={(e) => {
												if (singleLessonBeforeSave?.title.trim() !== '' && singleLessonBeforeSave?.title !== '') {
													handleLessonUpdate(e as FormEvent<Element>);
													resetImageUpload();
													resetVideoUpload();
													resetEnterImageVideoUrl();
													setHasUnsavedChanges(false);
												} else {
													setIsMissingFieldMsgOpen(true);
													if (!singleLessonBeforeSave?.title.trim()) {
														setTitleError(true);
													} else {
														setTitleError(false);
													}
												}
												window.scrollTo({ top: 0, behavior: 'smooth' });
											}}>
											Save
										</CustomSubmitButton>
										<CustomCancelButton
											onClick={() => {
												setIsEditMode(false);
												setIsLessonUpdated(false);
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
												setInstructionError(false);
												setQuestionError(false);
												setTitleError(false);
												setHasUnsavedChanges(false);
												setErrorMessage('');
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
										<Tooltip title='More Info' placement='top'>
											<IconButton
												sx={{ padding: '0 0.75rem', ml: '-0.75rem' }}
												onClick={() => {
													setIsLessonInfoDialogOpen(true);
												}}>
												<Info sx={{ color: 'white' }} fontSize='small' />
											</IconButton>
										</Tooltip>
										<CustomDialog
											openModal={isLessonInfoDialogOpen}
											closeModal={() => setIsLessonInfoDialogOpen(false)}
											title={singleLesson?.title}
											maxWidth='sm'>
											<LessonInfoModal lesson={singleLesson} onClose={() => setIsLessonInfoDialogOpen(false)} />
										</CustomDialog>
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
