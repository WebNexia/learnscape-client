import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { CheckCircleOutlineRounded, Lock } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserLessonDataStorage } from '../../contexts/UserCourseLessonDataContextProvider';
import { LessonById } from '../../interfaces/lessons';
import { useContext, useEffect, useState } from 'react';
import ProgressIcon from '../../assets/ProgressIcon.png';
import { LessonType } from '../../interfaces/enums';
import { QuizSubmissionsContext } from '../../contexts/QuizSubmissionsContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface LessonProps {
	lesson: LessonById;
	isEnrolledStatus: boolean;
	nextLessonId: string;
	nextChapterFirstLessonId: string;
	lessonOrder: number;
}

const Lesson = ({ lesson, isEnrolledStatus, nextLessonId, nextChapterFirstLessonId, lessonOrder }: LessonProps) => {
	const { userId, courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const { isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;

	const { sortedUserQuizSubmissionsData, isUserLoaded, fetchQuizSubmissionsByUserId } = useContext(QuizSubmissionsContext);

	const currentUserLessonData: string | null = localStorage.getItem('userLessonData');

	let parsedUserLessonData: UserLessonDataStorage[] = [];
	if (currentUserLessonData !== null) {
		parsedUserLessonData = JSON.parse(currentUserLessonData);
	}

	const [userLessonData, setUserLessonData] = useState<UserLessonDataStorage[]>(parsedUserLessonData);
	const [isLessonInProgress, setIsLessonInProgress] = useState<boolean>(false);
	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
	const [isFeedbackGiven, setIsFeedbackGiven] = useState<boolean>(false);
	const [isLessonRegisteredInThisCourse, setIsLessonRegisteredInThisCourse] = useState<boolean>(false);

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

	useEffect(() => {
		const fetchData = async () => {
			if (!isUserLoaded && sortedUserQuizSubmissionsData.length === 0) {
				try {
					await fetchQuizSubmissionsByUserId(userId!);
				} catch (error) {
					console.error('Error fetching quiz submissions:', error);
				}
			}
		};

		fetchData();
	}, [isUserLoaded, sortedUserQuizSubmissionsData.length, fetchQuizSubmissionsByUserId, userId]);

	useEffect(() => {
		if (sortedUserQuizSubmissionsData.length > 0) {
			const isFeedbackGiven = sortedUserQuizSubmissionsData.find((data) => data.lessonId === lesson._id)?.isChecked;

			setIsFeedbackGiven(isFeedbackGiven || false);
		}
	}, [sortedUserQuizSubmissionsData, lesson._id]);

	const handleLessonClick = () => {
		const navigateToLesson = (lessonId: string, nextId?: string) => {
			const url = `/user/${userId}/course/${courseId}/userCourseId/${userCourseId}/lesson/${lessonId}`;
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
			if (userLessonData.some((data: UserLessonDataStorage) => data.lessonId === lesson._id && data.courseId === courseId) && nextLessonId) {
				navigateToLesson(lesson._id, nextLessonId);
			} else if (!nextLessonId && nextChapterFirstLessonId) {
				navigateToLesson(lesson._id, nextChapterFirstLessonId);
			} else if (!nextChapterFirstLessonId) {
				navigateToLesson(lesson._id);
			}
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				height:
					isEnrolledStatus && isLessonInProgress && isMobileSize
						? '3.5rem'
						: !(isEnrolledStatus && isLessonInProgress) && isMobileSize
						? '2.5rem'
						: isEnrolledStatus && isLessonInProgress
						? '6rem'
						: '4rem',
				borderBottom: `0.1rem solid ${theme.border.lightMain}`,
				backgroundColor: isEnrolledStatus && isLessonInProgress ? theme.bgColor?.lessonInProgress : 'white',
				cursor: isEnrolledStatus ? 'pointer' : '',
				borderRadius: lessonOrder === 1 ? '0.3rem 0.3rem 0 0 ' : '0rem',
			}}
			onClick={handleLessonClick}>
			<Box
				sx={{
					height:
						isEnrolledStatus && isLessonInProgress && isMobileSize
							? '3rem'
							: !(isEnrolledStatus && isLessonInProgress) && isMobileSize
							? '2rem'
							: isEnrolledStatus && isLessonInProgress
							? '6rem'
							: '4rem',
					width:
						isEnrolledStatus && isLessonInProgress && isMobileSize
							? '3rem'
							: !(isEnrolledStatus && isLessonInProgress) && isMobileSize
							? '2rem'
							: isEnrolledStatus && isLessonInProgress
							? '10rem'
							: '5rem',
				}}>
				<img
					src={lesson.imageUrl || 'https://directmobilityonline.co.uk/assets/img/noimage.png'}
					alt='lesson_pic'
					width='100%'
					height='100%'
					style={{
						borderBottom: `0.1rem solid ${theme.border.lightMain}`,
						borderTopLeftRadius: lessonOrder === 1 ? '0.3rem' : 0,
						objectFit: 'cover',
					}}
				/>
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					px: isMobileSize ? '0.5rem' : '1rem',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 10 }}>
					{/* <Typography
						sx={{
							fontSize: isVerySmallScreen ? '0.5rem' : isRotatedMedium ? '0.6rem' : '0.85rem',
							color: isEnrolledStatus && isLessonInProgress ? 'white' : null,
						}}>
						Lesson {lessonOrder}
					</Typography> */}
					<Typography
						sx={{
							fontSize: isVerySmallScreen ? '0.6rem' : isRotatedMedium ? '0.75rem' : isSmallScreen ? '0.85rem' : '1rem',
							color: isEnrolledStatus && isLessonInProgress ? 'white' : null,
						}}>
						{lesson.title}
					</Typography>
				</Box>
				<Box sx={{ flex: 2 }}>
					{lesson.type === LessonType.QUIZ && isLessonRegisteredInThisCourse && isLessonCompleted && (
						<Box>
							<Typography sx={{ fontSize: isVerySmallScreen ? '0.45rem' : isRotatedMedium ? '0.65rem' : isSmallScreen ? '0.75rem' : '0.85rem' }}>
								{isFeedbackGiven ? 'Checked' : 'Unchecked'}
							</Typography>
						</Box>
					)}
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', flex: 4, justifyContent: 'flex-end' }}>
					<Box>
						<Typography
							sx={{
								fontSize: isVerySmallScreen ? '0.45rem' : isRotatedMedium ? '0.65rem' : isSmallScreen ? '0.75rem' : '0.85rem',
								marginRight: '1rem',
								color: isEnrolledStatus && isLessonInProgress && isLessonRegisteredInThisCourse ? theme.textColor?.common.main : 'inherit',
							}}>
							{lesson.type}
						</Typography>
					</Box>
					<Box>
						{isEnrolledStatus && isLessonInProgress && isLessonRegisteredInThisCourse ? (
							<img src={ProgressIcon} alt='' style={{ height: isMobileSize ? '0.9rem' : '1.5rem' }} />
						) : !isEnrolledStatus || (!isLessonInProgress && !isLessonCompleted) || !isLessonRegisteredInThisCourse ? (
							<Lock sx={{ color: theme.border.lightMain, fontSize: isMobileSize ? '0.9rem' : '1.35rem' }} />
						) : (
							<CheckCircleOutlineRounded sx={{ color: theme.palette.success.main, fontSize: isMobileSize ? '0.9rem' : '1.35rem' }} />
						)}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Lesson;
