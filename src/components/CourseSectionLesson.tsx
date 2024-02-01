import { Box, Typography } from '@mui/material';
import theme from '../themes';
import { Lock } from '@mui/icons-material';

interface CourseSectionLessonProps {
	lesson: any;
}

const CourseSectionLesson = ({ lesson }: CourseSectionLessonProps) => {
	return (
		<Box sx={{ display: 'flex', height: '4rem', borderBottom: `0.1rem solid ${theme.border.lightMain}` }}>
			<Box sx={{ height: '4rem', width: '5rem' }}>
				<img src={lesson.imageUrl} alt='lesson_pic' width='100%' height='100%' />
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					px: '1rem',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
					<Typography variant='body2'>{lesson.title}</Typography>
					<Typography variant='body1'>{lesson.topic}</Typography>
				</Box>
				<Box>
					<Lock sx={{ color: theme.border.lightMain }} />
				</Box>
			</Box>
		</Box>
	);
};

export default CourseSectionLesson;
