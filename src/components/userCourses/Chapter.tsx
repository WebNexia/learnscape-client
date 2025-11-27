import { Box, Typography, IconButton, Collapse, Chip, Tooltip, DialogContent, Checkbox, FormControlLabel } from '@mui/material';
import { ExpandMore, PlayCircleOutline, Checklist } from '@mui/icons-material';
import Lesson from './Lesson';
import { LessonById } from '../../interfaces/lessons';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { useContext, useState, useMemo, forwardRef, useImperativeHandle, useCallback, useEffect, useRef } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useUserLessonsForCourse } from '../../hooks/useUserLessonsForCourse';
import { useParams } from 'react-router-dom';
import theme from '../../themes';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { UserCourseLessonDataContext } from '../../contexts/UserCourseLessonDataContextProvider';
import axios from '@utils/axiosInstance';
import { useQueryClient } from 'react-query';
import { SingleCourse } from '../../interfaces/course';

interface ChapterProps {
	chapter: ChapterLessonData | { _id: string; title: string; lessons: any[]; lessonIds: string[]; evaluationChecklistItems?: string[] };
	course: SingleCourse;
	isEnrolledStatus: boolean;
	nextChapterFirstLessonId: string;
}

export interface ChapterRef {
	toggleExpanded: () => void;
	setExpanded: (expanded: boolean) => void;
}

