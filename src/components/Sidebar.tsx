import { Box, Typography } from '@mui/material';
import theme from '../themes';
import { User } from '../interfaces/user';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { CalendarMonth, Email, Groups, LibraryBooks, Settings } from '@mui/icons-material';
import SidebarBtn from './SidebarBtn';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
	data: User;
}

const Sidebar = ({ data }: SidebarProps) => {
	const navigate = useNavigate();
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
				position: 'absolute',
				left: 0,
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', height: '3rem', marginBottom: '1rem' }}>
				<Typography variant='h1' sx={{ color: theme.textColor?.common.main, fontSize: '1.75rem' }}>
					KAIZEN
				</Typography>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
				<img
					src={data.imageUrl}
					alt='user_profile_pic'
					style={{ height: '6rem', width: '6rem', borderRadius: '50%', marginBottom: '0.5rem' }}
				/>
				<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
					{data.username}
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
						btnText='Dashboard'
						IconName={DashboardIcon}
						onClick={() => navigate(`/user/${data._id}`)}
					/>
					<SidebarBtn
						btnText='Courses'
						IconName={LibraryBooks}
						onClick={() => navigate(`/user/${data._id}/courses`)}
					/>
					<SidebarBtn
						btnText='Schedule'
						IconName={CalendarMonth}
						onClick={() => navigate(`/user/${data._id}/schedule`)}
					/>
					<SidebarBtn
						btnText='Messages'
						IconName={Email}
						onClick={() => navigate(`/user/${data._id}/messages`)}
					/>
					<SidebarBtn
						btnText='Community'
						IconName={Groups}
						onClick={() => navigate(`/user/${data._id}/community`)}
					/>
					<SidebarBtn
						btnText='Settings'
						IconName={Settings}
						onClick={() => navigate(`/user/${data._id}/settings`)}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default Sidebar;
