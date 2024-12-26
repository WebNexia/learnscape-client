import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
// import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

const Header = () => {
	// const { organisation } = useContext(OrganisationContext);

	const { isVerySmallScreen, isSmallScreen, isRotated, isRotatedMedium } = useContext(MediaQueryContext);

	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const navigate = useNavigate();
	return (
		<AppBar position='sticky'>
			<Toolbar
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					width: '100%',
					height: isMobileSize ? '10vh' : '13vh',
					background: 'linear-gradient(270deg, #4D7B8B, #01435A)',
					position: 'fixed',
					top: 0,
					px: isMobileSizeSmall ? '0.35rem' : '0.75rem',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: isVerySmallScreen ? 2.5 : 1 }}>
					<Box>
						<Typography
							variant='h1'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: isMobileSizeSmall ? '1.25rem' : isMobileSize ? '2rem' : '3.5rem',
								cursor: 'pointer',
							}}
							style={{ textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)' }}
							onClick={() => navigate('/')}>
							{/* {organisation?.orgName} */}
							LearnScape
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.75rem' : '1rem',
							}}>
							Courses
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.5rem' : '0.75rem',
							}}>
							News
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.5rem' : '0.75rem',
							}}>
							Blog
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h5'
							sx={{
								fontFamily: 'Poppins',
								color: theme.textColor?.common.main,
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.2rem 0.2rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.5rem' : '0.75rem',
								paddingRight: '0.25rem',
							}}>
							About
						</Typography>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
					<Button
						sx={{
							textTransform: 'capitalize',
							fontSize: isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '1rem',
							color: theme.textColor?.common.main,
							border: '#fff 0.075rem solid',
							padding: isMobileSizeSmall ? '0.15rem 0.25rem' : '0.25rem 0.75rem',
							boxShadow: '0.1rem 0.4rem 0.2rem 0rem rgba(0, 0, 0, 0.3)',
							transition: '0.3s',
							':hover': { backgroundColor: '#fff', color: theme.textColor?.primary.main },
						}}
						onClick={() => navigate('/auth')}>
						Register
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default Header;
