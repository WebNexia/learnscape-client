import { Box, TableCell, Typography, SxProps } from '@mui/material';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';

interface CustomTableCellProps {
	children?: ReactNode;
	value?: string | boolean | number;
	cellSx?: SxProps;
}

const CustomTableCell = ({ children, value, cellSx }: CustomTableCellProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	// Decode HTML entities if value is a string
	const decodedValue = typeof value === 'string' ? decode(value) : value;

	return (
		<TableCell sx={{ textAlign: 'center', padding: '0.75rem 0', ...cellSx }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant='body2' sx={{ fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.75rem' : '0.85rem' }}>
					{decodedValue}
				</Typography>
				{children}
			</Box>
		</TableCell>
	);
};

export default CustomTableCell;
