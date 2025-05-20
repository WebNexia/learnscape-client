import { Alert, Avatar, Box, Button, DialogActions, DialogContent, Grid, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { Edit, Info, KeyboardBackspaceOutlined, PublishedWithChanges, Unpublished } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../interfaces/lessons';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent, useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { LessonType } from '../../interfaces/enums';
import { dateTimeFormatter } from '@utils/dateFormatter';
import CustomDialog from '../layouts/dialog/CustomDialog';

interface LessonPaperProps {
	userId?: string;
	singleLesson: Lesson;
	isActive: boolean;
	singleLessonBeforeSave: Lesson;
	isEditMode: boolean;
	isMissingFieldMsgOpen: boolean;
	resetChanges: boolean;
	editorContent: string;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingFieldMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;
	handlePublishing: () => void;
	setResetChanges: React.Dispatch<React.SetStateAction<boolean>>;
	handleLessonUpdate: (event: React.FormEvent<Element>) => void;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
	resetImageUpload: () => void;
	resetVideoUpload: () => void;
	resetEnterImageVideoUrl: () => void;
	setTitleError: React.Dispatch<React.SetStateAction<boolean>>;
	setInstructionError: React.Dispatch<React.SetStateAction<boolean>>;
	setQuestionError: React.Dispatch<React.SetStateAction<boolean>>;
}

const LessonPaper = ({
	userId,
	singleLesson,
	isActive,
	singleLessonBeforeSave,
	isEditMode,
	isMissingFieldMsgOpen,
	resetChanges,
	editorContent,
	setSingleLessonBeforeSave,
	setIsEditMode,
	setIsMissingFieldMsgOpen,
	handlePublishing,
	setResetChanges,
	handleLessonUpdate,
	setIsLessonUpdated,
	setIsQuestionUpdated,
	resetImageUpload,
	resetVideoUpload,
	resetEnterImageVideoUrl,
	setTitleError,
	setInstructionError,
	setQuestionError,
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
								navigate(`/admin/lessons/user/${userId}`);
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
										Enter title / instructions / questions !!!
									</Alert>
								</Snackbar>
								{isEditMode ? (
									<Box>
										<CustomSubmitButton
											sx={{ padding: '0 0.75rem', backgroundColor: theme.bgColor?.greenPrimary }}
											onClick={(e) => {
												if (singleLessonBeforeSave.type === LessonType.INSTRUCTIONAL_LESSON) {
													if (singleLessonBeforeSave?.title.trim() !== '' && singleLessonBeforeSave?.title !== '' && editorContent?.trim() !== '') {
														setIsEditMode(false);
														handleLessonUpdate(e as FormEvent<Element>);
														resetImageUpload();
														resetVideoUpload();
														resetEnterImageVideoUrl();
													} else {
														setIsMissingFieldMsgOpen(true);
														if (!singleLessonBeforeSave?.title.trim()) {
															setTitleError(true);
														} else {
															setTitleError(false);
														}
														if (!editorContent?.trim()) {
															setInstructionError(true);
														} else {
															setInstructionError(false);
														}
													}
												} else {
													if (
														singleLessonBeforeSave?.title.trim() !== '' &&
														singleLessonBeforeSave?.title !== '' &&
														editorContent?.trim() !== '' &&
														singleLessonBeforeSave.questionIds.length > 0
													) {
														setIsEditMode(false);
														handleLessonUpdate(e as FormEvent<Element>);
														resetImageUpload();
														resetVideoUpload();
														resetEnterImageVideoUrl();
													} else {
														setIsMissingFieldMsgOpen(true);
														if (!singleLessonBeforeSave?.title.trim()) {
															setTitleError(true);
														} else {
															setTitleError(false);
														}
														if (!editorContent?.trim()) {
															setInstructionError(true);
														} else {
															setInstructionError(false);
														}
														if (singleLessonBeforeSave.questionIds.length === 0) {
															setQuestionError(true);
														} else {
															setQuestionError(false);
														}
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
												setInstructionError(false);
												setQuestionError(false);
												setTitleError(false);
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
											<DialogContent>
												<Box display='flex' flexDirection='column' gap={1} sx={{ mt: '0.75rem' }}>
													<Grid container spacing={2.25}>
														<Grid item xs={3}>
															<Typography variant='body2' fontWeight='bold'>
																Created By:
															</Typography>
														</Grid>
														<Grid item xs={9} display='flex' alignItems='center'>
															<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={singleLesson?.createdByImageUrl} />
															<Typography variant='body2'>
																{singleLesson?.createdByName} ({singleLesson?.createdByRole}) on {dateTimeFormatter(singleLesson?.createdAt)}
															</Typography>
														</Grid>

														<Grid item xs={3}>
															<Typography variant='body2' fontWeight='bold'>
																Last Updated By:
															</Typography>
														</Grid>
														<Grid item xs={9} display='flex' alignItems='center'>
															<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={singleLesson?.updatedByImageUrl} />
															<Typography variant='body2'>
																{singleLesson?.updatedByName} ({singleLesson?.updatedByRole}) on {dateTimeFormatter(singleLesson?.updatedAt)}
															</Typography>
														</Grid>

														<Grid item xs={3}>
															<Typography variant='body2' fontWeight='bold'>
																Cloned From:
															</Typography>
														</Grid>

														{singleLesson?.clonedFromTitle ? (
															<Grid item xs={9}>
																<Typography
																	variant='body2'
																	onClick={() => {
																		setIsLessonInfoDialogOpen(false);
																		navigate(`/admin/lesson-edit/user/${userId}/lesson/${singleLesson?.clonedFromId}`);
																	}}
																	sx={{
																		'cursor': 'pointer',
																		':hover': {
																			textDecoration: 'underline',
																		},
																	}}>
																	📄 {singleLesson?.clonedFromTitle}
																</Typography>
															</Grid>
														) : (
															<Grid item xs={9}>
																<Typography
																	variant='body2'
																	sx={{
																		'cursor': 'pointer',
																		':hover': {
																			textDecoration: 'underline',
																		},
																	}}>
																	{' N/A '}
																</Typography>
															</Grid>
														)}

														<Grid item xs={3}>
															<Typography variant='body2' fontWeight='bold'>
																Published At:
															</Typography>
														</Grid>

														{singleLesson?.publishedAt ? (
															<Grid item xs={9}>
																<Typography variant='body2'>🗓️ {dateTimeFormatter(singleLesson.publishedAt)}</Typography>
															</Grid>
														) : (
															<Grid item xs={9}>
																<Typography variant='body2'>{'N/A'}</Typography>
															</Grid>
														)}
													</Grid>
												</Box>
											</DialogContent>

											<DialogActions>
												<CustomCancelButton
													onClick={() => setIsLessonInfoDialogOpen(false)}
													sx={{
														margin: '0 0.5rem 0.5rem 0',
													}}>
													Cancel
												</CustomCancelButton>
											</DialogActions>
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
