import React from 'react';
import { Box, Skeleton, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface AdminTableSkeletonProps {
	rows?: number;
	columns?: number;
	showSearchBar?: boolean;
	showPagination?: boolean;
}

const AdminTableSkeleton: React.FC<AdminTableSkeletonProps> = ({ rows = 5, columns = 4, showSearchBar = true, showPagination = true }) => {
	return (
		<Box sx={{ width: '100%', padding: '1.5rem' }}>
			{/* Search Bar Skeleton */}
			{showSearchBar && (
				<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: '0 1rem' }}>
					<Box sx={{ display: 'flex', gap: 2, marginBottom: 2, alignItems: 'center' }}>
						<Skeleton variant='rectangular' width={200} height={30} sx={{ borderRadius: 1 }} />
						<Skeleton variant='rectangular' width={180} height={30} sx={{ borderRadius: 1 }} />
						<Skeleton variant='rectangular' width={70} height={30} sx={{ borderRadius: 1 }} />
						<Skeleton variant='rectangular' width={70} height={30} sx={{ borderRadius: 1 }} />
					</Box>
					<Box>
						<Skeleton variant='rectangular' width={70} height={30} sx={{ borderRadius: 1 }} />
					</Box>
				</Box>
			)}

			{/* Table Skeleton */}
			<Table>
				<TableHead>
					<TableRow>
						{Array.from({ length: columns }).map((_, index) => (
							<TableCell key={index}>
								<Skeleton variant='text' width='80%' height={24} />
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{Array.from({ length: rows }).map((_, rowIndex) => (
						<TableRow key={rowIndex}>
							{Array.from({ length: columns }).map((_, colIndex) => (
								<TableCell key={colIndex}>
									<Skeleton variant='text' width={colIndex === 0 ? '90%' : '70%'} height={20} />
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Pagination Skeleton */}
			{showPagination && (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Skeleton variant='rectangular' width={32} height={32} sx={{ borderRadius: 1 }} />
						<Skeleton variant='rectangular' width={32} height={32} sx={{ borderRadius: 1 }} />
						<Skeleton variant='rectangular' width={32} height={32} sx={{ borderRadius: 1 }} />
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default AdminTableSkeleton;
