import { Box, Typography, keyframes, useTheme, useMediaQuery } from '@mui/material';
import { useContext, memo } from 'react';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import Sidebar from '../dashboardLayout/Sidebar';
import DashboardHeader from '../dashboardLayout/DashboardHeader';
import logo from '../../../assets/logo.png';
import TypingAnimation from './TypingAnimation';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const float = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(2deg);
  }
  50% {
    transform: translateY(0px) rotate(0deg);
  }
  75% {
    transform: translateY(10px) rotate(-2deg);
  }
  100% {
    transform: translateY(0px) rotate(0deg);
  }
`;

// Memoize the logo component to prevent unnecessary re-renders
const Logo = memo(({ small }: { small?: boolean }) => (
	<Box
		sx={{
			position: 'relative',
			zIndex: 1,
			mb: 4,
			animation: `${float} 4s ease-in-out infinite`,
		}}>
		<img
			src={logo}
			alt='Kaizen Logo'
			style={{
				width: small ? '15rem' : '20rem',
				height: 'auto',
				filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
			}}
		/>
	</Box>
));

// Memoize the base loading screen to prevent unnecessary re-renders
const BaseLoadingScreen = memo(() => {
	const themeMUI = useTheme();
	const isSmall = useMediaQuery(themeMUI.breakpoints.down('sm'));

	const { isRotatedMedium } = useContext(MediaQueryContext);

	const isSmallScreen = isSmall || isRotatedMedium;

	return (
		<Box
			sx={{
				'height': '100vh',
				'width': '100vw',
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'justifyContent': 'center',
				'background': '#ffffff',
				'position': 'relative',
				'overflow': 'hidden',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
					backgroundSize: '40px 40px',
					opacity: 0.3,
				},
			}}>
			<Logo small={isSmallScreen} />
			<Box
				sx={{
					position: 'relative',
					zIndex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 2,
				}}>
				<TypingAnimation />
				<Typography
					sx={{
						color: '#2C3E50',
						fontSize: isSmallScreen ? '1.5rem' : '2rem',
						fontWeight: 500,
						fontFamily: 'Varela Round',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						minHeight: '3rem',
					}}>
					<span>Loading</span>
				</Typography>
			</Box>
		</Box>
	);
});

const Loading = () => {
	const { user } = useContext(UserAuthContext);
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	if (!user) {
		return <BaseLoadingScreen />;
	}

	return (
		<>
			{!isMobileSize && <Sidebar />}

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '110vh',
					width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
					marginLeft: isMobileSize ? 0 : '10rem',
					position: 'absolute',
					right: 0,
				}}>
				<DashboardHeader pageName='' />
			</Box>
		</>
	);
};

export default Loading;
