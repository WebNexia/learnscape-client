import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { CalendarMonth, Email, Groups, LibraryBooks, Settings } from '@mui/icons-material';
import SidebarBtn from './SidebarBtn';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { PageName } from '../../../interfaces/enums';

const Sidebar = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const { userId } = useParams();

	const currentPage =
		window.location.pathname.split('/')[1].charAt(0).toUpperCase() +
		window.location.pathname.split('/')[1].slice(1);

	const [selectedPage, setSelectedPage] = useState<string>(currentPage);

	const username: string | null = localStorage.getItem('username');

	const navigateWithPage = (pageName: string, path: string) => {
		setSelectedPage(pageName);
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
				backgroundColor: theme.palette.primary.main,
				position: 'fixed',
				left: 0,
				zIndex: 10,
			}}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					height: '3rem',
					marginBottom: '1rem',
				}}>
				<Typography
					variant='h1'
					sx={{ color: theme.textColor?.common.main, fontSize: '1.75rem' }}>
					KAIZEN
				</Typography>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					marginBottom: '1rem',
				}}>
				<img
					src={localStorage.getItem('imageUrl') || undefined}
					alt='user_profile_pic'
					style={{
						height: '6rem',
						width: '6rem',
						borderRadius: '50%',
						marginBottom: '0.5rem',
					}}
				/>
				<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
					{username}
				</Typography>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						alignItems: 'flex-start',
						marginTop: '2rem',
					}}>
					<SidebarBtn
						btnText='Admin DB'
						IconName={DashboardIcon}
						onClick={() =>
							navigateWithPage(
								PageName.ADMIN_DASHBOARD,
								`/admin/dashboard/user/${id || userId}`
							)
						}
						selectedPage={selectedPage}
					/>
					<SidebarBtn
						btnText='Dashboard'
						IconName={DashboardIcon}
						onClick={() =>
							navigateWithPage(PageName.DASHBOARD, `/dashboard/user/${id || userId}`)
						}
						selectedPage={selectedPage}
					/>
					<SidebarBtn
						btnText='Courses'
						IconName={LibraryBooks}
						onClick={() =>
							navigateWithPage(PageName.COURSES, `/courses/user/${id || userId}`)
						}
						selectedPage={selectedPage}
					/>
					<SidebarBtn
						btnText='Schedule'
						IconName={CalendarMonth}
						onClick={() =>
							navigateWithPage(PageName.SCHEDULE, `/schedule/user/${id || userId}`)
						}
						selectedPage={selectedPage}
					/>
					<SidebarBtn
						btnText='Messages'
						IconName={Email}
						onClick={() =>
							navigateWithPage(PageName.MESSAGES, `/messages/user/${id || userId}`)
						}
						selectedPage={selectedPage}
					/>
					<SidebarBtn
						btnText='Community'
						IconName={Groups}
						onClick={() =>
							navigateWithPage(PageName.COMMUNITY, `/community/user/${id || userId}`)
						}
						selectedPage={selectedPage}
					/>
					<SidebarBtn
						btnText='Settings'
						IconName={Settings}
						onClick={() =>
							navigateWithPage(PageName.SETTINGS, `/settings/user/${id || userId}`)
						}
						selectedPage={selectedPage}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default Sidebar;
