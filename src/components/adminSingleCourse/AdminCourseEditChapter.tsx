import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useMotionValue, Reorder } from 'framer-motion';
import theme from '../../themes';
import { CreateTwoTone, Delete, FileCopy, NoteAdd } from '@mui/icons-material';
import { useState } from 'react';
import { Lesson } from '../../interfaces/lessons';
import { useRaisedShadow } from '../../hooks/useRaisedShadow';
import { ChapterLessonData, ChapterUpdateTrack } from '../../pages/AdminCourseEditPage';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import CreateLessonDialog from '../forms/newLesson/CreateLessonDialog';
import AddNewLessonDialog from './AddNewLessonDialog';
import { chapterUpdateTrack } from '../../utils/chapterUpdateTrack';

interface AdminCourseEditChapterProps {
	chapter: ChapterLessonData;
	setChapterLessonDataBeforeSave: React.Dispatch<React.SetStateAction<ChapterLessonData[]>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	isMissingField: boolean;
	setDeletedChapterIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const AdminCourseEditChapter = ({
	chapter,
	setChapterLessonDataBeforeSave,
	setIsChapterUpdated,
	setIsMissingField,
	isMissingField,
	setDeletedChapterIds,
}: AdminCourseEditChapterProps) => {
	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);
	const [addNewLessonModalOpen, setAddNewLessonModalOpen] = useState<boolean>(false);

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	return (
		<Box
			sx={{
				margin: '1.5rem 0 4rem 0',
				width: '100%',
				padding: '1rem',
				boxShadow: '0 0.3rem 1rem 0 rgba(0,0,0,0.25)',
				transition: '0.3s',
				borderRadius: '0.3rem',
				':hover': {
					boxShadow: '0 0.3rem 1rem 0.3rem rgba(0,0,0,0.5)',
				},
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: '1rem',
				}}>
				<Box>
					<CustomTextField
						value={chapter.title}
						onChange={(e) => {
							chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);

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
					{isMissingField && chapter?.title === '' && <CustomErrorMessage>Please enter chapter title</CustomErrorMessage>}
				</Box>
				<Box sx={{ display: 'flex' }}>
					<Box sx={{ marginRight: '1rem' }}>
						<Tooltip title='Add Lesson' placement='top'>
							<IconButton
								onClick={() => {
									setAddNewLessonModalOpen(true);
								}}>
								<NoteAdd />
							</IconButton>
						</Tooltip>

						<AddNewLessonDialog
							setAddNewLessonModalOpen={setAddNewLessonModalOpen}
							addNewLessonModalOpen={addNewLessonModalOpen}
							chapter={chapter}
							setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
							setIsChapterUpdated={setIsChapterUpdated}
						/>

						<Tooltip title='Create Lesson' placement='top'>
							<IconButton
								onClick={() => {
									setIsNewLessonModalOpen(true);
								}}>
								<CreateTwoTone />
							</IconButton>
						</Tooltip>

						<CreateLessonDialog
							chapter={chapter}
							isNewLessonModalOpen={isNewLessonModalOpen}
							setIsNewLessonModalOpen={setIsNewLessonModalOpen}
							createNewLesson={false}
							setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
							setIsChapterUpdated={setIsChapterUpdated}
						/>
					</Box>
					<Box>
						<Tooltip title='Clone Chapter' placement='top'>
							<IconButton>
								<FileCopy />
							</IconButton>
						</Tooltip>
						<Tooltip title='Delete Chapter' placement='top'>
							<IconButton
								onClick={() => {
									setChapterLessonDataBeforeSave((prevData) => {
										if (prevData !== undefined) {
											return prevData.filter((currentChapter) => chapter.chapterId !== currentChapter.chapterId);
										}
										return prevData;
									});

									setDeletedChapterIds((prevIds) => {
										if (!chapter.chapterId.includes('temp_chapter_id')) {
											return [...prevIds, chapter.chapterId];
										}
										return prevIds;
									});
								}}>
								<Delete />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
			</Box>
			{chapter?.lessonIds?.length !== 0 && (
				<Reorder.Group
					axis='y'
					values={chapter?.lessons}
					onReorder={(newLessons: Lesson[]): void => {
						setChapterLessonDataBeforeSave((prevData) => {
							if (prevData) {
								return prevData.map((currentChapter) => {
									if (currentChapter.chapterId === chapter?.chapterId) {
										return {
											...currentChapter,
											lessons: newLessons,
											lessonIds: newLessons.map((lesson: Lesson) => lesson._id),
										};
									}
									return currentChapter; // Return unchanged chapter if not the one being updated
								});
							}
							return prevData;
						});
						chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
					}}>
					{chapter?.lessons &&
						chapter.lessons?.map((lesson) => {
							return (
								<Reorder.Item key={lesson._id} value={lesson} style={{ boxShadow, listStyle: 'none' }}>
									<Box
										key={lesson._id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											height: '3.5rem',
											width: '100%',
											backgroundColor: theme.bgColor?.common,
											margin: '1.25rem 0',
											borderRadius: '0.25rem',
											boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
											transition: '0.4s',
											':hover': {
												boxShadow: '0.1rem 0 0.5rem 0.3rem rgba(0, 0, 0, 0.3)',
												cursor: 'pointer',
											},
										}}>
										<Box
											sx={{
												height: '3.5rem',
												width: '5rem',
											}}>
											<img
												src={lesson.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
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
											<Box>
												<Typography variant='body1'>{lesson.title}</Typography>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<Box sx={{ mr: '1rem' }}>
													<Typography variant='body1'>({lesson.type})</Typography>
												</Box>
												<Tooltip title='Remove Lesson' placement='left'>
													<IconButton
														onClick={() => {
															setChapterLessonDataBeforeSave((prevData) => {
																if (prevData) {
																	return prevData.map((currentChapter) => {
																		if (currentChapter.chapterId === chapter?.chapterId) {
																			const updatedLessons = currentChapter.lessons.filter((currentLesson) => currentLesson._id !== lesson._id);
																			const updatedLessonIds = updatedLessons.map((lesson) => lesson._id);
																			return {
																				...currentChapter,
																				lessons: updatedLessons,
																				lessonIds: updatedLessonIds,
																			};
																		}
																		return currentChapter; // Return unchanged chapter if not the one being updated
																	});
																}
																return prevData;
															});

															chapterUpdateTrack(chapter.chapterId, setIsChapterUpdated);
														}}>
														<Delete />
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
