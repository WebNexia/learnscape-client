import {
	Avatar,
	Box,
	IconButton,
	Link,
	Tooltip,
	Typography,
	DialogContent,
	DialogActions,
	Collapse,
	Chip,
	Checkbox,
	FormControlLabel,
} from '@mui/material';
import theme from '../../themes';
import { SingleCourse } from '../../interfaces/course';

import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { ChecklistGroup } from '../../interfaces/chapter';
import { EditTwoTone, Visibility, ExpandMore, PlayCircleOutline, Checklist, ExpandLess } from '@mui/icons-material';
import { dateFormatter } from '../../utils/dateFormatter';
import NoContentBoxAdmin from '../layouts/noContentBox/NoContentBoxAdmin';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import UKFlag from '../../assets/uk_flag_icon_round.svg.png';
import USFlag from '../../assets/usa_flag_united_states_america_icon_228698.png';
import EUFlag from '../../assets/european_flag_icon_228671.png';
import TRFlag from '../../assets/tr-flag-round-500.png';
import EditInstructorDialog from './EditInstructorDialog';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { useContext, useState, useMemo } from 'react';
import { truncateText, decodeHtmlEntities } from '@utils/utilText';
import { useAuth } from '../../hooks/useAuth';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { LessonType } from '../../interfaces/enums';
import { useParams, useNavigate } from 'react-router-dom';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { calculateQuizTotalScoreFromScores } from '../../utils/calculateQuizTotalScoreFromScores';

interface CourseDetailsNonEditBoxProps {
	singleCourse?: SingleCourse;
	chapters: ChapterLessonData[];
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
}

