import { Box, Grid, Skeleton } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface ResourcesSkeletonProps {
	rows?: number;
	isItems?: boolean; // If true, renders item skeletons (wider), if false, renders folder skeletons
}

const ResourcesSkeleton = ({ rows = 6, isItems = false }: ResourcesSkeletonProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	// Match FolderCard / ResourceItem widths: folders 12rem/16rem, items 12rem/16rem
	const width = isItems
		? (isMobileSize ? '12rem' : '16rem')
		: (isMobileSize ? '12rem' : '16rem');

	// Icon size matches FolderCard: 6rem (mobile) / 7rem (desktop)
	const iconSize = isMobileSize ? '6rem' : '7rem';

	// Folder skeleton: same card as FolderCard (padding, width, mb, borderRadius) and icon area size
	const folderSkeleton = (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				padding: '1.5rem',
				position: 'relative',
				width,
				mb: '1rem',
				borderRadius: '0.5rem',
			}}>
			{/* Icon area: same size as Folder icon (6rem/7rem), mb 0.5rem */}
			<Box
				sx={{
					position: 'relative',
					width: iconSize,
					height: iconSize,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					mb: '0.5rem',
				}}>
				{/* Folder shape scaled to fit icon area */}
				<Box
					sx={{
						position: 'relative',
						width: '70%',
						height: '70%',
					}}>
					<Skeleton
						variant='rounded'
						sx={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							width: '100%',
							height: '82%',
							borderRadius: '0 0 8px 8px',
						}}
					/>
					<Skeleton
						variant='rounded'
						sx={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '50%',
							height: '50%',
							borderRadius: '6px 6px 0 0',
						}}
					/>
				</Box>
			</Box>
			{/* Name skeleton - 2 lines, full width like FolderCard */}
			<Skeleton
				variant='text'
				sx={{
					width: '100%',
					height: isMobileSize ? '0.8rem' : '0.85rem',
					mb: '0.25rem',
				}}
			/>
			<Skeleton
				variant='text'
				sx={{
					width: '70%',
					height: isMobileSize ? '0.8rem' : '0.85rem',
				}}
			/>
		</Box>
	);

	const itemSkeleton = (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				padding: '1.5rem',
				width,
				mb: '1rem',
			}}>
			<Skeleton
				variant='rectangular'
				sx={{
					width: isMobileSize ? '3.5rem' : '4rem',
					height: isMobileSize ? '3.5rem' : '4rem',
					mb: '0.75rem',
					borderRadius: '4px',
				}}
			/>
			<Skeleton variant='text' sx={{ width: '90%', height: isMobileSize ? '0.8rem' : '0.85rem', mb: '0.25rem' }} />
			<Skeleton variant='text' sx={{ width: '60%', height: isMobileSize ? '0.8rem' : '0.85rem' }} />
		</Box>
	);

	if (isItems) {
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
					<Box key={index}>{itemSkeleton}</Box>
				))}
			</Box>
		);
	}

	// Folders: use same Grid layout as Resources page so skeleton cards align with real folders
	return (
		<Grid container spacing={3} sx={{ mt: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
			{Array.from({ length: rows }).map((_, index) => (
				<Grid item xs={6} sm={4} md={3} lg={2} key={index} display='flex' justifyContent='center'>
					{folderSkeleton}
				</Grid>
			))}
		</Grid>
	);
};

export default ResourcesSkeleton;
