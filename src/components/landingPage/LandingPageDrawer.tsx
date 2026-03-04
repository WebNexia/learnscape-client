import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { responsiveStyles } from '../../styles/responsiveStyles';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { useAuth } from '../../hooks/useAuth';
import theme from '../../themes';
import { Roles } from '../../interfaces/enums';

interface LandingPageDrawerProps {
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	navItems: Array<{
		label: string;
		action: () => void;
		isActive?: boolean;
	}>;
}

const ADEN_BLUE_GRADIENT = 'linear-gradient(180deg, #004c99 0%, #0052a3 100%)';

const LandingPageDrawer = ({ isDrawerOpen, setIsDrawerOpen, navItems }: LandingPageDrawerProps) => {
	const handleNavItemClick = (action: () => void) => {
		action();
		setIsDrawerOpen(false);
	};

	const { isRotatedMedium } = useContext(MediaQueryContext);
	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess } = useAuth();

	const drawerBackground = user
		? hasAdminAccess
			? theme.bgColor?.adminSidebar
			: user.role === Roles.INSTRUCTOR
				? theme.bgColor?.instructorSidebar
				: theme.palette.primary.main
		: ADEN_BLUE_GRADIENT;

	return (
		<Drawer
			open={isDrawerOpen}
			onClose={() => setIsDrawerOpen(false)}
			PaperProps={{
				sx: {
					'background': drawerBackground,
					'borderRight': '1px solid rgba(255, 255, 255, 0.15)',
					'width': { xs: !isRotatedMedium ? '40vw' : '30vw', sm: !isRotatedMedium ? '13rem' : '20vw' },
					'@media (max-width:600px) and (orientation: landscape)': {
						width: '12rem',
						minWidth: '10rem',
						maxWidth: '13.75rem',
					},
				},
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					pt: { xs: '4rem', sm: '3rem' },
					px: responsiveStyles.spacing.container,
				}}>
				<Typography
					variant='h5'
					sx={{
						mb: responsiveStyles.spacing.section,
						color: '#fff',
						fontSize: '1rem',
						fontFamily: 'Varela Round',
						textAlign: 'center',
					}}>
					Menü
				</Typography>
				<List>
					{navItems?.map((item, index) => (
						<ListItem key={index} disablePadding>
							<ListItemButton
								onClick={() => handleNavItemClick(item.action)}
								sx={{
									'py': responsiveStyles.spacing.item,
									'&:hover': {
										backgroundColor: 'rgba(255, 255, 255, 0.1)',
									},
								}}>
								<ListItemText
									primary={item.label}
									sx={{
										'& .MuiTypography-root': {
											fontFamily: 'Varela Round',
											fontSize: '0.9rem',
											color: '#fff',
											textDecoration: item.isActive ? 'underline' : 'none',
										},
									}}
								/>
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Box>
		</Drawer>
	);
};

export default LandingPageDrawer;
