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
				'borderRadius': '0.75rem',
				'position': 'relative',
				'overflow': 'hidden',
				'margin': '0 1rem 2rem 1rem',
				'backgroundColor': '#FFFFFF',
				'border': '1px solid rgba(0, 82, 163, 0.12)',
				'boxShadow': '0 12px 30px rgba(0, 82, 163, 0.08)',
				'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: '4px',
					background: 'linear-gradient(90deg, #0052a3 0%, #0066CC 100%)',
					transform: 'scaleX(0)',
					transformOrigin: 'left',
					transition: 'transform 0.3s ease',
					zIndex: 1,
				},
				':hover': {
					transform: 'translateY(-4px)',
					boxShadow: '0 20px 40px rgba(0, 82, 163, 0.12)',
					borderColor: 'rgba(0, 82, 163, 0.25)',
					'&::before': {
						transform: 'scaleX(1)',
					},
				},
				':active': {
					transform: 'translateY(-2px)',
					boxShadow: '0 16px 36px rgba(0, 82, 163, 0.1)',
					borderColor: 'rgba(0, 82, 163, 0.25)',
					'&::before': { transform: 'scaleX(1)' },
				},
				':focus-within': {
					transform: 'translateY(-4px)',
					boxShadow: '0 20px 40px rgba(0, 82, 163, 0.12)',
					borderColor: 'rgba(0, 82, 163, 0.25)',
					'&::before': { transform: 'scaleX(1)' },
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
				sx={{ height: isMobileSize ? '7rem' : '10rem', width: isMobileSize ? '17rem' : '22rem', objectFit: 'cover' }}
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
						color: fromHomePage ? '#0052a3' : theme.palette.primary.main,
						fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
						fontWeight: fromHomePage ? 600 : 400,
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
						padding: '1rem 1.25rem',
						borderTop: '1px solid rgba(0, 82, 163, 0.1)',
						backgroundColor: 'rgba(0, 82, 163, 0.04)',
						borderRadius: '0 0 0.75rem 0.75rem',
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
						<Avatar
							src={course?.instructor?.imageUrl}
							sx={{
								width: '1.75rem',
								height: '1.75rem',
								objectFit: 'cover',
								border: '2px solid #fff',
								boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
							}}
						/>
						<Box sx={{ display: 'flex', flexDirection: 'column', visibility: isEnrolled ? 'hidden' : 'visible' }}>
							<Typography
								sx={{
									fontSize: '0.65rem',
									letterSpacing: '0.5px',
									textTransform: 'uppercase',
									color: 'rgba(0, 82, 163, 0.65)',
									fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
								}}>
								Eğitmen
							</Typography>
							<Typography
								variant='body2'
								sx={{
									fontSize: isMobileSize ? '0.72rem' : '0.8rem',
									fontWeight: 600,
									color: fromHomePage ? '#0052a3' : theme.palette.primary.main,
									fontFamily: fromHomePage ? 'Varela Round' : theme.fontFamily?.main,
									lineHeight: 1.2,
								}}>
								{course?.instructor?.name}
							</Typography>
						</Box>
					</Box>

					{fromHomePage && (
						<Box
							sx={{
								px: 1,
								py: 0.375,
								borderRadius: '999px',
								backgroundColor: isCourseFree ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 82, 163, 0.12)',
								fontFamily: 'Varela Round',
								fontWeight: 600,
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								color: isCourseFree ? '#059669' : '#0052a3',
								transition: 'transform 0.2s ease',
								'&:hover': { transform: 'scale(1.02)' },
							}}>
							{isCourseFree
								? 'Ücretsiz'
								: `${setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${getPriceForCountry(course, resolvedCountryCode!)?.amount}`}
						</Box>
					)}

					{!fromHomePage && (
						<Box
							component='span'
							sx={{
								px: 1,
								py: 0.375,
								borderRadius: '999px',
								backgroundColor: isEnrolled ? 'rgba(0, 82, 163, 0.1)' : 'rgba(0, 82, 163, 0.12)',
								fontFamily: theme.fontFamily?.main,
								fontWeight: 600,
								fontSize: isMobileSize ? '0.72rem' : '0.8rem',
								color: theme.palette.primary.main,
							}}>
							{isEnrolled && isCourseCompleted
								? 'Review Course'
								: isEnrolled && !isCourseCompleted
									? 'Continue'
									: isCourseFree
										? 'Free'
										: `${setCurrencySymbol(getPriceForCountry(course, resolvedCountryCode!)?.currency)}${getPriceForCountry(course, resolvedCountryCode!)?.amount}`}
						</Box>
					)}
				</Box>
			</Box>
		</Card>
	);
};

export default DashboardCourseCard;
