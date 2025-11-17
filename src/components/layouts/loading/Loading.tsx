import { AppBar, Box, Button, IconButton, Toolbar, Typography, keyframes, useTheme, useMediaQuery } from '@mui/material';
import theme from '../../../themes';
import { useContext, memo } from 'react';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import SidebarBtn from '../dashboardLayout/SidebarBtn';
import { Roles } from '../../../interfaces/enums';
import { useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import logo from '../../../assets/logo.png';
import {
	AssignmentIndRounded,
	BugReport,
	CalendarMonth,
	CreditCard,
	Delete,
	Email,
	FilePresent,
	Groups,
	LibraryAddCheck,
	LibraryBooks,
	Menu,
	Notifications,
	PeopleAltOutlined,
	QuizOutlined,
	Settings,
} from '@mui/icons-material';
import TypingAnimation from './TypingAnimation';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const float = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(2deg);
  }
  50% {
    transform: translateY(0px) rotate(0deg);
  }
  75% {
    transform: translateY(10px) rotate(-2deg);
  }
  100% {
    transform: translateY(0px) rotate(0deg);
  }
`;

// const dotsAnimation = keyframes`
//   0% { content: ''; }
//   25% { content: '.'; }
//   50% { content: '..'; }
//   75% { content: '...'; }
//   100% { content: ''; }
// `;

// const blink = keyframes`
//   0%, 100% {
//     opacity: 1;
//   }
//   50% {
//     opacity: 0;
//   }
// `;

// Memoize the logo component to prevent unnecessary re-renders
const Logo = memo(({ small }: { small?: boolean }) => (
	<Box
		sx={{
			position: 'relative',
			zIndex: 1,
			mb: 4,
			animation: `${float} 4s ease-in-out infinite`,
		}}>
		<img
			src={logo}
			alt='Kaizen Logo'
			style={{
				width: small ? '15rem' : '20rem',
				height: 'auto',
				filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
			}}
		/>
	</Box>
));

// Memoize the base loading screen to prevent unnecessary re-renders
const BaseLoadingScreen = memo(() => {
	const themeMUI = useTheme();
	const isSmall = useMediaQuery(themeMUI.breakpoints.down('sm'));

	const { isRotatedMedium } = useContext(MediaQueryContext);

	const isSmallScreen = isSmall || isRotatedMedium;

	return (
		<Box
			sx={{
				'height': '100vh',
				'width': '100vw',
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'justifyContent': 'center',
				'background': '#ffffff',
				'position': 'relative',
				'overflow': 'hidden',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
					backgroundSize: '40px 40px',
					opacity: 0.3,
				},
			}}>
			<Logo small={isSmallScreen} />
			<Box
				sx={{
					position: 'relative',
					zIndex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 2,
				}}>
				<TypingAnimation />
				<Typography
					sx={{
						color: '#2C3E50',
						fontSize: isSmallScreen ? '1.5rem' : '2rem',
						fontWeight: 500,
						fontFamily: 'Varela Round',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						minHeight: '3rem',
					}}>
					<span>Loading</span>
				</Typography>
			</Box>
		</Box>
	);
});

