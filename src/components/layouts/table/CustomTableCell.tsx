import { TableCell, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface CustomTableCellProps {
	children?: ReactNode;
	value?: string | boolean | number;
}

const CustomTableCell = ({ children, value }: CustomTableCellProps) => {
	return (
		<TableCell sx={{ textAlign: 'center', padding: '0.75rem 0' }}>
			<Typography variant='body2'>{value}</Typography>
			{children}
		</TableCell>
	);
};

export default CustomTableCell;
