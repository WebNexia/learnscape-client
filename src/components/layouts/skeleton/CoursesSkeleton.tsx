import { Box, Card, CardContent, Skeleton } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CoursesSkeletonProps {
	rows?: number;
}

const CoursesSkeleton = ({ rows = 6 }: CoursesSkeletonProps) => {
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotated;

	return (
		<Box
			sx={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'center',
				margin: '0 2rem 2rem 2rem',
			}}>
			{Array.from({ length: rows }).map((_, index) => (
				<Card
					key={index}
					sx={{
						height: isMobileSize ? '21rem' : '25rem',
						width: isMobileSize ? '15rem' : '19rem',
						borderRadius: '0.65rem',
						margin: '0 1rem 2rem 1rem',
						boxShadow: '0.1rem 0rem 0.4rem 0.1rem rgba(0,0,0,0.15)',
					}}>
					{/* Course Image Skeleton */}
					<Skeleton
						variant='rectangular'
						sx={{
							height: isMobileSize ? '7rem' : '10rem',
							width: '100%',
							borderRadius: '0.65rem 0.65rem 0 0',
						}}
					/>

					<CardContent sx={{ padding: '1rem 1.5rem' }}>
						{/* Course Title Skeleton */}
						<Skeleton
							variant='text'
							sx={{
								fontSize: isMobileSize ? '0.8rem' : '0.9rem',
								textAlign: 'center',
								mb: 1,
								height: isMobileSize ? '1.2rem' : '1.4rem',
							}}
						/>

						{/* Course Description Skeleton - Multiple lines */}
						<Skeleton
							variant='text'
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								mb: 0.5,
								height: isMobileSize ? '0.9rem' : '1rem',
							}}
						/>
						<Skeleton
							variant='text'
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								mb: 0.5,
								height: isMobileSize ? '0.9rem' : '1rem',
							}}
						/>
						<Skeleton
							variant='text'
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
								mb: 0.5,
								height: isMobileSize ? '0.9rem' : '1rem',
								width: '70%', // Shorter last line
							}}
						/>
					</CardContent>

					{/* Bottom section with progress and price */}
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							width: '100%',
							position: 'absolute',
							bottom: 0,
							p: '1rem 1.5rem',
						}}>
						{/* Progress bar skeleton */}
						<Skeleton
							variant='rectangular'
							sx={{
								height: '0.5rem',
								width: '90%',
								borderRadius: '0.25rem',
								mb: 1,
							}}
						/>

						{/* Price skeleton */}
						<Skeleton
							variant='text'
							sx={{
								fontSize: isMobileSize ? '0.8rem' : '0.9rem',
								height: isMobileSize ? '1.1rem' : '1.3rem',
								width: '40%',
								alignSelf: 'flex-end',
							}}
						/>
					</Box>
				</Card>
			))}
		</Box>
	);
};

export default CoursesSkeleton;
