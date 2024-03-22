import {
	Box,
	Button,
	Card,
	CardContent,
	CardMedia,
	LinearProgress,
	Typography,
} from '@mui/material';
import { FilteredCourse } from '../interfaces/course';
import { truncateText } from '../utils/TextUtils';
import theme from '../themes';
import { useNavigate } from 'react-router-dom';

interface DashboardCourseCardProps {
	course: FilteredCourse;
	isEnrolled: boolean;
	userId: string | undefined;
	displayMyCourses: boolean;
	userCourseId: string;
	isCourseCompleted: boolean;
}

const DashboardCourseCard = ({
	course,
	isEnrolled,
	userId,
	displayMyCourses,
	userCourseId,
	isCourseCompleted,
}: DashboardCourseCardProps) => {
	const navigate = useNavigate();

	const buttonStyles = {
		fontFamily: theme.fontFamily?.main,
		textTransform: 'capitalize',
		border: `${theme.textColor?.greenSecondary.main} solid 0.1rem`,
		borderRadius: '0.5rem',
		px: '2rem',
		':hover': {
			color: isEnrolled ? theme.textColor?.greenSecondary.main : theme.textColor?.common.main,
			backgroundColor: isEnrolled ? theme.bgColor?.common : theme.bgColor?.greenSecondary,
		},
	};
	return (
		<Card
			sx={{
				display: !isEnrolled && displayMyCourses ? 'none' : 'block',
				height: '30rem',
				width: '22rem',
				borderRadius: '0.65rem',
				position: 'relative',
				marginBottom: '3rem',
			}}>
			<CardMedia
				sx={{ height: '12rem', width: '22rem', objectFit: 'contain' }}
				image={course.imageUrl}
			/>
			<CardContent sx={{ padding: '1rem 1.5rem' }}>
				<Typography
					variant='body1'
					sx={{ textAlign: 'center', color: theme.palette.primary.main }}>
					{course.title}
				</Typography>
				<Typography
					variant='body2'
					sx={{
						textAlign: 'justify',
						fontSize: '0.85rem',
						lineHeight: '1.6',
						marginTop: '0.75rem',
						width: '100%',
					}}>
					{truncateText(course.description, 250)}
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
						variant='body2'
						sx={{ textAlign: 'center', marginBottom: '0.2rem' }}>
						{isCourseCompleted ? 'Completed' : 'In Progress'}
					</Typography>
					<LinearProgress
						variant='determinate'
						color='success'
						value={isCourseCompleted ? 100 : 70}
					/>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '1rem',
					}}>
					<Typography
						variant='body2'
						sx={{
							visibility: isEnrolled ? 'hidden' : 'visible',
							color: theme.palette.primary.main,
						}}>
						{course.price}
					</Typography>

					<Button
						sx={{
							...buttonStyles,
							backgroundColor: isEnrolled ? theme.bgColor?.greenSecondary : 'inherit',
							color: isEnrolled
								? theme.textColor?.common.main
								: theme.textColor?.greenSecondary.main,
						}}
						onClick={() => {
							navigate(
								`/course/${course._id}/user/${userId}/userCourseId/${
									userCourseId === undefined ? 'none' : userCourseId
								}?isEnrolled=${isEnrolled}`
							);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}>
						{isEnrolled && isCourseCompleted
							? 'Review Course'
							: isEnrolled && !isCourseCompleted
							? 'Continue'
							: 'Explore'}
					</Button>
				</Box>
			</Box>
		</Card>
	);
};

export default DashboardCourseCard;
