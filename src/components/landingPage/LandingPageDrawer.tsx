import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { responsiveStyles } from '../../styles/responsiveStyles';
import theme from '../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface LandingPageDrawerProps {
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	navItems: Array<{
		label: string;
		action: () => void;
		isActive?: boolean;
	}>;
}

const LandingPageDrawer = ({ isDrawerOpen, setIsDrawerOpen, navItems }: LandingPageDrawerProps) => {
	const handleNavItemClick = (action: () => void) => {
		action();
		setIsDrawerOpen(false);
	};

	const { isRotatedMedium } = useContext(MediaQueryContext);

	return (
		<Drawer
			open={isDrawerOpen}
			onClose={() => setIsDrawerOpen(false)}
			PaperProps={{
				sx: {
					'backgroundColor': 'rgba(190, 170, 210)',
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
						color: theme.textColor?.common.main,
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
										backgroundColor: 'rgba(44, 62, 80, 0.05)',
									},
								}}>
								<ListItemText
									primary={item.label}
									sx={{
										'& .MuiTypography-root': {
											fontFamily: 'Varela Round',
											fontSize: '0.9rem',
											color: theme.textColor?.common.main,
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
