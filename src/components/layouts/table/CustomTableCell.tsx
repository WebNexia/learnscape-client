import { TableCell, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface CustomTableCellProps {
	children?: ReactNode;
	value?: string | boolean | number;
}

const CustomTableCell = ({ children, value }: CustomTableCellProps) => {
	return (
		<TableCell sx={{ textAlign: 'center' }}>
			<Typography variant='body2'>{value}</Typography>
			{children}
		</TableCell>
	);
};

export default CustomTableCell;
