import { AppBar, Box, Button, CircularProgress, IconButton, Toolbar, Typography } from '@mui/material';
import theme from '../../../themes';
import { useContext, useState } from 'react';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import SidebarBtn from '../dashboardLayout/SidebarBtn';
import { Mode, Roles } from '../../../interfaces/enums';
import DashboardIcon from '@mui/icons-material/Dashboard';
import {
	AssignmentIndRounded,
	CalendarMonth,
	DarkMode,
	Email,
	FilePresent,
	Groups,
	LibraryAddCheck,
	LibraryBooks,
	LightMode,
	Notifications,
	PeopleAltOutlined,
	QuizOutlined,
	Settings,
} from '@mui/icons-material';

const Loading = () => {
	const { organisation } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const [mode, setMode] = useState<Mode>((localStorage.getItem('mode') as Mode) || Mode.LIGHT_MODE);

	const currentPage = window.location.pathname.includes('admin')
		? window.location.pathname.split('/')[2].charAt(0).toUpperCase() + window.location.pathname.split('/')[2].slice(1)
		: window.location.pathname.split('/')[1].charAt(0).toUpperCase() + window.location.pathname.split('/')[1].slice(1);

	const [selectedPage, setSelectedPage] = useState<string>(currentPage);
	return (
		<>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '110vh',
					width: 'calc(100% - 10rem)',
					marginLeft: '10rem',
					position: 'absolute',
					right: 0,
				}}>
				<AppBar position='sticky'>
					<Toolbar
						sx={{
							display: 'flex',
							justifyContent: 'flex-end',
							alignItems: 'center',
							height: '3rem',
							width: '100%',
							backgroundColor: user?.role === Roles.ADMIN ? theme.bgColor?.adminHeader : theme.bgColor?.lessonInProgress,
							padding: '0 1rem 0 3rem',
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
							<IconButton
								sx={{
									mr: '0.75rem',
									':hover': {
										backgroundColor: 'transparent',
									},
								}}>
								<Notifications color='secondary' />
							</IconButton>

							{
								{
									[Mode.DARK_MODE]: (
										<IconButton
											sx={{
												color: theme.textColor?.common.main,
												mr: '0.75rem',
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<DarkMode />
										</IconButton>
									),
									[Mode.LIGHT_MODE]: (
										<IconButton
											sx={{
												color: theme.textColor?.common.main,
												mr: '0.75rem',
												':hover': {
													backgroundColor: 'transparent',
												},
											}}>
											<LightMode />
										</IconButton>
									),
								}[mode]
							}
							<Button
								sx={{
									textTransform: 'capitalize',
									color: theme.textColor?.common.main,
									fontFamily: theme.fontFamily?.main,
								}}>
								Log Out
							</Button>
						</Box>
					</Toolbar>
				</AppBar>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'flex-start',
					alignItems: 'center',
					width: '10rem',
					minHeight: '100vh',
					backgroundColor: user?.role === Roles.ADMIN ? theme.bgColor?.adminSidebar : theme.palette.primary.main,
					position: 'fixed',
					left: 0,
					zIndex: 10,
				}}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						height: '3rem',
						marginBottom: '0.5rem',
					}}>
					<Typography variant='h1' sx={{ color: theme.textColor?.common.main, fontSize: '1.5rem' }}>
						{organisation?.orgName}
					</Typography>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						marginBottom: '0.5rem',
					}}>
					<img
						src={user?.imageUrl}
						alt='user_profile_pic'
						style={{
							height: '3rem',
							width: '3rem',
							borderRadius: '50%',
							marginBottom: '0.5rem',
							objectFit: 'contain',
						}}
					/>
					<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
						{user?.username}
					</Typography>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							alignItems: 'flex-start',
							marginTop: '1.5rem',
						}}>
						{user?.role === Roles.ADMIN && (
							<>
								<SidebarBtn btnText='Dashboard' IconName={DashboardIcon} selectedPage={selectedPage} />
								<SidebarBtn btnText='Users' IconName={PeopleAltOutlined} selectedPage={selectedPage} />
								<SidebarBtn btnText='Courses' IconName={LibraryBooks} selectedPage={selectedPage} />
								<SidebarBtn btnText='Lessons' IconName={AssignmentIndRounded} selectedPage={selectedPage} />
								<SidebarBtn btnText='Questions' IconName={QuizOutlined} selectedPage={selectedPage} />
								<SidebarBtn btnText='Documents' IconName={FilePresent} selectedPage={selectedPage} />
								<SidebarBtn btnText='Submissions' IconName={LibraryAddCheck} selectedPage={selectedPage} />
								<SidebarBtn btnText='Schedule' IconName={CalendarMonth} selectedPage={selectedPage} />
								<SidebarBtn btnText='Messages' IconName={Email} selectedPage={selectedPage} />
								<SidebarBtn btnText='Community' IconName={Groups} selectedPage={selectedPage} />
								<SidebarBtn btnText='Settings' IconName={Settings} selectedPage={selectedPage} />
							</>
						)}
						{user?.role === Roles.USER && (
							<>
								<SidebarBtn btnText='Dashboard' IconName={DashboardIcon} selectedPage={selectedPage} />
								<SidebarBtn btnText='Courses' IconName={LibraryBooks} selectedPage={selectedPage} />
								<SidebarBtn btnText='Submissions' IconName={LibraryAddCheck} selectedPage={selectedPage} />
								<SidebarBtn btnText='Schedule' IconName={CalendarMonth} selectedPage={selectedPage} />
								<SidebarBtn btnText='Messages' IconName={Email} selectedPage={selectedPage} />
								<SidebarBtn btnText='Community' IconName={Groups} selectedPage={selectedPage} />
								<SidebarBtn btnText='Settings' IconName={Settings} selectedPage={selectedPage} />
							</>
						)}
					</Box>
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.bgColor?.secondary,
					height: '110vh',
					marginLeft: '10rem',
				}}>
				<CircularProgress />
				<Typography
					sx={{
						margin: '2rem',
						fontSize: '2rem',
						fontFamily: 'Poppins',
						fontWeight: 500,
						color: '#01435A',
					}}>
					Loading...
				</Typography>
				<Typography
					sx={{
						fontSize: '4rem',
						fontFamily: 'Permanent Marker, cursive',
						color: '#01435A',
					}}>
					{organisation?.orgName}
				</Typography>
			</Box>
		</>
	);
};

export default Loading;
