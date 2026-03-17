import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import {
	AssignmentIndRounded,
	Ballot,
	CalendarMonth,
	CreditCard,
	Email,
	FilePresent,
	Folder,
	Groups,
	LibraryAddCheck,
	LibraryBooks,
	PeopleAltOutlined,
	QuizOutlined,
	Settings,
	VideoCall,
} from '@mui/icons-material';
import SidebarBtn from './SidebarBtn';
import SidebarGroupedMenu from './SidebarGroupedMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { Roles } from '../../../interfaces/enums';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';

import { useUnreadMessages } from '../../../hooks/useUnreadMessages';
import { useAuth } from '../../../hooks/useAuth';
const Sidebar = () => {
	const navigate = useNavigate();

	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess } = useAuth();
	const location = useLocation();

	const hasUnreadMessages = useUnreadMessages();

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
					height: '1rem',
					marginBottom: '0.5rem',
				}}>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					marginBottom: '0.5rem',
				}}>
				<img
					src={user?.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
					alt='user_profile_pic'
					style={{
						height: '5rem',
						width: '5rem',
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
							<SidebarBtn
								btnText='Dashboard'
								IconName={DashboardIcon}
								onClick={() => navigateWithPage(`/admin/dashboard`)}
								active={currentPath?.includes('/admin/dashboard') || currentPath?.includes('/admin/inquiries')}
							/>
							<SidebarBtn
								btnText='Users'
								IconName={PeopleAltOutlined}
								onClick={() => navigateWithPage(`/admin/users`)}
								active={currentPath?.includes('/admin/users')}
							/>
							<SidebarGroupedMenu
								mainBtnText='Courses'
								mainIconName={LibraryBooks}
								mainPath='/admin/courses'
								mainIsActive={
									(currentPath?.includes('/admin/courses') ||
										currentPath?.includes('/admin/course-edit') ||
										(currentPath?.includes('/admin/course') && currentPath?.includes('/forms'))) &&
									!currentPath?.includes('/admin/lessons') &&
									!currentPath?.includes('/admin/lesson-edit') &&
									!currentPath?.includes('/admin/questions') &&
									!currentPath?.includes('/admin/documents') &&
									!currentPath?.includes('/admin/submissions')
								}
								subMenuItems={[
									{
										btnText: 'Courses',
										IconName: LibraryBooks,
										path: '/admin/courses',
										isActive:
											(currentPath?.includes('/admin/courses') ||
												currentPath?.includes('/admin/course-edit') ||
												(currentPath?.includes('/admin/course') && currentPath?.includes('/forms'))) &&
											!currentPath?.includes('/admin/submissions'),
									},
									{
										btnText: 'Lessons',
										IconName: AssignmentIndRounded,
										path: '/admin/lessons',
										isActive: currentPath?.includes('/admin/lessons') || currentPath?.includes('/admin/lesson-edit'),
									},
									{
										btnText: 'Questions',
										IconName: QuizOutlined,
										path: '/admin/questions',
										isActive: currentPath?.includes('/admin/questions'),
									},
									{
										btnText: 'Documents',
										IconName: FilePresent,
										path: '/admin/documents',
										isActive: currentPath?.includes('/admin/documents'),
									},
									{
										btnText: 'Submissions',
										IconName: LibraryAddCheck,
										path: '/admin/submissions',
										isActive: currentPath?.includes('/admin/submissions'),
									},
								]}
								onNavigate={navigateWithPage}
							/>
							{(currentPath?.includes('/admin/lessons') || currentPath?.includes('/admin/lesson-edit')) && (
								<SidebarBtn
									btnText='Lessons'
									IconName={AssignmentIndRounded}
									onClick={() => navigateWithPage(`/admin/lessons`)}
									active={currentPath?.includes('/admin/lessons') || currentPath?.includes('/admin/lesson-edit')}
								/>
							)}
							{currentPath?.includes('/admin/questions') && (
								<SidebarBtn
									btnText='Questions'
									IconName={QuizOutlined}
									onClick={() => navigateWithPage(`/admin/questions`)}
									active={currentPath?.includes('/admin/questions')}
								/>
							)}
							{currentPath?.includes('/admin/documents') && (
								<SidebarBtn
									btnText='Documents'
									IconName={FilePresent}
									onClick={() => navigateWithPage(`/admin/documents`)}
									active={currentPath?.includes('/admin/documents')}
								/>
							)}
							{currentPath?.includes('/admin/submissions') && (
								<SidebarBtn
									btnText='Submissions'
									IconName={LibraryAddCheck}
									onClick={() => navigateWithPage(`/admin/submissions`)}
									active={currentPath?.includes('/admin/submissions')}
								/>
							)}
							<SidebarBtn
								btnText='Calendar'
								IconName={CalendarMonth}
								onClick={() => navigateWithPage(`/admin/calendar`)}
								active={currentPath?.includes('/admin/calendar')}
							/>
							<SidebarBtn
								btnText='Messages'
								IconName={Email}
								onClick={() => navigateWithPage(`/admin/messages`)}
								active={currentPath?.includes('/admin/messages')}
								hasUnreadMessages={hasUnreadMessages}
							/>
							<SidebarBtn
								btnText='Community'
								IconName={Groups}
								onClick={() => navigateWithPage(`/admin/community`)}
								active={currentPath?.includes('/admin/community')}
							/>
							<SidebarBtn
								btnText='Resources'
								IconName={Folder}
								onClick={() => navigateWithPage(`/admin/resources`)}
								active={currentPath?.includes('/admin/resources')}
							/>
							<SidebarBtn
								btnText='Forms'
								IconName={Ballot}
								onClick={() => navigateWithPage(`/admin/forms`)}
								active={currentPath?.includes('/admin/forms') && !currentPath?.includes('/admin/course')}
							/>
							<SidebarBtn
								btnText='Consultancy'
								IconName={VideoCall}
								onClick={() => navigateWithPage(`/admin/consultations`)}
								active={currentPath?.includes('/admin/consultations')}
							/>
							{(user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN) && (
								<SidebarBtn
									btnText='Payments'
									IconName={CreditCard}
									onClick={() => navigateWithPage(`/admin/payments`)}
									active={currentPath?.includes('/admin/payments')}
								/>
							)}
						</>
					)}
					{user?.role === Roles.USER && (
						<>
							<SidebarBtn
								btnText='Dashboard'
								IconName={DashboardIcon}
								onClick={() => navigateWithPage(`/dashboard`)}
								active={currentPath?.includes('/dashboard')}
							/>
							<SidebarBtn
								btnText='Courses'
								IconName={LibraryBooks}
								onClick={() => navigateWithPage(`/courses`)}
								active={currentPath?.includes('/courses')}
							/>
							<SidebarBtn
								btnText='Submissions'
								IconName={LibraryAddCheck}
								onClick={() => navigateWithPage(`/submissions`)}
								active={currentPath?.includes('/submissions')}
							/>
							<SidebarBtn
								btnText='Calendar'
								IconName={CalendarMonth}
								onClick={() => navigateWithPage(`/calendar`)}
								active={currentPath?.includes('/calendar')}
							/>
							<SidebarBtn
								btnText='Messages'
								IconName={Email}
								onClick={() => navigateWithPage(`/messages`)}
								active={currentPath?.includes('/messages')}
								hasUnreadMessages={hasUnreadMessages}
							/>
							<SidebarBtn
								btnText='Community'
								IconName={Groups}
								onClick={() => navigateWithPage(`/community`)}
								active={currentPath?.includes('/community')}
							/>
							<SidebarBtn
								btnText='Resources'
								IconName={Folder}
								onClick={() => navigateWithPage(`/resources`)}
								active={currentPath?.includes('/resources')}
							/>
							<SidebarBtn
								btnText='Settings'
								IconName={Settings}
								onClick={() => navigateWithPage(`/settings`)}
								active={currentPath?.includes('/settings')}
							/>
						</>
					)}
					{user?.role === Roles.INSTRUCTOR && (
						<>
							<SidebarBtn
								btnText='Dashboard'
								IconName={DashboardIcon}
								onClick={() => navigateWithPage(`/instructor/dashboard`)}
								active={currentPath?.includes('/instructor/dashboard')}
							/>
							<SidebarGroupedMenu
								mainBtnText='Courses'
								mainIconName={LibraryBooks}
								mainPath='/instructor/courses'
								mainIsActive={
									(currentPath?.includes('/instructor/courses') ||
										(currentPath?.includes('/instructor/course') && currentPath?.includes('/forms'))) &&
									!currentPath?.includes('/instructor/lessons') &&
									!currentPath?.includes('/instructor/lesson-edit') &&
									!currentPath?.includes('/instructor/questions') &&
									!currentPath?.includes('/instructor/documents') &&
									!currentPath?.includes('/instructor/submissions')
								}
								subMenuItems={[
									{
										btnText: 'Courses',
										IconName: LibraryBooks,
										path: '/instructor/courses',
										isActive:
											(currentPath?.includes('/instructor/courses') ||
												currentPath?.includes('/instructor/course-edit') ||
												(currentPath?.includes('/instructor/course') && currentPath?.includes('/forms'))) &&
											!currentPath?.includes('/instructor/submissions'),
									},
									{
										btnText: 'Lessons',
										IconName: AssignmentIndRounded,
										path: '/instructor/lessons',
										isActive: currentPath?.includes('/instructor/lessons') || currentPath?.includes('/instructor/lesson-edit'),
									},
									{
										btnText: 'Questions',
										IconName: QuizOutlined,
										path: '/instructor/questions',
										isActive: currentPath?.includes('/instructor/questions'),
									},
									{
										btnText: 'Documents',
										IconName: FilePresent,
										path: '/instructor/documents',
										isActive: currentPath?.includes('/instructor/documents'),
									},
									{
										btnText: 'Submissions',
										IconName: LibraryAddCheck,
										path: '/instructor/submissions',
										isActive: currentPath?.includes('/instructor/submissions'),
									},
								]}
								onNavigate={navigateWithPage}
							/>
							{(currentPath?.includes('/instructor/lessons') || currentPath?.includes('/instructor/lesson-edit')) && <SidebarBtn
								btnText='Lessons'
								IconName={AssignmentIndRounded}
								onClick={() => navigateWithPage(`/instructor/lessons`)}
								active={currentPath?.includes('/instructor/lessons')}
							/>
							}
							{currentPath?.includes('/instructor/questions') && <SidebarBtn
								btnText='Questions'
								IconName={QuizOutlined}
								onClick={() => navigateWithPage(`/instructor/questions`)}
								active={currentPath?.includes('/instructor/questions')}
							/>}
							{currentPath?.includes('/instructor/documents') && <SidebarBtn
								btnText='Documents'
								IconName={FilePresent}
								onClick={() => navigateWithPage(`/instructor/documents`)}
								active={currentPath?.includes('/instructor/documents')}
							/>}
							{currentPath?.includes('/instructor/submissions') && <SidebarBtn
								btnText='Submissions'
								IconName={LibraryAddCheck}
								onClick={() => navigateWithPage(`/instructor/submissions`)}
								active={currentPath?.includes('/instructor/submissions')}
							/>}
							<SidebarBtn
								btnText='Forms'
								IconName={Ballot}
								onClick={() => navigateWithPage(`/instructor/forms`)}
								active={currentPath?.includes('/instructor/forms') && !currentPath?.includes('/instructor/course')}
							/>

							<SidebarBtn
								btnText='Calendar'
								IconName={CalendarMonth}
								onClick={() => navigateWithPage(`/instructor/calendar`)}
								active={currentPath?.includes('/instructor/calendar')}
							/>
							<SidebarBtn
								btnText='Messages'
								IconName={Email}
								onClick={() => navigateWithPage(`/instructor/messages`)}
								active={currentPath?.includes('/instructor/messages')}
								hasUnreadMessages={hasUnreadMessages}
							/>
							<SidebarBtn
								btnText='Community'
								IconName={Groups}
								onClick={() => navigateWithPage(`/instructor/community`)}
								active={currentPath?.includes('/instructor/community')}
							/>
							<SidebarBtn
								btnText='Resources'
								IconName={Folder}
								onClick={() => navigateWithPage(`/instructor/resources`)}
								active={currentPath?.includes('/instructor/resources')}
							/>
							<SidebarBtn
								btnText='Settings'
								IconName={Settings}
								onClick={() => navigateWithPage(`/instructor/settings`)}
								active={currentPath?.includes('/instructor/settings')}
							/>
						</>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default Sidebar;
