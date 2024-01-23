import { Box, Button, Paper, Typography } from '@mui/material';
import theme from '../themes';
import { Course } from '../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
								backgroundColor: theme.submitBtn?.backgroundColor?.secondary,
								width: '100%',
								textTransform: 'capitalize',
								position: 'absolute',
								bottom: 5,
								fontSize: '1rem',
								':hover': {
									color: theme.submitBtn?.backgroundColor?.secondary,
									backgroundColor: theme.submitBtn?.[':hover'].backgroundColor,
								},
							}}>
							Enroll
						</Button>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
					<Box>
						<Box
							sx={{
								width: '9rem',
								height: '6rem',
								backgroundColor: theme.bgColor?.common,
								borderRadius: '0.4rem',
								margin: '0 0.3rem 0.3rem 0',
								padding: '0.5rem',
								':hover': {
									backgroundColor: theme.bgColor?.greenSecondary,
								},
							}}>
							<Typography variant='body2' sx={{ fontSize: '0.85rem' }}>
								Starting Date
							</Typography>
							<Typography
								variant='body1'
								sx={{ color: theme.textColor?.primary.main, fontSize: '1.15rem' }}>
								January 1, 2024
							</Typography>
						</Box>
						<Box
							sx={{
								width: '9rem',
								height: '6rem',
								backgroundColor: theme.bgColor?.common,
								borderRadius: '0.4rem',
								margin: '0 0.3rem 0.3rem 0',
								padding: '0.5rem',
								':hover': {
									backgroundColor: theme.bgColor?.greenSecondary,
								},
							}}>
							<Typography variant='body2' sx={{ fontSize: '0.85rem' }}>
								Format
							</Typography>
							<Typography
								variant='body1'
								sx={{ color: theme.textColor?.primary.main, fontSize: '1.15rem' }}>
								Online Course
							</Typography>
						</Box>
					</Box>
					<Box>
						<Box
							sx={{
								width: '9rem',
								height: '6rem',
								backgroundColor: theme.bgColor?.common,
								borderRadius: '0.4rem',
								margin: '0 0.3rem 0.3rem 0',
								padding: '0.5rem',
								':hover': {
									backgroundColor: theme.bgColor?.greenSecondary,
								},
							}}>
							<Typography variant='body2' sx={{ fontSize: '0.85rem' }}>
								Duration
							</Typography>
							<Typography
								variant='body1'
								sx={{ color: theme.textColor?.primary.main, fontSize: '1.15rem' }}>
								8 weeks
							</Typography>
						</Box>
						<Box
							sx={{
								width: '9rem',
								height: '6rem',
								backgroundColor: theme.bgColor?.common,
								borderRadius: '0.4rem',
								margin: '0 0.3rem 0.3rem 0',
								padding: '0.5rem',
								':hover': {
									backgroundColor: theme.bgColor?.greenSecondary,
								},
							}}>
							<Typography variant='body2' sx={{ fontSize: '0.85rem' }}>
								Price
							</Typography>
							<Typography
								variant='body1'
								sx={{ color: theme.textColor?.primary.main, fontSize: '1.15rem' }}>
								{course.price}
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
