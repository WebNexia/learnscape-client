import { Button, Card, CardActions, CardContent, CardMedia, Typography } from '@mui/material';
import { Course } from '../interfaces/course';

interface DashboardCourseCardProps {
	course: Course;
}

const DashboardCourseCard = ({ course }: DashboardCourseCardProps) => {
	return (
		<Card sx={{ height: '30rem', maxWidth: '25rem', borderRadius: '0.65rem' }}>
			<CardMedia sx={{ height: '12rem', objectFit: 'contain' }} image={course.imageUrl} />
			<CardContent sx={{ padding: '1rem 1.5rem' }}>
				<Typography variant='body1' sx={{ textAlign: 'center' }}>
					{course.title}
				</Typography>
				<Typography variant='body2' sx={{ textAlign: 'justify', fontSize: '0.85rem', lineHeight: '1.6' }}>
					{course.description}
				</Typography>
			</CardContent>
			<CardActions>
				<Button>Explore</Button>
			</CardActions>
		</Card>
	);
};

export default DashboardCourseCard;
