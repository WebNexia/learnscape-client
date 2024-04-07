import { Box, Button, IconButton, Typography } from '@mui/material';
import { useMotionValue, Reorder } from 'framer-motion';
import theme from '../themes';
import { Delete } from '@mui/icons-material';
import { BaseChapter } from '../interfaces/chapter';
import { useState } from 'react';
import { Lesson } from '../interfaces/lessons';
import { useRaisedShadow } from '../hooks/use-raised-shadow';
import { SingleCourse } from '../interfaces/course';
import { ChapterUpdateTrack } from '../pages/AdminCourseEditPage';
import CustomTextField from './forms/CustomFields/CustomTextField';
import CustomErrorMessage from './forms/CustomFields/CustomErrorMessage';

interface AdminCourseEditChapterProps {
	chapter: BaseChapter;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	setChapters: React.Dispatch<React.SetStateAction<BaseChapter[]>>;
	setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>;
	setIsMissingField: React.Dispatch<React.SetStateAction<boolean>>;
	isMissingField: boolean;
}

const AdminCourseEditChapter = ({
	chapter,
	setSingleCourse,
	setChapters,
	setIsChapterUpdated,
	setIsMissingField,
	isMissingField,
}: AdminCourseEditChapterProps) => {
	const [lessons, setLessons] = useState<Lesson[]>(chapter.lessons);

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	return (
		<Box
			sx={{
				margin: '1.5rem 0 4rem 0',
				width: '90%',
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
						sx={{ backgroundColor: theme.bgColor?.common }}
						value={chapter.title}
						onChange={(e) => {
							setIsChapterUpdated((prevData: ChapterUpdateTrack[]) => {
								if (prevData) {
									prevData = prevData.map((data) => {
										if (data.chapterId === chapter._id) {
											return {
												...data,
												isUpdated: true,
											};
										}
										return data;
									})!;
								}
								return prevData;
							});
							setSingleCourse((prevCourse) => {
								if (prevCourse) {
									const updatedChapters = prevCourse.chapters.map(
										(currentChapter) => {
											if (chapter._id === currentChapter._id) {
												// Return a new chapter object with updated lessons
												return {
													...currentChapter,
													title: e.target.value,
												};
											}
											return currentChapter;
										}
									);

									// Return a new course object with updated chapters
									setChapters(updatedChapters);
									return {
										...prevCourse,
										chapters: updatedChapters,
									};
								}
								return prevCourse; // Return unchanged if prevCourse is undefined
							});
							setIsMissingField(false);
						}}
						error={isMissingField && chapter?.title === ''}
					/>
					{isMissingField && chapter?.title === '' && (
						<CustomErrorMessage>Please enter chapter name</CustomErrorMessage>
					)}
				</Box>
				<Box>
					<Button
						variant='contained'
						sx={{
							textTransform: 'capitalize',
							backgroundColor: theme.bgColor?.greenPrimary,
							':hover': {
								backgroundColor: theme.bgColor?.common,
								color: theme.textColor?.greenPrimary.main,
							},
						}}>
						Add Lesson
					</Button>
					<Button
						variant='contained'
						sx={{
							textTransform: 'capitalize',
							backgroundColor: theme.bgColor?.greenPrimary,
							ml: '0.75rem',
							':hover': {
								backgroundColor: theme.bgColor?.delete,
								color: theme.textColor?.common.main,
							},
						}}>
						Delete Chapter
					</Button>
				</Box>
			</Box>
			<Reorder.Group
				axis='y'
				values={lessons}
				onReorder={(newLessons): void => {
					setLessons(newLessons);
					setSingleCourse((prevCourse) => {
						if (prevCourse) {
							const updatedChapters = prevCourse.chapters.map((currentChapter) => {
								if (chapter._id === currentChapter._id) {
									// Return a new chapter object with updated lessons
									return {
										...currentChapter,
										lessons: newLessons,
										lessonIds: newLessons.map((newLesson) => newLesson._id),
									};
								}
								return currentChapter;
							});

							// Return a new course object with updated chapters
							setChapters(updatedChapters);
							return {
								...prevCourse,
								chapters: updatedChapters,
							};
						}
						return prevCourse; // Return unchanged if prevCourse is undefined
					});
					setIsChapterUpdated((prevData: ChapterUpdateTrack[]) => {
						if (prevData) {
							prevData = prevData.map((data) => {
								if (data.chapterId === chapter._id) {
									return { ...data, isUpdated: true };
								}
								return data;
							})!;
						}
						return prevData;
					});
				}}>
				{lessons.map((lesson) => {
					return (
						<Reorder.Item
							key={lesson._id}
							value={lesson}
							style={{ boxShadow, listStyle: 'none' }}>
							<Box
								key={lesson._id}
								sx={{
									display: 'flex',
									alignItems: 'center',
									height: '5rem',
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
										height: '5rem',
										width: '6rem',
									}}>
									<img
										src={lesson.imageUrl}
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
									<Box>
										<IconButton
											onClick={() => {
												setLessons(
													lessons.filter(
														(currentLesson) =>
															currentLesson._id !== lesson._id
													)
												);
												const updatedLessonIds: string[] = lessons.reduce(
													(acc: string[], currentLesson: Lesson) => {
														if (currentLesson._id !== lesson._id) {
															acc.push(currentLesson._id);
														}
														return acc;
													},
													[]
												);

												setSingleCourse((prevCourse) => {
													if (prevCourse) {
														const updatedChapters =
															prevCourse.chapters.map(
																(currentChapter) => {
																	if (
																		chapter._id ===
																		currentChapter._id
																	) {
																		// Return a new chapter object with updated lessons
																		return {
																			...currentChapter,
																			lessons: lessons.filter(
																				(currentLesson) =>
																					currentLesson._id !==
																					lesson._id
																			),
																			lessonIds:
																				updatedLessonIds,
																		};
																	}
																	return currentChapter;
																}
															);

														// Return a new course object with updated chapters
														setChapters(updatedChapters);
														return {
															...prevCourse,
															chapters: updatedChapters,
														};
													}
													return prevCourse; // Return unchanged if prevCourse is undefined
												});
												setIsChapterUpdated(
													(prevData: ChapterUpdateTrack[]) => {
														if (prevData) {
															prevData = prevData.map((data) => {
																if (
																	data.chapterId === chapter._id
																) {
																	return {
																		...data,
																		isUpdated: true,
																	};
																}
																return data;
															})!;
														}
														return prevData;
													}
												);
											}}>
											<Delete />
										</IconButton>
									</Box>
								</Box>
							</Box>
						</Reorder.Item>
					);
				})}
			</Reorder.Group>
		</Box>
	);
};

export default AdminCourseEditChapter;
