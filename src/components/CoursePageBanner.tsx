import { Box, Button, Paper } from '@mui/material';
import theme from '../themes';
import { Course } from '../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';

interface CoursePageBannerProps {
	course: Course;
}

const CoursePageBanner = ({ course }: CoursePageBannerProps) => {
	return (
		<Paper
			elevation={4}
			sx={{
				width: '90%',
				height: '20rem',
				marginTop: '3rem',
				backgroundColor: theme.palette.primary.main,
			}}>
			<Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', margin: '1rem 3rem 1rem 2rem' }}>
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
							}}>
							Back to courses
						</Button>
					</Box>
				</Box>
				<Box></Box>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