const CourseDetailsNonEditBox = ({ singleCourse, chapters, setSingleCourse }: CourseDetailsNonEditBoxProps) => {
	const [isEditInstructorDialogOpen, setIsEditInstructorDialogOpen] = useState<boolean>(false);
	const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState<boolean>(false);
	const [checklistViewDialogOpen, setChecklistViewDialogOpen] = useState<Record<string, boolean>>({});
	// Support both old format (Set<number>) and new format (Map<number, Set<number>>)
	const [checkedItems, setCheckedItems] = useState<Record<string, Set<number> | Map<number, Set<number>>>>({});

	// State to track which chapters are expanded (default: all expanded)
	const [expandedChapters, setExpandedChapters] = useState<{ [chapterId: string]: boolean }>({});

	const { isInstructor } = useAuth();
	const { courseId } = useParams();
	const navigate = useNavigate();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Check if description is long enough to show "View Full" button
	const description = singleCourse?.description || '';
	const isDescriptionLong = description.length > (isMobileSize ? 85 : 200);

	// Helper functions for chapter management
	const toggleChapter = (chapterId: string) => {
		setExpandedChapters((prev) => {
			const currentState = prev[chapterId] === true; // Default to false if not set
			return {
				...prev,
				[chapterId]: !currentState,
			};
		});
	};

	const isChapterExpanded = (chapterId: string) => {
		return expandedChapters[chapterId] === true; // Default to false if not set
	};

	// Calculate lesson statistics for each chapter
	const getChapterStats = useMemo(() => {
		const stats: { [chapterId: string]: { total: number; published: number; unpublished: number } } = {};

		chapters?.forEach((chapter) => {
			if (chapter && chapter.lessons) {
				const validLessons = chapter.lessons.filter((lesson) => lesson !== null);
				const published = validLessons.filter((lesson) => lesson.isActive).length;
				const unpublished = validLessons.length - published;

				stats[chapter.chapterId] = {
					total: validLessons.length,
					published,
					unpublished,
				};
			}
		});

		return stats;
	}, [chapters]);

	// Total possible score for the whole course (sum of all graded quizzes)
	const totalPossibleScoreForCourse = useMemo(() => {
		let total = 0;

		chapters?.forEach((chapter) => {
			if (!chapter?.lessons) return;

			chapter.lessons
				.filter((lesson) => lesson !== null)
				.forEach((lesson) => {
					const isGradedQuiz = lesson.isGraded && lesson.type === LessonType.QUIZ;
					if (isGradedQuiz) {
						total += calculateQuizTotalScoreFromScores(lesson);
					}
				});
		});

		return total;
	}, [chapters]);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: isMobileSize ? '95%' : '90%',
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileSize ? 'column' : 'row',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					width: '100%',
					gap: isMobileSize ? '1rem' : '2rem',
				}}>
				<Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
					<Box
						sx={{
							mt: '1rem',
							padding: isMobileSize ? '0.75rem' : '1rem',
							height: '7.25rem',
							boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
							flex: 1,
							borderRadius: '0.35rem',
						}}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
							Instructor
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mt: '0.5rem' }}>
							<Avatar
								src={singleCourse?.instructor?.imageUrl}
								sx={{ width: isMobileSize ? '1.75rem' : '2rem', height: isMobileSize ? '1.75rem' : '2rem', objectFit: 'cover' }}
							/>
							<Typography
								variant='body2'
								sx={{
									'textTransform': 'capitalize',
									'cursor': 'pointer',
									':hover': { textDecoration: 'underline' },
									'display': 'flex',
									'alignItems': 'center',
									'gap': '0.5rem',
									'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
								}}
								onClick={() => setIsEditInstructorDialogOpen(true)}>
								{singleCourse?.instructor?.name} <EditTwoTone fontSize='small' />
							</Typography>
						</Box>
						<EditInstructorDialog
							isEditInstructorDialogOpen={isEditInstructorDialogOpen}
							setIsEditInstructorDialogOpen={setIsEditInstructorDialogOpen}
							singleCourse={singleCourse}
							setSingleCourse={setSingleCourse}
						/>
					</Box>
					<Box
						sx={{
							mt: '1rem',
							padding: isMobileSize ? '0.75rem' : '1rem',
							height: '7.25rem',
							boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
							flex: 3,
							borderRadius: '0.35rem',
							position: 'relative',
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
								Description
							</Typography>
							{isDescriptionLong && (
								<Tooltip title='View Full Description' placement='top' arrow>
									<IconButton
										size='small'
										onClick={() => setIsDescriptionModalOpen(true)}
										sx={{
											'padding': '0.25rem',
											'color': theme.palette.primary.main,
											'&:hover': {
												backgroundColor: theme.palette.primary.light + '20',
											},
										}}>
										<Visibility sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
									</IconButton>
								</Tooltip>
							)}
						</Box>
						<Typography variant='body2' sx={{ mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{truncateText(singleCourse?.description || '', isMobileSize ? 85 : 200)}
						</Typography>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-end',
						mt: '1rem',
						padding: '0 0 2rem 0rem',
						flex: 1,
					}}>
					<Box sx={{ textAlign: 'center' }}>
						<img
							src={singleCourse?.imageUrl || 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Cover+Image'}
							alt='course_img'
							height='115rem'
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
							}}
						/>
						<Box>
							<Typography variant='body2' sx={{ mt: '0.25rem' }}>
								Cover Image
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					padding: isMobileSize ? '1rem' : '2rem',
					boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
					borderRadius: '0.35rem',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '1rem' }}>
						Prices
					</Typography>

					<Box sx={{ display: 'flex', mt: '0.5rem' }}>
						{singleCourse?.prices?.map((price) => {
							return (
								<Box
									sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: isMobileSize ? '0.75rem' : '2rem' }}
									key={price.currency}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
										{price.amount !== 'Free' && price.amount !== '0' && price.amount !== '' ? setCurrencySymbol(price.currency) : ''}
										{price.amount === 'Free' || price.amount === '0' || price.amount === '' ? 'Free' : price.amount}
									</Typography>
									<img
										src={
											price.currency === 'gbp'
												? UKFlag
												: price.currency === 'usd'
													? USFlag
													: price.currency === 'eur'
														? EUFlag
														: price.currency === 'try'
															? TRFlag
															: undefined
										}
										alt='flag'
										style={{
											height: isMobileSize ? '1.5rem' : '2rem',
											width: isMobileSize ? '1.5rem' : '2rem',
											borderRadius: '50%',
											marginTop: '0.35rem',
										}}
									/>
								</Box>
							);
						})}
					</Box>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '1rem' }}>
						{isMobileSize ? 'Start' : 'Starting Date'}
					</Typography>
					<Typography variant='body2' sx={{ mt: isMobileSize ? '1rem' : '1.5rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						{dateFormatter(singleCourse?.startingDate) || 'N/A'}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '1rem' }}>
						Weeks
					</Typography>
					<Typography variant='body2' sx={{ mt: isMobileSize ? '1rem' : '1.5rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						{singleCourse?.durationWeeks || 'N/A'}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '1rem' }}>
						Hours
					</Typography>
					<Typography variant='body2' sx={{ mt: isMobileSize ? '1rem' : '1.5rem', fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
						{singleCourse?.durationHours || 'N/A'}
					</Typography>
				</Box>
			</Box>

			{!singleCourse?.courseManagement.isExternal && (
				<Box sx={{ mt: '4rem', minHeight: '30vh', mb: singleCourse?.chapterIds?.length === 0 ? '3rem' : '0rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<Typography variant='h5'>CHAPTERS</Typography>
							{totalPossibleScoreForCourse > 0 && (
								<Typography
									variant='body2'
									sx={{
										fontSize: isMobileSize ? '0.7rem' : '0.8rem',
										color: theme.textColor?.secondary?.main || 'text.secondary',
										ml: isMobileSize ? '0.25rem' : '0.5rem',
									}}>
									(Total score: {totalPossibleScoreForCourse} pts)
								</Typography>
							)}
						</Box>

						{!singleCourse?.courseManagement.isExternal && (
							<CustomSubmitButton
								type='button'
								onClick={() => {
									if (courseId) {
										const routePrefix = isInstructor ? '/instructor' : '/admin';
										navigate(`${routePrefix}/course/${courseId}/forms`);
									}
								}}
								sx={{ mb: isMobileSize ? '1rem' : '1.25rem' }}>
								Public Forms
							</CustomSubmitButton>
						)}
					</Box>
					{singleCourse?.chapterIds?.length === 0 ? (
						<NoContentBoxAdmin content='No chapter for this course' />
					) : (
						<>
							{singleCourse &&
								singleCourse?.chapters &&
								chapters?.map((chapter) => {
									const chapterStats = getChapterStats[chapter.chapterId];
									const isExpanded = isChapterExpanded(chapter.chapterId);

									return (
										<Box
											key={chapter.chapterId}
											sx={{
												marginBottom: isMobileSize ? '1rem' : '1rem',
												overflow: 'hidden',
												transition: 'box-shadow 0.3s ease',
											}}>
											{/* Chapter Header */}
											<Box
												sx={{
													'backgroundColor': isInstructor ? theme.bgColor?.instructorHeader : theme.bgColor?.adminHeader,
													'padding': isMobileSize ? '0.75rem 1rem' : '0.75rem 1rem 0.75rem 0.5rem',
													'display': 'flex',
													'alignItems': 'center',
													'justifyContent': 'space-between',
													'transition': 'background-color 0.2s ease',
													'borderRadius': '0.35rem',
													'&:hover': {
														backgroundColor: isInstructor ? theme.bgColor?.instructorPaper : theme.bgColor?.adminPaper,
													},
												}}
												role='button'
												tabIndex={0}
												aria-expanded={isExpanded}
												aria-label={`${isExpanded ? 'Collapse' : 'Expand'} chapter: ${chapter.title}`}>
												<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
													<IconButton
														onClick={(e) => {
															e.stopPropagation();
															toggleChapter(chapter.chapterId);
														}}
														sx={{
															color: 'white',
															marginRight: isMobileSize ? '0.5rem' : '1rem',
															padding: '0rem',
															transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
															transition: 'transform 0.3s ease',
															border: 'solid 0.5px white',
														}}
														aria-hidden='true'>
														<ExpandMore fontSize='small' />
													</IconButton>
													<Typography
														variant='h6'
														sx={{
															fontSize: isMobileSize ? '0.75rem' : '0.85rem',
															color: 'white',
															flex: 1,
															textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
														}}>
														{chapter.title}
													</Typography>
												</Box>

												{/* Chapter Statistics */}
												<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
													{chapterStats && (
														<>
															<Chip
																icon={<PlayCircleOutline />}
																label={`${chapterStats.published}/${chapterStats.total}`}
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
															{chapterStats.unpublished > 0 && (
																<Chip
																	label={`${chapterStats.unpublished} Draft`}
																	size='small'
																	sx={{
																		backgroundColor: 'rgba(255, 193, 7, 0.4)',
																		color: 'white',
																		fontSize: isMobileSize ? '0.6rem' : '0.7rem',
																		fontWeight: 600,
																		height: isMobileSize ? '1.3rem' : '1.6rem',
																		textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
																	}}
																/>
															)}

															<Tooltip title='View Check-out Questions' placement='top' arrow>
																<IconButton
																	sx={{
																		'color': 'white',
																		'padding': '0.25rem',
																		'marginLeft': '0.5rem',
																		'&:hover': {
																			border: 'solid 0.5px white',
																		},
																	}}
																	onClick={(e) => {
																		e.stopPropagation();
																		setChecklistViewDialogOpen((prev) => ({ ...prev, [chapter.chapterId]: true }));
																		// Initialize checked items for this chapter
																		if (!checkedItems[chapter.chapterId]) {
																			setCheckedItems((prev) => ({ ...prev, [chapter.chapterId]: new Set<number>() }));
																		}
																	}}>
																	<Checklist fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }} />
																</IconButton>
															</Tooltip>
														</>
													)}
												</Box>
											</Box>

											{/* Collapsible Lessons */}
											<Collapse in={isExpanded} timeout='auto' unmountOnExit>
												<Box sx={{ backgroundColor: 'transparent', padding: '0.5rem' }}>
													{chapter &&
														chapter?.lessons &&
														chapter?.lessons?.length !== 0 &&
														chapter?.lessons
															?.filter((lesson) => lesson !== null)
															?.map((lesson) => {
																return (
																	<Box
																		key={lesson._id}
																		sx={{
																			'display': 'flex',
																			'alignItems': 'center',
																			'height': '3rem',
																			'width': '100%',
																			'backgroundColor': '#ffffff',
																			'border': '1px solid #e2e8f0',
																			'margin': '0.5rem 0',
																			'borderRadius': '0.5rem',
																			'boxShadow': '0 1px 2px rgba(0, 0, 0, 0.05)',
																			'transition': 'box-shadow 0.2s ease',
																			'&:hover': {
																				boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
																				borderColor: '#cbd5e1',
																			},
																		}}>
																		<Box
																			sx={{
																				display: 'flex',
																				justifyContent: 'space-between',
																				alignItems: 'center',
																				width: '100%',
																				margin: isMobileSize ? '0 0.25rem 0 0.5rem' : '0 0.75rem',
																				gap: isMobileSize ? 2 : 0,
																			}}>
																			<Box sx={{ flex: 4 }}>
																				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem' }}>
																					{lesson?.title}
																				</Typography>
																			</Box>
																			<Box sx={{ flex: 1 }}>
																				<Chip
																					label={lesson?.isActive ? 'Published' : 'Draft'}
																					size='small'
																					sx={{
																						backgroundColor: lesson?.isActive ? theme.palette.success.light : theme.palette.warning.light,
																						color: lesson?.isActive ? theme.palette.success.contrastText : theme.palette.warning.contrastText,
																						fontSize: isMobileSize ? '0.6rem' : '0.7rem',
																						height: isMobileSize ? '1.2rem' : '1.5rem',
																					}}
																				/>
																			</Box>
																			<Box
																				sx={{
																					display: 'flex',
																					justifyContent: 'flex-end',
																					alignItems: 'center',
																					flex: 4,
																				}}>
																				{(() => {
																					const isGradedQuiz = lesson?.isGraded && lesson?.type === LessonType.QUIZ;
																					const totalPossibleScore = isGradedQuiz ? calculateQuizTotalScoreFromScores(lesson) : 0;

																					const typeLabel = !isMobileSize
																						? lesson?.type
																						: lesson?.type === LessonType.INSTRUCTIONAL_LESSON
																							? 'Instructional'
																							: lesson?.type === LessonType.PRACTICE_LESSON
																								? 'Practice'
																								: 'Quiz';

																					return (
																						<Box sx={{ mr: '0.5rem', display: 'flex', alignItems: 'center', gap: 0.75 }}>
																							{isGradedQuiz && totalPossibleScore > 0 && (
																								<Typography
																									variant='caption'
																									sx={{
																										fontSize: isMobileSize ? '0.6rem' : '0.75rem',
																										color: theme.textColor?.secondary?.main || 'text.secondary',
																									}}>
																									({totalPossibleScore} pts)
																								</Typography>
																							)}
																							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem' }}>
																								{typeLabel}
																							</Typography>
																						</Box>
																					);
																				})()}
																				<Box>
																					<Tooltip title='Edit Lesson' placement='top' arrow>
																						<IconButton
																							sx={{
																								':hover': {
																									backgroundColor: 'transparent',
																								},
																							}}
																							onClick={() => {
																								if (isInstructor) {
																									window.open(`/instructor/lesson-edit/lesson/${lesson._id}`, '_blank');
																								} else {
																									window.open(`/admin/lesson-edit/lesson/${lesson._id}`, '_blank');
																								}
																								window.scrollTo({ top: 0, behavior: 'smooth' });
																							}}>
																							<EditTwoTone fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, ml: '-0.5rem' }} />
																						</IconButton>
																					</Tooltip>
																				</Box>
																			</Box>
																		</Box>
																	</Box>
																);
															})}
												</Box>
											</Collapse>
										</Box>
									);
								})}
						</>
					)}
				</Box>
			)}
			{!singleCourse?.courseManagement.isExternal && (
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', width: '100%', mb: '4rem', mt: '2rem' }}>
					<Box sx={{ mb: '1.25rem' }}>
						<Typography variant='h5' sx={{ fontSize: isMobileSize ? '1rem' : undefined }}>
							Course Materials
						</Typography>
					</Box>
					{singleCourse?.documents?.filter((doc) => doc !== null)?.length !== 0 ? (
						<Box>
							{singleCourse?.documents
								?.filter((doc) => doc !== null)
								?.map((doc) => (
									<Box sx={{ mb: '0.5rem' }} key={doc._id}>
										<Link
											href={doc?.documentUrl}
											target='_blank'
											rel='noopener noreferrer'
											variant='body2'
											sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{decodeHtmlEntities(doc?.name || '')}
										</Link>
									</Box>
								))}
						</Box>
					) : (
						<NoContentBoxAdmin content='No material for this course' />
					)}
				</Box>
			)}

			{/* Description Modal */}
			<CustomDialog openModal={isDescriptionModalOpen} closeModal={() => setIsDescriptionModalOpen(false)} title='Course Description' maxWidth='sm'>
				<DialogContent>
					<Typography
						variant='body2'
						sx={{
							fontSize: isMobileSize ? '0.75rem' : '0.85rem',
							lineHeight: 1.7,
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}>
						{description}
					</Typography>
				</DialogContent>
				<DialogActions>
					<CustomCancelButton
						onClick={() => setIsDescriptionModalOpen(false)}
						sx={{
							margin: '0 1rem 0.5rem 0',
						}}>
						Close
					</CustomCancelButton>
				</DialogActions>
			</CustomDialog>

			{/* Checklist View Dialogs (Student View) */}
			{chapters.map((chapter) => {
				return (
					<CustomDialog
						key={`checklist-${chapter.chapterId}`}
						openModal={checklistViewDialogOpen[chapter.chapterId] || false}
						closeModal={() => {
							setChecklistViewDialogOpen((prev) => ({ ...prev, [chapter.chapterId]: false }));
						}}
						title='Check-out Questions'
						maxWidth='sm'>
						<DialogContent>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', mt: '1rem' }}>
								{chapter?.evaluationChecklistItems && chapter?.evaluationChecklistItems.length > 0 ? (
									(() => {
										// Handle both old format (string[]) and new format (ChecklistGroup[])
										const items = chapter.evaluationChecklistItems;
										const isOldFormat = items.length > 0 && typeof items[0] === 'string';

										if (isOldFormat) {
											// Old format: display as flat list
											const oldItems = items as unknown as string[];
											return oldItems.map((item, index) => (
												<FormControlLabel
													key={index}
													control={
														<Checkbox
															checked={(() => {
																const chapterChecked = checkedItems[chapter.chapterId];
																if (chapterChecked instanceof Set) {
																	return chapterChecked.has(index);
																}
																return false;
															})()}
															onChange={(e) => {
																const chapterId = chapter.chapterId;
																const currentChecked = checkedItems[chapterId];
																// Handle old format (Set) or initialize new Set
																const currentSet =
																	currentChecked instanceof Set
																		? currentChecked
																		: currentChecked instanceof Map
																			? new Set<number>()
																			: new Set<number>();
																const newChecked = new Set(currentSet);

																if (e.target.checked) {
																	newChecked.add(index);
																} else {
																	newChecked.delete(index);
																}

																setCheckedItems((prev) => ({
																	...prev,
																	[chapterId]: newChecked,
																}));
															}}
															sx={{
																'color': theme.palette.primary.main,
																'& .MuiSvgIcon-root': {
																	fontSize: '1.25rem',
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
											));
										} else {
											// New format: display as grouped
											const groups = items as ChecklistGroup[];
											return groups
												.filter((group) => group && typeof group === 'object' && Array.isArray(group.items))
												.map((group, groupIndex) => (
													<Box key={groupIndex} sx={{ mb: '1rem' }}>
														{/* Group Header */}
														<Typography
															variant='h6'
															sx={{
																fontSize: isMobileSize ? '0.85rem' : '0.95rem',
																fontWeight: 600,
																mb: '0.5rem',
																color: theme.palette.primary.main,
															}}>
															{group.groupTitle}
														</Typography>
														{/* Group Items */}
														{group.items && Array.isArray(group.items) && group.items.length > 0 ? (
															group.items.map((item, itemIndex) => (
																<FormControlLabel
																	key={`${groupIndex}-${itemIndex}`}
																	control={
																		<Checkbox
																			checked={(() => {
																				const chapterChecked = checkedItems[chapter.chapterId];
																				if (chapterChecked instanceof Map) {
																					return chapterChecked.get(groupIndex)?.has(itemIndex) || false;
																				}
																				return false;
																			})()}
																			onChange={(e) => {
																				const chapterId = chapter.chapterId;
																				const currentChecked = checkedItems[chapterId];
																				// Ensure we're working with Map format for new grouped structure
																				const currentMap = currentChecked instanceof Map ? currentChecked : new Map<number, Set<number>>();
																				const groupChecked = new Set(currentMap.get(groupIndex) || []);

																				if (e.target.checked) {
																					groupChecked.add(itemIndex);
																				} else {
																					groupChecked.delete(itemIndex);
																				}

																				const newChecked = new Map(currentMap);
																				if (groupChecked.size > 0) {
																					newChecked.set(groupIndex, groupChecked);
																				} else {
																					newChecked.delete(groupIndex);
																				}

																				setCheckedItems((prev) => ({
																					...prev,
																					[chapterId]: newChecked,
																				}));
																			}}
																			sx={{
																				'color': theme.palette.primary.main,
																				'& .MuiSvgIcon-root': {
																					fontSize: '1.25rem',
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
															))
														) : (
															<Typography
																variant='body2'
																sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: theme.palette.text.secondary }}>
																No items in this group
															</Typography>
														)}
													</Box>
												));
										}
									})()
								) : (
									<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											No checklist items for this chapter
										</Typography>
									</Box>
								)}

								{/* Ask for Feedback - Read Only */}
								<Box>
									<FormControlLabel
										control={
											<Checkbox
												checked={chapter.askForFeedback || false}
												disabled
												sx={{
													'color': theme.palette.primary.main,
													'& .MuiSvgIcon-root': {
														fontSize: '1.25rem',
													},
													'&.Mui-disabled': {
														color: theme.palette.action.disabled,
													},
												}}
											/>
										}
										label={
											<Typography
												variant='body2'
												sx={{
													fontSize: isMobileSize ? '0.75rem' : '0.85rem',
													color: theme.palette.text.secondary,
												}}>
												Ask for Feedback
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
								</Box>
							</Box>
						</DialogContent>
						<DialogActions>
							<CustomCancelButton
								onClick={() => {
									setChecklistViewDialogOpen((prev) => ({ ...prev, [chapter.chapterId]: false }));
								}}
								sx={{
									margin: '0 1rem 0.5rem 0',
								}}>
								Close
							</CustomCancelButton>
						</DialogActions>
					</CustomDialog>
				);
			})}
		</Box>
	);
};

export default CourseDetailsNonEditBox;
