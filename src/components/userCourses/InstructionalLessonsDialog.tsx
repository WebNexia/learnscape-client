import { Box, Button, CircularProgress, DialogActions, DialogContent, Typography } from '@mui/material';
import { useContext, useMemo } from 'react';
import { decode } from 'html-entities';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';
import { Lesson } from '../../interfaces/lessons';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';
import { useWordAssist, wrapWordsForHover } from '../../hooks/useWordAssist';
import WordAssistPopper from './WordAssistPopper';

interface InstructionalLessonsDialogProps {
	open: boolean;
	onClose: () => void;
	lessons: Lesson[];
	selectedLessonId: string;
	onSelectLesson: (lessonId: string) => void;
	enableWordAssist?: boolean;
	/** When true, full lesson body is still loading (e.g. course shell omits text/video). */
	isSelectedLessonBodyLoading?: boolean;
}

const InstructionalLessonsDialog = ({
	open,
	onClose,
	lessons,
	selectedLessonId,
	onSelectLesson,
	enableWordAssist = false,
	isSelectedLessonBodyLoading = false,
}: InstructionalLessonsDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const lessonTextColor = theme.textColor?.secondary.main || '#4D7B8B';
	const lessonTextFontFamily = theme.fontFamily?.main || 'Poppins';
	const { anchorEl, activeWord, wordInfo, isLoadingWordInfo, handleWordHover, handleWordTouchStart, handleWordTouchEnd, handleMouseLeave } = useWordAssist({
		enabled: enableWordAssist,
		hoverDelayMs: 1000,
	});

	const selectedLesson = useMemo(
		() => lessons.find((instructionalLesson) => instructionalLesson._id === selectedLessonId),
		[lessons, selectedLessonId]
	);

	return (
		<CustomDialog openModal={open} closeModal={onClose} maxWidth='lg' title='Lectures in This Chapter'>
			<DialogContent
				sx={{
					overflow: 'hidden',
					height: isMobileSize ? '80vh' : '70vh',
					maxHeight: isMobileSize ? '80vh' : '70vh',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isMobileSize ? 'column' : 'row',
						gap: '1rem',
						height: '100%',
						minHeight: 0,
					}}>
					<Box
						sx={{
							width: isMobileSize ? '100%' : '30%',
							flexShrink: 0,
							display: 'flex',
							flexDirection: 'column',
							gap: '0.5rem',
							maxHeight: isMobileSize ? 'unset' : '100%',
							overflowY: 'hidden',
							pr: isMobileSize ? 0 : '0.5rem',
						}}>
						{lessons.map((instructionalLesson) => {
							const isSelected = instructionalLesson._id === selectedLessonId;
							return (
								<Button
									key={instructionalLesson._id}
									variant={isSelected ? 'contained' : 'outlined'}
									color='primary'
									onClick={() => onSelectLesson(instructionalLesson._id)}
									sx={{
										justifyContent: 'flex-start',
										textAlign: 'left',
										textTransform: 'none',
										fontSize: isMobileSize ? '0.75rem' : '0.85rem',
										px: '0.75rem',
										fontFamily: 'Poppins',
									}}>
									{instructionalLesson.title}
								</Button>
							);
						})}
					</Box>

					<Box
						sx={{
							width: isMobileSize ? '100%' : '70%',
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							gap: '1rem',
							minHeight: 0,
						}}>
						{selectedLesson ? (
							<>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.95rem' : '1.15rem', textAlign: 'center' }}>
									{selectedLesson.title}
								</Typography>
								<Box
									sx={{
										flex: 1,
										minHeight: 0,
										overflowY: 'auto',
										pr: isMobileSize ? 0 : '0.25rem',
									}}>
									{isSelectedLessonBodyLoading ? (
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
												minHeight: isMobileSize ? '12rem' : '16rem',
												width: '100%',
											}}>
											<CircularProgress size={isMobileSize ? 28 : 36} />
										</Box>
									) : (
										<>
											{selectedLesson.videoUrl && (
										<Box sx={{ width: '100%', height: isMobileSize ? '14rem' : '20rem', mb: '1rem', mt: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
											<UniversalVideoPlayer
												url={selectedLesson.videoUrl}
												width='90%'
												height='100%'
												style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.2)' }}
												controls
											/>
										</Box>
									)}

									{selectedLesson.text && (
										<Box
											sx={{
												boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.15)',
												padding: isMobileSize ? '0.75rem' : '1.25rem',
												backgroundColor: theme.bgColor?.common,
												borderRadius: '0.35rem',
												width: '90%',
												display: 'flex',
												alignItems: 'center',
												margin: '1rem auto',
												'&, & *': {
													fontFamily: `${lessonTextFontFamily} !important`,
													color: `${lessonTextColor} !important`,
													lineHeight: '2.1 !important',
												},
											}}>
											<Typography
												component='div'
												onMouseOver={handleWordHover}
												onMouseLeave={handleMouseLeave}
												onTouchStart={handleWordTouchStart}
												onTouchEnd={handleWordTouchEnd}
												onTouchCancel={handleWordTouchEnd}
												dangerouslySetInnerHTML={{ __html: wrapWordsForHover(sanitizeHtml(decode(selectedLesson.text))) }}
												sx={{
													'lineHeight': 2.1,
													'fontSize': isMobileSize ? '0.75rem' : '0.9rem',
													'color': lessonTextColor,
													'& img': {
														maxWidth: '100%',
														height: 'auto',
														borderRadius: '0.35rem',
														margin: '0.75rem 0',
													},
													'& .pronounceable-word': {
														cursor: enableWordAssist ? 'pointer' : 'default',
														borderRadius: '0.2rem',
														padding: '0 0.1rem',
														transition: 'background-color 0.15s ease',
													},
													'& .pronounceable-word:hover': {
														backgroundColor: enableWordAssist ? 'rgba(1, 67, 90, 0.14)' : 'transparent',
													},
													fontFamily: lessonTextFontFamily,
												}}
											/>
										</Box>
									)}

									{!selectedLesson.videoUrl && !selectedLesson.text && (
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											No video or text content available for this lesson yet.
										</Typography>
									)}
										</>
									)}
								</Box>
							</>
						) : (
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Select an instructional lesson to view its content.
							</Typography>
						)}
					</Box>
				</Box>
				<WordAssistPopper
					open={Boolean(anchorEl) && enableWordAssist}
					anchorEl={anchorEl}
					activeWord={activeWord}
					wordInfo={wordInfo}
					isLoadingWordInfo={isLoadingWordInfo}
				/>
			</DialogContent>
			<DialogActions sx={{ px: '1.5rem', pb: '1rem' }}>
				<CustomCancelButton onClick={onClose}>Close</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default InstructionalLessonsDialog;
