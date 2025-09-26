import { Box, Chip, DialogActions, DialogContent, Typography } from '@mui/material';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomDialog from './dialog/CustomDialog';
import theme from '../../themes';

interface CoursesInfoDialogProps {
	isInfoDialogOpen: boolean;
	setIsInfoDialogOpen: (isInfoDialogOpen: boolean) => void;
}

const CoursesInfoDialog = ({ isInfoDialogOpen, setIsInfoDialogOpen }: CoursesInfoDialogProps) => {
	return (
		<CustomDialog
			openModal={isInfoDialogOpen}
			closeModal={() => setIsInfoDialogOpen(false)}
			maxWidth='sm'
			title='About Course Types'
			titleSx={{
				fontSize: '1.5rem',
				fontWeight: 600,
				fontFamily: theme.fontFamily?.main,
				color: theme.palette.primary.main,
				ml: '0.5rem',
				textAlign: 'center',
				mb: 1,
			}}
			PaperProps={{
				sx: {
					height: 'auto',
					maxHeight: '90vh',
					overflow: 'visible',
					borderRadius: '1rem',
					background: theme.palette.background.paper,
					boxShadow: '0 0.5rem 2rem rgba(0, 0, 0, 0.1)',
					fontFamily: theme.fontFamily?.main,
				},
			}}>
			<DialogContent>
				<Box sx={{ p: 1, pt: 2 }}>
					<Typography
						sx={{
							mb: '2rem',
							mt: '-1rem',
							fontFamily: theme.fontFamily?.main,
							fontSize: { xs: '0.85rem', sm: '1rem' },
							color: theme.palette.text.secondary,
						}}>
						We offer two types of courses on our application. Each course type provides a different learning experience:
					</Typography>
					<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', mb: '2rem' }}>
						<Chip
							label='Platform Course'
							color='success'
							size='small'
							sx={{
								fontFamily: theme.fontFamily?.main,
								fontWeight: 500,
								mr: 2,
								minWidth: '8rem',
								mb: { xs: 2, sm: 0 },
								color: '#fff',
							}}
						/>
						<Typography
							sx={{
								fontFamily: theme.fontFamily?.main,
								fontSize: { xs: '0.85rem', sm: '0.9rem' },
								color: theme.palette.text.primary,
							}}>
							All training materials and management services are provided through our platform. After logging in, you can easily access your courses
							and track your progress.
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
						<Chip
							label='Partner Course'
							color='info'
							size='small'
							sx={{
								fontFamily: theme.fontFamily?.main,
								fontWeight: 500,
								mr: 2,
								minWidth: '8rem',
								mb: { xs: 2, sm: 0 },
							}}
						/>
						<Typography
							sx={{
								fontFamily: theme.fontFamily?.main,
								fontSize: { xs: '0.85rem', sm: '0.9rem' },
								color: theme.palette.text.primary,
							}}>
							These courses are offered by our partner instructors. Registration is done through our platform, but lessons and content management are
							delivered using the instructor's preferred platform and methods.
						</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions sx={{ mt: '-1rem' }}>
				<CustomCancelButton
					onClick={() => setIsInfoDialogOpen(false)}
					sx={{
						fontFamily: theme.fontFamily?.main,
						margin: '0 1rem 1rem 0',
					}}>
					Close
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default CoursesInfoDialog;
