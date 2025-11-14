import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { CheckCircleOutlineRounded, Lock } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserLessonDataStorage } from '../../contexts/UserCourseLessonDataContextProvider';
import { LessonById } from '../../interfaces/lessons';
import { useContext, useEffect, useState, useMemo } from 'react';
import ProgressIcon from '../../assets/ProgressIcon.png';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useUserLessonsForCourse } from '../../hooks/useUserLessonsForCourse';

interface LessonProps {
	lesson: LessonById;
	isEnrolledStatus: boolean;
	nextLessonId: string;
	nextChapterFirstLessonId: string;
	lessonOrder: number;
	isLastLessonOfChapter?: boolean;
	currentChapterHasChecklist?: boolean;
	currentChapterChecklistCompleted?: boolean;
}

const Lesson = ({ lesson, isEnrolledStatus, nextLessonId, nextChapterFirstLessonId, lessonOrder }: LessonProps) => {
	const { courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const { isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;

	// Fetch user lessons for current course using the new hook
	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');
	const parsedUserLessonData = userLessonsData || [];

	const [userLessonData, setUserLessonData] = useState<UserLessonDataStorage[]>(parsedUserLessonData);
	const [isLessonInProgress, setIsLessonInProgress] = useState<boolean>(false);
	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
	const [isLessonRegisteredInThisCourse, setIsLessonRegisteredInThisCourse] = useState<boolean>(false);

	useEffect(() => {
		const fetchUserLessonProgress = () => {
			// Update local state with hook data
			setUserLessonData(parsedUserLessonData);

			// Find current lesson data and update states
			parsedUserLessonData?.forEach((data: UserLessonDataStorage) => {
				if (data.lessonId === lesson._id && data.courseId === courseId) {
					setIsLessonInProgress(data.isInProgress);
					setIsLessonCompleted(data.isCompleted);
					setIsLessonRegisteredInThisCourse(true);
				}
			});
		};

		fetchUserLessonProgress();
	}, [parsedUserLessonData, lesson._id, courseId]);

	const handleLessonClick = () => {
		const navigateToLesson = (lessonId: string, nextId?: string) => {
			const url = `/course/${courseId}/userCourseId/${userCourseId}/lesson/${lessonId}`;
			const queryParams = `?isCompleted=${isLessonCompleted}`;
			if (nextId) {
				const nextQuery = `&next=${nextId}`;
				navigate(`${url}${queryParams}${nextQuery}`);
			} else {
				navigate(`${url}${queryParams}`);
			}

			window.scrollTo({ top: 0, behavior: 'smooth' });
		};

		if (isEnrolledStatus && isLessonRegisteredInThisCourse) {
			if (userLessonData?.some((data: UserLessonDataStorage) => data.lessonId === lesson._id && data.courseId === courseId) && nextLessonId) {
				navigateToLesson(lesson._id, nextLessonId);
			} else if (!nextLessonId && nextChapterFirstLessonId) {
				navigateToLesson(lesson._id, nextChapterFirstLessonId);
			} else if (!nextChapterFirstLessonId) {
				navigateToLesson(lesson._id);
			}
		}
	};

	const isAccessible = useMemo(() => {
		if (!isEnrolledStatus) return false;
		return isLessonRegisteredInThisCourse || isLessonInProgress || isLessonCompleted;
	}, [isEnrolledStatus, isLessonRegisteredInThisCourse, isLessonInProgress, isLessonCompleted]);

	return (
		<Box
			sx={{
				'display': 'flex',
				'height':
					isEnrolledStatus && isLessonInProgress && isMobileSize
						? '3.5rem'
						: !(isEnrolledStatus && isLessonInProgress) && isMobileSize
							? '2.5rem'
							: isEnrolledStatus && isLessonInProgress
								? '4.5rem'
								: '3rem',
				'borderBottom': `0.1rem solid ${theme.border.lightMain}`,
				'backgroundColor': isEnrolledStatus && isLessonInProgress ? '#A8D8A8' : 'white',
				'cursor': isAccessible ? 'pointer' : '',
				'borderRadius': lessonOrder === 1 ? '0.3rem 0.3rem 0 0 ' : '0rem',
				':hover': {
					backgroundColor: !isLessonInProgress ? '#F0F2F5' : '',
					borderColor: theme.border.lightMain,
				},
			}}
			onClick={handleLessonClick}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					px: isMobileSize ? '0.5rem' : '1rem',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 8 }}>
					<Typography
						sx={{
							fontSize: isVerySmallScreen ? '0.6rem' : isRotatedMedium ? '0.7rem' : isSmallScreen ? '0.75rem' : '0.8rem',
						}}>
						{lesson.title}
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', flex: 4, justifyContent: 'flex-end' }}>
					<Box>
						<Typography
							sx={{
								fontSize: isVerySmallScreen ? '0.55rem' : isRotatedMedium ? '0.65rem' : isSmallScreen ? '0.75rem' : '0.75rem',
								marginRight: '1rem',
							}}>
							{lesson.type}
						</Typography>
					</Box>
					<Box>
						{isEnrolledStatus && isLessonInProgress && isLessonRegisteredInThisCourse ? (
							<img src={ProgressIcon} alt='' style={{ height: isMobileSize ? '0.9rem' : '1.5rem' }} />
						) : isEnrolledStatus && isLessonCompleted && isLessonRegisteredInThisCourse ? (
							<CheckCircleOutlineRounded sx={{ color: theme.palette.success.main, fontSize: isMobileSize ? '0.9rem' : '1.35rem' }} />
						) : !isEnrolledStatus || (!isLessonInProgress && !isLessonCompleted) || !isLessonRegisteredInThisCourse ? (
							<Lock sx={{ color: theme.border.lightMain, fontSize: isMobileSize ? '0.9rem' : '1.35rem' }} />
						) : null}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Lesson;
