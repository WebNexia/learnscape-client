import React, { useContext } from 'react';
import { Box, Table, TableBody } from '@mui/material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomTableHead from './table/CustomTableHead';
import CustomTablePagination from './table/CustomTablePagination';

interface Column {
	key: string;
	label: string;
	infoIcon?: React.ReactNode;
}

interface StickyTabComponentProps<T> {
	// Data
	data: T[];
	columns: Column[];

	// Pagination
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;

	// Sorting
	orderBy?: keyof T;
	order?: 'asc' | 'desc';
	onSort: (property: keyof T) => void;

	// Selection (optional)
	selectAll?: boolean;
	onSelectAll?: (checked: boolean) => void;

	// Row rendering
	renderRow: (item: T, index: number) => React.ReactNode;

	// Responsive
	isVerySmallScreen?: boolean;
}

function StickyTabComponent<T extends Record<string, any>>({
	data,
	columns,
	currentPage,
	totalPages,
	onPageChange,
	orderBy,
	order,
	onSort,
	selectAll,
	onSelectAll,
	renderRow,
	isVerySmallScreen = false,
}: StickyTabComponentProps<T>) {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box sx={{ width: '100%' }}>
			<Table
				sx={{
					'mb': '2rem',
					'& .MuiTableHead-root': {
						position: 'sticky',
						top: isMobileSize ? '14rem' : '16rem', // Account for tabs + filter row
						zIndex: 99,
						backgroundColor: 'background.paper',
						boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
					},
					'& .MuiTableHead-root .MuiTableCell-root': {
						backgroundColor: 'background.paper',
						padding: '0.25rem 1rem',
					},
				}}
				size='small'
				aria-label='a dense table'>
				<CustomTableHead<T>
					orderBy={orderBy as keyof T}
					order={order as 'asc' | 'desc'}
					handleSort={onSort}
					selectAll={selectAll}
					onSelectAll={onSelectAll ? (event) => onSelectAll(event.target.checked) : undefined}
					columns={columns}
				/>
				<TableBody>{data.map((item, index) => renderRow(item, index))}</TableBody>
			</Table>
			<CustomTablePagination count={totalPages} page={currentPage} onChange={onPageChange} />
		</Box>
	);
}

export default StickyTabComponent;
