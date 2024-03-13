import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { Lock } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface LessonProps {
	lesson: any;
	isEnrolledStatus: boolean;
}

const Lesson = ({ lesson, isEnrolledStatus }: LessonProps) => {
	const { userId } = useParams();
	const navigate = useNavigate();

	const handleLessonClick = () => {
		const updatedUserLessonIds = localStorage.getItem('userLessonIds');
		let updatedUserLessonIdsList: string[] = [];

		if (updatedUserLessonIds !== null) {
			updatedUserLessonIdsList = JSON.parse(updatedUserLessonIds);
		}
		if (isEnrolledStatus && updatedUserLessonIdsList.includes(lesson._id)) {
			navigate(`/user/${userId}/lesson/${lesson._id}`);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				height: '4rem',
				borderBottom: `0.1rem solid ${theme.border.lightMain}`,
				cursor: 'pointer',
			}}
			onClick={handleLessonClick}>
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
					<Typography variant='body2'>Lesson {lesson.order}</Typography>
					<Typography variant='body1'>{lesson.title}</Typography>
				</Box>
				<Box>
					<Lock sx={{ color: theme.border.lightMain }} />
				</Box>
			</Box>
		</Box>
	);
};

export default Lesson;
