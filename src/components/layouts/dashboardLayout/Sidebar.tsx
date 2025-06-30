import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import DashboardIcon from '@mui/icons-material/Dashboard';
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
import SidebarBtn from './SidebarBtn';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { PageName, Roles } from '../../../interfaces/enums';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';

const Sidebar = () => {
	const navigate = useNavigate();
	const { id, userId } = useParams();
	const { user } = useContext(UserAuthContext);
	const location = useLocation();

	// Determine the current page from the route
	const currentPath = location.pathname;

	const navigateWithPage = (path: string) => {
		navigate(path);
	};

	return (
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
					{user?.role === Roles.ADMIN && (
						<>
							<SidebarBtn
								btnText='Dashboard'
								IconName={DashboardIcon}
								onClick={() => navigateWithPage(`/admin/dashboard/user/${id || userId}`)}
								active={currentPath.includes('/admin/dashboard') || currentPath.includes('/admin/contact-requests')}
							/>
							<SidebarBtn
								btnText='Users'
								IconName={PeopleAltOutlined}
								onClick={() => navigateWithPage(`/admin/users/user/${id || userId}`)}
								active={currentPath.includes('/admin/users')}
							/>
							<SidebarBtn
								btnText='Courses'
								IconName={LibraryBooks}
								onClick={() => navigateWithPage(`/admin/courses/user/${id || userId}`)}
								active={currentPath.includes('/admin/courses') || currentPath.includes('/admin/course-edit')}
							/>
							<SidebarBtn
								btnText='Lessons'
								IconName={AssignmentIndRounded}
								onClick={() => navigateWithPage(`/admin/lessons/user/${id || userId}`)}
								active={currentPath.includes('/admin/lessons') || currentPath.includes('/admin/lesson-edit')}
							/>
							<SidebarBtn
								btnText='Questions'
								IconName={QuizOutlined}
								onClick={() => navigateWithPage(`/admin/questions/user/${id || userId}`)}
								active={currentPath.includes('/admin/questions')}
							/>
							<SidebarBtn
								btnText='Documents'
								IconName={FilePresent}
								onClick={() => navigateWithPage(`/admin/documents/user/${id || userId}`)}
								active={currentPath.includes('/admin/documents')}
							/>
							<SidebarBtn
								btnText='Submissions'
								IconName={LibraryAddCheck}
								onClick={() => navigateWithPage(`/admin/submissions/user/${id || userId}`)}
								active={currentPath.includes('/admin/submissions')}
							/>
							<SidebarBtn
								btnText='Payments'
								IconName={CreditCard}
								onClick={() => navigateWithPage(`/admin/payments/user/${id || userId}`)}
								active={currentPath.includes('/admin/payments')}
							/>
							<SidebarBtn
								btnText='Calendar'
								IconName={CalendarMonth}
								onClick={() => navigateWithPage(`/admin/calendar/user/${id || userId}`)}
								active={currentPath.includes('/admin/calendar')}
							/>
							<SidebarBtn
								btnText='Messages'
								IconName={Email}
								onClick={() => navigateWithPage(`/admin/messages/user/${id || userId}`)}
								active={currentPath.includes('/admin/messages')}
							/>
							<SidebarBtn
								btnText='Community'
								IconName={Groups}
								onClick={() => navigateWithPage(`/admin/community/user/${id || userId}`)}
								active={currentPath.includes('/admin/community')}
							/>
							<SidebarBtn
								btnText='Settings'
								IconName={Settings}
								onClick={() => navigateWithPage(`/admin/settings/user/${id || userId}`)}
								active={currentPath.includes('/admin/settings')}
							/>
						</>
					)}
					{user?.role === Roles.USER && (
						<>
							<SidebarBtn
								btnText='Dashboard'
								IconName={DashboardIcon}
								onClick={() => navigateWithPage(`/dashboard/user/${id || userId}`)}
								active={currentPath.includes('/dashboard')}
							/>
							<SidebarBtn
								btnText='Courses'
								IconName={LibraryBooks}
								onClick={() => navigateWithPage(`/courses/user/${id || userId}`)}
								active={currentPath.includes('/courses')}
							/>
							<SidebarBtn
								btnText='Submissions'
								IconName={LibraryAddCheck}
								onClick={() => navigateWithPage(`/submissions/user/${id || userId}`)}
								active={currentPath.includes('/submissions')}
							/>
							<SidebarBtn
								btnText='Calendar'
								IconName={CalendarMonth}
								onClick={() => navigateWithPage(`/calendar/user/${id || userId}`)}
								active={currentPath.includes('/calendar')}
							/>
							<SidebarBtn
								btnText='Messages'
								IconName={Email}
								onClick={() => navigateWithPage(`/messages/user/${id || userId}`)}
								active={currentPath.includes('/messages')}
							/>
							<SidebarBtn
								btnText='Community'
								IconName={Groups}
								onClick={() => navigateWithPage(`/community/user/${id || userId}`)}
								active={currentPath.includes('/community')}
							/>
							<SidebarBtn
								btnText='Settings'
								IconName={Settings}
								onClick={() => navigateWithPage(`/settings/user/${id || userId}`)}
								active={currentPath.includes('/settings')}
							/>
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default Sidebar;
