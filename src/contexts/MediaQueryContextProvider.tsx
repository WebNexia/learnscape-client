import { ReactNode, createContext } from 'react';
import { useMediaQuery } from '@mui/material';

interface MediaQueryContextTypes {
	isVerySmallScreen: boolean;
	isSmallScreen: boolean;
	isMediumScreen: boolean;
	isRotated: boolean;
	isRotatedMedium: boolean;
	isPortrait: boolean;
	isLandscape: boolean;
	isMobile: boolean;
	isSmallMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isMobilePortrait: boolean;
	isMobileLandscape: boolean;
	isSmallMobilePortrait: boolean;
	isSmallMobileLandscape: boolean;
	isTabletPortrait: boolean;
	isTabletLandscape: boolean;
	isDesktopPortrait: boolean;
	isDesktopLandscape: boolean;
}

interface MediaQueryContextProviderProps {
	children: ReactNode;
}

export const MediaQueryContext = createContext<MediaQueryContextTypes>({
	isVerySmallScreen: false,
	isMediumScreen: false,
	isSmallScreen: false,
	isRotated: false,
	isRotatedMedium: false,
	isPortrait: false,
	isLandscape: false,
	isMobile: false,
	isSmallMobile: false,
	isTablet: false,
	isDesktop: false,
	isMobilePortrait: false,
	isMobileLandscape: false,
	isSmallMobilePortrait: false,
	isSmallMobileLandscape: false,
	isTabletPortrait: false,
	isTabletLandscape: false,
	isDesktopPortrait: false,
	isDesktopLandscape: false,
});

const MediaQueryContextProvider = (props: MediaQueryContextProviderProps) => {
	// Orientation detection
	const isPortrait = useMediaQuery('(orientation: portrait)');
	const isLandscape = useMediaQuery('(orientation: landscape)');

	// Device type detection
	// For mobile: use width in portrait, height in landscape (since landscape width can be > 600px)
	// Using 550px height to avoid catching tablets (most tablets are 600px+ height in landscape)
	const isMobilePortrait = useMediaQuery('(max-width: 600px) and (orientation: portrait)');
	const isMobileLandscape = useMediaQuery('(max-height: 550px) and (orientation: landscape)');
	const isMobile = isMobilePortrait || isMobileLandscape;

	// Small mobile detection (for devices like Galaxy S III - 360px width)
	// Small mobile: max-width 400px in portrait, max-height 400px in landscape
	const isSmallMobilePortrait = useMediaQuery('(max-width: 380px) and (orientation: portrait)');
	const isSmallMobileLandscape = useMediaQuery('(max-height: 380px) and (orientation: landscape)');
	const isSmallMobile = isSmallMobilePortrait || isSmallMobileLandscape;

	// Tablet and desktop detection
	const isTablet = useMediaQuery('(min-width: 601px) and (max-width: 1180px)');
	const isDesktop = useMediaQuery('(min-width: 1181px)');

	// Device + orientation combinations
	const isTabletPortrait = isTablet && isPortrait;
	const isTabletLandscape = isTablet && isLandscape;
	const isDesktopPortrait = isDesktop && isPortrait;
	const isDesktopLandscape = isDesktop && isLandscape;

	const isRotated = useMediaQuery('(max-height: 395px)');
	const isRotatedMedium = useMediaQuery('(max-height: 495px)');
	const isVerySmallScreen = useMediaQuery('(max-width: 525px)');
	const isSmallScreen = useMediaQuery('(max-width: 898px)');
	const isMediumScreen = useMediaQuery('(max-width:1180px)');

	return (
		<MediaQueryContext.Provider
			value={{
				isVerySmallScreen,
				isSmallScreen,
				isMediumScreen,
				isRotated,
				isRotatedMedium,
				isPortrait,
				isLandscape,
				isMobile,
				isSmallMobile,
				isTablet,
				isDesktop,
				isMobilePortrait,
				isMobileLandscape,
				isSmallMobilePortrait,
				isSmallMobileLandscape,
				isTabletPortrait,
				isTabletLandscape,
				isDesktopPortrait,
				isDesktopLandscape,
			}}>
			{props.children}
		</MediaQueryContext.Provider>
	);
};

export default MediaQueryContextProvider;
