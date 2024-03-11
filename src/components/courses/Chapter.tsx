import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';
import { BaseChapter } from '../../interfaces/chapter';

interface ChapterProps {
	chapter: BaseChapter;
	isEnrolledStatus: boolean;
	firstChapterOrder: number;
	courseId: string;
}

const Chapter = ({ chapter, isEnrolledStatus, firstChapterOrder, courseId }: ChapterProps) => {
	const isFirstChapter: boolean = chapter.order === firstChapterOrder;

	const firstLessonOrder: number = chapter.lessons?.sort((a, b) => a.order - b.order)[0].order;

	return (
		<Box
			sx={{
				marginBottom: '2rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box sx={{ backgroundColor: theme.palette.secondary.main, padding: '1rem 0' }}>
				<Typography variant='h3'>{chapter.title}</Typography>
			</Box>
			{chapter.lessons
				.sort((a, b) => a.order - b.order)
				.map((lesson, index) => (
					<Lesson
						key={index}
						lesson={lesson}
						isEnrolledStatus={isEnrolledStatus}
						lessonOrder={lesson.order}
						isFirstChapter={isFirstChapter}
						firstLessonOrder={firstLessonOrder}
					/>
				))}
		</Box>
	);
};

export default Chapter;
