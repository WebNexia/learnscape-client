import { Button, Card, CardActions, CardContent, CardMedia, Typography } from '@mui/material';
import { Course } from '../interfaces/course';
import { truncateText } from '../utils/TextUtils';
import theme from '../themes';
import { useNavigate } from 'react-router-dom';

interface DashboardCourseCardProps {
	course: Course;
}

const DashboardCourseCard = ({ course }: DashboardCourseCardProps) => {
	const navigate = useNavigate();
	return (
		<Card
			sx={{
				height: '30rem',
				maxWidth: '25rem',
				borderRadius: '0.65rem',
				position: 'relative',
				marginBottom: '3rem',
			}}>
			<CardMedia sx={{ height: '12rem', objectFit: 'contain' }} image={course.imageUrl} />
			<CardContent sx={{ padding: '1rem 1.5rem' }}>
				<Typography variant='body1' sx={{ textAlign: 'center', color: theme.palette.primary.main }}>
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
			<CardActions
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					position: 'absolute',
					bottom: 0,
					width: '100%',
					padding: '1rem',
				}}>
				<Typography variant='body2' sx={{ color: theme.palette.primary.main }}>
					{course.price}
				</Typography>
				<Button
					sx={{
						fontFamily: theme.fontFamily?.main,
						color: theme.submitBtn?.backgroundColor,
						textTransform: 'capitalize',
						border: `${theme.submitBtn?.backgroundColor} solid 0.1rem`,
						borderRadius: '0.5rem',
						px: '2rem',
						':hover': {
							color: theme.textColor?.common.main,
							backgroundColor: theme.submitBtn?.backgroundColor,
						},
					}}
					onClick={() => navigate(`/course/${course._id}`)}>
					Explore
				</Button>
			</CardActions>
		</Card>
	);
};

export default DashboardCourseCard;