const Chapter = forwardRef<ChapterRef, ChapterProps>(({ chapter, course, isEnrolledStatus, nextChapterFirstLessonId }, ref) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;
	const [isExpanded, setIsExpanded] = useState<boolean>(false); // Default to expanded
	const [checklistDialogOpen, setChecklistDialogOpen] = useState<boolean>(false);
	const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
	const [isSubmittingChecklist, setIsSubmittingChecklist] = useState<boolean>(false);

	// Get courseId and userCourseId from URL params
	const { courseId, userCourseId } = useParams();

	// Get userCoursesData from context to check if checklist is completed
	const { userCoursesData } = useContext(UserCourseLessonDataContext);

	// React Query client for cache invalidation
	const queryClient = useQueryClient();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	// Get chapterId - standardize to use _id (backend format)
	// ChapterLessonData has chapterId which maps to _id, BaseChapter has _id directly
	const chapterId = (chapter as any)._id || (chapter as ChapterLessonData).chapterId;

	// Fetch user lessons for current course using the new hook
	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');
	const parsedUserLessonData = userLessonsData || [];

	// Calculate progress for this chapter
	const progressData = useMemo(() => {
		if (!isEnrolledStatus || !chapter?.lessons) {
			return { completed: 0, total: 0, percentage: 0 };
		}

		const validLessons = chapter.lessons.filter((lesson) => lesson !== null);
		const completedLessons = validLessons.filter((lesson) => {
			return parsedUserLessonData.some((data) => data.lessonId === lesson._id && data.isCompleted);
		});

		const total = validLessons.length;
		const completed = completedLessons.length;
		const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

		return { completed, total, percentage };
	}, [chapter?.lessons, isEnrolledStatus, parsedUserLessonData]);

	// Check if chapter is completed (all lessons completed)
	const isChapterCompleted = useMemo(() => {
		if (!isEnrolledStatus || !chapter?.lessons) return false;
		const validLessons = chapter.lessons.filter((lesson) => lesson !== null);
		return validLessons.length > 0 && progressData.completed === progressData.total;
	}, [isEnrolledStatus, chapter?.lessons, progressData]);

	// Check if checklist is already completed
	const isChecklistCompleted = useMemo(() => {
		if (!userCourseId || !userCoursesData || !chapterId) return false;
		const userCourse = userCoursesData.find((data) => data.userCourseId === userCourseId);
		return userCourse?.completedChapterChecklistIds?.includes(chapterId) || false;
	}, [userCourseId, userCoursesData, chapterId]);

	// Check if chapter has checklist items
	const hasChecklistItems = useMemo(() => {
		return chapter?.evaluationChecklistItems && chapter.evaluationChecklistItems.length > 0;
	}, [chapter?.evaluationChecklistItems]);

	// Check if all items are checked
	const allItemsChecked = useMemo(() => {
		if (!hasChecklistItems) return false;
		return checkedItems.size === chapter.evaluationChecklistItems?.length;
	}, [checkedItems, hasChecklistItems, chapter.evaluationChecklistItems]);

	// Track if we've already auto-opened for this chapter completion
	// Use sessionStorage to persist across page visits within the same session
	const autoOpenKey = useMemo(() => `checklist-auto-opened-${chapterId}`, [chapterId]);
	const hasAutoOpened = useRef<boolean>(sessionStorage.getItem(autoOpenKey) === 'true');

	// Auto-open checklist dialog when chapter is completed (only once per session, and only if coming from lesson completion)
	useEffect(() => {
		// Check if user came from a lesson page (indicates they just completed a lesson)
		const fromLessonPage = document.referrer.includes('/lesson/') || sessionStorage.getItem(`lesson-completed-${chapterId}`) === 'true';

		// Only auto-open if:
		// 1. Chapter is completed
		// 2. Has checklist items
		// 3. Checklist is NOT completed
		// 4. User is enrolled
		// 5. We haven't auto-opened yet for this chapter
		// 6. User came from a lesson page (just completed a lesson)
		if (isChapterCompleted && hasChecklistItems && !isChecklistCompleted && isEnrolledStatus && !hasAutoOpened.current && fromLessonPage) {
			// Small delay to ensure UI is ready
			const timer = setTimeout(() => {
				setChecklistDialogOpen(true);
				// Initialize empty checked items
				setCheckedItems(new Set());
				// Mark as auto-opened in both ref and sessionStorage
				hasAutoOpened.current = true;
				sessionStorage.setItem(autoOpenKey, 'true');
				// Clear the lesson completion flag
				sessionStorage.removeItem(`lesson-completed-${chapterId}`);
			}, 500);

			return () => clearTimeout(timer);
		}

		// Clear the auto-opened flag if checklist is completed (allows manual opening via View Objectives button)
		if (isChecklistCompleted) {
			sessionStorage.removeItem(autoOpenKey);
			hasAutoOpened.current = false;
		}
	}, [isChapterCompleted, hasChecklistItems, isChecklistCompleted, isEnrolledStatus, chapterId, autoOpenKey]);

	const handleToggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	const handleOpenChecklistDialog = (e: React.MouseEvent) => {
		e.stopPropagation();
		setChecklistDialogOpen(true);
		// If checklist is already completed, check all items
		if (isChecklistCompleted && chapter.evaluationChecklistItems) {
			const allIndices = new Set(chapter.evaluationChecklistItems.map((_, index) => index));
			setCheckedItems(allIndices);
		} else if (checkedItems.size === 0 && chapter.evaluationChecklistItems) {
			// Initialize empty set if not already set
			setCheckedItems(new Set());
		}
	};

	const handleCloseChecklistDialog = () => {
		if (isChecklistCompleted || !isEnrolledStatus || !isChapterCompleted) {
			setChecklistDialogOpen(false);
			setCheckedItems(new Set());
		}
	};

	const handleCheckboxChange = (index: number) => {
		if (!isChapterCompleted || isChecklistCompleted) return; // Disable if chapter not completed or already completed

		const newChecked = new Set(checkedItems);
		if (newChecked.has(index)) {
			newChecked.delete(index);
		} else {
			newChecked.add(index);
		}
		setCheckedItems(newChecked);
	};

	// Function to mark checklist as completed
	const handleSubmitChecklist = useCallback(async () => {
		if (!userCourseId || !chapterId || !isChapterCompleted || isChecklistCompleted || !allItemsChecked || isSubmittingChecklist) {
			return;
		}

		setIsSubmittingChecklist(true);
		try {
			// Call API to add chapterId to completedChapterChecklistIds
			await axios.patch(`${base_url}/usercourses/${userCourseId}`, {
				completedChapterChecklistIds: chapterId,
			});

			// Invalidate React Query cache to refresh user course data
			// The query key in UserAuthContextProvider is ['userCourseData', userId]
			await queryClient.invalidateQueries({ queryKey: ['userCourseData'] });

			// Also refetch to ensure data is updated
			await queryClient.refetchQueries({ queryKey: ['userCourseData'] });

			// Close dialog
			setChecklistDialogOpen(false);
			setCheckedItems(new Set());
		} catch (error) {
			console.error('Error submitting checklist:', error);
			// TODO: Show error message to user
		} finally {
			setIsSubmittingChecklist(false);
		}
	}, [userCourseId, chapterId, isChapterCompleted, isChecklistCompleted, allItemsChecked, isSubmittingChecklist, base_url, queryClient]);

	// Expose functions to parent component
	useImperativeHandle(ref, () => ({
		toggleExpanded: handleToggleExpanded,
		setExpanded: (expanded: boolean) => {
			setIsExpanded(expanded);
		},
	}));

	const validLessons = chapter?.lessons?.filter((lesson) => lesson !== null) || [];

	return (
		<Box
			sx={{
				'marginBottom': isMobileSize ? '1rem' : '1.5rem',
				'backgroundColor': '#ffffff',
				'border': '1px solid #e2e8f0',
				'borderRadius': '0.35rem',
				'overflow': 'hidden',
				'boxShadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
				'transition': 'box-shadow 0.3s ease',
				'&:hover': {
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
					borderColor: '#cbd5e1',
				},
			}}>
			{/* Chapter Header - Always Visible */}
			<Box
				sx={{
					'backgroundColor': theme.bgColor?.primary,
					'padding': isMobileSize ? '0.5rem' : '0.75rem 1rem 0.75rem 0.25rem',
					'cursor': 'pointer',
					'display': 'flex',
					'alignItems': 'center',
					'justifyContent': 'space-between',
					'transition': 'background-color 0.2s ease',
					'&:hover': {
						backgroundColor: theme.bgColor?.primary,
					},
				}}
				onClick={handleToggleExpanded}
				role='button'
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleToggleExpanded();
					}
				}}
				aria-expanded={isExpanded}
				aria-label={`${isExpanded ? 'Collapse' : 'Expand'} chapter: ${chapter.title}`}>
				<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
					<IconButton
						sx={{
							'color': 'white',
							'marginRight': isMobileSize ? '0.5rem' : '1rem',
							'padding': '0.25rem',
							'transform': isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
							'transition': 'transform 0.3s ease',
							':hover': {
								border: 'solid 0.5px white',
							},
						}}
						aria-hidden='true'>
						<ExpandMore fontSize='small' />
					</IconButton>
					<Typography
						variant='h4'
						sx={{
							fontSize: isMobileSize ? '0.8rem' : '0.95rem',
							color: 'white',
							flex: 1,
							textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
						}}>
						{chapter.title}
					</Typography>
				</Box>

				{/* Progress Indicators */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					{isEnrolledStatus && progressData.total > 0 && (
						<>
							<Chip
								icon={<PlayCircleOutline />}
								label={`${progressData.completed}/${progressData.total}`}
								size='small'
								sx={{
									'backgroundColor': 'rgba(255, 255, 255, 0.25)',
									'color': 'white',
									'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
									'fontWeight': 600,
									'height': isMobileSize ? '1.5rem' : '1.8rem',
									'textShadow': '0 1px 2px rgba(0, 0, 0, 0.3)',
									'& .MuiChip-icon': {
										color: 'white',
										fontSize: isMobileSize ? '0.8rem' : '1rem',
									},
								}}
							/>
							<Box
								sx={{
									width: isMobileSize ? '40px' : '50px',
									height: isMobileSize ? '6px' : '8px',
									backgroundColor: 'rgba(255, 255, 255, 0.3)',
									borderRadius: '4px',
									overflow: 'hidden',
								}}>
								<Box
									sx={{
										width: `${progressData.percentage}%`,
										height: '100%',
										backgroundColor: progressData.percentage === 100 ? '#4caf50' : '#ff9800',
										transition: 'width 0.3s ease',
									}}
								/>
							</Box>
						</>
					)}

					<Tooltip
						title={chapter?.evaluationChecklistItems?.length && chapter?.evaluationChecklistItems?.length > 0 ? 'View Objectives' : ''}
						placement='top'
						arrow>
						<IconButton
							sx={{
								'color': 'white',
								'padding': '0.25rem',
								'marginLeft': isEnrolledStatus && progressData.total > 0 ? '0.5rem' : '0',
								'&:hover': {
									border: 'solid 0.5px white',
								},
							}}
							onClick={handleOpenChecklistDialog}>
							<Checklist fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Collapsible Content */}
			<Collapse in={isExpanded} timeout='auto' unmountOnExit>
				<Box sx={{ boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)' }}>
					{validLessons.map((lesson: LessonById, index) => {
						let nextLessonId: string = '';
						if (index !== validLessons.length - 1) {
							nextLessonId = validLessons[index + 1]._id;
						}
						let lessonOrder: number = index + 1;
						// Check if this is the last lesson of the current chapter (will navigate to next chapter)
						const isLastLessonOfChapter = !nextLessonId && !!nextChapterFirstLessonId && validLessons.length > 1;

						// Get current chapter's checklist info - needed to block next chapter if checklist not completed
						// This applies when this is the last lesson and user tries to navigate to next chapter
						return (
							<Lesson
								key={lesson._id}
								lesson={lesson}
								course={course}
								isEnrolledStatus={isEnrolledStatus}
								nextLessonId={nextLessonId}
								nextChapterFirstLessonId={nextChapterFirstLessonId}
								lessonOrder={lessonOrder}
								isLastLessonOfChapter={isLastLessonOfChapter}
								currentChapterHasChecklist={hasChecklistItems}
								currentChapterChecklistCompleted={isChecklistCompleted}
							/>
						);
					})}
				</Box>
			</Collapse>

			{/* Checklist Dialog */}
			{hasChecklistItems && (
				<CustomDialog
					openModal={checklistDialogOpen}
					closeModal={handleCloseChecklistDialog}
					title={isEnrolledStatus ? 'Chapter Objectives Checkout' : 'Chapter Objectives'}
					maxWidth='sm'>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							{isEnrolledStatus && !isChapterCompleted && (
								<Box
									sx={{
										padding: '1rem',
										backgroundColor: theme.palette.warning.light + '20',
										borderRadius: '0.5rem',
										border: `1px solid ${theme.palette.warning.light}`,
									}}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: theme.palette.warning.dark }}>
										Complete all lessons in this chapter to enable the checklist.
									</Typography>
								</Box>
							)}
							{isEnrolledStatus && isChecklistCompleted && (
								<Box
									sx={{
										padding: '1rem',
										backgroundColor: theme.palette.success.light + '20',
										borderRadius: '0.5rem',
										border: `1px solid ${theme.palette.success.light}`,
									}}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: theme.palette.success.dark }}>
										You have completed this checklist.
									</Typography>
								</Box>
							)}
							{chapter.evaluationChecklistItems?.map((item, index) => (
								<FormControlLabel
									key={index}
									control={
										<Checkbox
											checked={isChecklistCompleted ? true : checkedItems.has(index)}
											onChange={() => handleCheckboxChange(index)}
											disabled={!isEnrolledStatus || !isChapterCompleted || isChecklistCompleted}
											sx={{
												'color': theme.palette.primary.main,
												'& .MuiSvgIcon-root': {
													fontSize: '1.25rem',
												},
												'&.Mui-disabled': {
													color: isChecklistCompleted ? theme.palette.success.main : theme.palette.action.disabled,
												},
											}}
										/>
									}
									label={
										<Typography
											variant='body2'
											sx={{
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												lineHeight: 1.7,
												wordBreak: 'break-word',
											}}>
											{item}
										</Typography>
									}
									sx={{
										'alignItems': 'center',
										'margin': 0,
										'& .MuiFormControlLabel-label': {
											marginLeft: '0.5rem',
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
										},
									}}
								/>
							))}
						</Box>
					</DialogContent>
					{isEnrolledStatus && (
						<CustomDialogActions
							onSubmit={isEnrolledStatus && isChapterCompleted && !isChecklistCompleted && allItemsChecked ? handleSubmitChecklist : undefined}
							onCancel={handleCloseChecklistDialog}
							submitBtnText='Submit'
							disableBtn={!isEnrolledStatus || !isChapterCompleted || isChecklistCompleted || !allItemsChecked || isSubmittingChecklist}
							isSubmitting={isSubmittingChecklist}
							actionSx={{ mb: '0.5rem' }}
						/>
					)}
				</CustomDialog>
			)}
		</Box>
	);
});

Chapter.displayName = 'Chapter';

export default Chapter;
