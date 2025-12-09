import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import theme from '../../../themes';
import { SingleCourse } from '../../../interfaces/course';
import { Info, KeyboardBackspaceOutlined, Insights } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';
import axios from '@utils/axiosInstance';
import { useContext, useState } from 'react';
import { useQueryClient } from 'react-query';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { dateFormatter } from '../../../utils/dateFormatter';
import PaymentDialogWrapper from './PaymentDialogWrapper';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';

interface CoursePageBannerProps {
	course: SingleCourse;
	isEnrolledStatus?: boolean;
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>>;
	documentsRef?: React.RefObject<HTMLDivElement>;
	fromHomePage?: boolean;
	// Optional: used on learner course page for analytics navigation
	userCourseId?: string;
	isCourseCompleted?: boolean;
}

const CoursePageBanner = ({
	course,
	isEnrolledStatus,
	setIsEnrolledStatus,
	documentsRef,
	fromHomePage,
	userCourseId,
	isCourseCompleted,
}: CoursePageBannerProps) => {
	const firstLessonId: string = course && course?.chapters && course?.chapters[0]?.lessonIds && course?.chapters[0]?.lessonIds[0];

	const navigate = useNavigate();

	const { isRotated, isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const queryClient = useQueryClient();

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const [displayEnrollmentMsg, setDisplayEnrollmentMsg] = useState<boolean>(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	const { courseId } = useParams();
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

			// Only create userLesson if course is NOT external
			if (!course.courseManagement?.isExternal) {
				await axios.post(`${base_url}/userlessons`, {
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

				// Invalidate user lessons cache to refresh lesson data
				await queryClient.invalidateQueries(['userLessonsForCourse', courseId, resolvedUserId]);
			}

			// Invalidate React Query cache to refresh context data
			await queryClient.invalidateQueries(['userCourseData']);

			return userCourseId;
		} catch (error) {
			console.error('❌ Error during course registration:', error);
			throw error; // ⚠️ Propagate to prevent payment from proceeding
		}
	};

	const handleEnroll = async () => {
		if (isProcessing) return; // Prevent multiple clicks

		if (isCourseFree && !fromHomePage) {
			setIsProcessing(true);
			try {
				await courseRegistration(user?._id!, course?.orgId!);
				setDisplayEnrollmentMsg(true);
				if (setIsEnrolledStatus) setIsEnrolledStatus(true);
			} catch (error) {
				console.error('Course registration failed:', error);
			} finally {
				setIsProcessing(false);
			}
		} else {
			setIsPaymentDialogOpen(true);
		}
	};

	return (
		<Paper
			elevation={10}
			sx={{
				width: fromHomePage ? { xs: '90%', sm: '80%', md: '57.5vw' } : '90%',
				height: { xs: 'auto', sm: 'auto', md: 'auto', lg: fromHomePage ? '48vh' : 'auto' },
				margin:
					fromHomePage && !isSmallScreen && !isRotatedMedium ? '3rem 0 2rem 0' : isSmallScreen || isRotatedMedium ? '1.25rem 0 1.5rem 0' : '2rem 0',
				backgroundColor: fromHomePage ? theme.bgColor?.primary : theme.palette.primary.main,
				padding: '0.75rem',
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
							{fromHomePage
								? course.courseManagement.isExternal
									? ' Detaylar email adresinize gönderildi.'
									: 'Kurs detaylarını görmek için platforma giriş yapın.'
								: 'To view course details, please log in.'}
						</>
					)}
				</Alert>
			</Snackbar>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					height: '100%',
					padding: { xs: '1rem 0rem 1rem 1rem', sm: '1rem', md: '1rem' },
					position: 'relative',
				}}>
				{/* Layout container */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',

						flex: { xs: 4, sm: 4, md: 3 },
						position: 'relative',
						height: 'fit-content',
						mr: '1rem',
						mt: '1rem',
					}}>
					<Box>
						{!fromHomePage && isMobileSize && (
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
									navigate(`/courses`);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}}>
								Back to courses
							</Button>
						)}
						<Typography
							variant={isSmallScreen ? 'h6' : 'h4'}
							sx={{
								color: theme.textColor?.common.main,
								margin: '0rem 0 1rem 0',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{course.title} {fromHomePage && course.courseManagement.isExternal ? `(Partner Kursu)` : `(Platform Kursu)`}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.75rem', sm: '0.9rem' },
								lineHeight: isSmallScreen ? 1.6 : 1.7,
								textAlign: 'left',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								mb: '3.5rem',
							}}>
							{course.description}
						</Typography>
					</Box>
				</Box>

				{!isEnrolledStatus && !course.isExpired && (isCourseFree ? user?.isSubscribed || user?.hasRegisteredCourse : true) ? (
					<CustomSubmitButton
						variant='contained'
						onClick={handleEnroll}
						sx={{
							'width': 'fit-content',
							'padding': isMobileSize ? '1rem 1.5rem' : '1rem 2rem',
							'position': 'absolute',
							'bottom': isRotated ? 60 : '1.5rem',
							'fontSize': isMobileSize ? '0.75rem' : '1rem',
							'fontFamily': fromHomePage ? 'Varela Round' : '',
							'pointerEvents': isProcessing ? 'none' : 'auto',
							'background': fromHomePage ? '#FF6F4E !important' : '',
							'borderRadius': fromHomePage ? '0.75rem' : undefined,
							'color': fromHomePage ? '#fff !important' : '',
							'&:hover': {
								color: fromHomePage ? '#fff !important' : undefined,
								backgroundColor: fromHomePage ? '#FF6F4E !important' : undefined,
							},
						}}>
						{fromHomePage ? 'Kayıt Ol' : isProcessing ? 'Processing...' : 'Enroll'}
					</CustomSubmitButton>
				) : !isEnrolledStatus && course.isExpired ? (
					<Alert
						severity='warning'
						sx={{
							position: 'absolute',
							bottom: isRotated ? 60 : '1.5rem',
							fontSize: isVerySmallScreen || isRotated ? '0.75rem' : '0.9rem',
							backgroundColor: !fromHomePage ? theme.bgColor?.lessonInProgress : theme.bgColor?.greenSecondary,
							color: theme.textColor?.common.main,
							width: 'fit-content',
							fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
						}}>
						{fromHomePage ? 'Kayıt süresi doldu' : 'Enrollment is closed'}
					</Alert>
				) : isEnrolledStatus ? (
					// See Course Materials + Analytics icon (side by side at bottom)
					<Box
						sx={{
							position: 'absolute',
							bottom: isRotated ? 60 : '1.5rem',
							left: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: 1,
						}}>
						<Typography
							onClick={() => {
								documentsRef?.current?.scrollIntoView({ behavior: 'smooth' });
							}}
							sx={{
								fontSize: isVerySmallScreen || isRotated ? '0.65rem' : '0.9rem',
								textTransform: 'capitalize',
								color: theme.textColor?.common.main,
								cursor: 'pointer',
								textDecoration: 'underline',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{fromHomePage ? 'Kurs Materyallerini Gör' : 'See Course Materials'}
						</Typography>

						{/* Analytics icon - visible for enrolled courses; disabled until course is completed */}
						{!fromHomePage && userCourseId && !course.courseManagement?.isExternal && (
							<Tooltip title='Course Analytics' placement='top' arrow>
								{/* span wrapper keeps tooltip working when IconButton is disabled */}
								<span>
									<IconButton
										aria-label='Course analytics'
										size={isVerySmallScreen ? 'small' : 'medium'}
										sx={{
											color: theme.textColor?.common.main,
										}}
										onClick={() => {
											if (courseId && userCourseId && isEnrolledStatus) {
												// isCourseCompleted &&
												navigate(`/course/${courseId}/userCourseId/${userCourseId}/analytics`);
												window.scrollTo({ top: 0, behavior: 'smooth' });
											}
										}}>
										<Insights fontSize={isMobileSize ? 'small' : 'medium'} sx={{ color: '#ffffff' }} />
									</IconButton>
								</span>
							</Tooltip>
						)}
					</Box>
				) : (
					!fromHomePage && (
						<Typography
							variant='body2'
							sx={{
								width: 'fit-content',
								position: 'absolute',
								bottom: isRotated ? 60 : '1.5rem',
								fontSize: isVerySmallScreen || isRotated ? '0.65rem' : '0.9rem',
								color: theme.textColor?.common.main,
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							Subscribe to platform or register for a paid course to enroll in free courses
						</Typography>
					)
				)}
				{fromHomePage && isCourseFree && (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'absolute', bottom: isRotated ? 60 : '1.5rem' }}>
						<Info fontSize='small' sx={{ color: 'lightgray' }} />
						<Typography
							variant='body2'
							sx={{
								color: 'lightgray',
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							Ücretsiz kurslara kayıt olmak için platformda hesap açtıktan sonra platforma abone olun veya ücretli bir kursa kayıt olun!
						</Typography>
					</Box>
				)}
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', sm: 'column', md: 'row' },
						justifyContent: 'center',
						alignItems: 'center',
						flex: { xs: 1, sm: 1, md: 1.5 },
						mr: isRotatedMedium ? '1rem' : '0rem',
						height: 'fit-content',
						mt: '1rem',
					}}>
					<Box>
						<CoursePageBannerDataCard
							title={fromHomePage ? 'Başlangıç Tarihi' : 'Starting Date'}
							content={dateFormatter(course.startingDate)}
							fromHomePage={fromHomePage}
							customSettings={{
								color: theme.textColor?.common.main,
								bgColor: fromHomePage ? '#FF6F4E' : theme.bgColor?.greenSecondary,
							}}
						/>

						<CoursePageBannerDataCard
							title={fromHomePage ? 'Hafta(#)' : 'Weeks(#)'}
							content={course.durationWeeks ?? ''}
							fromHomePage={fromHomePage}
						/>
					</Box>
					<Box>
						<CoursePageBannerDataCard
							title={fromHomePage ? 'Saat(#)' : 'Hours(#)'}
							content={course.durationHours ?? ''}
							fromHomePage={fromHomePage}
						/>
						<CoursePageBannerDataCard
							title={fromHomePage ? 'Fiyat' : 'Price'}
							content={`${isCourseFree ? '' : setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${
								isCourseFree ? (fromHomePage ? 'Ücretsiz' : 'Free') : getPriceForCountry(course, resolvedCountryCode!)?.amount
							}`}
							fromHomePage={fromHomePage}
						/>
					</Box>
				</Box>

				<PaymentDialogWrapper
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
