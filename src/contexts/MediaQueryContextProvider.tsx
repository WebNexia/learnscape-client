import { ReactNode, createContext } from 'react';
import { useMediaQuery } from '@mui/material';

interface MediaQueryContextTypes {
	isVerySmallScreen: boolean;
	isSmallScreen: boolean;
	isMediumScreen: boolean;
	isRotated: boolean;
}

interface MediaQueryContextProviderProps {
	children: ReactNode;
}

export const MediaQueryContext = createContext<MediaQueryContextTypes>({
	isVerySmallScreen: false,
	isMediumScreen: false,
	isSmallScreen: false,
	isRotated: false,
});

const MediaQueryContextProvider = (props: MediaQueryContextProviderProps) => {
	const isRotated = useMediaQuery('(max-height: 435px)');
	const isVerySmallScreen = useMediaQuery('(max-width: 435px)');
	const isSmallScreen = useMediaQuery('(max-width: 821px)');
	const isMediumScreen = useMediaQuery('(max-width:960px)');

	return (
		<MediaQueryContext.Provider value={{ isVerySmallScreen, isSmallScreen, isMediumScreen, isRotated }}>{props.children}</MediaQueryContext.Provider>
	);
};

export default MediaQueryContextProvider;
