import { TableCell, Typography } from '@mui/material';

interface CustomTableCellProps {
	value: string | boolean | number; // Adjust the type as needed
}

const CustomTableCell = ({ value }: CustomTableCellProps) => {
	return (
		<TableCell sx={{ textAlign: 'center' }}>
			<Typography variant='body2'>{value}</Typography>
		</TableCell>
	);
};

export default CustomTableCell;
