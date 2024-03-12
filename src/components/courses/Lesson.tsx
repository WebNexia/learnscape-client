import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { Lock } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

interface LessonProps {
	lesson: any;
	isEnrolledStatus: boolean;
	lessonOrder: number;
	firstLessonOrder: number;
	isFirstChapter: boolean;
	userLessonIdsList: string[];
}

const Lesson = ({
	lesson,
	isEnrolledStatus,
	lessonOrder,
	isFirstChapter,
	firstLessonOrder,
	userLessonIdsList,
}: LessonProps) => {
	const { userId, courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const isFirstLesson: boolean = lessonOrder === firstLessonOrder;

	useEffect(() => {
		const createUserLesson = async () => {
			try {
				const response = await axios.post(`${base_url}/userLessons`, {
					lessonId: lesson._id,
					userId,
					courseId,
					userCourseId,
					currentQuestion: 1,
					lessonOrder,
					isCompleted: false,
					isInProgress: true,
				});

				const currentUserLessonIds = localStorage.getItem('userLessonIds');
				let updatedUserLessonIds: string[] = [];

				if (currentUserLessonIds !== null) {
					updatedUserLessonIds = JSON.parse(currentUserLessonIds).push(response.data[0]?._id);
				}
			} catch (error) {
				console.log(error);
			}
		};

		if (isEnrolledStatus && isFirstLesson && isFirstChapter && userCourseId !== 'none') {
			createUserLesson();
		}
	}, [userCourseId]);

	return (
		<Box
			sx={{
				display: 'flex',
				height: '4rem',
				borderBottom: `0.1rem solid ${theme.border.lightMain}`,
				cursor: 'pointer',
			}}
			onClick={() => {
				if (isEnrolledStatus && userLessonIdsList.includes(lesson._id)) {
					navigate(`/user/${userId}/lesson/${lesson._id}`);
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}
			}}>
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
