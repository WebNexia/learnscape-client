import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { CheckBoxOutlined } from '@mui/icons-material';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../interfaces/enums';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { QuizNotification } from '../../../hooks/useDashboardSummary';

interface DashboardQuizSubmissionsProps {
	quizNotification?: QuizNotification;
}

const DashboardQuizSubmissions = ({ quizNotification }: DashboardQuizSubmissionsProps) => {
	const { user } = useContext(UserAuthContext);
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isAdmin = user?.role === Roles.ADMIN;
	const isMobileSize: boolean = isSmallScreen || isRotated;
	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'padding': '1rem',
				'height': '12rem',
				'borderRadius': '0.35rem',
				'cursor': 'pointer',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : null }}>
					{isAdmin ? 'Unchecked' : 'Checked'} Quizzes
				</Typography>
				<CheckBoxOutlined sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} fontSize={isMobileSize ? 'small' : 'medium'} />
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '7rem' }}>
				<Typography
					sx={{
						fontSize: isMobileSize ? '0.65rem' : '0.85rem',
						color: quizNotification?.hasNotification ? (isAdmin ? '#ef5350' : theme.textColor?.greenPrimary.main) : 'gray',
						textAlign: 'center',
					}}>
					{quizNotification?.message || 'No quiz notifications'}
				</Typography>
			</Box>
		</Box>
	);
};

export default DashboardQuizSubmissions;
