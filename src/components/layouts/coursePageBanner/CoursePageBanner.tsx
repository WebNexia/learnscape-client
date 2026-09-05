import { Alert, Box, Button, IconButton, Paper, Snackbar, Tooltip, Typography, DialogContent } from '@mui/material';
import theme from '../../../themes';
import { CourseEnrollmentProof, SingleCourse } from '../../../interfaces/course';
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
import { getListPriceIfDifferent, getPriceForCountry } from '../../../utils/getPriceForCountry';
import { resolvePricingCountryCode } from '../../../utils/resolvePricingCountryCode';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import CustomDialog from '../dialog/CustomDialog';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import { UserCourseLessonDataContext } from '../../../contexts/UserCourseLessonDataContextProvider';
import { useUserLessonsForCourse } from '../../../hooks/useUserLessonsForCourse';
import { getCourseProgress } from '../../../utils/courseProgress';
import { learnerCourseShellQueryKey } from '../../../hooks/useLearnerCourseShell';
import { isSubscriptionsProductEnabled } from '../../../config/features';
import { getPostEnrollmentUserPatch } from '../../../utils/learnerPlatformAccess';
import { extractVideoId } from '../../../utils/videoUrlUtils';

const LP_INTRO_SESSION_PREFIX = 'lpIntroVideoSession:';

