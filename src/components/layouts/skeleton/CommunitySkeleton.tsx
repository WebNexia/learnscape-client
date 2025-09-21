import React from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

const CommunitySkeleton: React.FC = () => {
	return (
		<Box sx={{ width: '100%', padding: '2rem' }}>
			{/* Header Skeleton */}
			<Box sx={{ textAlign: 'center', marginBottom: 3 }}>
				<Skeleton variant='text' width={300} height={40} sx={{ margin: '0 auto 1rem' }} />
			</Box>

			{/* Search Bar Skeleton */}
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

			{/* Topic Cards Skeleton */}
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{Array.from({ length: 5 }).map((_, index) => (
					<Card key={index} sx={{ width: '100%', margin: '0 auto' }}>
						<CardContent>
							<Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
								<Skeleton variant='circular' width={40} height={40} />
								<Box sx={{ flex: 1 }}>
									<Skeleton variant='text' width='60%' height={24} />
									<Skeleton variant='text' width='40%' height={16} />
								</Box>
							</Box>
							<Skeleton variant='text' width='90%' height={20} />
							<Skeleton variant='text' width='80%' height={20} />
							<Skeleton variant='text' width='70%' height={20} />
							<Box sx={{ display: 'flex', gap: 1, marginTop: 2 }}>
								<Skeleton variant='rectangular' width={80} height={24} sx={{ borderRadius: 1 }} />
								<Skeleton variant='rectangular' width={60} height={24} sx={{ borderRadius: 1 }} />
								<Skeleton variant='rectangular' width={100} height={24} sx={{ borderRadius: 1 }} />
							</Box>
						</CardContent>
					</Card>
				))}
			</Box>

			{/* Pagination Skeleton */}
			<Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Skeleton variant='rectangular' width={32} height={32} sx={{ borderRadius: 1 }} />
					<Skeleton variant='rectangular' width={32} height={32} sx={{ borderRadius: 1 }} />
					<Skeleton variant='rectangular' width={32} height={32} sx={{ borderRadius: 1 }} />
				</Box>
			</Box>
		</Box>
	);
};

export default CommunitySkeleton;
