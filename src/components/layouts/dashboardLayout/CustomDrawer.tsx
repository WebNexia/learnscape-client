import { Box, Drawer, Typography } from '@mui/material';
import theme from '../../../themes';
import SidebarBtn from './SidebarBtn';
import { useNavigate, useParams } from 'react-router-dom';
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
	const { id, userId } = useParams();
	const { user } = useContext(UserAuthContext);
	const { organisation } = useContext(OrganisationContext);

	const currentPage = window.location.pathname.includes('admin')
		? window.location.pathname.split('/')[2].charAt(0).toUpperCase() + window.location.pathname.split('/')[2].slice(1)
		: window.location.pathname.split('/')[1].charAt(0).toUpperCase() + window.location.pathname.split('/')[1].slice(1);

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
										onClick={() => navigateWithPage(PageName.ADMIN_DASHBOARD, `/admin/dashboard/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Users'
										IconName={PeopleAltOutlined}
										onClick={() => navigateWithPage(PageName.ADMIN_USERS, `/admin/users/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Courses'
										IconName={LibraryBooks}
										onClick={() => navigateWithPage(PageName.ADMIN_COURSES, `/admin/courses/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Lessons'
										IconName={AssignmentIndRounded}
										onClick={() => navigateWithPage(PageName.ADMIN_LESSONS, `/admin/lessons/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Questions'
										IconName={QuizOutlined}
										onClick={() => navigateWithPage(PageName.ADMIN_QUESTIONS, `/admin/questions/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Documents'
										IconName={FilePresent}
										onClick={() => navigateWithPage(PageName.ADMIN_DOCUMENTS, `/admin/documents/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Submissions'
										IconName={LibraryAddCheck}
										onClick={() => navigateWithPage(PageName.ADMIN_QUIZ_SUBMISSIONS, `/admin/submissions/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Payments'
										IconName={CreditCard}
										onClick={() => navigateWithPage(PageName.ADMIN_PAYMENTS, `/admin/payments/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Calendar'
										IconName={CalendarMonth}
										onClick={() => navigateWithPage(PageName.CALENDAR, `/admin/calendar/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Messages'
										IconName={Email}
										onClick={() => navigateWithPage(PageName.ADMIN_MESSAGES, `/admin/messages/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Community'
										IconName={Groups}
										onClick={() => navigateWithPage(PageName.ADMIN_COMMUNITY, `/admin/community/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Settings'
										IconName={Settings}
										onClick={() => navigateWithPage(PageName.ADMIN_SETTINGS, `/admin/settings/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
								</>
							)}
							{user?.role === Roles.USER && (
								<>
									<SidebarBtn
										btnText='Dashboard'
										IconName={DashboardIcon}
										onClick={() => navigateWithPage(PageName.DASHBOARD, `/dashboard/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Courses'
										IconName={LibraryBooks}
										onClick={() => navigateWithPage(PageName.COURSES, `/courses/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>

									<SidebarBtn
										btnText='Submissions'
										IconName={LibraryAddCheck}
										onClick={() => navigateWithPage(PageName.SUBMISSIONS, `/submissions/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>

									<SidebarBtn
										btnText='Calendar'
										IconName={CalendarMonth}
										onClick={() => navigateWithPage(PageName.CALENDAR, `/calendar/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Messages'
										IconName={Email}
										onClick={() => navigateWithPage(PageName.MESSAGES, `/messages/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Community'
										IconName={Groups}
										onClick={() => navigateWithPage(PageName.COMMUNITY, `/community/user/${id || userId}`)}
										selectedPage={selectedPage}
									/>
									<SidebarBtn
										btnText='Settings'
										IconName={Settings}
										onClick={() => navigateWithPage(PageName.SETTINGS, `/settings/user/${id || userId}`)}
										selectedPage={selectedPage}
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
