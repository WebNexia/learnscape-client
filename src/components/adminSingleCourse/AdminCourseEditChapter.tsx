import { Box, IconButton, Tooltip, Typography, Collapse, DialogContent, FormControlLabel, Checkbox } from '@mui/material';
import { useMotionValue, Reorder } from 'framer-motion';
import theme from '../../themes';
import { CreateTwoTone, Delete, NoteAdd, ExpandMore, Checklist, AddCircle, RemoveCircle, DragIndicator } from '@mui/icons-material';
import { useState, useContext } from 'react';
import { Lesson } from '../../interfaces/lessons';
import { useRaisedShadow } from '../../hooks/useRaisedShadow';
import { ChapterLessonData, ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import CreateLessonDialog from '../forms/newLesson/CreateLessonDialog';
import AddNewLessonDialog from './AddNewLessonDialog';
import { chapterUpdateTrack } from '../../utils/chapterUpdateTrack';
import { ChecklistGroup } from '../../interfaces/chapter';
import { LessonsContext } from '../../contexts/LessonsContextProvider';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';
import { LessonType } from '../../interfaces/enums';
import { calculateQuizTotalScoreFromScores } from '../../utils/calculateQuizTotalScoreFromScores';

import { useParams } from 'react-router-dom';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../hooks/useAuth';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { truncateText } from '@utils/utilText';

interface AdminCourseEditChapterProps {
	chapter: ChapterLessonData;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	isMissingField: boolean;
	setDeletedChapterIds: React.Dispatch<React.SetStateAction<string[]>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminCourseEditChapter = ({
	chapter,
	setChapterLessonDataBeforeSave,
	setIsChapterUpdated,
	setIsMissingField,
	isMissingField,
	setDeletedChapterIds,
	setHasUnsavedChanges,
}: AdminCourseEditChapterProps) => {
	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);
	const [addNewLessonModalOpen, setAddNewLessonModalOpen] = useState<boolean>(false);
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState<boolean>(false);
	const [checklistGroups, setChecklistGroups] = useState<ChecklistGroup[]>([{ groupTitle: '', items: [''] }]);
	const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0])); // Track which groups are expanded
	const [checklistValidationError, setChecklistValidationError] = useState<string>('');

	const [askForFeedback, setAskForFeedback] = useState<boolean>(false);

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);
	const checklistGroupsY = useMotionValue(0);
	const checklistGroupsBoxShadow = useRaisedShadow(checklistGroupsY);
	const { updateLesson } = useContext(LessonsContext);
	const { isInstructor, user } = useAuth();
	const { courseId } = useParams();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const handleToggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	const handleLessonAdded = () => {
		setIsExpanded(true);
	};

	const handleOpenChecklistDialog = () => {
		// Handle both old format (string[]) and new format (ChecklistGroup[])
		let groupsToSet: ChecklistGroup[] = [];

		if (chapter.evaluationChecklistItems && chapter.evaluationChecklistItems.length > 0) {
			// Check if it's old format (array of strings)
			if (typeof chapter.evaluationChecklistItems[0] === 'string') {
				// Migrate old format to new grouped format
				const oldItems = chapter.evaluationChecklistItems as unknown as string[];
				groupsToSet = [{ groupTitle: 'Default Group', items: oldItems.length > 0 ? oldItems : [''], _id: generateUniqueId('checklist-group') }];
			} else {
				// New format - ensure each group has a unique ID
				const groups = chapter.evaluationChecklistItems as ChecklistGroup[];
				groupsToSet =
					groups.length > 0
						? groups.map((g) => ({
								...g,
								items: g.items.length > 0 ? [...g.items] : [''],
								_id: g._id || generateUniqueId('checklist-group'), // Preserve existing ID or generate new one
							}))
						: [{ groupTitle: '', items: [''], _id: generateUniqueId('checklist-group') }];
			}
		} else {
			groupsToSet = [{ groupTitle: '', items: [''], _id: generateUniqueId('checklist-group') }];
		}

		setChecklistGroups(groupsToSet);
		// Initialize askForFeedback from chapter data
		setAskForFeedback(chapter.askForFeedback || false);
		// Expand all groups by default
		setExpandedGroups(new Set(groupsToSet.map((_, index) => index)));
		setIsChecklistDialogOpen(true);
	};

	const handleCloseChecklistDialog = () => {
		setIsChecklistDialogOpen(false);
		setChecklistValidationError('');
		setChecklistGroups([{ groupTitle: '', items: [''] }]);
		setExpandedGroups(new Set([0]));
	};

	// Group management
	const handleAddGroup = () => {
		setChecklistGroups([...checklistGroups, { groupTitle: '', items: [''], _id: generateUniqueId('checklist-group') }]);
		setExpandedGroups(new Set([...expandedGroups, checklistGroups.length]));
	};

	const handleRemoveGroup = (groupIndex: number) => {
		if (checklistGroups.length > 1) {
			const newGroups = checklistGroups.filter((_, i) => i !== groupIndex);
			setChecklistGroups(newGroups);
			const newExpanded = new Set(expandedGroups);
			newExpanded.delete(groupIndex);
			// Adjust indices for groups after the removed one
			const adjustedExpanded = new Set<number>();
			newExpanded.forEach((idx) => {
				if (idx < groupIndex) {
					adjustedExpanded.add(idx);
				} else if (idx > groupIndex) {
					adjustedExpanded.add(idx - 1);
				}
			});
			setExpandedGroups(adjustedExpanded);
		}
	};

	const handleGroupTitleChange = (groupIndex: number, value: string) => {
		const updatedGroups = [...checklistGroups];
		updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], groupTitle: value };
		setChecklistGroups(updatedGroups);
		// Clear validation error when user edits group title
		if (checklistValidationError) {
			setChecklistValidationError('');
		}
	};

	const handleToggleGroupExpanded = (groupIndex: number) => {
		const newExpanded = new Set(expandedGroups);
		if (newExpanded.has(groupIndex)) {
			newExpanded.delete(groupIndex);
		} else {
			newExpanded.add(groupIndex);
		}
		setExpandedGroups(newExpanded);
	};

	// Item management within groups
	const handleAddChecklistItem = (groupIndex: number) => {
		const updatedGroups = [...checklistGroups];
		updatedGroups[groupIndex] = {
			...updatedGroups[groupIndex],
			items: [...updatedGroups[groupIndex].items, ''],
		};
		setChecklistGroups(updatedGroups);
	};

	const handleRemoveChecklistItem = (groupIndex: number, itemIndex: number) => {
		const updatedGroups = [...checklistGroups];
		if (updatedGroups[groupIndex].items.length > 1) {
			updatedGroups[groupIndex] = {
				...updatedGroups[groupIndex],
				items: updatedGroups[groupIndex].items.filter((_, i) => i !== itemIndex),
			};
		} else {
			// If only one item left, just clear it
			updatedGroups[groupIndex] = {
				...updatedGroups[groupIndex],
				items: [''],
			};
		}
		setChecklistGroups(updatedGroups);
	};

	const handleChecklistItemChange = (groupIndex: number, itemIndex: number, value: string) => {
		const updatedGroups = [...checklistGroups];
		updatedGroups[groupIndex] = {
			...updatedGroups[groupIndex],
			items: updatedGroups[groupIndex].items.map((item, i) => (i === itemIndex ? value : item)),
		};
		setChecklistGroups(updatedGroups);
	};

	const handleSaveChecklist = async () => {
		try {
			const hasInvalidGroup = checklistGroups.some((group) => {
				const cleanTitle = group.groupTitle.trim();
				const cleanItems = group.items.map((item) => item.trim()).filter((item) => item.length > 0);
				return cleanItems.length > 0 && cleanTitle.length === 0;
			});

			if (hasInvalidGroup) {
				setChecklistValidationError('Add a title to all groups with items.');
				return;
			}

			// Clear any previous validation error
			setChecklistValidationError('');

			const cleanGroups = checklistGroups
				.map((group) => {
					const cleanTitle = group.groupTitle.trim();
					const cleanItems = group.items.map((item) => item.trim()).filter((item) => item.length > 0);

					if (cleanTitle.length > 0 && cleanItems.length > 0) {
						return {
							groupTitle: cleanTitle,
							items: cleanItems,
						};
					}

					return null;
				})
				.filter((group) => group !== null) as ChecklistGroup[];

			// Update local state immediately
			setChapterLessonDataBeforeSave((prevData) => {
				if (prevData) {
					return prevData.map((currentChapter) => {
						if (currentChapter.chapterId === chapter.chapterId) {
							return {
								...currentChapter,
								evaluationChecklistItems: cleanGroups,
								askForFeedback: askForFeedback,
							};
						}
						return currentChapter;
					});
				}
				return prevData;
			});

			chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
			setHasUnsavedChanges(true);
			setIsChecklistDialogOpen(false);
		} catch (error) {
			console.error('Error saving checklist:', error);
		}
	};

	return (
		<Box
			sx={{
				'margin': '1rem 0 1.25rem 0',
				'width': '100%',
				'padding': '0.75rem 0.75rem 0.25rem 0.75rem',
				'boxShadow': '0 0.3rem 0.5rem 0 rgba(0,0,0,0.25)',
				'transition': '0.3s',
				'borderRadius': '0.3rem',
				':hover': {
					boxShadow: '0 0.3rem 0.5rem 0.2rem rgba(0,0,0,0.35)',
				},
			}}>
			{/* Chapter Header - Collapsible */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					backgroundColor: isInstructor ? theme.bgColor?.instructorHeader : theme.bgColor?.adminHeader,
					padding: isMobileSize ? '0.25rem 0.25rem' : '0.25rem 0.5rem',
					borderRadius: '0.35rem',
					marginBottom: '0.5rem',
					transition: 'background-color 0.2s ease',
					gap: '1rem',
				}}>
				<Box sx={{ display: 'flex', alignItems: 'center', flex: 2 }}>
					<Tooltip title={isExpanded ? 'Collapse' : 'Expand'} placement='top' arrow>
						<IconButton
							sx={{
								color: 'white',
								marginRight: isMobileSize ? '0.5rem' : '1rem',
								padding: '0rem',
								transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
								transition: 'transform 0.3s ease',
								cursor: 'pointer',
								border: 'solid 0.5px white',
							}}
							onClick={handleToggleExpanded}
							aria-expanded={isExpanded}
							aria-label={`${isExpanded ? 'Collapse' : 'Expand'} chapter: ${chapter.title}`}>
							<ExpandMore fontSize='small' />
						</IconButton>
					</Tooltip>
					<Typography
						variant='h6'
						sx={{
							fontSize: isMobileSize ? '0.75rem' : '0.85rem',
							color: 'white',
							flex: 1,
							textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
						}}>
						{chapter.title || 'Untitled Chapter'}
					</Typography>
				</Box>

				<Box sx={{ flex: 2 }}>
					<Tooltip title='Max 50 Characters' placement='top' arrow>
						<CustomTextField
							sx={{
								'width': '100%',
								'mb': '0rem',
								'& .MuiInputBase-root': {
									borderRadius: '0',
								},
							}}
							InputProps={{ inputProps: { maxLength: 50 } }}
							value={chapter.title}
							onChange={(e) => {
								chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
								setHasUnsavedChanges(true);

								setChapterLessonDataBeforeSave((prevData) => {
									const updatedChapters = prevData?.map((currentChapter) => {
										if (chapter.chapterId === currentChapter.chapterId) {
											return {
												...currentChapter,
												title: e.target.value,
											};
										}
										return currentChapter;
									});
									return updatedChapters;
								});

								setIsMissingField(false);
							}}
							error={isMissingField && chapter?.title === ''}
							placeholder='Enter chapter title...'
						/>
					</Tooltip>
					{isMissingField && chapter?.title === '' && <CustomErrorMessage>Please enter chapter title</CustomErrorMessage>}
				</Box>

				{/* Chapter Actions */}
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0rem', flex: 1 }}>
					<Tooltip title='Edit Check-out Questions' placement='top' arrow>
						<IconButton
							sx={{ color: 'white' }}
							onClick={(e) => {
								e.stopPropagation();
								handleOpenChecklistDialog();
							}}>
							<Checklist fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
						</IconButton>
					</Tooltip>

					<Tooltip title='Add Lesson' placement='top' arrow>
						<IconButton
							sx={{ color: 'white' }}
							onClick={(e) => {
								e.stopPropagation();
								setAddNewLessonModalOpen(true);
							}}>
							<NoteAdd fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
						</IconButton>
					</Tooltip>

					<Tooltip title='Create Lesson' placement='top' arrow>
						<IconButton
							sx={{ color: 'white' }}
							onClick={(e) => {
								e.stopPropagation();
								setIsNewLessonModalOpen(true);
							}}>
							<CreateTwoTone fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
						</IconButton>
					</Tooltip>

					<Tooltip title='Delete Chapter' placement='top' arrow>
						<IconButton
							sx={{ color: 'white' }}
							onClick={(e) => {
								e.stopPropagation();
								setChapterLessonDataBeforeSave((prevData) => {
									if (prevData !== undefined) {
										return prevData?.filter((currentChapter) => chapter.chapterId !== currentChapter.chapterId) || [];
									}
									return prevData;
								});

								setHasUnsavedChanges(true);

								setDeletedChapterIds((prevIds) => {
									if (!chapter.chapterId?.includes('temp_chapter_id')) {
										return [...prevIds, chapter.chapterId];
									}
									return prevIds;
								});
							}}>
							<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined }} />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Chapter Title Edit Field */}

			{/* Modals */}
			<AddNewLessonDialog
				setAddNewLessonModalOpen={setAddNewLessonModalOpen}
				addNewLessonModalOpen={addNewLessonModalOpen}
				chapter={chapter}
				setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
				setIsChapterUpdated={setIsChapterUpdated}
				setHasUnsavedChanges={setHasUnsavedChanges}
				onLessonAdded={handleLessonAdded}
			/>

			<CreateLessonDialog
				chapter={chapter}
				isNewLessonModalOpen={isNewLessonModalOpen}
				setIsNewLessonModalOpen={setIsNewLessonModalOpen}
				createNewLesson={false}
				setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
				setIsChapterUpdated={setIsChapterUpdated}
				setHasUnsavedChanges={setHasUnsavedChanges}
				onLessonAdded={handleLessonAdded}
			/>

			{/* Checklist Edit Dialog */}
			<CustomDialog openModal={isChecklistDialogOpen} closeModal={handleCloseChecklistDialog} title='Edit Check-out Questions' maxWidth='sm'>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', mt: '1rem' }}>
						<Reorder.Group
							axis='y'
							values={checklistGroups}
							onReorder={(newGroups: ChecklistGroup[]) => {
								// Create a map of group ID to old index (for tracking which groups were expanded)
								const oldGroupMap = new Map<string, number>();
								checklistGroups.forEach((group, index) => {
									if (group._id) {
										oldGroupMap.set(group._id, index);
									}
								});

								// Map new groups to their old indices to preserve expansion state
								const newExpanded = new Set<number>();
								newGroups.forEach((newGroup, newIndex) => {
									if (newGroup._id) {
										const oldIndex = oldGroupMap.get(newGroup._id);
										if (oldIndex !== undefined && expandedGroups.has(oldIndex)) {
											newExpanded.add(newIndex);
										}
									}
								});

								setChecklistGroups(newGroups);
								setExpandedGroups(newExpanded);
							}}>
							{checklistGroups.map((group, groupIndex) => (
								<Reorder.Item key={group._id || groupIndex} value={group} style={{ boxShadow: checklistGroupsBoxShadow, listStyle: 'none' }}>
									<Box
										sx={{
											border: '1px solid #e2e8f0',
											borderRadius: '0.5rem',
											overflow: 'hidden',
											backgroundColor: '#ffffff',
											marginBottom: '1.5rem',
										}}>
										{/* Group Header - Collapsible */}
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '1rem 1rem',
												backgroundColor: isInstructor ? theme.bgColor?.instructorHeader : theme.bgColor?.adminHeader,
											}}>
											<Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
												<IconButton
													size='small'
													onClick={() => handleToggleGroupExpanded(groupIndex)}
													sx={{
														color: 'white',
														padding: '0.25rem',
														transform: expandedGroups.has(groupIndex) ? 'rotate(180deg)' : 'rotate(0deg)',
														transition: 'transform 0.3s ease',
														cursor: 'pointer',
														border: 'solid 0.5px white',
													}}>
													<ExpandMore fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
												</IconButton>
												<Box
													sx={{
														flex: 1,
														position: 'relative',
														zIndex: 1,
														marginLeft: '0.5rem',
														mb: '-0.85rem',
													}}>
													<CustomTextField
														value={group.groupTitle}
														onChange={(e) => {
															handleGroupTitleChange(groupIndex, e.target.value);
														}}
														placeholder={`Group ${groupIndex + 1} Title`}
														disabled={false}
														sx={{
															'width': '100%',
															'& .MuiOutlinedInput-root': {
																'backgroundColor': 'white',
																'&:hover': {
																	backgroundColor: 'white',
																},
															},
															'& .MuiInputBase-input': {
																cursor: 'text',
																pointerEvents: 'auto',
															},
															'& .MuiInputBase-root': {
																pointerEvents: 'auto',
																borderRadius: '0',
															},
														}}
														InputProps={{
															inputProps: {
																maxLength: 100,
															},
														}}
													/>
												</Box>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
												{checklistGroups.length > 1 && (
													<Tooltip title='Remove Group' placement='top' arrow>
														<IconButton
															size='small'
															onClick={(e) => {
																e.stopPropagation();
																handleRemoveGroup(groupIndex);
															}}
															sx={{ color: 'white' }}>
															<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined, ml: '0.5rem' }} />
														</IconButton>
													</Tooltip>
												)}
												<Tooltip title='Drag to reorder' placement='top' arrow>
													<IconButton
														size='small'
														sx={{
															'color': 'white',
															'cursor': 'grab',
															'&:active': {
																cursor: 'grabbing',
															},
														}}
														onMouseDown={(e) => e.stopPropagation()}>
														<DragIndicator fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined, mr: '-0.65rem' }} />
													</IconButton>
												</Tooltip>
											</Box>
										</Box>

										{/* Group Items - Collapsible */}
										<Collapse in={expandedGroups.has(groupIndex)} timeout='auto' unmountOnExit>
											<Box sx={{ padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
												{group.items.map((item, itemIndex) => (
													<Box
														key={itemIndex}
														sx={{
															display: 'flex',
															alignItems: 'flex-start',
															gap: '0.5rem',
															width: '100%',
														}}>
														<CustomTextField
															multiline
															label={`Item ${itemIndex + 1}`}
															value={item}
															rows={2}
															onChange={(e) => handleChecklistItemChange(groupIndex, itemIndex, e.target.value)}
															sx={{ flex: 1 }}
															InputProps={{
																inputProps: {
																	maxLength: 500,
																},
															}}
														/>
														{itemIndex === group.items.length - 1 && (
															<Tooltip title='Add Item' placement='top' arrow>
																<IconButton onClick={() => handleAddChecklistItem(groupIndex)} sx={{ mt: '0.5rem' }}>
																	<AddCircle fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
																</IconButton>
															</Tooltip>
														)}
														{group.items.length > 1 && (
															<Tooltip title='Remove Item' placement='top' arrow>
																<IconButton onClick={() => handleRemoveChecklistItem(groupIndex, itemIndex)} sx={{ mt: '0.5rem', ml: '-0.5rem' }}>
																	<RemoveCircle fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
																</IconButton>
															</Tooltip>
														)}
													</Box>
												))}
											</Box>
										</Collapse>
									</Box>
								</Reorder.Item>
							))}
						</Reorder.Group>
						{checklistValidationError && <CustomErrorMessage>{checklistValidationError}</CustomErrorMessage>}
						<FormControlLabel
							control={
								<Checkbox
									checked={askForFeedback}
									onChange={(e) => {
										setAskForFeedback(e.target.checked);
									}}
									sx={{
										'& .MuiSvgIcon-root': {
											fontSize: isMobileSize ? '1rem' : '1.1rem',
										},
									}}
								/>
							}
							label='Ask for Feedback'
							sx={{
								'mr': '0rem',
								'& .MuiFormControlLabel-label': {
									fontSize: isMobileSize ? '0.75rem' : '0.8rem',
								},
							}}
						/>

						{/* Add Group Button */}
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: '-0.5rem' }}>
							<Tooltip title='Add Group' placement='top' arrow>
								<IconButton
									onClick={handleAddGroup}
									sx={{
										'border': `2px dashed ${isInstructor ? theme.bgColor?.instructorHeader : theme.bgColor?.adminHeader}`,
										'borderRadius': '0.5rem',
										'padding': '0.75rem',
										'&:hover': {
											borderColor: isInstructor ? theme.bgColor?.instructorHeader : theme.bgColor?.adminHeader,
										},
									}}>
									<AddCircle
										sx={{
											fontSize: isMobileSize ? '1.15rem' : '1.35rem',
											color: isInstructor ? theme.bgColor?.instructorHeader : theme.bgColor?.adminHeader,
										}}
									/>
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
				</DialogContent>
				<CustomDialogActions
					onCancel={handleCloseChecklistDialog}
					onSubmit={handleSaveChecklist}
					submitBtnText='Save'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Collapsible Lessons Section */}
			<Collapse in={isExpanded} timeout='auto' unmountOnExit>
				{chapter?.lessonIds?.length !== 0 && (
					<Reorder.Group
						axis='y'
						values={chapter?.lessons || []}
						onReorder={(newLessons: Lesson[]): void => {
							setChapterLessonDataBeforeSave((prevData) => {
								if (prevData) {
									return prevData?.map((currentChapter) => {
										if (currentChapter.chapterId === chapter?.chapterId) {
											return {
												...currentChapter,
												lessons: newLessons,
												lessonIds: newLessons?.map((lesson: Lesson) => lesson._id) || [],
											};
										}
										return currentChapter; // Return unchanged chapter if not the one being updated
									});
								}
								return prevData;
							});
							chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
							setHasUnsavedChanges(true);
						}}>
						{chapter?.lessons &&
							chapter?.lessons
								?.filter((lesson) => lesson !== null)
								?.map((lesson) => {
									return (
										<Reorder.Item key={lesson._id} value={lesson} style={{ boxShadow, listStyle: 'none' }}>
											<Box
												key={lesson._id}
												sx={{
													'display': 'flex',
													'alignItems': 'center',
													'height': '2.25rem',
													'width': '100%',
													'backgroundColor': theme.bgColor?.common,
													'margin': '0.85rem 0',
													'borderRadius': '0.25rem',
													'boxShadow': '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
													'transition': '0.4s',
													':hover': {
														boxShadow: '0.1rem 0 0.5rem 0.3rem rgba(0, 0, 0, 0.3)',
														cursor: 'pointer',
													},
												}}>
												<Box
													sx={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														margin: isMobileSize ? '0 0.5rem' : '0 1rem',
														width: '100%',
														gap: isMobileSize ? 1 : 0,
													}}>
													<Box sx={{ flex: 4 }}>
														<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem' }}>
															{truncateText(lesson.title, isMobileSize ? 20 : 40)}
														</Typography>
													</Box>
													<Box sx={{ flex: 1 }}>
														<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.55rem' : '0.85rem' }}>
															{lesson.isActive ? 'Published' : 'Unpublished'}
														</Typography>
													</Box>
													<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 4 }}>
														{(() => {
															const isGradedQuiz = lesson?.isGraded && lesson?.type === LessonType.QUIZ;
															const totalPossibleScore = isGradedQuiz ? calculateQuizTotalScoreFromScores(lesson) : 0;

															return (
																<Box sx={{ mr: isMobileSize ? '0.25rem' : '1rem', display: 'flex', alignItems: 'center', gap: 0.75 }}>
																	{isGradedQuiz && totalPossibleScore > 0 && (
																		<Typography
																			variant='caption'
																			sx={{
																				fontSize: isMobileSize ? '0.55rem' : '0.75rem',
																				color: theme.textColor?.secondary?.main || 'text.secondary',
																			}}>
																			({totalPossibleScore} pts)
																		</Typography>
																	)}
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.6rem' : '0.85rem' }}>
																		{lesson.type}
																	</Typography>
																</Box>
															);
														})()}
														<Tooltip title='Remove Lesson' placement='right' arrow>
															<IconButton
																sx={{
																	':hover': {
																		backgroundColor: 'transparent',
																	},
																	'mr': isMobileSize ? '-0.5rem' : '-0.5rem',
																}}
																onClick={() => {
																	setChapterLessonDataBeforeSave((prevData) => {
																		if (prevData) {
																			return prevData?.map((currentChapter) => {
																				if (currentChapter.chapterId === chapter?.chapterId) {
																					const updatedLessons =
																						currentChapter.lessons?.filter((currentLesson) => currentLesson._id !== lesson._id) || [];
																					const updatedLessonIds = updatedLessons?.map((lesson) => lesson._id) || [];
																					return {
																						...currentChapter,
																						lessons: updatedLessons,
																						lessonIds: updatedLessonIds,
																					};
																				}
																				return currentChapter;
																			});
																		}
																		return prevData;
																	});

																	updateLesson({
																		...lesson,
																		usedInCourses: lesson.usedInCourses?.filter((id) => id !== courseId) || [],
																		updatedAt: new Date().toISOString(),
																		updatedByName: user ? `${user.firstName} ${user.lastName}` : '',
																		updatedByImageUrl: user?.imageUrl || '',
																		updatedByRole: user?.role || '',
																		createdByName: lesson.createdByName,
																		createdByImageUrl: lesson.createdByImageUrl,
																		createdByRole: lesson.createdByRole,
																		createdAt: lesson.createdAt,
																	});

																	chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
																	setHasUnsavedChanges(true);
																}}>
																<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />
															</IconButton>
														</Tooltip>
													</Box>
												</Box>
											</Box>
										</Reorder.Item>
									);
								})}
					</Reorder.Group>
				)}
			</Collapse>
		</Box>
	);
};

export default AdminCourseEditChapter;
