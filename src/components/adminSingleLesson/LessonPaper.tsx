import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../themes';
import { Edit, Info, KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../interfaces/lessons';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { FormEvent, useContext, useState } from 'react';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomDialog from '../layouts/dialog/CustomDialog';
import LessonInfoModal from '../layouts/lessons/LessonInfoModal';
import { useStickyPaper } from '../../hooks/useStickyPaper';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';

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

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const { user } = useContext(UserAuthContext);
	const isInstructor = user?.role === Roles.INSTRUCTOR;

	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [isLessonInfoDialogOpen, setIsLessonInfoDialogOpen] = useState<boolean>(false);

	const { isSticky, paperRef } = useStickyPaper(isMobileSize);
	return (
		<Paper
			ref={paperRef}
			elevation={10}
			sx={{
				width: isSticky ? (isMobileSize ? '100%' : 'calc(100% - 10rem)') : '100%',
				height: isSticky ? '3rem' : '6rem',
				mt: isSticky ? 0 : '1.25rem',
				backgroundColor: isInstructor ? theme.bgColor?.instructorPaper : theme.bgColor?.adminPaper,
				position: isSticky ? 'fixed' : 'relative',
				top: isSticky ? (isMobileSize ? '3.5rem' : '4rem') : 'auto',
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
						justifyContent: isSticky ? 'space-between' : 'space-between',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: { md: 2, lg: 3 },
						padding: isSticky ? (isMobileSize ? '0.25rem 0rem' : '0.5rem 1rem') : '0.5rem',
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
								navigate(`${isInstructor ? '/instructor/lessons' : '/admin/lessons'}`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isSticky ? 'Lessons' : 'Back to lessons'}
						</Button>
					</Box>
					{!isMobileSize && (
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Box>
								<Typography
									variant='body1'
									sx={{
										textTransform: 'capitalize',
										color: theme.textColor?.common.main,
										padding: isSticky ? '0 0 0 0.5rem' : '0 0 0.5rem 0.5rem',
										fontSize: isSticky ? '0.75rem' : undefined,
									}}>
									{singleLessonBeforeSave?.type} {isActive ? '(Published)' : '(Unpublished)'}
								</Typography>
							</Box>
						</Box>
					)}
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
							justifyContent: isSticky ? 'space-between' : 'space-between',
							height: '100%',
							width: '100%',
							gap: isSticky ? 2 : 0,
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', flex: 3 }}>
							<Typography
								variant={singleLessonBeforeSave?.title.length > 50 ? 'body2' : 'h6'}
								sx={{
									color: theme.textColor?.common.main,
									mr: '0.5rem',
									fontSize: isSticky
										? singleLessonBeforeSave?.title.length > 50
											? isMobileSize
												? '0.5rem'
												: '0.65rem'
											: isMobileSize
												? '0.7rem'
												: '0.8rem'
										: undefined,
								}}>
								{singleLessonBeforeSave?.title}
							</Typography>
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: '100%',
								flex: isMobileSize ? 3.5 : 2,
								mr: isMobileSize ? '-0.75rem' : '0rem',
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
									<Box sx={{ width: '100%' }}>
										<CustomSubmitButton
											unsaved={hasUnsavedChanges}
											sx={{ backgroundColor: theme.bgColor?.greenPrimary, fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined }}
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
											sx={{
												color: theme.textColor?.common.main,
												borderColor: theme.textColor?.common.main,
												fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
											}}>
											Cancel
										</CustomCancelButton>
									</Box>
								) : (
									<Box sx={{ ml: isMobileSize ? '0rem' : '1rem' }}>
										<CustomSubmitButton
											sx={{
												visibility: isEditMode ? 'hidden' : 'visible',
												fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
											}}
											onClick={handlePublishing}>
											{isActive ? 'Unpublish' : 'Publish'}
										</CustomSubmitButton>
										<Tooltip title='Edit Lesson' placement='top' arrow>
											<IconButton
												sx={{ ml: isMobileSize ? '0rem' : '0.5rem' }}
												onClick={() => {
													setIsEditMode(true);
													resetImageUpload();
													resetVideoUpload();
													resetEnterImageVideoUrl();
												}}>
												<Edit sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
											</IconButton>
										</Tooltip>
										<Tooltip title='More Info' placement='top' arrow>
											<IconButton
												sx={{ ml: isMobileSize ? '-0.75rem' : '-0.25rem' }}
												onClick={() => {
													setIsLessonInfoDialogOpen(true);
												}}>
												<Info sx={{ color: 'white', fontSize: isSticky ? (isMobileSize ? '0.9rem' : '1rem') : undefined }} fontSize='small' />
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
