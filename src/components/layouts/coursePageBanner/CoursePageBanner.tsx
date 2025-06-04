import { Alert, Box, Button, Paper, Snackbar, Typography } from '@mui/material';
import theme from '../../../themes';
import { SingleCourse } from '../../../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';
import axios from '@utils/axiosInstance';
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
import { useGeoLocation } from '../../../hooks/useGeoLocation';

interface CoursePageBannerProps {
	course: SingleCourse;
	isEnrolledStatus?: boolean;
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>>;
	documentsRef?: React.RefObject<HTMLDivElement>;
	fromHomePage?: boolean;
}

const CoursePageBanner = ({ course, isEnrolledStatus, setIsEnrolledStatus, documentsRef, fromHomePage }: CoursePageBannerProps) => {
	const firstLessonId: string = course && course?.chapters && course?.chapters[0]?.lessonIds && course?.chapters[0]?.lessonIds[0];

	const navigate = useNavigate();

	const { isRotated, isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const [displayEnrollmentMsg, setDisplayEnrollmentMsg] = useState<boolean>(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);

	const { courseId, userId } = useParams();
	const { user } = useContext(UserAuthContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const location = useGeoLocation();

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	const isCourseFree: boolean =
		getPriceForCountry(course, resolvedCountryCode!)?.amount === 'Free' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '0';

	const vertical = 'top';
	const horizontal = 'center';

	const courseRegistration = async (resolvedUserId: string, resolvedOrgId: string): Promise<string> => {
		try {
			if (!courseId || !resolvedUserId || !resolvedOrgId) {
				throw new Error('Missing required data for course registration');
			}

			const response = await axios.post(`${base_url}/userCourses/`, {
				userId: resolvedUserId,
				courseId,
				isCompleted: false,
				isInProgress: true,
				orgId: resolvedOrgId,
			});

			if (!response.data?._id) {
				throw new Error('User course creation failed: Missing ID');
			}

			const userCourseId = response.data._id;

			const responseUserLesson = await axios.post(`${base_url}/userlessons`, {
				lessonId: fromHomePage ? course.firstLessonId : firstLessonId,
				userId: resolvedUserId,
				courseId,
				userCourseId,
				currentQuestion: 1,
				isCompleted: false,
				isInProgress: true,
				notes: '',
				orgId: resolvedOrgId,
				teacherFeedback: '',
				isFeedbackGiven: false,
			});

			// Update localStorage: userLessonData
			const currentUserLessonData: string | null = localStorage.getItem('userLessonData');
			if (currentUserLessonData !== null) {
				const updatedUserLessonData: UserLessonDataStorage[] = JSON.parse(currentUserLessonData);
				if (!updatedUserLessonData.some((data) => data.lessonId === firstLessonId && data.courseId === courseId)) {
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

			// Update localStorage: userCourseData
			let updatedUserCoursesIds: UserCoursesIdsWithCourseIds[] = [];
			const storedUserCoursesIds = localStorage.getItem('userCourseData');
			if (storedUserCoursesIds !== null) {
				updatedUserCoursesIds = JSON.parse(storedUserCoursesIds);
			}
			updatedUserCoursesIds.push({
				courseId,
				userCourseId,
				isCourseCompleted: false,
				isCourseInProgress: true,
				courseTitle: course.title,
				createdAt: response.data.createdAt,
				isActive: true,
				validUntil: response.data.validUntil,
			});
			localStorage.setItem('userCourseData', JSON.stringify(updatedUserCoursesIds));

			return userCourseId;
		} catch (error) {
			console.error('❌ Error during course registration:', error);
			throw error; // ⚠️ Propagate to prevent payment from proceeding
		}
	};

	// const handleEnrollment = async (): Promise<void> => {
	// 	if (
	// 		getPriceForCountry(course, resolvedCountryCode!).amount === 'Free' ||
	// 		getPriceForCountry(course, resolvedCountryCode!).amount === '0' ||
	// 		getPriceForCountry(course, resolvedCountryCode!).amount === ''
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
				width: fromHomePage ? '57.5vw' : '90%',
				height: isRotated ? '18rem' : fromHomePage ? '48vh' : '45vh',
				margin:
					fromHomePage && !isSmallScreen && !isRotatedMedium ? '3rem 0 2rem 0' : isSmallScreen || isRotatedMedium ? '1.25rem 0 1.5rem 0' : '2rem 0',
				backgroundColor: fromHomePage ? theme.bgColor?.lessonInProgress : theme.palette.primary.main,
			}}>
			<Snackbar
				open={displayEnrollmentMsg}
				autoHideDuration={!fromHomePage ? 4000 : 6000}
				onClose={() => setDisplayEnrollmentMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert
					onClose={() => setDisplayEnrollmentMsg(false)}
					severity='success'
					sx={{
						width: '100%',
						fontSize: isMobileSize ? '0.75rem' : '0.9rem',
						backgroundColor: theme.bgColor?.greenSecondary,
						color: theme.textColor?.common.main,
					}}>
					{fromHomePage ? 'Kursa başarıyla kayıt oldunuz!' : 'You have successfully enrolled in the course!'}
					{fromHomePage && (
						<>
							<br />
							{fromHomePage ? 'Kurs detaylarını görmek için giriş yapın.' : 'To view course details, please log in.'}
						</>
					)}
				</Alert>
			</Snackbar>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					height: isRotated ? '18rem' : fromHomePage ? '48vh' : '45vh',
					padding: fromHomePage ? '1rem' : '0',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						margin: isVerySmallScreen ? '1rem 2rem 1rem 1rem' : '1rem 3rem 1rem 2rem',
						flex: 3,
						position: 'relative',
						height: fromHomePage ? '40vh' : '37.5vh',
					}}>
					<Box>
						{!fromHomePage && (
							<Button
								variant='text'
								startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
								sx={{
									'color': theme.textColor?.common.main,
									'textTransform': 'inherit',
									'fontFamily': theme.fontFamily?.main,
									':hover': {
										backgroundColor: 'transparent',
										textDecoration: 'underline',
									},

									'fontSize': isSmallScreen ? '0.75rem' : null,
								}}
								onClick={() => {
									navigate(`/courses/user/${userId}`);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}}>
								{fromHomePage ? 'Kurslara Dön' : 'Back to courses'}
							</Button>
						)}
						<Typography
							variant={isSmallScreen ? 'h6' : 'h3'}
							sx={{
								color: theme.textColor?.common.main,
								margin: '0.5rem 0 1rem 0',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{course.title}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: isSmallScreen ? '0.65rem' : '0.85rem',
								lineHeight: isSmallScreen ? 1.6 : 1.7,
								textAlign: 'left',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{isVerySmallScreen
								? truncateText(course.description, 200)
								: isSmallScreen
									? truncateText(course.description, 250)
									: truncateText(course.description, 450)}
						</Typography>
						{!isEnrolledStatus && !course.isExpired ? (
							<CustomSubmitButton
								variant='contained'
								sx={{
									width: isMobileSize ? '3rem' : '6rem',
									position: 'absolute',
									bottom: isRotated ? 60 : 5,
									fontSize: isMobileSize ? '0.75rem' : '0.9rem',
									fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								}}
								onClick={() => setIsPaymentDialogOpen(true)}>
								{fromHomePage ? 'Kayıt Ol' : 'Enroll'}
							</CustomSubmitButton>
						) : !isEnrolledStatus && course.isExpired ? (
							<Alert
								severity='warning'
								sx={{
									position: 'absolute',
									bottom: isRotated ? 60 : 5,
									fontSize: isVerySmallScreen || isRotated ? '0.65rem' : '0.9rem',
									backgroundColor: !fromHomePage ? theme.bgColor?.lessonInProgress : theme.bgColor?.greenSecondary,
									color: theme.textColor?.common.main,
									width: 'fit-content',
									fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								}}>
								{fromHomePage ? 'Kayıt süresi doldu' : 'Enrollment is closed'}
							</Alert>
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
									fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								}}>
								{fromHomePage ? 'Kurs Materyallerini Gör' : 'See Course Materials'}
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
							title={fromHomePage ? 'Fiyat' : 'Price'}
							content={`${isCourseFree ? '' : setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${
								isCourseFree ? (fromHomePage ? 'Ücretsiz' : 'Free') : getPriceForCountry(course, resolvedCountryCode!)?.amount
							}`}
							customSettings={{
								color: theme.textColor?.common.main,
								bgColor: theme.bgColor?.greenSecondary,
							}}
							fromHomePage
						/>
						<CoursePageBannerDataCard title={fromHomePage ? 'Hafta(#)' : 'Weeks(#)'} content={course.durationWeeks} fromHomePage />
					</Box>
					<Box>
						<CoursePageBannerDataCard
							title={fromHomePage ? 'Başlangıç Tarihi' : 'Starting Date'}
							content={dateFormatter(course.startingDate)}
							fromHomePage
						/>

						<CoursePageBannerDataCard title={fromHomePage ? 'Saat(#)' : 'Hours(#)'} content={course.durationHours} fromHomePage />
					</Box>
				</Box>

				<PaymentDialog
					course={course}
					isPaymentDialogOpen={isPaymentDialogOpen}
					setIsPaymentDialogOpen={setIsPaymentDialogOpen}
					courseRegistration={courseRegistration}
					fromHomePage={fromHomePage}
					setDisplayEnrollmentMsg={setDisplayEnrollmentMsg}
					setIsEnrolledStatus={setIsEnrolledStatus}
				/>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
