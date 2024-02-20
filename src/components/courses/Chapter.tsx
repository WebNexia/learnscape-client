import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';

interface ChapterProps {
	chapter: BaseChapter;
}

const Chapter = ({ chapter }: ChapterProps) => {
	return (
		<Box
			sx={{
				marginBottom: '2rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box sx={{ backgroundColor: theme.palette.secondary.main, padding: '1rem 0' }}>
				<Typography variant='h3'>{chapter.title}</Typography>
			</Box>
			{chapter.lessons.map((lesson) => (
				<Lesson lesson={lesson} />
			))}
		</Box>
	);
};

export default Chapter;
