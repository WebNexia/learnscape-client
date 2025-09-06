import { Box, Drawer, Typography } from '@mui/material';
import theme from '../../../themes';
import SidebarBtn from './SidebarBtn';
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { PageName, Roles } from '../../../interfaces/enums';
import {
	AssignmentIndRounded,
	CalendarMonth,
	CreditCard,
	Email,
	FilePresent,
	Groups,
	LibraryAddCheck,
	LibraryBooks,
	PeopleAltOutlined,
	QuizOutlined,
	Settings,
} from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface CustomDrawerProps {
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CustomDrawer = ({ isDrawerOpen, setIsDrawerOpen }: CustomDrawerProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);
	const { organisation } = useContext(OrganisationContext);

	const currentPage = window.location.pathname?.includes('admin')
		? window.location.pathname?.split('/')?.[2]?.charAt(0)?.toUpperCase() + window.location.pathname?.split('/')?.[2]?.slice(1)
		: window.location.pathname?.split?.('/')?.[1]?.charAt?.(0)?.toUpperCase?.() + window.location.pathname?.split?.('/')?.[1]?.slice(1);

	const [selectedPage, setSelectedPage] = useState<string>(currentPage);

	const navigateWithPage = (pageName: string, path: string) => {
		setSelectedPage(pageName);
		navigate(path);
	};
	return (
		<Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'flex-start',
					alignItems: 'center',
					width: '8.5rem',
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
						marginBottom: '0.25rem',
					}}>
					<Typography variant='h1' sx={{ color: theme.textColor?.common.main, fontSize: '1.25rem' }}>
						{organisation?.orgName}
					</Typography>
				</Box>
				<Box
					sx={{
						flexGrow: 1, // Allow the box to grow and take available space
						overflowY: 'auto', // Enable vertical scrolling
						width: '100%', // Make sure it takes full width
						overflowX: 'hidden',
						height: '50vh',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							marginBottom: '0.5rem',
							width: '8.5rem',
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
						<Typography variant='body2' sx={{ color: theme.textColor?.common.main }}>
							{user?.username}
						</Typography>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'flex-start',
								alignItems: 'flex-start',
								marginTop: '1rem',
							}}>
							{user?.role === Roles.ADMIN && (
								<>
									<SidebarBtn
										btnText='Dashboard'
										IconName={DashboardIcon}
										onClick={() => navigateWithPage(PageName.ADMIN_DASHBOARD, `/admin/dashboard`)}
										active={selectedPage === PageName.ADMIN_DASHBOARD}
									/>
									<SidebarBtn
										btnText='Users'
										IconName={PeopleAltOutlined}
										onClick={() => navigateWithPage(PageName.ADMIN_USERS, `/admin/users`)}
										active={selectedPage === PageName.ADMIN_USERS}
									/>
									<SidebarBtn
										btnText='Courses'
										IconName={LibraryBooks}
										onClick={() => navigateWithPage(PageName.ADMIN_COURSES, `/admin/courses`)}
										active={selectedPage === PageName.ADMIN_COURSES}
									/>
									<SidebarBtn
										btnText='Lessons'
										IconName={AssignmentIndRounded}
										onClick={() => navigateWithPage(PageName.ADMIN_LESSONS, `/admin/lessons`)}
										active={selectedPage === PageName.ADMIN_LESSONS}
									/>
									<SidebarBtn
										btnText='Questions'
										IconName={QuizOutlined}
										onClick={() => navigateWithPage(PageName.ADMIN_QUESTIONS, `/admin/questions`)}
										active={selectedPage === PageName.ADMIN_QUESTIONS}
									/>
									<SidebarBtn
										btnText='Documents'
										IconName={FilePresent}
										onClick={() => navigateWithPage(PageName.ADMIN_DOCUMENTS, `/admin/documents`)}
										active={selectedPage === PageName.ADMIN_DOCUMENTS}
									/>
									<SidebarBtn
										btnText='Submissions'
										IconName={LibraryAddCheck}
										onClick={() => navigateWithPage(PageName.ADMIN_QUIZ_SUBMISSIONS, `/admin/submissions`)}
										active={selectedPage === PageName.ADMIN_QUIZ_SUBMISSIONS}
									/>
									<SidebarBtn
										btnText='Payments'
										IconName={CreditCard}
										onClick={() => navigateWithPage(PageName.ADMIN_PAYMENTS, `/admin/payments`)}
										active={selectedPage === PageName.ADMIN_PAYMENTS}
									/>
									<SidebarBtn
										btnText='Calendar'
										IconName={CalendarMonth}
										onClick={() => navigateWithPage(PageName.CALENDAR, `/admin/calendar`)}
										active={selectedPage === PageName.CALENDAR}
									/>
									<SidebarBtn
										btnText='Messages'
										IconName={Email}
										onClick={() => navigateWithPage(PageName.ADMIN_MESSAGES, `/admin/messages`)}
										active={selectedPage === PageName.ADMIN_MESSAGES}
									/>
									<SidebarBtn
										btnText='Community'
										IconName={Groups}
										onClick={() => navigateWithPage(PageName.ADMIN_COMMUNITY, `/admin/community`)}
										active={selectedPage === PageName.ADMIN_COMMUNITY}
									/>
									<SidebarBtn
										btnText='Settings'
										IconName={Settings}
										onClick={() => navigateWithPage(PageName.ADMIN_SETTINGS, `/admin/settings`)}
										active={selectedPage === PageName.ADMIN_SETTINGS}
									/>
								</>
							)}
							{user?.role === Roles.USER && (
								<>
									<SidebarBtn
										btnText='Dashboard'
										IconName={DashboardIcon}
										onClick={() => navigateWithPage(PageName.DASHBOARD, `/dashboard`)}
										active={selectedPage === PageName.DASHBOARD}
									/>
									<SidebarBtn
										btnText='Courses'
										IconName={LibraryBooks}
										onClick={() => navigateWithPage(PageName.COURSES, `/courses`)}
										active={selectedPage === PageName.COURSES}
									/>

									<SidebarBtn
										btnText='Submissions'
										IconName={LibraryAddCheck}
										onClick={() => navigateWithPage(PageName.SUBMISSIONS, `/submissions`)}
										active={selectedPage === PageName.SUBMISSIONS}
									/>

									<SidebarBtn
										btnText='Calendar'
										IconName={CalendarMonth}
										onClick={() => navigateWithPage(PageName.CALENDAR, `/calendar`)}
										active={selectedPage === PageName.CALENDAR}
									/>
									<SidebarBtn
										btnText='Messages'
										IconName={Email}
										onClick={() => navigateWithPage(PageName.MESSAGES, `/messages`)}
										active={selectedPage === PageName.MESSAGES}
									/>
									<SidebarBtn
										btnText='Community'
										IconName={Groups}
										onClick={() => navigateWithPage(PageName.COMMUNITY, `/community`)}
										active={selectedPage === PageName.COMMUNITY}
									/>
									<SidebarBtn
										btnText='Settings'
										IconName={Settings}
										onClick={() => navigateWithPage(PageName.SETTINGS, `/settings`)}
										active={selectedPage === PageName.SETTINGS}
									/>
								</>
							)}
						</Box>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default CustomDrawer;
