import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { LearnerQuizSubmissionsContext } from '../../../contexts/LearnerQuizSubmissionsContextProvider';
import { AdminQuizSubmissionsContext } from '../../../contexts/AdminQuizSubmissionsContextProvider';
import { CheckBoxOutlined } from '@mui/icons-material';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../interfaces/enums';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const DashboardQuizSubmissions = () => {
	const { user } = useContext(UserAuthContext);
	const { userQuizSubmissions } = useContext(LearnerQuizSubmissionsContext);
	const { quizSubmissions: adminQuizSubmissions } = useContext(AdminQuizSubmissionsContext);
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	// Smart context selection based on user role
	const isAdmin = user?.role === Roles.ADMIN;
	const submissions = isAdmin ? adminQuizSubmissions : userQuizSubmissions;

	const isMobileSize: boolean = isSmallScreen || isRotated;
	const [numberOfUncheckedQuizzes, setNumberOfUncheckedQuizzes] = useState<number>(0);
	const [numberOfRecentlyCheckedQuizzes, setNumberOfRecentlyCheckedQuizzes] = useState<number>(0);

	const currentDate = new Date(); // Current date
	const twoWeeksEarlierFromNow = new Date();
	twoWeeksEarlierFromNow.setDate(currentDate.getDate() - 14);

	useEffect(() => {
		const totalUnchecked = submissions.filter((submission) => !submission.isChecked).length;
		const totalRecentlyChecked = submissions.filter(
			(submission) => submission.isChecked && new Date(submission.updatedAt) > twoWeeksEarlierFromNow
		).length;
		setNumberOfUncheckedQuizzes(totalUnchecked);
		setNumberOfRecentlyCheckedQuizzes(totalRecentlyChecked);
	}, [submissions, twoWeeksEarlierFromNow]);
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
				{isAdmin ? (
					<Typography
						sx={{ fontSize: isMobileSize ? '0.65rem' : '0.85rem', color: numberOfUncheckedQuizzes > 0 ? '#ef5350' : 'gray', textAlign: 'center' }}>
						{numberOfUncheckedQuizzes > 0 ? `Total ${numberOfUncheckedQuizzes} unchecked quizzes` : 'No unchecked quizzes'}
					</Typography>
				) : (
					<Typography
						sx={{
							fontSize: isMobileSize ? '0.65rem' : '0.85rem',
							color: numberOfRecentlyCheckedQuizzes > 0 ? theme.textColor?.greenPrimary.main : 'gray',
							textAlign: 'center',
						}}>
						{numberOfRecentlyCheckedQuizzes > 0
							? `You have ${numberOfRecentlyCheckedQuizzes} recently checked quiz(zes)`
							: 'You have no recently checked quizzes'}
					</Typography>
				)}
			</Box>
		</Box>
	);
};

export default DashboardQuizSubmissions;
