import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { QuizSubmissionsContext } from '../../../contexts/QuizSubmissionsContextProvider';
import { CheckBoxOutlined } from '@mui/icons-material';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../interfaces/enums';
import theme from '../../../themes';

const DashboardQuizSubmissions = () => {
	const { user } = useContext(UserAuthContext);
	const { sortedQuizSubmissionsData } = useContext(QuizSubmissionsContext);
	const [numberOfUncheckedQuizzes, setNumberOfUncheckedQuizzes] = useState<number>(0);
	const [numberOfRecentlyCheckedQuizzes, setNumberOfRecentlyCheckedQuizzes] = useState<number>(0);

	const currentDate = new Date(); // Current date
	const twoWeeksEarlierFromNow = new Date();
	twoWeeksEarlierFromNow.setDate(currentDate.getDate() - 14);

	useEffect(() => {
		const totalUnchecked = sortedQuizSubmissionsData.filter((submission) => !submission.isChecked).length;
		const totalRecentlyChecked = sortedQuizSubmissionsData.filter(
			(submission) => submission.isChecked && new Date(submission.updatedAt) > twoWeeksEarlierFromNow
		).length;
		setNumberOfUncheckedQuizzes(totalUnchecked);
		setNumberOfRecentlyCheckedQuizzes(totalRecentlyChecked);
	}, [sortedQuizSubmissionsData, twoWeeksEarlierFromNow]);
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				padding: '1rem',
				height: '12rem',
				borderRadius: '0.35rem',
				cursor: 'pointer',
				transition: '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='h5'>{user?.role === Roles.ADMIN ? 'Unchecked' : 'Checked'} Quizzes</Typography>
				<CheckBoxOutlined sx={{ ml: '0.5rem', color: theme.textColor?.greenPrimary.main }} />
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '7rem' }}>
				{user?.role === Roles.ADMIN ? (
					<Typography sx={{ fontSize: '0.85rem' }}>
						{numberOfUncheckedQuizzes > 0 ? `You have ${numberOfUncheckedQuizzes} unchecked quizzes` : 'You have no unchecked quizzes'}
					</Typography>
				) : (
					<Typography sx={{ fontSize: '0.85rem' }}>
						{numberOfRecentlyCheckedQuizzes > 0
							? `You have ${numberOfRecentlyCheckedQuizzes} recently checked quizzes`
							: 'You have no recently checked quizzes'}
					</Typography>
				)}
			</Box>
		</Box>
	);
};

export default DashboardQuizSubmissions;
