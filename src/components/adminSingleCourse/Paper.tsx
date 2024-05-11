import { Box, Button, Paper, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { SingleCourse } from '../../interfaces/course';

interface CoursePaperProps {
	userId?: string;
	singleCourse?: SingleCourse;
	isActive?: boolean;
}

const CoursePaper = ({ userId, singleCourse, isActive }: CoursePaperProps) => {
	const navigate = useNavigate();
	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '7rem',
				m: '2.25rem 0',
				backgroundColor: theme.palette.primary.main,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box sx={{ flex: 2, padding: '0.5rem' }}>
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
						onClick={() => {
							navigate(`/admin/courses/user/${userId}`);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}>
						Back to courses
					</Button>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'flex-end',
						flex: 1,
						mr: '3rem',
					}}>
					<Typography variant='h3' sx={{ color: theme.textColor?.common.main }}>
						{singleCourse?.title}
					</Typography>
					<Typography variant='body2' sx={{ color: theme.textColor?.common.main, mt: '0.75rem' }}>
						{isActive ? '(Published)' : '(Unpublished)'}
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePaper;
