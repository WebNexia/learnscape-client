import { ReactNode, createContext } from 'react';
import { useMediaQuery } from '@mui/material';

interface MediaQueryContextTypes {
	isVerySmallScreen: boolean;
	isSmallScreen: boolean;
	isMediumScreen: boolean;
}

interface MediaQueryContextProviderProps {
	children: ReactNode;
}

export const MediaQueryContext = createContext<MediaQueryContextTypes>({
	isVerySmallScreen: false,
	isMediumScreen: false,
	isSmallScreen: false,
});

const MediaQueryContextProvider = (props: MediaQueryContextProviderProps) => {
	const isVerySmallScreen = useMediaQuery('(max-width: 435px)');
	const isSmallScreen = useMediaQuery('(max-width: 700px)');
	const isMediumScreen = useMediaQuery('(max-width:960px)');

	return (
		<MediaQueryContext.Provider value={{ isVerySmallScreen, isSmallScreen, isMediumScreen }}>
			{props.children}
		</MediaQueryContext.Provider>
	);
};

export default MediaQueryContextProvider;
