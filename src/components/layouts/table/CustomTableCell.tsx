import { TableCell, Typography } from '@mui/material';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CustomTableCellProps {
	children?: ReactNode;
	value?: string | boolean | number;
}

const CustomTableCell = ({ children, value }: CustomTableCellProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<TableCell sx={{ textAlign: 'center', padding: '0.75rem 0' }}>
			<Typography variant='body2' sx={{ fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.75rem' : '0.85rem' }}>
				{value}
			</Typography>
			{children}
		</TableCell>
	);
};

export default CustomTableCell;