/** iframe embed URL for common hosts; unsupported URLs should open in a new tab */
const getIntroVideoEmbedSrc = (raw: string): string | null => {
	const url = raw.trim();
	if (!url) return null;

	if (url.includes('youtube.com') || url.includes('youtu.be')) {
		const id = extractVideoId(url);
		return id ? `https://www.youtube.com/embed/${id}?rel=0&controls=1&playsinline=1` : null;
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
	isEnrollmentRemoved?: boolean;
	setIsEnrolledStatus?: React.Dispatch<React.SetStateAction<boolean>>;
	documentsRef?: React.RefObject<HTMLDivElement>;
	fromHomePage?: boolean;
	// Optional: used on learner course page for analytics navigation
	userCourseId?: string;
	isCourseCompleted?: boolean;
	/** Staff learner-view: overrides mobile back navigation target (defaults to /courses) */
	backToCoursesPath?: string;
}

const CoursePageBanner = ({
	course,
	isEnrolledStatus,
	isEnrollmentRemoved: isEnrollmentRemovedProp,
	setIsEnrolledStatus,
	documentsRef,
	fromHomePage,
	userCourseId,
	backToCoursesPath,
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
	const { user, setUser } = useContext(UserAuthContext);
	const { userCoursesData } = useContext(UserCourseLessonDataContext);
	const isTrUi = Boolean(fromHomePage || user);

	const enrollmentRecord = userCoursesData?.find((data) => data.courseId === courseId);
	const isEnrollmentRemoved =
		isEnrollmentRemovedProp ?? (enrollmentRecord != null && enrollmentRecord.isActive === false);

	const { data: userLessonsData } = useUserLessonsForCourse(courseId || '');
	const parsedUserLessons = userLessonsData || [];

	const isExternalCourse = Boolean(course.courseManagement?.isExternal);
	const showCourseProgress = isEnrolledStatus && !isExternalCourse;

	const courseProgress = useMemo(() => {
		if (!showCourseProgress) return { completed: 0, total: 0, percentage: 0 };
		return getCourseProgress(course, parsedUserLessons);
	}, [showCourseProgress, course, parsedUserLessons]);

	const hasCourseMaterials = useMemo(() => {
		const docsWithUrl = (course.documents ?? []).filter(
			(doc) => doc && doc._id && typeof doc.documentUrl === 'string' && doc.documentUrl.trim() !== ''
		);
		if (docsWithUrl.length > 0) return true;
		return (course.documentIds?.length ?? 0) > 0;
	}, [course.documents, course.documentIds]);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const location = useGeoLocation();

	const resolvedCountryCode = resolvePricingCountryCode(user?.countryCode, location?.countryCode);

	const sellingPrice = getPriceForCountry(course, resolvedCountryCode);
	const originalPrice = getListPriceIfDifferent(course, resolvedCountryCode);
	const isCourseFree: boolean =
		sellingPrice?.amount === 'Free' || sellingPrice?.amount === '' || sellingPrice?.amount === '0';
	const hasListPrice = Boolean(originalPrice);

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
		if (fromHomePage) {
			markIntroVideoSeenThisSession();
		}
		setIsIntroVideoOpen(false);
	};

	const introVideoButtonSx = {
		fontSize: isMobileSize ? '0.75rem' : '1rem',
		padding: isMobileSize ? '0.5rem 1rem' : '1rem 1.25rem',
		textTransform: 'none' as const,
		fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
		borderRadius: fromHomePage ? '0.75rem' : undefined,
		color: theme.textColor?.common.main,
		'&:hover': {
			borderColor: '#fff',
			backgroundColor: 'rgba(255,255,255,0.08)',
		},
	};

	const vertical = 'top';
	const horizontal = 'center';

	const courseRegistration = async (
		resolvedUserId: string,
		resolvedOrgId: string,
		groupName?: string,
		proof?: CourseEnrollmentProof
	): Promise<string> => {
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
				...(proof?.email && { email: proof.email }),
				...(proof?.paymentIntentId && { paymentIntentId: proof.paymentIntentId }),
			});

			if (!response.data?._id) {
				throw new Error('User course creation failed: Missing ID');
			}

			const userCourseId = response.data._id;

			// The server creates the initial userLesson during enrollment when chapters exist.
			await queryClient.invalidateQueries(['userLessonsForCourse', courseId, resolvedUserId]);

			// Invalidate React Query cache to refresh context data
			await queryClient.invalidateQueries(['userCourseData']);
			// Invalidate single course data to refresh capacity status
			if (courseId) {
				await queryClient.invalidateQueries(learnerCourseShellQueryKey(courseId));
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
					await courseRegistration(user?._id!, course?.orgId!, undefined, { email: user?.email });
					const patch = getPostEnrollmentUserPatch(user, course);
					if (patch) {
						setUser((prev) => (prev ? { ...prev, ...patch } : prev));
					}
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
				height: { xs: 'auto', sm: 'auto', md: 'auto', lg: fromHomePage ? '54vh' : 'auto' },
				margin:
					fromHomePage && !isSmallScreen && !isRotatedMedium ? '3rem 0 2rem 0' : isSmallScreen || isRotatedMedium ? '1.25rem 0 1.5rem 0' : '2rem 0',
				backgroundColor: fromHomePage ? theme.bgColor?.primary : theme.palette.primary.main,
				...(fromHomePage
					? {
							// Mobile only: slightly darker for white-text readability
							backgroundImage: {
								xs: 'linear-gradient(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.22))',
								sm: 'none',
							},
						}
					: null),
				padding: '0.75rem',
				borderRadius: fromHomePage ? '0.75rem' : undefined,
				overflow: fromHomePage ? 'hidden' : undefined,
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
					{isTrUi ? 'Kursa başarıyla kayıt oldunuz!' : 'You have successfully enrolled in the course!'}
					{fromHomePage && (
						<>
							<br />
							{course.courseManagement.isExternal
								? ' Detaylar email adresinize gönderildi.'
								: 'Kurs detaylarını görmek için platforma giriş yapın.'}
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
									navigate(backToCoursesPath || `/courses`);
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
							{course.title} {/*{fromHomePage && course.courseManagement.isExternal ? `(Partner Kursu)` : `(Platform Kursu)`} */}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.88rem', sm: '0.95rem', md: '1rem' },
								fontWeight: fromHomePage ? { xs: 500, sm: 400 } : 400,
								lineHeight: { xs: 1.75, sm: isSmallScreen ? 1.6 : 1.7 },
								textAlign: 'left',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								mb: '3.5rem',
								whiteSpace: 'pre-line',
							}}>
							{course.description}
						</Typography>
					</Box>
				</Box>

				{!isEnrolledStatus &&
					!isEnrollmentRemoved &&
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
									padding: isMobileSize ? '0.5rem 1rem' : '1rem 1.25rem',
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
								Kursu Satın Al
							</CustomSubmitButton>
							<CustomSubmitButton
								variant='outlined'
								onClick={() => setIsIntroVideoOpen(true)}
								startIcon={<PlayCircleOutlined />}
								sx={introVideoButtonSx}>
								Tanıtımı İzle
							</CustomSubmitButton>
						</Box>
					) : !fromHomePage && introVideoUrl ? (
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
									padding: isMobileSize ? '0.5rem 1rem' : '1rem 1.25rem',
									'fontSize': isMobileSize ? '0.75rem' : '1rem',
									'fontFamily': theme.fontFamily?.main,
									'pointerEvents': isProcessing ? 'none' : 'auto',
								}}>
								{isProcessing ? (isTrUi ? 'İşleniyor...' : 'Processing...') : isTrUi ? 'Kursu Satın Al' : 'Register'}
							</CustomSubmitButton>
							<CustomSubmitButton
								variant='outlined'
								onClick={() => setIsIntroVideoOpen(true)}
								startIcon={<PlayCircleOutlined />}
								sx={introVideoButtonSx}>
								{isTrUi ? 'Tanıtımı İzle' : 'Watch Intro'}
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
							{isProcessing
								? isTrUi
									? 'İşleniyor...'
									: 'Processing...'
								: isTrUi
									? 'Kursu Satın Al'
									: 'Enroll'}
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
						{isCapacityFull ? (isTrUi ? 'Kontenjan doldu' : 'No seats available') : isTrUi ? 'Kayıtlar kapalı' : 'Registration is closed'}
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
						{isTrUi ? 'Kayıt süresi doldu' : 'Enrollment is closed'}
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
						{hasCourseMaterials && (
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
								{isTrUi ? 'Kurs Materyalleri' : 'Materials'}
							</Typography>
						)}

						{introVideoUrl && (
							<CustomSubmitButton
								variant='outlined'
								onClick={() => setIsIntroVideoOpen(true)}
								startIcon={<PlayCircleOutlined />}
								sx={{
									...introVideoButtonSx,
									fontSize: isVerySmallScreen || isRotated ? '0.65rem' : introVideoButtonSx.fontSize,
									padding: isVerySmallScreen || isRotated ? '0.35rem 0.75rem' : introVideoButtonSx.padding,
								}}>
								{isTrUi ? 'Tanıtımı İzle' : 'Watch Intro'}
							</CustomSubmitButton>
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
					!fromHomePage &&
					isCourseFree &&
					!isEnrollmentRemoved && (
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
								? isTrUi
									? 'Ücretsiz kurslara kayıt için platforma abone olun veya ücretli bir kursa kayıt olun'
									: 'Subscribe to platform or register for a paid course to enroll in free courses'
								: isTrUi
									? 'Ücretsiz kurslara kayıt için ücretli bir kursa kayıt olun'
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
							title={isTrUi ? 'Başlangıç Tarihi' : 'Starting Date'}
							content={dateFormatter(course.startingDate)}
							fromHomePage={fromHomePage}
							customSettings={{
								color: fromHomePage ? theme.textColor?.common.main : isEnrolledStatus ? theme.textColor?.primary.main : theme.textColor?.common.main,
								bgColor: fromHomePage ? '#FF6F4E' : isEnrolledStatus ? '#ffffff' : theme.bgColor?.greenSecondary,
							}}
						/>

						<CoursePageBannerDataCard
							title={isTrUi ? 'Hafta(#)' : 'Weeks(#)'}
							content={course.durationWeeks ?? ''}
							fromHomePage={fromHomePage}
						/>
					</Box>
					<Box>
						<CoursePageBannerDataCard
							title={isTrUi ? 'Ders(#)' : 'Lessons(#)'}
							content={course.durationHours ?? ''}
							fromHomePage={fromHomePage}
						/>
						<CoursePageBannerDataCard
							title={
								showCourseProgress
									? isTrUi
										? 'İlerleme'
										: 'Progress'
									: isEnrolledStatus
										? isTrUi
											? 'Durum'
											: 'Status'
										: isTrUi
											? 'Fiyat'
											: 'Price'
							}
							content={
								showCourseProgress
									? `${courseProgress.percentage}%`
									: isEnrolledStatus
										? fromHomePage
											? 'Kayıtlı'
											: 'Enrolled'
										: isCourseFree
											? isTrUi
												? 'Ücretsiz'
												: 'Free'
											: (
												<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
													{originalPrice ? (
														<Box
															component='span'
															sx={{
																fontSize: isMobileSize ? '0.62rem' : '0.78rem',
																fontWeight: 700,
																textDecoration: 'line-through',
																textDecorationThickness: '2px',
																color: '#334155',
																lineHeight: 1.2,
															}}>
															{setCurrencySymbol(originalPrice.currency)}
															{originalPrice.amount}
														</Box>
													) : null}
													<Box component='span' sx={{ lineHeight: 1.15 }}>
														{setCurrencySymbol(sellingPrice?.currency ?? '')}
														{sellingPrice?.amount}
													</Box>
												</Box>
											)
							}
							fromHomePage={fromHomePage}
							customSettings={
								isEnrolledStatus
									? {
										bgColor: fromHomePage ? undefined : theme.bgColor?.greenSecondary,
										color: fromHomePage ? undefined : theme.textColor?.common.main,
									}
									: hasListPrice
										? { height: { xs: '4.6rem', sm: '4.6rem', md: '6rem' } }
										: undefined
							}
						/>
					</Box>
				</Box>

				{!fromHomePage && (
					<PaymentDialogWrapper
						course={course}
						isPaymentDialogOpen={isPaymentDialogOpen}
						setIsPaymentDialogOpen={setIsPaymentDialogOpen}
						courseRegistration={courseRegistration}
						fromHomePage={fromHomePage}
						setDisplayEnrollmentMsg={setDisplayEnrollmentMsg}
						setIsEnrolledStatus={setIsEnrolledStatus}
					/>
				)}
			</Box>

			{introVideoUrl && (
				<CustomDialog
					openModal={isIntroVideoOpen}
					closeModal={closeIntroVideoModal}
					maxWidth='md'
					PaperProps={{
						style: { backgroundColor: 'transparent' },
						sx: {
							backgroundColor: 'transparent',
							backgroundImage: 'none',
							overflow: 'hidden',
							boxShadow: 'none',
							borderRadius: { xs: '0.5rem', sm: '0.75rem' },
							margin: { xs: '0.75rem', sm: '1.5rem' },
							width: { xs: 'calc(100% - 1.5rem)', sm: '100%' },
							maxWidth: { xs: 'calc(100% - 1.5rem)', md: '900px' },
						},
					}}>
					<DialogContent sx={{ backgroundColor: 'transparent', p: 0, overflow: 'hidden' }}>
						{introEmbedSrc ? (
							<Box
								sx={{
									position: 'relative',
									width: 'min(100%, calc((100dvh - 2rem) * 16 / 9))',
									aspectRatio: '16 / 9',
									mx: 'auto',
									overflow: 'hidden',
									bgcolor: '#000',
									borderRadius: { xs: '0.5rem', sm: '0.75rem' },
									'& iframe, & video, & > div': {
										backgroundColor: '#000',
									},
								}}>
								<Box
									component='iframe'
									src={isIntroVideoOpen ? introEmbedSrc : undefined}
									title={isTrUi ? 'Kurs tanıtım videosu' : 'Course intro video'}
									allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
									allowFullScreen
									sx={{
										position: 'absolute',
										inset: 0,
										width: '100%',
										height: '100%',
										border: 0,
										backgroundColor: '#000',
									}}
								/>
							</Box>
						) : (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
								<Typography
									variant='body2'
									sx={{
										fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
										color: '#fff',
									}}>
									{isTrUi
										? 'Video bu sayfada gömülü izlenemiyor; yeni sekmede açabilirsiniz.'
										: 'This video cannot be embedded here; you can open it in a new tab.'}
								</Typography>
								<Button
									component='a'
									href={introVideoUrl}
									target='_blank'
									rel='noopener noreferrer'
									variant='contained'
									sx={{
										fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
										textTransform: 'none',
										alignSelf: 'flex-start',
										borderRadius: fromHomePage ? '0.75rem' : undefined,
									}}>
									{isTrUi ? 'Videoyu aç' : 'Open video'}
								</Button>
							</Box>
						)}
					</DialogContent>
				</CustomDialog>
			)}

			{/* Group Info Dialog */}
			<CustomDialog
				openModal={isGroupInfoDialogOpen}
				closeModal={() => setIsGroupInfoDialogOpen(false)}
				title={isTrUi ? 'Grup Bilgisi' : 'Group Information'}
				maxWidth='xs'>
				<DialogContent sx={{ p: '2rem' }}>
					{userGroup && (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							<Box>
								<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem', color: theme.textColor?.primary.main }}>
									{isTrUi ? 'Grup Adı:' : 'Group Name:'}
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
									{userGroup.name}
								</Typography>
							</Box>
							{userGroup.description && (
								<Box>
									<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem', color: theme.textColor?.primary.main }}>
										{isTrUi ? 'Açıklama:' : 'Description:'}
									</Typography>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem', whiteSpace: 'pre-line' }}>
										{userGroup.description}
									</Typography>
								</Box>
							)}
						</Box>
					)}
				</DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', p: '0 1.5rem 1rem 0' }}>
					<CustomCancelButton onClick={() => setIsGroupInfoDialogOpen(false)}>{isTrUi ? 'Kapat' : 'Close'}</CustomCancelButton>
				</Box>
			</CustomDialog>
		</Paper>
	);
};

export default CoursePageBanner;
