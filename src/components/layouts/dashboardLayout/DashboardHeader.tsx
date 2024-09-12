import { AppBar, Box, Button, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import theme from '../../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { Mode, Roles } from '../../../interfaces/enums';
import { DarkMode, LightMode } from '@mui/icons-material';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';

interface DashboardHeaderProps {
	pageName: string;
}

const DashboardHeader = ({ pageName }: DashboardHeaderProps) => {
	const { signOut, user } = useContext(UserAuthContext);
	const [mode, setMode] = useState<Mode>((localStorage.getItem('mode') as Mode) || Mode.LIGHT_MODE);
	const navigate = useNavigate();
	const { updateInProgressLessons } = useUserCourseLessonData();

	const clearAllQuizData = () => {
		Object.keys(localStorage).forEach((key) => {
			if (key.startsWith('UserQuizAnswers-')) {
				localStorage.removeItem(key);
			}
		});
	};

	useEffect(() => {
		if (!localStorage.getItem('mode')) {
			localStorage.setItem('mode', Mode.LIGHT_MODE);
		}
	}, []);

	return (
		<AppBar position='sticky'>
			<Toolbar
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					height: '3rem',
					width: '100%',
					backgroundColor: user?.role === Roles.ADMIN ? theme.bgColor?.adminHeader : theme.bgColor?.lessonInProgress,
					padding: '0 1rem 0 3rem',
				}}>
				<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
					{pageName}
				</Typography>
				<Box>
					{
						{
							[Mode.DARK_MODE]: (
								<Tooltip title='Light Mode' placement='left'>
									<IconButton
										sx={{ color: theme.textColor?.common.main }}
										onClick={() => {
											setMode(Mode.LIGHT_MODE);
											localStorage.setItem('mode', Mode.LIGHT_MODE);
										}}>
										<DarkMode />
									</IconButton>
								</Tooltip>
							),
							[Mode.LIGHT_MODE]: (
								<Tooltip title='Dark Mode' placement='left'>
									<IconButton
										sx={{ color: theme.textColor?.common.main }}
										onClick={() => {
											setMode(Mode.DARK_MODE);
											localStorage.setItem('mode', Mode.DARK_MODE);
										}}>
										<LightMode />
									</IconButton>
								</Tooltip>
							),
						}[mode]
					}
					<Button
						sx={{
							textTransform: 'capitalize',
							color: theme.textColor?.common.main,
							fontFamily: theme.fontFamily?.main,
						}}
						onClick={async () => {
							await signOut();
							await updateInProgressLessons();
							localStorage.removeItem('orgId');
							localStorage.removeItem('userCourseData');
							localStorage.removeItem('userLessonData');
							localStorage.removeItem('role');
							localStorage.removeItem('activeChatId');
							localStorage.removeItem('chatList');

							clearAllQuizData();

							navigate('/');
						}}>
						Log Out
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default DashboardHeader;
