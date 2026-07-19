import { Box, Typography, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { InsertDriveFile, Edit, Delete, PlayCircle, MoreVert } from '@mui/icons-material';
import { ResourceItem } from '../../interfaces/resource';
import { useContext, useState } from 'react';
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
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const isMenuOpen = Boolean(menuAnchor);

	const handleClick = () => {
		if (onView && item.url) {
			onView();
		}
	};

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		event.stopPropagation();
		setMenuAnchor(event.currentTarget);
	};

	const handleMenuClose = () => {
		setMenuAnchor(null);
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		handleMenuClose();
		if (onEdit) onEdit(e);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		handleMenuClose();
		if (onDelete) onDelete(e);
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
					'& .menu-button': {
						opacity: 1,
					},
				},
			}}
			onClick={handleClick}>
			{/* Three-dot menu - Google Drive style */}
			{hasAdminAccess && (onEdit || onDelete) && (
				<Box
					sx={{
						position: 'absolute',
						top: isMobileSize ? '1.5rem' : '1.75rem',
						right: isMobileSize ? '1.5rem' : '1.75rem',
						zIndex: 10,
					}}
					onClick={(e) => e.stopPropagation()}>
					<IconButton
						size='small'
						onClick={handleMenuOpen}
						sx={{
							padding: '0.25rem',
							opacity: 0,
							transition: 'opacity 0.2s ease',
							'&:hover': {
								backgroundColor: 'action.hover',
							},
						}}
						className='menu-button'>
						<MoreVert sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem' }} />
					</IconButton>
					<Menu
						anchorEl={menuAnchor}
						open={isMenuOpen}
						onClose={handleMenuClose}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						MenuListProps={{
							'aria-labelledby': 'menu-button',
						}}>
						{onEdit && (
							<MenuItem onClick={handleEdit} sx={{ gap: '0.5rem' }}>
								<Edit fontSize='small' sx={{fontSize: isMobileSize ? '0.85rem' : '0.95rem'}}/>
								<Typography variant='body2' sx={{fontSize: isMobileSize ? '0.7rem' : '0.8rem'}}>Edit</Typography>
							</MenuItem>
						)}
						{onDelete && (
							<MenuItem onClick={handleDelete} sx={{ gap: '0.5rem', color: 'error.main' }}>
								<Delete fontSize='small' sx={{fontSize: isMobileSize ? '0.85rem' : '0.95rem'}}/>
								<Typography variant='body2' sx={{fontSize: isMobileSize ? '0.7rem' : '0.8rem'}}>Delete</Typography>
							</MenuItem>
						)}
					</Menu>
				</Box>
			)}

			{/* File/Video Icon */}
			<Box
				sx={{
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					mb: '0.75rem',
				}}>
				{item.type === 'video' ? (
					<PlayCircle
						sx={{
							fontSize: isMobileSize ? '2.7rem' : '3.9rem',
							color: 'primary.main',
						}}
					/>
				) : (
					<InsertDriveFile
						sx={{
							fontSize: isMobileSize ? '2.7rem' : '3.9rem',
							color: 'primary.main',
						}}
					/>
				)}
			</Box>

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
