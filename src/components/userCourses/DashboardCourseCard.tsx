import { Avatar, Box, Button, Card, CardContent, CardMedia, LinearProgress, Typography, Chip } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { truncateText } from '../../utils/utilText';
import { useContext } from 'react';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../utils/getPriceForCountry';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useGeoLocation } from '../../hooks/useGeoLocation';

interface DashboardCourseCardProps {
	course: SingleCourse;
	isEnrolled?: boolean;
	userId?: string | undefined;
	displayMyCourses?: boolean;
	userCourseId?: string;
	isCourseCompleted?: boolean;
	fromHomePage?: boolean;
}

const DashboardCourseCard = ({
	course,
	isEnrolled,
	userId,
	displayMyCourses,
	userCourseId,
	isCourseCompleted,
	fromHomePage,
}: DashboardCourseCardProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	const location = useGeoLocation();

	let resolvedCountryCode = user?.countryCode || location?.countryCode || 'US';

	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const buttonStyles = {
		'fontFamily': theme.fontFamily?.main,
		'textTransform': 'capitalize',
		'border': `${theme.textColor?.greenSecondary.main} solid 0.1rem`,
		'borderRadius': '0.5rem',
		'px': '0.75rem',
		'fontSize': isMobileSize ? '0.7rem' : '0.8rem',
		':hover': {
			color: isEnrolled ? theme.textColor?.greenSecondary.main : theme.textColor?.common.main,
			backgroundColor: isEnrolled ? theme.bgColor?.common : theme.bgColor?.greenSecondary,
		},
	};

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
				if (!fromHomePage) {
					navigate(
						`/course/${course._id}/user/${userId}/userCourseId/${userCourseId === undefined ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`
					);
				} else {
					navigate(`/course/${course.title}/${course._id}`);
				}
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}}>
			{course.isExpired && (
				<Box
					sx={{
						position: 'absolute',
						top: 5,
						right: 5,
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
						fontSize: isMobileSize ? '0.9rem' : '1rem',
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
					{truncateText(course.description, 200)}
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
						{fromHomePage && (
							<Chip
								label={course.courseManagement.isExternal ? <span>Partner</span> : <span>Platform</span>}
								color={course.courseManagement.isExternal ? 'info' : 'success'}
								size='small'
								sx={{
									fontFamily: 'Varela Round',
									fontWeight: 500,
									color: 'white',
									ml: 'auto',
									px: 1,
								}}
							/>
						)}
					</Box>

					{!fromHomePage && (
						<Button
							sx={{
								...buttonStyles,
								backgroundColor: isEnrolled ? theme.bgColor?.greenSecondary : 'inherit',
								color: isEnrolled ? theme.textColor?.common.main : theme.textColor?.greenSecondary.main,
							}}
							size={isMobileSize ? 'small' : 'small'}
							onClick={() => {
								if (!fromHomePage) {
									navigate(
										`/course/${course._id}/user/${userId}/userCourseId/${userCourseId === undefined ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`
									);
								} else {
									navigate(`/course/${course.title}/${course._id}`);
								}
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isEnrolled && isCourseCompleted ? 'Review Course' : isEnrolled && !isCourseCompleted ? 'Continue' : 'Explore'}
						</Button>
					)}
				</Box>
			</Box>
		</Card>
	);
};

export default DashboardCourseCard;
