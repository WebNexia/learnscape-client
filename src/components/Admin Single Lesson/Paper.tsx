import { Box, Button, Paper, Typography } from '@mui/material';
import theme from '../../themes';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../interfaces/lessons';

interface LessonPaperProps {
	userId?: string;
	singleLesson?: Lesson;
	isActive?: boolean;
}

const LessonPaper = ({ userId, singleLesson, isActive }: LessonPaperProps) => {
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
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						flex: 2,
						padding: '0.5rem',
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
							onClick={() => {
								navigate(`/admin/lessons/user/${userId}`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to lessons
						</Button>
					</Box>
					<Box sx={{ width: '100%' }}>
						<Typography
							variant='h6'
							sx={{
								textTransform: 'capitalize',
								color: theme.textColor?.common.main,
								padding: '0.5rem',
							}}>
							{singleLesson?.type}
						</Typography>
					</Box>
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
						{singleLesson?.title}
					</Typography>
					<Typography variant='body2' sx={{ color: theme.textColor?.common.main, mt: '0.75rem' }}>
						{isActive ? '(Published)' : '(Unpublished)'}
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default LessonPaper;
