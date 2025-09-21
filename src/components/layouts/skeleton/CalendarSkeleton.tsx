import React from 'react';
import { Box, Skeleton } from '@mui/material';

const CalendarSkeleton: React.FC = () => {
	return (
		<Box sx={{ width: '100%', padding: '2rem 5rem 2rem 5rem' }}>
			{/* Calendar Grid Skeleton */}
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(7, 1fr)',
					gap: 1,
					border: '1px solid #e0e0e0',
					borderRadius: 1,
					padding: 1,
				}}>
				{/* Day headers */}
				{Array.from({ length: 7 }).map((_, index) => (
					<Box key={`header-${index}`} sx={{ padding: 1, textAlign: 'center' }}>
						<Skeleton variant='text' width='60%' height={20} />
					</Box>
				))}

				{/* Calendar cells */}
				{Array.from({ length: 35 }).map((_, index) => (
					<Box
						key={`cell-${index}`}
						sx={{
							minHeight: 100,
							padding: 1,
							border: '1px solid #f0f0f0',
							borderRadius: 1,
							display: 'flex',
							flexDirection: 'column',
							gap: 0.5,
						}}>
						<Skeleton variant='text' width='30%' height={16} />
						<Skeleton variant='rectangular' width='100%' height={20} sx={{ borderRadius: 0.5 }} />
						<Skeleton variant='rectangular' width='80%' height={16} sx={{ borderRadius: 0.5 }} />
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default CalendarSkeleton;
