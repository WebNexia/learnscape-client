import { Box, Typography, Chip } from '@mui/material';
import theme from '../../themes';
import { CheckCircleOutlineRounded, Lock, PlayArrowRounded } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserLessonDataStorage } from '../../contexts/UserCourseLessonDataContextProvider';
import { LessonById } from '../../interfaces/lessons';
import { useContext, useEffect, useState, useMemo } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useUserLessonsForCourse } from '../../hooks/useUserLessonsForCourse';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { SingleCourse, Price } from '../../interfaces/course';
import { LessonType } from '../../interfaces/enums';
import LessonIconTile from '../lesson/LessonIconTile';
import { isSubscriptionsProductEnabled } from '../../config/features';

interface LessonProps {
	lesson: LessonById;
	course: SingleCourse;
	isEnrolledStatus: boolean;
	nextLessonId: string;
	nextChapterFirstLessonId: string;
	lessonOrder: number;
	chapterId?: string;
	isLastLessonOfChapter?: boolean;
	currentChapterHasChecklist?: boolean;
	currentChapterChecklistCompleted?: boolean;
	isLastInChapter?: boolean;
	/** Staff learner-view: unlock all lessons, no progress records */
	staffPreviewMode?: boolean;
	staffPreviewBasePath?: string;
}

const lessonTypeLabel = (type: string) => {
	if (type === LessonType.INSTRUCTIONAL_LESSON) return 'Lecture';
	if (type === LessonType.PRACTICE_LESSON) return 'Practice';
	return 'Quiz';
};

