import { Box, TableCell, Typography, SxProps } from '@mui/material';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';

interface CustomTableCellProps {
	children?: ReactNode;
	value?: string | boolean | number;
	cellSx?: SxProps;
	align?: 'left' | 'center' | 'right';
}

const CustomTableCell = ({ children, value, cellSx, align = 'center' }: CustomTableCellProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	// Decode HTML entities if value is a string
	const decodedValue = typeof value === 'string' ? decode(value) : value;

	return (
		<TableCell align={align} sx={{ textAlign: align, padding: '0.75rem 1rem', overflow: 'hidden', ...cellSx }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center', minWidth: 0, width: '100%' }}>
				{value !== undefined && value !== null && value !== '' && (
					<Typography
						variant='body2'
						sx={{
							fontSize: isMobileSizeSmall ? '0.65rem' : isMobileSize ? '0.75rem' : '0.85rem',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							width: '100%',
							textAlign: align,
						}}>
						{decodedValue}
					</Typography>
				)}
				{children}
			</Box>
		</TableCell>
	);
};

export default CustomTableCell;
