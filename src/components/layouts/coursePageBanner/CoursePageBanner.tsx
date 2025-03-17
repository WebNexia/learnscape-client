import { Alert, Box, Button, Paper, Snackbar, Typography } from '@mui/material';
import theme from '../../../themes';
import { SingleCourse } from '../../../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';
import axios from 'axios';
import { useContext, useState } from 'react';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../../../contexts/UserCourseLessonDataContextProvider';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { dateFormatter } from '../../../utils/dateFormatter';
import PaymentDialog from './PaymentDialog';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { truncateText } from '../../../utils/utilText';

interface CoursePageBannerProps {
	course: SingleCourse;
	isEnrolledStatus?: boolean;
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>>;
	documentsRef?: React.RefObject<HTMLDivElement>;
	fromHomePage?: boolean;
}

const CoursePageBanner = ({ course, isEnrolledStatus, setIsEnrolledStatus, documentsRef, fromHomePage }: CoursePageBannerProps) => {
	const firstLessonId: string = course && course.chapters && course?.chapters[0]?.lessonIds && course?.chapters[0]?.lessonIds[0];

	const navigate = useNavigate();

	const { isRotated, isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const [displayEnrollmentMsg, setDisplayEnrollmentMsg] = useState<boolean>(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);

	const { courseId, userId } = useParams();
	const { user } = useContext(UserAuthContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const isCourseFree: boolean =
		getPriceForCountry(course, user?.countryCode!)?.amount === 'Free' ||
		getPriceForCountry(course, user?.countryCode!)?.amount === '' ||
		getPriceForCountry(course, user?.countryCode!)?.amount === '0';

	const vertical = 'top';
	const horizontal = 'center';

	const courseRegistration = async (resolvedUserId: string, resolvedOrgId: string): Promise<void> => {
		try {
			const response = await axios.post(`${base_url}/userCourses/`, {
				courseId,
				userId: resolvedUserId,
				isCompleted: false,
				isInProgress: true,
				orgId: resolvedOrgId,
			});

			if (setIsEnrolledStatus) setIsEnrolledStatus(true);

			const responseUserLesson = await axios.post(`${base_url}/userlessons`, {
				lessonId: fromHomePage ? course.firstLessonId : firstLessonId,
				userId: resolvedUserId,
				courseId,
				userCourseId: response.data._id,
				currentQuestion: 1,
				isCompleted: false,
				isInProgress: true,
				notes: '',
				orgId: resolvedOrgId,
				teacherFeedback: '',
				isFeedbackGiven: false,
			});

			const currentUserLessonData: string | null = localStorage.getItem('userLessonData');

			if (currentUserLessonData !== null) {
				const updatedUserLessonData: UserLessonDataStorage[] = JSON.parse(currentUserLessonData);
				if (!updatedUserLessonData.some((data: UserLessonDataStorage) => data.lessonId === firstLessonId && data.courseId === courseId) && courseId) {
					const newUserLessonData: UserLessonDataStorage = {
						lessonId: firstLessonId,
						userLessonId: responseUserLesson.data._id,
						courseId,
						currentQuestion: 1,
						isCompleted: false,
						isInProgress: true,
						teacherFeedback: '',
						isFeedbackGiven: false,
						updatedAt: responseUserLesson.data.updatedAt,
					};

					updatedUserLessonData.push(newUserLessonData);
					localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
				}
			}

			let updatedUserCoursesIds: UserCoursesIdsWithCourseIds[] = [];
			const storedUserCoursesIds = localStorage.getItem('userCourseData');
			if (storedUserCoursesIds !== null && courseId) {
				updatedUserCoursesIds = JSON.parse(storedUserCoursesIds);
				updatedUserCoursesIds.push({
					courseId,
					userCourseId: response.data._id,
					isCourseCompleted: false,
					isCourseInProgress: true,
					courseTitle: course.title,
					createdAt: response.data.createdAt,
				});
				localStorage.setItem('userCourseData', JSON.stringify(updatedUserCoursesIds));
			}

			setDisplayEnrollmentMsg(true);

			if (!fromHomePage) {
				navigate(`/course/${course._id}/user/${userId}/userCourseId/${response.data._id}?isEnrolled=true`);
			}
		} catch (error) {
			console.log(error);
		}
	};

	// const handleEnrollment = async (): Promise<void> => {
	// 	if (
	// 		getPriceForCountry(course, user?.countryCode!).amount === 'Free' ||
	// 		getPriceForCountry(course, user?.countryCode!).amount === '0' ||
	// 		getPriceForCountry(course, user?.countryCode!).amount === ''
	// 	) {
	// 		await courseRegistration();
	// 		if (setIsEnrolledStatus) setIsEnrolledStatus(true);
	// 	} else {
	// 		setIsPaymentDialogOpen(true);
	// 	}
	// };

	return (
		<Paper
			elevation={10}
			sx={{
				width: fromHomePage ? '85%' : '90%',
				height: isRotated ? '18rem' : '23rem',
				margin:
					fromHomePage && !isSmallScreen && !isRotatedMedium
						? '3rem 0 2rem 0'
						: isSmallScreen || isRotatedMedium
						? '1.25rem 0 1.5rem 0'
						: '3rem 0 2rem 0',
				backgroundColor: fromHomePage ? theme.bgColor?.lessonInProgress : theme.palette.primary.main,
			}}>
			<Snackbar
				open={displayEnrollmentMsg}
				autoHideDuration={4000}
				onClose={() => setDisplayEnrollmentMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert
					onClose={() => setDisplayEnrollmentMsg(false)}
					severity='success'
					sx={{ width: '100%', fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}>
					You have successfully enrolled in the course!
				</Alert>
			</Snackbar>

			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', height: isRotated ? '18rem' : '23rem' }}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						margin: isVerySmallScreen ? '1rem 2rem 1rem 1rem' : '1rem 3rem 1rem 2rem',
						flex: 3,
						position: 'relative',
						height: '20rem',
					}}>
					<Box>
						{!fromHomePage && (
							<Button
								variant='text'
								startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
								sx={{
									color: theme.textColor?.common.main,
									textTransform: 'inherit',
									fontFamily: theme.fontFamily?.main,
									':hover': {
										backgroundColor: 'transparent',
										textDecoration: 'underline',
									},

									fontSize: isSmallScreen ? '0.75rem' : null,
								}}
								onClick={() => {
									navigate(`/courses/user/${userId}`);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}}>
								Back to courses
							</Button>
						)}
						<Typography variant={isSmallScreen ? 'h6' : 'h3'} sx={{ color: theme.textColor?.common.main, margin: '0.5rem 0 1rem 0' }}>
							{course.title}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: isSmallScreen ? '0.65rem' : '0.85rem',
								lineHeight: isSmallScreen ? 1.6 : 1.7,
								textAlign: 'left',
							}}>
							{isVerySmallScreen
								? truncateText(course.description, 200)
								: isSmallScreen
								? truncateText(course.description, 250)
								: truncateText(course.description, 450)}
						</Typography>
						{!isEnrolledStatus ? (
							<CustomSubmitButton
								variant='contained'
								sx={{
									width: isMobileSize ? '3rem' : '6rem',
									position: 'absolute',
									bottom: isRotated ? 60 : 5,
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
								}}
								onClick={() => setIsPaymentDialogOpen(true)}>
								Enroll
							</CustomSubmitButton>
						) : (
							<Typography
								onClick={() => {
									documentsRef?.current?.scrollIntoView({ behavior: 'smooth' });
								}}
								sx={{
									width: 'fit-content',
									position: 'absolute',
									bottom: isRotated ? 60 : 5,
									fontSize: isVerySmallScreen || isRotated ? '0.65rem' : '0.9rem',
									textTransform: 'capitalize',
									color: theme.textColor?.common.main,
									cursor: 'pointer',
									textDecoration: 'underline',
								}}>
								See Course Materials
							</Typography>
						)}
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isVerySmallScreen ? 'column' : ' row',
						justifyContent: 'center',
						alignItems: 'center',
						flex: 2,
						mr: isRotatedMedium ? '1rem' : '0rem',
					}}>
					<Box>
						<CoursePageBannerDataCard
							title='Price'
							content={`${isCourseFree ? '' : setCurrencySymbol(getPriceForCountry(course, user?.countryCode!)?.currency)}${
								isCourseFree ? 'Free' : getPriceForCountry(course, user?.countryCode!)?.amount
							}`}
							customSettings={{
								color: theme.textColor?.common.main,
								bgColor: theme.bgColor?.greenSecondary,
							}}
						/>
						<CoursePageBannerDataCard title='Weeks(#)' content={course.durationWeeks} />
					</Box>
					<Box>
						<CoursePageBannerDataCard title='Starting Date' content={dateFormatter(course.startingDate)} />

						<CoursePageBannerDataCard title='Hours(#)' content={course.durationHours} />
					</Box>
				</Box>

				<PaymentDialog
					course={course}
					isPaymentDialogOpen={isPaymentDialogOpen}
					setIsPaymentDialogOpen={setIsPaymentDialogOpen}
					courseRegistration={courseRegistration}
					fromHomePage={fromHomePage}
				/>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
