import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { CheckCircleOutlineRounded, Lock } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserLessonDataStorage } from '../../contexts/UserCourseLessonDataContextProvider';
import { LessonById } from '../../interfaces/lessons';
import { useEffect, useState } from 'react';
import ProgressIcon from '../../assets/ProgressIcon.png';

interface LessonProps {
	lesson: LessonById;
	isEnrolledStatus: boolean;
	nextLessonId: string;
	nextLessonOrder: number;
	nextChapterFirstLessonId: string;
	nextChapterFirstLessonOrder: number;
}

const Lesson = ({
	lesson,
	isEnrolledStatus,
	nextLessonId,
	nextLessonOrder,
	nextChapterFirstLessonId,
	nextChapterFirstLessonOrder,
}: LessonProps) => {
	const { userId, courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const currentUserLessonData: string | null = localStorage.getItem('userLessonData');

	let parsedUserLessonData: UserLessonDataStorage[] = [];
	if (currentUserLessonData !== null) {
		parsedUserLessonData = JSON.parse(currentUserLessonData);
	}

	const [userLessonData, setUserLessonData] =
		useState<UserLessonDataStorage[]>(parsedUserLessonData);
	const [isLessonInProgress, setIsLessonInProgress] = useState<boolean>(false);
	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
	const [isLessonRegisteredInThisCourse, setIsLessonRegisteredInThisCourse] =
		useState<boolean>(false);

	useEffect(() => {
		const fetchUserLessonProgress = () => {
			setUserLessonData(parsedUserLessonData);

			setUserLessonData((prevData) => {
				prevData.forEach((data: UserLessonDataStorage) => {
					if (data.lessonId === lesson._id && data.courseId === courseId) {
						setIsLessonInProgress(data.isInProgress);
						setIsLessonCompleted(data.isCompleted);
						setIsLessonRegisteredInThisCourse(true);
					}
				});
				return prevData;
			});
		};

		fetchUserLessonProgress();
	}, [currentUserLessonData]);

	const handleLessonClick = () => {
		const navigateToLesson = (lessonId: string, nextId?: string, nextOrder?: number) => {
			const url = `/user/${userId}/course/${courseId}/userCourseId/${userCourseId}/lesson/${lessonId}`;
			const queryParams = `?isCompleted=${isLessonCompleted}`;

			if (nextId && nextOrder) {
				const nextQuery = `&next=${nextId}&nextLessonOrder=${nextOrder}`;
				navigate(`${url}${queryParams}${nextQuery}`);
			} else {
				navigate(`${url}${queryParams}`);
			}

			window.scrollTo({ top: 0, behavior: 'smooth' });
		};

		if (isEnrolledStatus && isLessonRegisteredInThisCourse) {
			if (
				userLessonData.some(
					(data: UserLessonDataStorage) =>
						data.lessonId === lesson._id && data.courseId === courseId
				) &&
				nextLessonId
			) {
				navigateToLesson(lesson._id, nextLessonId, nextLessonOrder);
			} else if (!nextLessonId && nextChapterFirstLessonId) {
				navigateToLesson(lesson._id, nextChapterFirstLessonId, nextChapterFirstLessonOrder);
			} else if (!nextChapterFirstLessonId) {
				navigateToLesson(lesson._id);
			}
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				height: isEnrolledStatus && isLessonInProgress ? '8rem' : '4rem',
				borderBottom: `0.1rem solid ${theme.border.lightMain}`,
				backgroundColor:
					isEnrolledStatus && isLessonInProgress
						? theme.bgColor?.lessonInProgress
						: 'white',
				cursor: 'pointer',
			}}
			onClick={handleLessonClick}>
			<Box
				sx={{
					height: isEnrolledStatus && isLessonInProgress ? '8rem' : '4rem',
					width: isEnrolledStatus && isLessonInProgress ? '10rem' : '5rem',
				}}>
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
					<Typography
						variant='body2'
						sx={{ color: isEnrolledStatus && isLessonInProgress ? 'white' : null }}>
						Lesson {lesson.order}
					</Typography>
					<Typography
						variant='body1'
						sx={{ color: isEnrolledStatus && isLessonInProgress ? 'white' : null }}>
						{lesson.title}
					</Typography>
				</Box>
				<Box>
					{isEnrolledStatus && isLessonInProgress && isLessonRegisteredInThisCourse ? (
						<img src={ProgressIcon} alt='' />
					) : !isEnrolledStatus ||
					  (!isLessonInProgress && !isLessonCompleted) ||
					  !isLessonRegisteredInThisCourse ? (
						<Lock sx={{ color: theme.border.lightMain }} />
					) : (
						<CheckCircleOutlineRounded sx={{ color: theme.palette.success.main }} />
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default Lesson;
