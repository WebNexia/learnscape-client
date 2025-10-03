import { Avatar, Box, Card, CardContent, CardMedia, LinearProgress, Typography, Chip } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { truncateText } from '../../utils/utilText';
import { useContext } from 'react';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../utils/getPriceForCountry';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { setCurrencySymbol } from '@utils/setCurrencySymbol';

interface DashboardCourseCardProps {
	course: SingleCourse;
	isEnrolled?: boolean;
	displayMyCourses?: boolean;
	userCourseId?: string;
	isCourseCompleted?: boolean;
	fromHomePage?: boolean;
}

const DashboardCourseCard = ({ course, isEnrolled, displayMyCourses, userCourseId, isCourseCompleted, fromHomePage }: DashboardCourseCardProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	const location = useGeoLocation();

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const isCourseFree: boolean =
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '0' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === 'Free' ||
		getPriceForCountry(course, resolvedCountryCode!)?.amount === '';
	return (
		<Card
			sx={{
				'display': !isEnrolled && displayMyCourses ? 'none' : 'block',
				'height': isMobileSize ? '21rem' : '25rem',
				'width': isMobileSize ? '15rem' : '19rem',
				'borderRadius': '0.65rem',
				'position': 'relative',
				'margin': '0 1rem 2rem 1rem',
				'boxShadow': '0.1rem 0rem 0.4rem 0.1rem rgba(0,0,0,0.15)',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0.1rem 0.2rem 0.4rem 0.2rem rgba(0,0,0,0.25)',
				},
				'cursor': 'pointer',
			}}
			onClick={() => {
				if (user && !fromHomePage) {
					// Logged-in user from dashboard - go to course page
					navigate(`/course/${course._id}/userCourseId/${!userCourseId ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`);
				} else if (user && fromHomePage) {
					// Logged-in user from home page - still go to course page
					navigate(`/course/${course._id}/userCourseId/${!userCourseId ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`);
				} else {
					// Non-logged-in user - go to landing page
					navigate(`/landing-page-course/${encodeURIComponent(course?.title)}/${course?._id}`);
				}
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}}>
			{course.isExpired && (
				<Box
					sx={{
						position: 'absolute',
						top: '0.5rem',
						right: '0.5rem',
						backgroundColor: theme.palette.error.main,
						color: 'white',
						px: 1.5,
						py: 0.25,
						borderRadius: '4px',
						fontSize: '0.7rem',
						fontWeight: 500,
						zIndex: 1,
						fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
					}}>
					<Typography variant='body2' sx={{ color: theme.textColor?.common.main, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
						Closed
					</Typography>
				</Box>
			)}

			{fromHomePage && course.courseManagement && (
				<Chip
					label={course.courseManagement.isExternal ? <span>Partner</span> : <span>Platform</span>}
					color={course.courseManagement.isExternal ? 'info' : 'success'}
					size='small'
					sx={{
						position: 'absolute',
						top: '0.5rem',
						left: '0.5rem',
						fontFamily: 'Varela Round',
						fontWeight: 500,
						color: 'white',
						ml: 'auto',
						px: 1,
					}}
				/>
			)}

			<CardMedia
				sx={{ height: isMobileSize ? '7rem' : '10rem', width: isMobileSize ? '17rem' : '22rem', objectFit: 'contain' }}
				image={
					course.imageUrl ||
					'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
				}
			/>
			<CardContent sx={{ padding: '1rem 1.5rem' }}>
				<Typography
					sx={{
						fontSize: {
							xs: '0.8rem',
							sm: '0.8rem',
							md: course?.title?.length > 35 ? '0.8rem' : '0.9rem',
							lg: course?.title?.length > 35 ? '0.9rem' : '1rem',
						},
						textAlign: 'center',
						color: theme.palette.primary.main,
						fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
					}}>
					{course.title}
				</Typography>
				<Typography
					variant='body2'
					sx={{
						textAlign: 'justify',
						fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						lineHeight: isMobileSize ? '1.4' : '1.5',
						marginTop: isMobileSize ? '0.5rem' : '0.75rem',
						width: '100%',
						fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
					}}>
					{truncateText(course.description, isEnrolled && isMobileSize ? 125 : isEnrolled ? 150 : 200)}
				</Typography>
			</CardContent>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					position: 'absolute',
					bottom: 0,
				}}>
				<Box
					sx={{
						visibility: isEnrolled ? 'visible' : 'hidden',
						width: '90%',
						alignSelf: 'center',
					}}>
					<Typography
						sx={{
							fontSize: isMobileSize ? '0.75rem' : '0.85rem',
							textAlign: 'center',
							marginBottom: '0.2rem',
							fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
						}}>
						{isCourseCompleted ? 'Completed' : 'In Progress'}
					</Typography>
					<LinearProgress variant='determinate' color='success' value={isCourseCompleted ? 100 : 70} />
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '1rem',
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
						<Avatar src={course?.instructor?.imageUrl} sx={{ width: '1.5rem', height: '1.5rem', objectFit: 'cover' }} />
						<Typography
							variant='body2'
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								visibility: isEnrolled ? 'hidden' : 'visible',
								color: theme.palette.primary.main,
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{course?.instructor?.name}
						</Typography>
					</Box>

					{fromHomePage && (
						<Typography
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
							}}>
							{isCourseFree
								? 'Ücretsiz'
								: `${setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${getPriceForCountry(course, resolvedCountryCode!)?.amount}`}
						</Typography>
					)}

					{!fromHomePage && (
						<Typography
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.85rem',
								fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								width: '100%',
								textAlign: 'right',
							}}>
							{isEnrolled && isCourseCompleted
								? 'Review Course'
								: isEnrolled && !isCourseCompleted
									? 'Continue'
									: isCourseFree
										? 'Free'
										: `${setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${getPriceForCountry(course, resolvedCountryCode!)?.amount}`}
						</Typography>
					)}
				</Box>
			</Box>
		</Card>
	);
};

export default DashboardCourseCard;
