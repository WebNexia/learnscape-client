import { Box, Button, Paper, Typography } from '@mui/material';
import theme from '../themes';
import { Course } from '../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';

interface CoursePageBannerProps {
	course: Course;
	userId?: string;
}

const CoursePageBanner = ({ course, userId }: CoursePageBannerProps) => {
	const navigate = useNavigate();
	return (
		<Paper
			elevation={10}
			sx={{
				width: '85%',
				height: '23rem',
				marginTop: '3rem',
				backgroundColor: theme.palette.primary.main,
			}}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						margin: '1rem 3rem 1rem 2rem',
						flex: 1,
						position: 'relative',
						height: '20rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								color: theme.textColor?.common.main,
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => navigate(`/courses/user/${userId}`)}>
							Back to courses
						</Button>
						<Typography
							variant='h3'
							sx={{ color: theme.textColor?.common.main, margin: '0.5rem 0 1rem 0' }}>
							{course.title}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: '0.85rem',
								lineHeight: 1.8,
								textAlign: 'justify',
							}}>
							{course.description}
						</Typography>
						<Button
							variant='contained'
							sx={{
								backgroundColor: theme.bgColor?.greenSecondary,
								width: '100%',
								textTransform: 'capitalize',
								position: 'absolute',
								bottom: 5,
								fontSize: '1rem',
								':hover': {
									color: theme.textColor?.greenSecondary.main,
									backgroundColor: theme.submitBtn?.[':hover'].backgroundColor,
								},
							}}>
							Enroll
						</Button>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
					<Box>
						<CoursePageBannerDataCard title='Starting Date' content='January 1, 2024' />
						<CoursePageBannerDataCard title='Duration' content='8 Weeks' />
					</Box>
					<Box>
						<CoursePageBannerDataCard title='Format' content='Online Course' />

						<CoursePageBannerDataCard
							title='Price'
							content={course.price}
							customSettings={{
								color: theme.textColor?.common.main,
								bgColor: theme.bgColor?.greenSecondary,
							}}
						/>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
