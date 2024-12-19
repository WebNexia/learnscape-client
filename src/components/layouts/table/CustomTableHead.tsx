import { TableHead, TableRow, TableCell, TableSortLabel, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

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
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<TableHead>
			<TableRow>
				{columns?.map((column, index) => (
					<TableCell key={index} sx={{ textAlign: 'center', padding: isMobileSizeSmall ? '0.05rem' : 'inherit' }}>
						<TableSortLabel
							active={orderBy === column.key}
							direction={orderBy === column.key ? order : 'asc'}
							onClick={() => {
								if (column.key !== 'actions') {
									handleSort(column.key as keyof T);
								}
							}}>
							<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '0.9rem' }}>
								{column.label}
							</Typography>
						</TableSortLabel>
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
};

export default CustomTableHead;
