import { TableHead, TableRow, TableCell, TableSortLabel, Typography, Checkbox, Box } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface Column {
	key: string;
	label: string;
	infoIcon?: React.ReactNode;
	width?: string | number;
}

interface CustomTableHeadProps<T> {
	orderBy: keyof T;
	order: 'asc' | 'desc';
	handleSort: (property: keyof T) => void;
	columns: Column[];
	// Optional checkbox props
	selectAll?: boolean;
	onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomTableHead = <T,>({ orderBy, order, handleSort, columns, selectAll, onSelectAll }: CustomTableHeadProps<T>) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<TableHead>
			<TableRow hover>
				{columns?.map((column, index) => (
					<TableCell key={index} sx={{ textAlign: 'center', padding: isMobileSizeSmall ? '0.05rem' : 'inherit', width: column.width || 'auto' }}>
						{column.key === 'checkbox' ? (
							<Checkbox checked={selectAll} onChange={onSelectAll} color='primary' size='small' />
						) : (
							<TableSortLabel
								active={orderBy === column.key}
								direction={orderBy === column.key ? order : 'asc'}
								onClick={() => {
									if (column.key !== 'actions') {
										handleSort(column.key as keyof T);
									}
								}}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
									<Typography variant='h6' sx={{ fontSize: isMobileSizeSmall ? '0.7rem' : isMobileSize ? '0.85rem' : '0.9rem' }}>
										{column.label}
									</Typography>
									{column.infoIcon}
								</Box>
							</TableSortLabel>
						)}
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
};

export default CustomTableHead;
