import { Box, Typography, IconButton, Collapse, Chip, Tooltip, DialogContent, Checkbox } from '@mui/material';
import { ExpandMore, PlayCircleOutline, Checklist } from '@mui/icons-material';
import Lesson from './Lesson';
import { LessonById } from '../../interfaces/lessons';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { ChecklistGroup } from '../../interfaces/chapter';
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
import CustomTextField from '../forms/customFields/CustomTextField';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';

interface ChapterProps {
	chapter:
		| ChapterLessonData
		| { _id: string; title: string; lessons: any[]; lessonIds: string[]; evaluationChecklistItems?: ChecklistGroup[]; askForFeedback?: boolean };
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
	// Track checked items by group index and item index: Map<groupIndex, Set<itemIndex>>
	const [checkedItems, setCheckedItems] = useState<Map<number, Set<number>>>(new Map());
	const [isSubmittingChecklist, setIsSubmittingChecklist] = useState<boolean>(false);
	// Track which groups are expanded in the checklist dialog
	const [expandedChecklistGroups, setExpandedChecklistGroups] = useState<Set<number>>(new Set());
	// Feedback state
	const [feedback, setFeedback] = useState<string>('');
	const { user } = useContext(UserAuthContext);
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

	// Check if all items are checked (across all groups)
	const allItemsChecked = useMemo(() => {
		if (!hasChecklistItems || !chapter?.evaluationChecklistItems || !Array.isArray(chapter.evaluationChecklistItems)) return false;

		// Count total items across all groups (skip malformed groups safely)
		const totalItems = chapter.evaluationChecklistItems.reduce((sum, group) => {
			if (!group || !Array.isArray(group.items)) return sum;
			return sum + group.items.length;
		}, 0);

		// Count checked items across all groups
		let checkedCount = 0;
		chapter.evaluationChecklistItems.forEach((group, groupIndex) => {
			if (!group || !Array.isArray(group.items)) return;
			const groupChecked = checkedItems.get(groupIndex);
			if (groupChecked) {
				checkedCount += groupChecked.size;
			}
		});

		return checkedCount === totalItems && totalItems > 0;
	}, [checkedItems, hasChecklistItems, chapter?.evaluationChecklistItems]);

	// Track if we've already auto-opened for this chapter completion
	// Use sessionStorage to persist across page visits within the same session
	const autoOpenKey = useMemo(() => `checklist-auto-opened-${chapterId}`, [chapterId]);
	const hasAutoOpened = useRef<boolean>(sessionStorage.getItem(autoOpenKey) === 'true');