const Loading = () => {
	const { user } = useContext(UserAuthContext);
	const { isRotatedMedium, isSmallScreen, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const location = useLocation();

	// Determine role from current route when user is not loaded yet
	const getRoleFromRoute = (): Roles => {
		if (location.pathname.startsWith('/admin/')) return Roles.ADMIN;
		if (location.pathname.startsWith('/instructor/')) return Roles.INSTRUCTOR;
		if (location.pathname.startsWith('/dashboard')) return Roles.USER;
		return Roles.ADMIN; // fallback
	};

	// Get the effective role (user role if available, otherwise from route)
	const effectiveRole = user?.role || getRoleFromRoute();

	// Check if user has admin-level access (admin, owner, or super-admin)
	const hasAdminAccess = effectiveRole === Roles.ADMIN || effectiveRole === Roles.OWNER || effectiveRole === Roles.SUPER_ADMIN;

	// Use useMemo for mode to prevent unnecessary re-renders
	// const mode = useMemo(() => (localStorage.getItem('mode') as Mode) || Mode.LIGHT_MODE, []);

	// Use useMemo for currentPage to prevent unnecessary re-renders
	// const currentPage = useMemo(() => {
	// 	const path = window.location.pathname;
	// 	return path?.includes('admin')
	// 		? path?.split?.('/')?.[2]?.charAt?.(0)?.toUpperCase?.() + path?.split?.('/')?.[2]?.slice(1)
	// 		: path?.split?.('/')?.[1]?.charAt?.(0)?.toUpperCase?.() + path?.split?.('/')?.[1]?.slice(1);
	// }, []);

	// const [selectedPage, setSelectedPage] = useState<string>(currentPage);

	// If user is not logged in, show the base loading screen
	if (!user) {
		return <BaseLoadingScreen />;
	}

	// For logged-in users, show the dashboard loading screen
	return (
		<>
			{isMobileSize ? (
				<>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							minHeight: '110vh',
							width: '100%',
							marginLeft: '10rem',
							position: 'absolute',
							right: 0,
						}}>
						<AppBar position='sticky'>
							<Toolbar
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									height: '3rem',
									width: '100%',
									backgroundColor: hasAdminAccess
										? theme.bgColor?.adminHeader
										: effectiveRole === Roles.INSTRUCTOR
											? theme.bgColor?.instructorHeader
											: theme.bgColor?.lessonInProgress,
									padding: '0 1rem',
								}}>
								<IconButton>
									<Menu sx={{ color: '#fff', padding: 0 }} fontSize='small' />
								</IconButton>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
											'mr': 1,
										}}>
										<BugReport
											color='secondary'
											fontSize={isMobileSize ? 'small' : 'medium'}
											sx={{
												fontSize: isMobileSize ? '1rem' : undefined,
											}}
										/>
									</IconButton>

									<IconButton
										sx={{
											'mr': '0.75rem',
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Notifications color='secondary' sx={{ fontSize: '1rem', mr: '1rem' }} />
									</IconButton>

									{/* {
										{
											[Mode.DARK_MODE]: (
												<IconButton
													sx={{
														'color': theme.textColor?.common.main,
														'mr': '0.75rem',
														':hover': {
															backgroundColor: 'transparent',
														},
													}}>
													<DarkMode sx={{ fontSize: '1rem' }} />
												</IconButton>
											),
											[Mode.LIGHT_MODE]: (
												<IconButton
													sx={{
														'color': theme.textColor?.common.main,
														'mr': '0.75rem',
														':hover': {
															backgroundColor: 'transparent',
														},
													}}>
													<LightMode sx={{ fontSize: '1rem' }} />
												</IconButton>
											),
										}[mode]
									} */}
									<Button
										sx={{
											textTransform: 'capitalize',
											color: theme.textColor?.common.main,
											fontFamily: theme.fontFamily?.main,
											fontSize: '0.75rem',
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
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: theme.bgColor?.secondary,
							height: '110vh',
						}}>
						<TypingAnimation />
						<Typography
							sx={{
								margin: '2rem',
								fontSize: isVerySmallScreen ? '1rem' : '1.5rem',
								fontFamily: 'Poppins',
								fontWeight: 500,
								color: '#01435A',
							}}>
							Loading...
						</Typography>
						<Logo small={isVerySmallScreen} />
					</Box>
				</>
			) : (
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
									backgroundColor: hasAdminAccess
										? theme.bgColor?.adminHeader
										: effectiveRole === Roles.INSTRUCTOR
											? theme.bgColor?.instructorHeader
											: theme.bgColor?.lessonInProgress,
									padding: '0 1rem 0 3rem',
								}}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<IconButton
										sx={{
											':hover': {
												backgroundColor: 'transparent',
											},
											'mr': 1,
										}}>
										<BugReport
											color='secondary'
											fontSize={isMobileSize ? 'small' : 'medium'}
											sx={{
												fontSize: isMobileSize ? '1rem' : undefined,
											}}
										/>
									</IconButton>

									{(user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN) && (
										<IconButton
											sx={{
												':hover': {
													backgroundColor: 'transparent',
												},
												'mr': 1,
											}}>
											<Delete
												color='secondary'
												fontSize={isMobileSize ? 'small' : 'medium'}
												sx={{
													fontSize: isMobileSize ? '1rem' : undefined,
												}}
											/>
										</IconButton>
									)}

									<IconButton
										sx={{
											'mr': '1rem',
											':hover': {
												backgroundColor: 'transparent',
											},
										}}>
										<Notifications color='secondary' />
									</IconButton>

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
							backgroundColor: hasAdminAccess
								? theme.bgColor?.adminSidebar
								: user?.role === Roles.INSTRUCTOR
									? theme.bgColor?.instructorSidebar
									: theme.palette.primary.main,
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
								Kaizenglish
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
									objectFit: 'cover',
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
								{hasAdminAccess && (
									<>
										<SidebarBtn btnText='Dashboard' IconName={DashboardIcon} />
										<SidebarBtn btnText='Users' IconName={PeopleAltOutlined} />
										<SidebarBtn btnText='Courses' IconName={LibraryBooks} />
										<SidebarBtn btnText='Lessons' IconName={AssignmentIndRounded} />
										<SidebarBtn btnText='Questions' IconName={QuizOutlined} />
										<SidebarBtn btnText='Documents' IconName={FilePresent} />
										<SidebarBtn btnText='Submissions' IconName={LibraryAddCheck} />
										<SidebarBtn btnText='Payments' IconName={CreditCard} />
										<SidebarBtn btnText='Calendar' IconName={CalendarMonth} />
										<SidebarBtn btnText='Messages' IconName={Email} />
										<SidebarBtn btnText='Community' IconName={Groups} />
										<SidebarBtn btnText='Settings' IconName={Settings} />
									</>
								)}
								{user?.role === Roles.USER && (
									<>
										<SidebarBtn btnText='Dashboard' IconName={DashboardIcon} />
										<SidebarBtn btnText='Courses' IconName={LibraryBooks} />
										<SidebarBtn btnText='Submissions' IconName={LibraryAddCheck} />
										<SidebarBtn btnText='Calendar' IconName={CalendarMonth} />
										<SidebarBtn btnText='Messages' IconName={Email} />
										<SidebarBtn btnText='Community' IconName={Groups} />
										<SidebarBtn btnText='Settings' IconName={Settings} />
									</>
								)}
								{user?.role === Roles.INSTRUCTOR && (
									<>
										<SidebarBtn btnText='Dashboard' IconName={DashboardIcon} />
										<SidebarBtn btnText='Courses' IconName={LibraryBooks} />
										<SidebarBtn btnText='Lessons' IconName={AssignmentIndRounded} />
										<SidebarBtn btnText='Questions' IconName={QuizOutlined} />
										<SidebarBtn btnText='Documents' IconName={FilePresent} />
										<SidebarBtn btnText='Submissions' IconName={LibraryAddCheck} />
										<SidebarBtn btnText='Calendar' IconName={CalendarMonth} />
										<SidebarBtn btnText='Messages' IconName={Email} />
										<SidebarBtn btnText='Community' IconName={Groups} />
										<SidebarBtn btnText='Settings' IconName={Settings} />
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
						{/* <TypingAnimation />
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
						<Logo /> */}
					</Box>
				</>
			)}
		</>
	);
};

export default Loading;
