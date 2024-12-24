import { Typography } from '@mui/material';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
interface ErrorMessageProps {
	children: ReactNode;
	sx?: object;
}

const CustomErrorMessage = ({ children, sx }: ErrorMessageProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Typography variant='body2' sx={{ color: 'red', fontSize: isMobileSize ? '0.7rem' : '0.85rem', backgroundColor: 'transparent', ...sx }}>
			{children}
		</Typography>
	);
};

export default CustomErrorMessage;
