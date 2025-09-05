import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useMotionValue, Reorder } from 'framer-motion';
import theme from '../../themes';
import { CreateTwoTone, Delete, NoteAdd } from '@mui/icons-material';
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
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { useParams } from 'react-router-dom';

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

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);
	const { updateLesson } = useContext(LessonsContext);
	const { user } = useContext(UserAuthContext);
	const { courseId } = useParams();

	return (
		<Box
			sx={{
				'margin': '1.5rem 0 3rem 0',
				'width': '100%',
				'padding': '1rem',
				'boxShadow': '0 0.3rem 1rem 0 rgba(0,0,0,0.25)',
				'transition': '0.3s',
				'borderRadius': '0.3rem',
				':hover': {
					boxShadow: '0 0.3rem 1rem 0.3rem rgba(0,0,0,0.5)',
				},
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}>
				<Box sx={{ width: '40%' }}>
					<Tooltip title='Max 50 Characters' placement='top' arrow>
						<CustomTextField
							sx={{ marginTop: '0.85rem', width: '100%' }}
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
						/>
					</Tooltip>
					{isMissingField && chapter?.title === '' && <CustomErrorMessage>Please enter chapter title</CustomErrorMessage>}
				</Box>
				<Box sx={{ display: 'flex' }}>
					<Box sx={{ marginRight: '0.25rem' }}>
						<Tooltip title='Add Lesson' placement='top' arrow>
							<IconButton
								onClick={() => {
									setAddNewLessonModalOpen(true);
								}}>
								<NoteAdd fontSize='small' />
							</IconButton>
						</Tooltip>

						<AddNewLessonDialog
							setAddNewLessonModalOpen={setAddNewLessonModalOpen}
							addNewLessonModalOpen={addNewLessonModalOpen}
							chapter={chapter}
							setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
							setIsChapterUpdated={setIsChapterUpdated}
							setHasUnsavedChanges={setHasUnsavedChanges}
						/>

						<Tooltip title='Create Lesson' placement='top' arrow>
							<IconButton
								onClick={() => {
									setIsNewLessonModalOpen(true);
								}}>
								<CreateTwoTone fontSize='small' />
							</IconButton>
						</Tooltip>

						<CreateLessonDialog
							chapter={chapter}
							isNewLessonModalOpen={isNewLessonModalOpen}
							setIsNewLessonModalOpen={setIsNewLessonModalOpen}
							createNewLesson={false}
							setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
							setIsChapterUpdated={setIsChapterUpdated}
							setHasUnsavedChanges={setHasUnsavedChanges}
						/>
					</Box>
					<Box>
						{/* <Tooltip title='Clone Chapter' placement='top'>
							<IconButton>
								<FileCopy fontSize='small' />
							</IconButton>
						</Tooltip> */}
						<Tooltip title='Delete Chapter' placement='top' arrow>
							<IconButton
								onClick={() => {
									setChapterLessonDataBeforeSave((prevData) => {
										if (prevData !== undefined) {
											return prevData?.filter((currentChapter) => chapter.chapterId !== currentChapter.chapterId);
										}
										return prevData;
									});

									setHasUnsavedChanges(true);

									setDeletedChapterIds((prevIds) => {
										if (!chapter.chapterId.includes('temp_chapter_id')) {
											return [...prevIds, chapter.chapterId];
										}
										return prevIds;
									});
								}}>
								<Delete fontSize='small' />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
			</Box>
			{chapter?.lessonIds?.length !== 0 && (
				<Reorder.Group
					axis='y'
					values={chapter?.lessons || []}
					onReorder={(newLessons: Lesson[]): void => {
						setChapterLessonDataBeforeSave((prevData) => {
							if (prevData) {
								return prevData.map((currentChapter) => {
									if (currentChapter.chapterId === chapter?.chapterId) {
										return {
											...currentChapter,
											lessons: newLessons,
											lessonIds: newLessons?.map((lesson: Lesson) => lesson._id),
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
							.map((lesson) => {
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
												'margin': '1rem 0',
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
													height: '2.25rem',
													width: '3rem',
												}}>
												<img
													src={lesson?.imageUrl || 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Img'}
													alt='lesson_img'
													height='100%'
													width='100%'
													style={{
														borderRadius: '0.25rem 0 0 0.25rem',
													}}
												/>
											</Box>
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													margin: '0 1rem',
													width: '100%',
												}}>
												<Box sx={{ flex: 4 }}>
													<Typography variant='body2'>{lesson.title}</Typography>
												</Box>
												<Box sx={{ flex: 1 }}>
													<Typography variant='body2'>{lesson.isActive ? 'Published' : 'Unpublished'}</Typography>
												</Box>
												<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 4 }}>
													<Box sx={{ mr: '1rem' }}>
														<Typography variant='body2'>({lesson.type})</Typography>
													</Box>
													<Tooltip title='Remove Lesson' placement='right' arrow>
														<IconButton
															onClick={() => {
																setChapterLessonDataBeforeSave((prevData) => {
																	if (prevData) {
																		return prevData.map((currentChapter) => {
																			if (currentChapter.chapterId === chapter?.chapterId) {
																				const updatedLessons = currentChapter.lessons?.filter((currentLesson) => currentLesson._id !== lesson._id);
																				const updatedLessonIds = updatedLessons?.map((lesson) => lesson._id);
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
															<Delete fontSize='small' />
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
		</Box>
	);
};

export default AdminCourseEditChapter;
