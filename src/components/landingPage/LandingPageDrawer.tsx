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
					'backgroundColor': '#FDF7F0',
					'width': { xs: !isRotatedMedium ? '40vw' : '30vw', sm: !isRotatedMedium ? '13rem' : '20vw' },
					'@media (max-width:600px) and (orientation: landscape)': {
						width: '12rem',
						minWidth: '10rem',
						maxWidth: '13.75rem',
					},
					'backgroundImage': `
						linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05)),
						radial-gradient(circle, rgba(44,62,80,0.08) 1px, transparent 1px)
					`,
					'backgroundSize': 'auto, 1.875rem 1.875rem',
					'backgroundRepeat': 'repeat, repeat',
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
						color: theme.textColor?.primary.main,
						fontSize: !isRotatedMedium ? responsiveStyles.typography.h5 : '0.95rem',
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
											fontSize: !isRotatedMedium ? responsiveStyles.typography.h5 : '0.85rem',
											color: theme.textColor?.primary.main,
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