const Lesson = ({
	lesson,
	course,
	isEnrolledStatus,
	nextLessonId,
	nextChapterFirstLessonId,
	chapterId,
	isLastInChapter = false,
	staffPreviewMode = false,
	staffPreviewBasePath,
}: LessonProps) => {
	const { courseId, userCourseId } = useParams();
	const navigate = useNavigate();

	const { user } = useContext(UserAuthContext);
	const { isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;

	const { data: userLessonsData, isLoading: isUserLessonsLoading } = useUserLessonsForCourse(courseId || '', {
		enabled: !staffPreviewMode,
	});
	const parsedUserLessonData = userLessonsData || [];
	const isProgressPending = !staffPreviewMode && isEnrolledStatus && isUserLessonsLoading;

	const [userLessonData, setUserLessonData] = useState<UserLessonDataStorage[]>(parsedUserLessonData);
	const [isLessonInProgress, setIsLessonInProgress] = useState<boolean>(false);
	const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);
	const [isLessonRegisteredInThisCourse, setIsLessonRegisteredInThisCourse] = useState<boolean>(false);

	useEffect(() => {
		setUserLessonData(parsedUserLessonData);
		parsedUserLessonData?.forEach((data: UserLessonDataStorage) => {
			if (data.lessonId === lesson._id && data.courseId === courseId) {
				setIsLessonInProgress(data.isInProgress);
				setIsLessonCompleted(data.isCompleted);
				setIsLessonRegisteredInThisCourse(true);
			}
		});
	}, [parsedUserLessonData, lesson._id, courseId]);

	const handleLessonClick = () => {
		if (!isAccessible) return;

		const navigateToLesson = (targetLessonId: string, nextId?: string) => {
			const params = new URLSearchParams();
			if (chapterId) params.set('chapterId', chapterId);
			if (!staffPreviewMode) params.set('isCompleted', String(isLessonCompleted));
			if (nextId) params.set('next', nextId);
			const query = params.toString();
			const path = staffPreviewMode
				? `${staffPreviewBasePath || `/admin/course-preview/course/${courseId}`}/lesson/${targetLessonId}`
				: `/course/${courseId}/userCourseId/${userCourseId}/lesson/${targetLessonId}`;
			navigate(query ? `${path}?${query}` : path);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		};

		if (staffPreviewMode) {
			if (nextLessonId) {
				navigateToLesson(lesson._id, nextLessonId);
			} else if (nextChapterFirstLessonId) {
				navigateToLesson(lesson._id, nextChapterFirstLessonId);
			} else {
				navigateToLesson(lesson._id);
			}
			return;
		}

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

	const getCurrencyForCountry = (countryCode: string): 'gbp' | 'usd' | 'eur' | 'try' => {
		if (!countryCode) return 'usd';
		const code = countryCode.toUpperCase();
		if (code === 'TR') return 'try';
		if (code === 'GB') return 'gbp';
		const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'IE', 'PT', 'GR', 'FI', 'AT', 'LU', 'CY', 'EE', 'LT', 'LV', 'SI', 'SK', 'MT'];
		if (euCountries.includes(code)) return 'eur';
		return 'usd';
	};

	const getUserPrice = (courseData: SingleCourse, countryCode: string | undefined): Price | null => {
		if (!countryCode || !courseData?.prices) return null;
		const currency = getCurrencyForCountry(countryCode);
		const price = courseData.prices.find((p) => p.currency === currency);
		return price || courseData.prices.find((p) => p.currency === 'usd') || null;
	};

	const isFreePlatformCourse = useMemo(() => {
		if (!course?.courseManagement || course.courseManagement.isExternal) return false;
		const countryCode = user?.countryCode;
		if (!countryCode) return false;
		const userPrice = getUserPrice(course, countryCode);
		if (!userPrice) return false;
		const amount = userPrice.amount;
		return amount === '' || amount === '0' || amount === 'Free';
	}, [course, user?.countryCode]);

	const hasSubscriptionAccess = useMemo(() => {
		if (!user) return false;
		if (user.hasRegisteredCourse) return true;
		if (!isSubscriptionsProductEnabled) return false;
		if (user.isSubscribed) return true;
		if (user.subscriptionValidUntil) {
			const validUntil = new Date(user.subscriptionValidUntil);
			if (validUntil > new Date()) return true;
		}
		return false;
	}, [user]);

	const isAccessible = useMemo(() => {
		if (staffPreviewMode) return true;
		if (!isEnrolledStatus || isProgressPending) return false;
		if (isFreePlatformCourse && !hasSubscriptionAccess) return false;
		return isLessonRegisteredInThisCourse || isLessonInProgress || isLessonCompleted;
	}, [
		staffPreviewMode,
		isEnrolledStatus,
		isProgressPending,
		isFreePlatformCourse,
		hasSubscriptionAccess,
		isLessonRegisteredInThisCourse,
		isLessonInProgress,
		isLessonCompleted,
	]);

	const statusAccent = isLessonCompleted
		? theme.palette.success.main
		: isLessonInProgress && isAccessible
			? '#f59e0b'
			: isAccessible
				? theme.palette.primary.main
				: '#cbd5e1';

	const statusBg = isLessonCompleted
		? 'rgba(30, 194, 139, 0.08)'
		: isLessonInProgress && isAccessible
			? 'rgba(245, 158, 11, 0.08)'
			: '#ffffff';

	const outlineFont = "'Varela Round', 'Segoe UI', Arial, sans-serif";

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				minHeight: isMobileSize ? '3.1rem' : '3.55rem',
				borderBottom: isLastInChapter ? 'none' : '1px solid #eef2f7',
				backgroundColor: statusBg,
				cursor: isAccessible ? 'pointer' : 'default',
				transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
				position: 'relative',
				':hover': isAccessible
					? {
						backgroundColor: isLessonCompleted ? 'rgba(30, 194, 139, 0.12)' : '#f1f5f9',
					}
					: {},
			}}
			onClick={handleLessonClick}>
			{/* Timeline dot aligned to chapter rail */}
			<Box
				sx={{
					width: isMobileSize ? '1.4rem' : '1.7rem',
					flexShrink: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}>
				<Box
					sx={{
						width: isMobileSize ? '0.55rem' : '0.65rem',
						height: isMobileSize ? '0.55rem' : '0.65rem',
						borderRadius: '50%',
						backgroundColor: isAccessible ? statusAccent : '#ffffff',
						border: `2px solid ${statusAccent}`,
						boxShadow: '0 0 0 3px #ffffff',
						opacity: isAccessible ? 1 : 0.6,
						zIndex: 1,
					}}
				/>
			</Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					pr: isMobileSize ? '0.55rem' : '1rem',
					pl: isMobileSize ? '0.15rem' : '0.35rem',
					py: isMobileSize ? '0.45rem' : '0.55rem',
				}}>
				<Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: isMobileSize ? '0.5rem' : '0.75rem', minWidth: 0 }}>
					<LessonIconTile lessonIconKey={lesson.lessonIconKey} size={isMobileSize ? 'small' : 'medium'} />
					<Typography
						sx={{
							fontFamily: outlineFont,
							fontSize: isVerySmallScreen ? '0.65rem' : isRotatedMedium ? '0.72rem' : isSmallScreen ? '0.76rem' : '0.84rem',
							fontWeight: isLessonInProgress && !isLessonCompleted ? 600 : 500,
							color: isAccessible ? '#1e293b' : '#94a3b8',
							lineHeight: 1.35,
						}}>
						{lesson.title}
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', gap: isMobileSize ? '0.35rem' : '0.55rem', flexShrink: 0 }}>
					<Chip
						label={lessonTypeLabel(lesson.type)}
						size='small'
						sx={{
							height: isMobileSize ? '1.25rem' : '1.4rem',
							fontFamily: outlineFont,
							fontSize: isMobileSize ? '0.58rem' : '0.65rem',
							fontWeight: 600,
							backgroundColor: 'rgba(1,67,90,0.07)',
							color: theme.palette.primary.main,
							border: '1px solid rgba(1,67,90,0.12)',
							'& .MuiChip-label': { px: isMobileSize ? 0.6 : 0.85 },
						}}
					/>
					{staffPreviewMode ? (
						<PlayArrowRounded sx={{ color: theme.palette.primary.main, fontSize: isMobileSize ? '1.05rem' : '1.3rem' }} />
					) : isEnrolledStatus && isLessonCompleted && isLessonRegisteredInThisCourse && isAccessible ? (
						<CheckCircleOutlineRounded sx={{ color: theme.palette.success.main, fontSize: isMobileSize ? '1.05rem' : '1.3rem' }} />
					) : isEnrolledStatus && isLessonInProgress && isLessonRegisteredInThisCourse && isAccessible ? (
						<PlayArrowRounded sx={{ color: '#f59e0b', fontSize: isMobileSize ? '1.05rem' : '1.3rem' }} />
					) : isProgressPending ? null : !isAccessible ? (
						<Lock sx={{ color: '#cbd5e1', fontSize: isMobileSize ? '1rem' : '1.2rem' }} />
					) : null}
				</Box>
			</Box>
		</Box>
	);
};

export default Lesson;
