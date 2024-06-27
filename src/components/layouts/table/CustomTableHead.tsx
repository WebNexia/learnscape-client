import { TableHead, TableRow, TableCell, TableSortLabel, Typography } from '@mui/material';

interface Column {
	key: string;
	label: string;
}

interface CustomTableHeadProps<T> {
	orderBy: keyof T;
	order: 'asc' | 'desc';
	handleSort: (property: keyof T) => void;
	columns: Column[];
}

const CustomTableHead = <T,>({ orderBy, order, handleSort, columns }: CustomTableHeadProps<T>) => {
	return (
		<TableHead>
			<TableRow>
				{columns?.map((column, index) => (
					<TableCell key={index} sx={{ textAlign: 'center' }}>
						<TableSortLabel
							active={orderBy === column.key}
							direction={orderBy === column.key ? order : 'asc'}
							onClick={() => {
								if (column.key !== 'actions') {
									handleSort(column.key as keyof T);
								}
							}}>
							<Typography variant='h6'>{column.label}</Typography>
						</TableSortLabel>
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
};

export default CustomTableHead;