	// Auto-open checklist dialog when chapter is completed (only once per session, and only if coming from lesson completion)
	useEffect(() => {
		// Check if user came from a lesson page (indicates they just completed a lesson)
		const fromLessonPage = document.referrer.includes('/lesson/') || sessionStorage.getItem(`lesson-completed-${chapterId}`) === 'true';

		const shouldAutoOpen =
			isChapterCompleted &&
			(hasChecklistItems || chapter.askForFeedback === true) &&
			(!hasChecklistItems || !isChecklistCompleted) &&
			isEnrolledStatus &&
			!hasAutoOpened.current &&
			fromLessonPage;

		if (shouldAutoOpen) {
			// Small delay to ensure UI is ready
			const timer = setTimeout(() => {
				setChecklistDialogOpen(true);
				// Initialize empty checked items
				setCheckedItems(new Map());
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
	}, [isChapterCompleted, hasChecklistItems, isChecklistCompleted, isEnrolledStatus, chapterId, autoOpenKey, chapter.askForFeedback]);

	const handleToggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	const handleOpenChecklistDialog = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!isEnrolledStatus && !chapter.evaluationChecklistItems?.length) return;
		setChecklistDialogOpen(true);
		// If checklist is already completed, check all items
		if (isChecklistCompleted && chapter.evaluationChecklistItems) {
			const allChecked = new Map<number, Set<number>>();
			chapter.evaluationChecklistItems.forEach((group, groupIndex) => {
				if (!group || !Array.isArray(group.items)) return;
				allChecked.set(groupIndex, new Set(group.items.map((_, itemIndex) => itemIndex)));
			});
			setCheckedItems(allChecked);
		} else if (checkedItems.size === 0 && chapter.evaluationChecklistItems) {
			// Initialize empty map if not already set
			setCheckedItems(new Map());
		}
		// Start with all groups collapsed by default
		setExpandedChecklistGroups(new Set());

		// Always start with empty feedback (learners cannot view their previous feedback)
		setFeedback('');
	};

	const handleToggleChecklistGroup = (groupIndex: number) => {
		const newExpanded = new Set(expandedChecklistGroups);
		if (newExpanded.has(groupIndex)) {
			newExpanded.delete(groupIndex);
		} else {
			newExpanded.add(groupIndex);
		}
		setExpandedChecklistGroups(newExpanded);
	};

	const handleCloseChecklistDialog = () => {
		if (isChecklistCompleted || !isEnrolledStatus || !isChapterCompleted || !hasChecklistItems) {
			setChecklistDialogOpen(false);
			setCheckedItems(new Map());
			setFeedback('');
		}
	};

	const handleCheckboxChange = (groupIndex: number, itemIndex: number) => {
		if (!isChapterCompleted || isChecklistCompleted) return; // Disable if chapter not completed or already completed

		const newChecked = new Map(checkedItems);
		const groupChecked = new Set(newChecked.get(groupIndex) || []);

		if (groupChecked.has(itemIndex)) {
			groupChecked.delete(itemIndex);
		} else {
			groupChecked.add(itemIndex);
		}

		if (groupChecked.size > 0) {
			newChecked.set(groupIndex, groupChecked);
		} else {
			newChecked.delete(groupIndex);
		}

		setCheckedItems(newChecked);
	};

	const handleSubmitChecklist = useCallback(async () => {
		const canSubmitChecklist = hasChecklistItems && !isChecklistCompleted && allItemsChecked;
		const canSubmitFeedback = chapter.askForFeedback === true;
		const canSubmit = canSubmitChecklist || canSubmitFeedback;

		if (!userCourseId || !chapterId || !isChapterCompleted || !canSubmit || isSubmittingChecklist) {
			return;
		}

		setIsSubmittingChecklist(true);
		try {
			if (hasChecklistItems && allItemsChecked && !isChecklistCompleted) {
				await axios.patch(`${base_url}/usercourses/${userCourseId}`, {
					completedChapterChecklistIds: chapterId,
				});
			}

			if (chapter.askForFeedback === true && courseId && course?.orgId && feedback.trim().length > 0) {
				try {
					await axios.post(`${base_url}/feedback`, {
						userId: user?._id,
						chapterId,
						userCourseId,
						courseId,
						orgId: course.orgId,
						feedback: feedback.trim(),
					});
				} catch (feedbackError) {
					console.error('Error saving feedback:', feedbackError);
				}
			}

			await queryClient.invalidateQueries({ queryKey: ['userCourseData'] });

			await queryClient.refetchQueries({ queryKey: ['userCourseData'] });

			setChecklistDialogOpen(false);
			setCheckedItems(new Map());
			setFeedback('');
		} catch (error) {
			console.error('Error submitting checklist:', error);
		} finally {
			setIsSubmittingChecklist(false);
		}
	}, [
		userCourseId,
		chapterId,
		isChapterCompleted,
		isChecklistCompleted,
		allItemsChecked,
		hasChecklistItems,
		isSubmittingChecklist,
		base_url,
		queryClient,
		chapter.askForFeedback,
		courseId,
		course?.orgId,
		feedback,
	]);

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
						title={
							chapter?.evaluationChecklistItems?.length && chapter?.evaluationChecklistItems?.length > 0
								? 'View Objectives'
								: chapter.askForFeedback === true && isEnrolledStatus
									? 'Give Feedback'
									: ''
						}
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
			{(hasChecklistItems || chapter.askForFeedback) && (
				<CustomDialog
					openModal={checklistDialogOpen}
					closeModal={handleCloseChecklistDialog}
					title={isEnrolledStatus ? (hasChecklistItems ? 'Chapter Objectives Checkout' : 'Give Us Your Feedback') : 'Chapter Objectives'}
					maxWidth='sm'>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							{isEnrolledStatus && !isChapterCompleted && hasChecklistItems && (
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
							{chapter.evaluationChecklistItems?.map((group, groupIndex) => {
								if (!group || !Array.isArray(group.items) || group.items.length === 0) {
									return null;
								}

								const isGroupExpanded = expandedChecklistGroups.has(groupIndex);
								const groupChecked = checkedItems.get(groupIndex);
								const groupTotalCount = group.items.length;
								const groupCheckedCount = groupChecked?.size || 0;
								const isGroupChecked = groupTotalCount > 0 && groupCheckedCount === groupTotalCount;

								return (
									<Box
										key={groupIndex}
										sx={{
											'border': '1px solid #e2e8f0',
											'borderRadius': '0.5rem',
											'overflow': 'hidden',
											'backgroundColor': '#ffffff',
											'boxShadow': '0 2px 8px rgba(0, 0, 0, 0.08)',
											'transition': 'all 0.3s ease',
											'&:hover': {
												boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
												borderColor: theme.palette.primary.main,
											},
										}}>
										{/* Group Header - Collapsible */}
										<Box
											sx={{
												'display': 'flex',
												'alignItems': 'center',
												'justifyContent': 'space-between',
												'padding': '0.75rem 1.25rem',
												'background': isGroupChecked
													? `linear-gradient(135deg, ${theme.palette.success.light}15 0%, ${theme.palette.success.main}20 100%)`
													: `linear-gradient(135deg, ${theme.palette.primary.light}10 0%, ${theme.palette.primary.main}15 100%)`,
												'cursor': 'pointer',
												'transition': 'all 0.3s ease',
												'&:hover': {
													background: isGroupChecked
														? `linear-gradient(135deg, ${theme.palette.success.light}25 0%, ${theme.palette.success.main}30 100%)`
														: `linear-gradient(135deg, ${theme.palette.primary.light}20 0%, ${theme.palette.primary.main}25 100%)`,
												},
											}}
											onClick={() => handleToggleChecklistGroup(groupIndex)}>
											<Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.75rem' }}>
												<IconButton
													size='small'
													sx={{
														color: theme.palette.primary.main,
														padding: '0.25rem',
														transform: isGroupExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
														transition: 'transform 0.3s ease',
													}}>
													<ExpandMore fontSize='small' />
												</IconButton>
												<Typography
													variant='h6'
													sx={{
														fontSize: isMobileSize ? '0.8rem' : '0.9rem',
														fontWeight: 500,
														color: theme.palette.primary.main,
														flex: 1,
													}}>
													{group.groupTitle}
												</Typography>
												{/* Progress indicator */}
												<Chip
													label={`${groupCheckedCount}/${groupTotalCount}`}
													size='medium'
													sx={{
														backgroundColor: isGroupChecked ? theme.palette.success.main : theme.palette.grey[200],
														color: isGroupChecked ? 'white' : theme.palette.text.secondary,
														fontWeight: 600,
														fontSize: isMobileSize ? '0.7rem' : '0.75rem',
														height: '1.5rem',
													}}
												/>
											</Box>
										</Box>

										{/* Group Items - Collapsible */}
										<Collapse in={isGroupExpanded} timeout='auto' unmountOnExit>
											<Box sx={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
												{group.items.map((item, itemIndex) => {
													const isItemChecked = isChecklistCompleted ? true : checkedItems.get(groupIndex)?.has(itemIndex) || false;

													return (
														<Box
															key={`${groupIndex}-${itemIndex}`}
															onClick={() => {
																if (!isChecklistCompleted && isEnrolledStatus && isChapterCompleted) {
																	handleCheckboxChange(groupIndex, itemIndex);
																}
															}}
															sx={{
																'display': 'flex',
																'alignItems': 'center',
																'gap': '0.75rem',
																'padding': isMobileSize ? '0.5rem 0.5rem' : '0.875rem 1rem',
																'borderRadius': '0.5rem',
																'border': `2px solid ${isItemChecked ? theme.palette.success.main : '#e2e8f0'}`,
																'backgroundColor': isItemChecked
																	? `linear-gradient(135deg, ${theme.palette.success.light}10 0%, ${theme.palette.success.main}15 100%)`
																	: '#ffffff',
																'cursor': !isChecklistCompleted && isEnrolledStatus && isChapterCompleted ? 'pointer' : 'default',
																'transition': 'all 0.2s ease',
																'&:hover': {
																	borderColor: isItemChecked ? theme.palette.success.main : theme.palette.primary.main,
																	backgroundColor: isItemChecked
																		? `linear-gradient(135deg, ${theme.palette.success.light}15 0%, ${theme.palette.success.main}20 100%)`
																		: theme.palette.primary.light + '08',
																	transform: !isChecklistCompleted && isEnrolledStatus && isChapterCompleted ? 'translateX(4px)' : 'none',
																	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
																},
															}}>
															<Checkbox
																checked={isItemChecked}
																onChange={() => handleCheckboxChange(groupIndex, itemIndex)}
																disabled={!isEnrolledStatus || !isChapterCompleted || isChecklistCompleted}
																sx={{
																	'color': theme.palette.primary.main,
																	'& .MuiSvgIcon-root': {
																		fontSize: isMobileSize ? '1.15rem' : '1.35rem',
																	},
																	'&.Mui-checked': {
																		color: theme.palette.success.main,
																	},
																	'&.Mui-disabled': {
																		color: isChecklistCompleted ? theme.palette.success.main : theme.palette.action.disabled,
																	},
																	'mt': '-0.25rem',
																}}
															/>
															<Typography
																variant='body2'
																sx={{
																	fontSize: isMobileSize ? '0.7rem' : '0.8rem',
																	lineHeight: 1.6,
																	wordBreak: 'break-word',
																	flex: 1,
																	color: isItemChecked ? theme.palette.text.primary : theme.palette.text.secondary,
																	textDecoration: isItemChecked ? 'none' : 'none',
																	fontWeight: isItemChecked ? 500 : 400,
																	pt: '0.25rem',
																}}>
																{item}
															</Typography>
														</Box>
													);
												})}
											</Box>
										</Collapse>
									</Box>
								);
							})}

							{/* Feedback Section */}
							{chapter.askForFeedback === true && isEnrolledStatus && (
								<Box
									sx={{
										mt: '1rem',
										backgroundColor: theme.palette.primary.light + '08',
										borderRadius: '0.5rem',
									}}>
									<Typography
										variant='body2'
										sx={{
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
											fontWeight: 500,
											mb: '0.75rem',
											color: theme.palette.text.primary,
										}}>
										Feedback (Optional)
									</Typography>
									<CustomTextField
										multiline
										rows={4}
										value={feedback}
										onChange={(e) => setFeedback(e.target.value)}
										placeholder='Share your thoughts about this chapter and/or course...'
										fullWidth
										disabled={isSubmittingChecklist}
										sx={{
											'& .MuiOutlinedInput-root': {
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												backgroundColor: theme.bgColor?.common,
											},
										}}
										InputProps={{
											inputProps: {
												maxLength: 1000,
											},
										}}
									/>
									<Typography
										variant='caption'
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.7rem',
											color: theme.palette.text.secondary,
											mt: '0.5rem',
											display: 'block',
											textAlign: 'right',
										}}>
										{feedback.length}/1000 characters
									</Typography>
								</Box>
							)}
						</Box>
					</DialogContent>
					{isEnrolledStatus && (
						<CustomDialogActions
							onSubmit={
								isEnrolledStatus &&
								isChapterCompleted &&
								((hasChecklistItems && !isChecklistCompleted && allItemsChecked) ||
									(chapter.askForFeedback === true && (!hasChecklistItems || isChecklistCompleted)))
									? handleSubmitChecklist
									: undefined
							}
							onCancel={handleCloseChecklistDialog}
							submitBtnText='Submit'
							disableBtn={
								!isEnrolledStatus ||
								!isChapterCompleted ||
								(hasChecklistItems && !isChecklistCompleted && !allItemsChecked) ||
								(!hasChecklistItems && chapter.askForFeedback !== true) ||
								(isChecklistCompleted && chapter.askForFeedback !== true) ||
								isSubmittingChecklist
							}
							isSubmitting={isSubmittingChecklist}
							actionSx={{ mb: '0.5rem', mr: '0.5rem' }}
						/>
					)}
				</CustomDialog>
			)}
		</Box>
	);
});

Chapter.displayName = 'Chapter';

export default Chapter;
