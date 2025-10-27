import { Box, IconButton, Tooltip, Typography, Collapse } from '@mui/material';
import { useMotionValue, Reorder } from 'framer-motion';
import theme from '../../themes';
import { CreateTwoTone, Delete, NoteAdd, ExpandMore } from '@mui/icons-material';
import { useState, useContext } from 'react';
import { Lesson } from '../../interfaces/lessons';
import { useRaisedShadow } from '../../hooks/useRaisedShadow';
import { ChapterLessonData, ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import CreateLessonDialog from '../forms/newLesson/CreateLessonDialog';
import AddNewLessonDialog from './AddNewLessonDialog';
import { chapterUpdateTrack } from '../../utils/chapterUpdateTrack';
import { LessonsContext } from '../../contexts/LessonsContextProvider';

import { useParams } from 'react-router-dom';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../hooks/useAuth';

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

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);
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
							sx={{ width: '100%', mb: '0rem' }}
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
															{lesson.title}
														</Typography>
													</Box>
													<Box sx={{ flex: 1 }}>
														<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.55rem' : '0.85rem' }}>
															{lesson.isActive ? 'Published' : 'Unpublished'}
														</Typography>
													</Box>
													<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 4 }}>
														<Box sx={{ mr: '1rem' }}>
															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.6rem' : '0.85rem' }}>
																({lesson.type})
															</Typography>
														</Box>
														<Tooltip title='Remove Lesson' placement='right' arrow>
															<IconButton
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
