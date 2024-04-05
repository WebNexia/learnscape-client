import { Box, Button, IconButton, Typography } from '@mui/material';
import { useMotionValue, Reorder } from 'framer-motion';
import theme from '../themes';
import { Delete } from '@mui/icons-material';
import { BaseChapter } from '../interfaces/chapter';
import { useState } from 'react';
import { Lesson } from '../interfaces/lessons';
import { useRaisedShadow } from '../hooks/use-raised-shadow';
import { SingleCourse } from '../interfaces/course';

interface AdminCourseEditChapterProps {
	chapter: BaseChapter;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>>;
	setChapters: React.Dispatch<React.SetStateAction<BaseChapter[]>>;
}

const AdminCourseEditChapter = ({
	chapter,
	setSingleCourse,
	setChapters,
}: AdminCourseEditChapterProps) => {
	const [lessons, setLessons] = useState<Lesson[]>(chapter.lessons);

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	return (
		<Box key={chapter._id} sx={{ margin: '1.5rem 0 3rem 0', width: '90%' }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: '1rem',
				}}>
				<Box>
					<Typography variant='h6'>{chapter.title}</Typography>
				</Box>
				<Box>
					<Button
						variant='contained'
						sx={{
							backgroundColor: theme.bgColor?.greenPrimary,
							':hover': {
								backgroundColor: theme.bgColor?.common,
								color: theme.textColor?.greenPrimary.main,
							},
						}}>
						Add Lesson
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
										<IconButton>
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
