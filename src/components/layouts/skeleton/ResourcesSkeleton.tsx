import { Box, Skeleton } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface ResourcesSkeletonProps {
	rows?: number;
	isItems?: boolean; // If true, renders item skeletons (wider), if false, renders folder skeletons
}

const ResourcesSkeleton = ({ rows = 6, isItems = false }: ResourcesSkeletonProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	// Width matches current design: folders are 12rem/14rem, items are 12rem/16rem
	const width = isItems 
		? (isMobileSize ? '12rem' : '16rem')
		: (isMobileSize ? '12rem' : '14rem');

	return (
		<Box
			sx={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'flex-start',
				margin: '1rem 0 0 0',
				gap: '1.5rem',
			}}>
			{Array.from({ length: rows }).map((_, index) => (
				<Box
					key={index}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'flex-start',
						padding: '1.5rem',
						position: 'relative',
						width,
						boxShadow: isItems ? 'none' : '0 0 0.85rem 0.1rem rgba(0,0,0,0.2)',
						borderRadius: isItems ? '0' : '0.5rem',
						mb: '1rem',
					}}>
					{/* Icon Skeleton */}
					<Skeleton
						variant='circular'
						sx={{
							width: isMobileSize ? '3.5rem' : '5rem',
							height: isMobileSize ? '3.5rem' : '5rem',
							mb: isItems ? '0.75rem' : '0.5rem',
						}}
					/>

					{/* Name Skeleton - 2 lines max */}
					<Skeleton
						variant='text'
						sx={{
							width: '90%',
							height: isMobileSize ? '0.8rem' : '0.85rem',
							mb: '0.25rem',
						}}
					/>
					<Skeleton
						variant='text'
						sx={{
							width: '60%',
							height: isMobileSize ? '0.8rem' : '0.85rem',
						}}
					/>
				</Box>
			))}
		</Box>
	);
};

export default ResourcesSkeleton;
