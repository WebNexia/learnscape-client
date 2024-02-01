import { Box, Typography } from '@mui/material';
import theme from '../themes';
import CourseSectionLesson from './CourseSectionLesson';

const CourseSection = ({ section }: any) => {
	return (
		<Box
			sx={{
				marginBottom: '2rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box sx={{ backgroundColor: theme.palette.secondary.main, padding: '1rem 0' }}>
				<Typography variant='h3'>{section.title}</Typography>
			</Box>
			{section.lessons.map((lesson: any) => (
				<CourseSectionLesson lesson={lesson} />
			))}
		</Box>
	);
};

export default CourseSection;
