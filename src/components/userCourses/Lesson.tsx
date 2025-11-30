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
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { SingleCourse, Price } from '../../interfaces/course';

interface LessonProps {
	lesson: LessonById;
	course: SingleCourse;
	isEnrolledStatus: boolean;
	nextLessonId: string;
	nextChapterFirstLessonId: string;
	lessonOrder: number;
	isLastLessonOfChapter?: boolean;
	currentChapterHasChecklist?: boolean;
	currentChapterChecklistCompleted?: boolean;
}

const Lesson = ({ lesson, course, isEnrolledStatus, nextLessonId, nextChapterFirstLessonId, lessonOrder }: LessonProps) => {
	const { courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const { user } = useContext(UserAuthContext);
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
		// Don't navigate if lesson is not accessible (locked)
		if (!isAccessible) {
			return;
		}

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

	// Helper function to get currency for country code
	const getCurrencyForCountry = (countryCode: string): 'gbp' | 'usd' | 'eur' | 'try' => {
		if (!countryCode) return 'usd';
		const code = countryCode.toUpperCase();

		// TR -> TRY
		if (code === 'TR') return 'try';

		// GB -> GBP
		if (code === 'GB') return 'gbp';

		// EU countries -> EUR
		const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'IE', 'PT', 'GR', 'FI', 'AT', 'LU', 'CY', 'EE', 'LT', 'LV', 'SI', 'SK', 'MT'];
		if (euCountries.includes(code)) return 'eur';

		// Default to USD
		return 'usd';
	};

	// Get price for user's country/currency
	const getUserPrice = (course: SingleCourse, countryCode: string | undefined): Price | null => {
		if (!countryCode || !course?.prices) return null;

		const currency = getCurrencyForCountry(countryCode);
		const price = course.prices.find((p) => p.currency === currency);

		// Fallback to USD if currency not found
		return price || course.prices.find((p) => p.currency === 'usd') || null;
	};

	// Check if course is a free platform course (not external and price is free for user's currency)
	const isFreePlatformCourse = useMemo(() => {
		// Must be a platform course (not external)
		if (!course?.courseManagement || course.courseManagement.isExternal) return false;

		// Get user's country code
		const countryCode = user?.countryCode;
		if (!countryCode) return false;

		// Get price for user's currency
		const userPrice = getUserPrice(course, countryCode);
		if (!userPrice) return false;

		// Check if price is free (empty string, '0', or 'Free')
		const amount = userPrice.amount;
		return amount === '' || amount === '0' || amount === 'Free';
	}, [course, user?.countryCode]);

	// Check if user has subscription access (hasRegisteredCourse OR isSubscribed OR subscriptionValidUntil is valid)
	// Users with hasRegisteredCourse: true have full access to all features including free platform courses
	const hasSubscriptionAccess = useMemo(() => {
		if (!user) return false;

		// Priority 1: If user has registered course, they have full access to everything (free content + all features)
		if (user.hasRegisteredCourse) return true;

		// Priority 2: If user is subscribed, they have access
		if (user.isSubscribed) return true;

		// Priority 3: Check if subscriptionValidUntil is valid (not null and in the future)
		// This covers canceled subscriptions that still have access until period end
		if (user.subscriptionValidUntil) {
			const validUntil = new Date(user.subscriptionValidUntil);
			const now = new Date();
			if (validUntil > now) {
				return true;
			}
		}

		return false;
	}, [user]);

	const isAccessible = useMemo(() => {
		if (!isEnrolledStatus) return false;

		// For free platform courses, check subscription access
		// hasRegisteredCourse grants access to free platform courses even without subscription
		if (isFreePlatformCourse) {
			if (!hasSubscriptionAccess) return false;
		}

		return isLessonRegisteredInThisCourse || isLessonInProgress || isLessonCompleted;
	}, [isEnrolledStatus, isFreePlatformCourse, hasSubscriptionAccess, isLessonRegisteredInThisCourse, isLessonInProgress, isLessonCompleted]);

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
						{isEnrolledStatus && isLessonInProgress && isLessonRegisteredInThisCourse && isAccessible ? (
							<img src={ProgressIcon} alt='' style={{ height: isMobileSize ? '0.9rem' : '1.5rem' }} />
						) : isEnrolledStatus && isLessonCompleted && isLessonRegisteredInThisCourse && isAccessible ? (
							<CheckCircleOutlineRounded sx={{ color: theme.palette.success.main, fontSize: isMobileSize ? '0.9rem' : '1.35rem' }} />
						) : !isAccessible ? (
							<Lock sx={{ color: theme.border.lightMain, fontSize: isMobileSize ? '0.9rem' : '1.35rem' }} />
						) : null}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Lesson;
