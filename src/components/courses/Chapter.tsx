import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';
import { BaseChapter } from '../../interfaces/chapter';
import { LessonById } from '../../interfaces/lessons';

interface ChapterProps {
	chapter: BaseChapter;
	isEnrolledStatus: boolean;
	nextChapterFirstLessonId: string;
	nextChapterFirstLessonOrder: number;
}

const Chapter = ({
	chapter,
	isEnrolledStatus,
	nextChapterFirstLessonId,
	nextChapterFirstLessonOrder,
}: ChapterProps) => {
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
				.map((lesson: LessonById, index) => {
					let nextLessonId: string = '';
					let nextLessonOrder: number = 1;
					if (index !== chapter.lessons.length - 1) {
						nextLessonId = chapter.lessons[index + 1]._id;
						nextLessonOrder = chapter.lessons[index + 1].order;
					}
					return (
						<Lesson
							key={lesson._id}
							lesson={lesson}
							isEnrolledStatus={isEnrolledStatus}
							nextLessonId={nextLessonId}
							nextLessonOrder={nextLessonOrder}
							nextChapterFirstLessonId={nextChapterFirstLessonId}
							nextChapterFirstLessonOrder={nextChapterFirstLessonOrder}
						/>
					);
				})}
		</Box>
	);
};

export default Chapter;
