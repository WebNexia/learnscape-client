import { Box, Button, Card, CardContent, CardMedia, LinearProgress, Typography } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { truncateText } from '../../utils/utilText';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import { useContext } from 'react';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { getPriceForCountry } from '../../utils/getPriceForCountry';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface DashboardCourseCardProps {
	course: SingleCourse;
	isEnrolled: boolean;
	userId: string | undefined;
	displayMyCourses: boolean;
	userCourseId: string;
	isCourseCompleted: boolean;
}

const DashboardCourseCard = ({ course, isEnrolled, userId, displayMyCourses, userCourseId, isCourseCompleted }: DashboardCourseCardProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const buttonStyles = {
		fontFamily: theme.fontFamily?.main,
		textTransform: 'capitalize',
		border: `${theme.textColor?.greenSecondary.main} solid 0.1rem`,
		borderRadius: '0.5rem',
		px: isMobileSize ? '1rem' : '2rem',
		fontSize: isMobileSize ? '0.7rem' : '0.85rem',
		':hover': {
			color: isEnrolled ? theme.textColor?.greenSecondary.main : theme.textColor?.common.main,
			backgroundColor: isEnrolled ? theme.bgColor?.common : theme.bgColor?.greenSecondary,
		},
	};

	const isCourseFree: boolean =
		getPriceForCountry(course, user?.countryCode!).amount === '0' ||
		getPriceForCountry(course, user?.countryCode!).amount === 'Free' ||
		getPriceForCountry(course, user?.countryCode!).amount === '';
	return (
		<Card
			sx={{
				display: !isEnrolled && displayMyCourses ? 'none' : 'block',
				height: isMobileSize ? '24rem' : '30rem',
				width: isMobileSize ? '16rem' : '22rem',
				borderRadius: '0.65rem',
				position: 'relative',
				margin: '0 0.2rem 2rem 0.2rem',
			}}>
			<CardMedia
				sx={{ height: isMobileSize ? '9rem' : '12rem', width: isMobileSize ? '17rem' : '22rem', objectFit: 'contain' }}
				image={
					course.imageUrl ||
					'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
				}
			/>
			<CardContent sx={{ padding: '1rem 1.5rem' }}>
				<Typography sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', textAlign: 'center', color: theme.palette.primary.main }}>
					{course.title}
				</Typography>
				<Typography
					variant='body2'
					sx={{
						textAlign: 'justify',
						fontSize: isMobileSize ? '0.7rem' : '0.85rem',
						lineHeight: isMobileSize ? '1.5' : '1.6',
						marginTop: isMobileSize ? '0.5rem' : '0.75rem',
						width: '100%',
					}}>
					{truncateText(course.description, 175)}
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
					<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', textAlign: 'center', marginBottom: '0.2rem' }}>
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
					<Typography
						sx={{
							fontSize: isMobileSize ? '0.7rem' : '0.85rem',
							visibility: isEnrolled ? 'hidden' : 'visible',
							color: theme.palette.primary.main,
						}}>
						{isCourseFree ? '' : setCurrencySymbol(getPriceForCountry(course, user?.countryCode!).currency)}
						{isCourseFree ? 'Free' : getPriceForCountry(course, user?.countryCode!).amount}
					</Typography>

					<Button
						sx={{
							...buttonStyles,
							backgroundColor: isEnrolled ? theme.bgColor?.greenSecondary : 'inherit',
							color: isEnrolled ? theme.textColor?.common.main : theme.textColor?.greenSecondary.main,
						}}
						size={isMobileSize ? 'small' : 'medium'}
						onClick={() => {
							navigate(
								`/course/${course._id}/user/${userId}/userCourseId/${userCourseId === undefined ? 'none' : userCourseId}?isEnrolled=${isEnrolled}`
							);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}>
						{isEnrolled && isCourseCompleted ? 'Review Course' : isEnrolled && !isCourseCompleted ? 'Continue' : 'Explore'}
					</Button>
				</Box>
			</Box>
		</Card>
	);
};

export default DashboardCourseCard;
