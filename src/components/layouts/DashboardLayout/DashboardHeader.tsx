import { AppBar, Box, Button, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import theme from '../../../themes';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Mode } from '../../../interfaces/enums';
import { DarkMode, LightMode } from '@mui/icons-material';

interface DashboardHeaderProps {
	pageName: string;
}

const DashboardHeader = ({ pageName }: DashboardHeaderProps) => {
	const [mode, setMode] = useState<Mode>((localStorage.getItem('mode') as Mode) || Mode.LIGHT_MODE);
	const navigate = useNavigate();

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
					backgroundColor: theme.textColor?.secondary.main,
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
						onClick={() => {
							navigate('/');
							localStorage.removeItem('user_token');
							localStorage.removeItem('username');
							localStorage.removeItem('imageUrl');
							localStorage.removeItem('userCoursesIds');
							localStorage.removeItem('userLessonData');
						}}>
						Log Out
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default DashboardHeader;
