import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import theme from '../../themes';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
// import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

const Header = ({ coursesRef }: { coursesRef: React.RefObject<HTMLDivElement> }) => {
	// const { organisation } = useContext(OrganisationContext);

	const handleScrollToCourses = () => {
		if (coursesRef.current) {
			const offset = -50; // Adjust this value to scroll more down (e.g., 100px)
			const elementPosition = coursesRef.current.getBoundingClientRect().top + window.scrollY;

			window.scrollTo({
				top: elementPosition - offset, // Scrolls slightly further down
				behavior: 'smooth',
			});
		}
	};

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
					background: theme.palette.secondary.main, // 'linear-gradient(270deg, #4D7B8B, #01435A)',
					position: 'fixed',
					top: 0,
					px: isMobileSizeSmall ? '0.35rem' : '0.75rem',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '33%' }}>
					<Typography
						variant='h1'
						sx={{
							color: 'linear-gradient(270deg, #4D7B8B, #01435A)',
							fontSize: isMobileSizeSmall ? '1.25rem' : isMobileSize ? '2rem' : '3.25rem',
							cursor: 'pointer',
						}}
						style={{ textShadow: '0.15rem 0.15rem rgba(0, 0, 0, 0.15)' }}
						onClick={() => navigate('/')}>
						{/* {organisation?.orgName} */}
						Kaizenglish
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', width: '33%' }}>
					<Box>
						<Typography
							variant='h4'
							onClick={handleScrollToCourses}
							sx={{
								fontFamily: 'Poppins',
								color: 'linear-gradient(270deg, #4D7B8B, #01435A)',
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.1rem 0.1rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
							}}>
							Courses
						</Typography>
					</Box>
					<Box>
						<Typography
							variant='h4'
							sx={{
								fontFamily: 'Poppins',
								color: 'linear-gradient(270deg, #4D7B8B, #01435A)',
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.1rem 0.1rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.5rem' : '1.25rem',
							}}>
							News
						</Typography>
					</Box>
					<Box onClick={() => navigate('/resources')}>
						<Typography
							variant='h4'
							sx={{
								fontFamily: 'Poppins',
								color: 'linear-gradient(270deg, #4D7B8B, #01435A)',
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.1rem 0.1rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.5rem' : '1.25rem',
							}}>
							Resources
						</Typography>
					</Box>
					{/* <Box>
						<Typography
							variant='h4'
							component='a'
							href={`https://wa.me/447498163458?text=${encodeURIComponent('Feel free to ask us anything about our courses!')}`}
							target='_blank'
							rel='noopener noreferrer'
							sx={{
								fontFamily: 'Poppins',
								color: 'linear-gradient(270deg, #4D7B8B, #01435A)',
								':hover': { textDecoration: 'underline' },
								cursor: 'pointer',
								textShadow: '0.1rem 0.1rem rgba(0, 0, 0, 0.15)',
								fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.85rem' : undefined,
								paddingLeft: isVerySmallScreen ? '0.5rem' : '1.25rem',
								paddingRight: '0.25rem',
							}}>
							Chat
						</Typography>
					</Box> */}
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '33%' }}>
					<Button
						sx={{
							textTransform: 'capitalize',
							fontSize: isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '1rem',
							color: 'linear-gradient(270deg, #4D7B8B, #01435A)',
							border: '#4D7B8B 0.075rem solid',
							padding: isMobileSizeSmall ? '0.1rem 0.2rem' : '0.5rem 1.75rem',
							// boxShadow: '0.1rem 0.2rem 0.2rem 0.1rem rgba(0, 0, 0, 0.3)',

							borderRadius: '5rem',
							':hover': { backgroundColor: ' #4D7B8B', color: '#ffff' },
						}}
						onClick={() => navigate('/auth')}>
						Login
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default Header;
