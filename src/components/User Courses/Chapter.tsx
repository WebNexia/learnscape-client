import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';
import { LessonById } from '../../interfaces/lessons';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';

interface ChapterProps {
	chapter: ChapterLessonData;
	isEnrolledStatus: boolean;
	nextChapterFirstLessonId: string;
}

const Chapter = ({ chapter, isEnrolledStatus, nextChapterFirstLessonId }: ChapterProps) => {
	return (
		<Box
			sx={{
				marginBottom: '2rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box sx={{ backgroundColor: theme.palette.secondary.main, padding: '1rem 0' }}>
				<Typography variant='h3'>{chapter.title}</Typography>
			</Box>
			{chapter &&
				chapter.lessons &&
				chapter.lessons.map((lesson: LessonById, index) => {
					let nextLessonId: string = '';

					if (index !== chapter.lessons.length - 1) {
						nextLessonId = chapter.lessons[index + 1]._id;
					}
					let lessonOrder: number = index + 1;
					return (
						<Lesson
							key={lesson._id}
							lesson={lesson}
							isEnrolledStatus={isEnrolledStatus}
							nextLessonId={nextLessonId}
							nextChapterFirstLessonId={nextChapterFirstLessonId}
							lessonOrder={lessonOrder}
						/>
					);
				})}
		</Box>
	);
};

export default Chapter;
