import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography, DialogContent } from '@mui/material';
import theme from '../../../themes';
import { SingleCourse } from '../../../interfaces/course';
import { Info, KeyboardBackspaceOutlined, Insights, PlayCircleOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';
import axios from '@utils/axiosInstance';
import { useContext, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import { dateFormatter } from '../../../utils/dateFormatter';
import PaymentDialogWrapper from './PaymentDialogWrapper';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../../utils/getPriceForCountry';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import CustomDialog from '../dialog/CustomDialog';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import { UserCourseLessonDataContext } from '../../../contexts/UserCourseLessonDataContextProvider';
import { useUserLessonsForCourse } from '../../../hooks/useUserLessonsForCourse';
import { isSubscriptionsProductEnabled } from '../../../config/features';
import { extractVideoId } from '../../../utils/videoUrlUtils';

const LP_INTRO_SESSION_PREFIX = 'lpIntroVideoSession:';

/** iframe embed URL for common hosts; unsupported URLs should open in a new tab */
const getIntroVideoEmbedSrc = (raw: string): string | null => {
	const url = raw.trim();
	if (!url) return null;

	if (url.includes('youtube.com') || url.includes('youtu.be')) {
		const id = extractVideoId(url);
		return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
	}
	if (url.includes('vimeo.com')) {
		const id = extractVideoId(url);
		return id ? `https://player.vimeo.com/video/${id}` : null;
	}
	if (url.includes('dailymotion.com')) {
		const id = extractVideoId(url);
		return id ? `https://www.dailymotion.com/embed/video/${id}` : null;
	}
	return null;
};

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
}: CoursePageBannerProps) => {
	const firstLessonId: string = course && course?.chapters && course?.chapters[0]?.lessonIds && course?.chapters[0]?.lessonIds[0];

	const navigate = useNavigate();

	const { isRotated, isSmallScreen, isVerySmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const queryClient = useQueryClient();

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const [displayEnrollmentMsg, setDisplayEnrollmentMsg] = useState<boolean>(false);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [isGroupInfoDialogOpen, setIsGroupInfoDialogOpen] = useState<boolean>(false);
	const [isIntroVideoOpen, setIsIntroVideoOpen] = useState<boolean>(false);
	const [userGroup, setUserGroup] = useState<{ name: string; description: string } | null>(null);

	const { courseId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { userCoursesData } = useContext(UserCourseLessonDataContext);

	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');
	const parsedUserLessons = userLessonsData || [];

	const courseProgress = useMemo(() => {
		if (!isEnrolledStatus || !course?.chapters) return { completed: 0, total: 0, percentage: 0 };
		const total = course.chapters.reduce(
			(sum, ch) => sum + (ch.lessons?.length ?? ch.lessonIds?.length ?? 0),
			0
		);
		const completed = parsedUserLessons.filter((ul) => ul.isCompleted).length;
		const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
		return { completed, total, percentage };
	}, [isEnrolledStatus, course?.chapters, parsedUserLessons]);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const location = useGeoLocation();

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	const isCourseFree: boolean =
		getPriceForCountry(course, resolvedCountryCode!)?.amount === 'Free' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '0';

	const isManuallyClosed = Boolean(course?.isRegistrationClosedByAdmin);
	const isCapacityFull = Boolean(course?.isCapacityFull);

	const introVideoUrl = course?.introVideoUrl?.trim() ?? '';
	const introEmbedSrc = introVideoUrl ? getIntroVideoEmbedSrc(introVideoUrl) : null;

	const markIntroVideoSeenThisSession = () => {
		if (!course?._id) return;
		try {
			sessionStorage.setItem(`${LP_INTRO_SESSION_PREFIX}${course._id}`, '1');
		} catch {
			/* noop */
		}
	};

	const closeIntroVideoModal = () => {
		markIntroVideoSeenThisSession();
		setIsIntroVideoOpen(false);
	};

	const vertical = 'top';
	const horizontal = 'center';

	const courseRegistration = async (resolvedUserId: string, resolvedOrgId: string, groupName?: string): Promise<string> => {
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
				...(groupName && { groupName }),
			});

			if (!response.data?._id) {
				throw new Error('User course creation failed: Missing ID');
			}

			const userCourseId = response.data._id;

			// The server creates the initial userLesson during enrollment.
			if (!course.courseManagement?.isExternal) {
				// Invalidate user lessons cache to refresh lesson data
				await queryClient.invalidateQueries(['userLessonsForCourse', courseId, resolvedUserId]);
			}

			// Invalidate React Query cache to refresh context data
			await queryClient.invalidateQueries(['userCourseData']);
			// Invalidate single course data to refresh capacity status
			if (courseId) {
				await queryClient.invalidateQueries(['singleCourseDataUser', courseId]);
			}

			return userCourseId;
		} catch (error) {
			console.error('❌ Error during course registration:', error);
			throw error; // ⚠️ Propagate to prevent payment from proceeding
		}
	};

	const handleEnroll = async () => {
		if (isProcessing) return; // Prevent multiple clicks

		// From LP course page: go to dedicated payment page (Header & Footer visible)
		if (fromHomePage) {
			navigate(`/landing-page-course/${encodeURIComponent(course?.title ?? '')}/${course?._id}/payment`);
			return;
		}

		if (isCourseFree && !fromHomePage) {
			setIsProcessing(true);
			try {
				// For free courses, check if groups exist and require selection
				// If groups exist, user should go through payment dialog to select group
				if (course?.groups && course.groups.length > 0) {
					setIsPaymentDialogOpen(true);
					setIsProcessing(false);
				} else {
					await courseRegistration(user?._id!, course?.orgId!);
					setDisplayEnrollmentMsg(true);
					if (setIsEnrolledStatus) setIsEnrolledStatus(true);
				}
			} catch (error) {
				console.error('Course registration failed:', error);
			} finally {
				setIsProcessing(false);
			}
		} else {
			setIsPaymentDialogOpen(true);
		}
	};

	// Get user's group information from context data
	useEffect(() => {
		if (!isEnrolledStatus || !courseId || !course?.groups || course.groups.length === 0) {
			setUserGroup(null);
			return;
		}

		// Find userCourse data from context
		const userCourseData = userCoursesData?.find((data) => data.courseId === courseId);
		const groupName = userCourseData?.groupName;
		const groupDescription = userCourseData?.groupDescription;

		if (groupName) {
			setUserGroup({
				name: groupName,
				description: groupDescription || ''
			});
		} else {
			setUserGroup(null);
		}
	}, [isEnrolledStatus, courseId, course?.groups, userCoursesData]);

	// LP: once per browser tab session, auto-open intro modal when configured (flag set on dismiss)
	useEffect(() => {
		if (!fromHomePage || !introVideoUrl || !course?._id) return;
		try {
			if (sessionStorage.getItem(`${LP_INTRO_SESSION_PREFIX}${course._id}`)) return;
		} catch {
			return;
		}
		setIsIntroVideoOpen(true);
	}, [fromHomePage, introVideoUrl, course?._id]);

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

				{!isEnrolledStatus &&
					!course.isExpired &&
					!isManuallyClosed &&
					!isCapacityFull &&
					!(fromHomePage && isCourseFree) &&
					(isCourseFree ? user?.hasRegisteredCourse || (isSubscriptionsProductEnabled && user?.isSubscribed) : true) ? (
					fromHomePage && introVideoUrl ? (
						<Box
							sx={{
								position: 'absolute',
								bottom: isRotated ? 60 : '1.5rem',
								left: '1rem',
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								gap: { xs: 1, sm: 1.5 },
								flexWrap: 'wrap',
								maxWidth: { xs: 'calc(100% - 1.5rem)', sm: 'none' },
							}}>
							<CustomSubmitButton
								variant='contained'
								onClick={handleEnroll}
								sx={{
									'width': 'fit-content',
									padding: isMobileSize ? '0.5rem 1rem' : '0.5rem 1rem',
									'position': 'relative',
									'fontSize': isMobileSize ? '0.75rem' : '1rem',
									'fontFamily': fromHomePage ? 'Varela Round' : '',
									'pointerEvents': isProcessing ? 'none' : 'auto',
									'background': '#FF6F4E !important',
									'borderRadius': '0.75rem',
									'color': '#fff !important',
									'&:hover': {
										color: '#fff !important',
										backgroundColor: '#FF6F4E !important',
									},
								}}>
								Kayıt Ol
							</CustomSubmitButton>
							<CustomSubmitButton
								variant='outlined'
								onClick={() => setIsIntroVideoOpen(true)}
								startIcon={<PlayCircleOutlined />}
								sx={{
									fontSize: isMobileSize ? '0.75rem' : '1rem',
									padding: isMobileSize ? '0.5rem 1rem' : '0.5rem 1rem',
									textTransform: 'none',
									fontFamily: 'Varela Round',
									borderColor: 'rgba(255,255,255,0.85)',
									color: theme.textColor?.common.main,
									borderRadius: '0.75rem',
									'&:hover': {
										borderColor: '#fff',
										backgroundColor: 'rgba(255,255,255,0.08)',
									},
								}}>
								Tanıtım İzle
							</CustomSubmitButton>
						</Box>
					) : (
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
					)
				) : !isEnrolledStatus && !course.isExpired && (isManuallyClosed || isCapacityFull) ? (
					<Alert
						severity={isCapacityFull ? 'error' : 'warning'}
						sx={{
							position: 'absolute',
							bottom: isRotated ? 60 : '1.5rem',
							fontSize: isVerySmallScreen || isRotated ? '0.75rem' : '0.9rem',
							backgroundColor: !fromHomePage ? theme.bgColor?.lessonInProgress : theme.bgColor?.greenSecondary,
							color: theme.textColor?.common.main,
							width: 'fit-content',
							fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
						}}>
						{isCapacityFull ? (fromHomePage ? 'Kontenjan doldu' : 'No seats available') : fromHomePage ? 'Kayıtlar kapalı' : 'Registration is closed'}
					</Alert>
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
						{course.documentIds.length > 0 && (
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
								{fromHomePage ? 'Kurs Materyalleri' : 'Course Materials'}
							</Typography>
						)}

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
										<Insights fontSize='small' sx={{ color: '#ffffff' }} />
									</IconButton>
								</span>
							</Tooltip>
						)}

						{/* Group Info icon - visible for enrolled courses with groups */}
						{!fromHomePage && userCourseId && userGroup && (
							<Tooltip title='Group Information' placement='top' arrow>
								<IconButton
									aria-label='Group information'
									size={isVerySmallScreen ? 'small' : 'medium'}
									sx={{
										color: theme.textColor?.common.main,
									}}
									onClick={() => setIsGroupInfoDialogOpen(true)}>
									<Info fontSize='small' sx={{ color: '#ffffff' }} />
								</IconButton>
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
							{isSubscriptionsProductEnabled
								? 'Subscribe to platform or register for a paid course to enroll in free courses'
								: 'Register for a paid course to enroll in free courses'}
						</Typography>
					)
				)}
				{fromHomePage && isCourseFree && (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'absolute', bottom: isRotated ? 60 : '1.5rem', width: '60%' }}>
						<Info fontSize='small' sx={{ color: 'lightgray' }} />
						<Typography
							variant='body2'
							sx={{
								color: 'lightgray',
								fontSize: isMobileSize ? '0.65rem' : '0.8rem',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{isSubscriptionsProductEnabled
								? 'Ücretsiz kurslara kayıt olmak için platformda hesap açtıktan sonra platforma abone olun veya ücretli bir kursa kayıt olun!'
								: 'Ücretsiz kurslara kayıt olmak için ücretli bir kursa kayıt olun!'}
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
								color: fromHomePage ? theme.textColor?.common.main : isEnrolledStatus ? theme.textColor?.primary.main : theme.textColor?.common.main,
								bgColor: fromHomePage ? '#FF6F4E' : isEnrolledStatus ? '#ffffff' : theme.bgColor?.greenSecondary,
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
							title={isEnrolledStatus ? (fromHomePage ? 'İlerleme' : 'Progress') : fromHomePage ? 'Fiyat' : 'Price'}
							content={
								isEnrolledStatus
									? `${courseProgress.percentage}%`
									: `${isCourseFree ? '' : setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${isCourseFree ? (fromHomePage ? 'Ücretsiz' : 'Free') : getPriceForCountry(course, resolvedCountryCode!)?.amount
									}`
							}
							fromHomePage={fromHomePage}
							customSettings={
								isEnrolledStatus
									? {
										bgColor: fromHomePage ? undefined : theme.bgColor?.greenSecondary,
										color: fromHomePage ? undefined : theme.textColor?.common.main,
									}
									: undefined
							}
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

			{/* LP tanıtım videosu */}
			{fromHomePage && introVideoUrl && (
				<CustomDialog
					openModal={isIntroVideoOpen}
					closeModal={closeIntroVideoModal}
					title={course.title}
					maxWidth='md'
					PaperProps={{
						sx: {
							backgroundColor: theme.palette.secondary.main,
						},
					}}>
					<DialogContent sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
						{introEmbedSrc ? (
							<Box
								sx={{
									position: 'relative',
									width: '100%',
									pt: '56.25%',
									borderRadius: 1,
									overflow: 'hidden',
									bgcolor: '#000',
								}}>
								<Box
									component='iframe'
									src={isIntroVideoOpen ? introEmbedSrc : undefined}
									title='Kurs tanıtım videosu'
									allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
									allowFullScreen
									sx={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										height: '100%',
										border: 0,
									}}
								/>
							</Box>
						) : (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
								<Typography variant='body2' sx={{ fontFamily: 'Varela Round', color: theme.textColor?.primary?.main }}>
									Video bu sayfada gömülü izlenemiyor; yeni sekmede açabilirsiniz.
								</Typography>
								<Button
									component='a'
									href={introVideoUrl}
									target='_blank'
									rel='noopener noreferrer'
									variant='contained'
									sx={{ fontFamily: 'Varela Round', textTransform: 'none', alignSelf: 'flex-start', borderRadius: '0.75rem' }}>
									Videoyu aç
								</Button>
							</Box>
						)}
					</DialogContent>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', p: '0 1.5rem 1rem 0' }}>
						<CustomCancelButton onClick={closeIntroVideoModal}>Kapat</CustomCancelButton>
					</Box>
				</CustomDialog>
			)}

			{/* Group Info Dialog */}
			<CustomDialog
				openModal={isGroupInfoDialogOpen}
				closeModal={() => setIsGroupInfoDialogOpen(false)}
				title='Group Information'
				maxWidth='xs'>
				<DialogContent sx={{ p: '2rem' }}>
					{userGroup && (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							<Box>
								<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem', color: theme.textColor?.primary.main }}>
									Group Name:
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
									{userGroup.name}
								</Typography>
							</Box>
							{userGroup.description && (
								<Box>
									<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem', color: theme.textColor?.primary.main }}>
										Description:
									</Typography>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
										{userGroup.description}
									</Typography>
								</Box>
							)}
						</Box>
					)}
				</DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', p: '0 1.5rem 1rem 0' }}>
					<CustomCancelButton onClick={() => setIsGroupInfoDialogOpen(false)}>Close</CustomCancelButton>
				</Box>
			</CustomDialog>
		</Paper>
	);
};

export default CoursePageBanner;
