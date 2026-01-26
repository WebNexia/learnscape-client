import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { InsertDriveFile, Edit, Delete, PlayCircle } from '@mui/icons-material';
import { ResourceItem } from '../../interfaces/resource';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../hooks/useAuth';

interface ResourceItemCardProps {
	item: ResourceItem;
	onEdit?: (e: React.MouseEvent) => void;
	onDelete?: (e: React.MouseEvent) => void;
	onView?: () => void;
}

const ResourceItemCard = ({ item, onEdit, onDelete, onView }: ResourceItemCardProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { hasAdminAccess } = useAuth();

	const handleClick = () => {
		if (onView && item.url) {
			onView();
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				padding: '1.5rem',
				cursor: onView ? 'pointer' : 'default',
				position: 'relative',
				width: isMobileSize ? '12rem' : '16rem',
				transition: 'all 0.2s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
				},
			}}
			onClick={handleClick}>
			{/* Action Buttons */}
			{hasAdminAccess && (onEdit || onDelete) && (
				<Box
					sx={{
						position: 'absolute',
						top:isMobileSize? '1.5rem' : '1.75rem',
						right: '3rem',
						display: 'flex',
						flexDirection: 'column',
						gap:isMobileSize? '0.25rem' : '0.5rem',
						zIndex: 1,
					}}
					onClick={(e) => e.stopPropagation()}>
					{onEdit && (
						<Tooltip title='Edit' placement='right' arrow>
							<IconButton
								size='small'
								onClick={onEdit}
								sx={{
									backgroundColor: 'transparent',
									'&:hover': { backgroundColor: 'action.hover' },
								}}>
								<Edit fontSize='small' sx={{fontSize: isMobileSize? '1rem' : '1.25rem'}} />
							</IconButton>
						</Tooltip>
					)}
					{onDelete && (
						<Tooltip title='Delete' placement='right' arrow>
							<IconButton
								size='small'
								onClick={onDelete}
								sx={{
									backgroundColor: 'transparent',
									'&:hover': { backgroundColor: 'action.hover' },
								}}>
								<Delete fontSize='small' color='error' sx={{fontSize: isMobileSize? '1rem' : '1.25rem'}} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			)}

			{/* File/Video Icon */}
			{item.type === 'video' ? (
				<PlayCircle
					sx={{
						fontSize: isMobileSize ? '3.5rem' : '5rem',
						color: 'primary.main',
						mb: '0.75rem',
					}}
				/>
			) : (
				<InsertDriveFile
					sx={{
						fontSize: isMobileSize ? '3.5rem' : '5rem',
						color: 'primary.main',
						mb: '0.75rem',
					}}
				/>
			)}

			{/* Item Name */}
			<Typography
				variant='body1'
				sx={{
					textAlign: 'center',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					width: '100%',
					fontSize: isMobileSize ? '0.8rem' : '0.85rem',
				}}>
				{item.title}
			</Typography>
		</Box>
	);
};

export default ResourceItemCard;
