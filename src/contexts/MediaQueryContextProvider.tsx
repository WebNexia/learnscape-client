import { ReactNode, createContext } from 'react';
import { useMediaQuery } from '@mui/material';

interface MediaQueryContextTypes {
	isVerySmallScreen: boolean;
	isSmallScreen: boolean;
	isMediumScreen: boolean;
	isRotated: boolean;
	isRotatedMedium: boolean;
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
});

const MediaQueryContextProvider = (props: MediaQueryContextProviderProps) => {
	const isRotated = useMediaQuery('(max-height: 395px)');
	const isRotatedMedium = useMediaQuery('(max-height: 495px)');
	const isVerySmallScreen = useMediaQuery('(max-width: 525px)');
	const isSmallScreen = useMediaQuery('(max-width: 898px)');
	const isMediumScreen = useMediaQuery('(max-width:1180px)');

	return (
		<MediaQueryContext.Provider value={{ isVerySmallScreen, isSmallScreen, isMediumScreen, isRotated, isRotatedMedium }}>
			{props.children}
		</MediaQueryContext.Provider>
	);
};

export default MediaQueryContextProvider;
