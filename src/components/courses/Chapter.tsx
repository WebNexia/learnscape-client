import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';
import { BaseChapter } from '../../interfaces/chapter';
import { LessonById } from '../../interfaces/lessons';

interface ChapterProps {
	chapter: BaseChapter;
	isEnrolledStatus: boolean;
}

const Chapter = ({ chapter, isEnrolledStatus }: ChapterProps) => {
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
					return <Lesson key={index} lesson={lesson} isEnrolledStatus={isEnrolledStatus} />;
				})}
		</Box>
	);
};

export default Chapter;
