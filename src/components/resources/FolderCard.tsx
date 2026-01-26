import { Box, Typography, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { Folder, Edit, Delete, MoreVert } from '@mui/icons-material';
import { ResourceFolder } from '../../interfaces/resource';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { useAuth } from '../../hooks/useAuth';

interface FolderCardProps {
	folder: ResourceFolder;
	onClick: () => void;
	onEdit?: (e: React.MouseEvent) => void;
	onDelete?: (e: React.MouseEvent) => void;
}

const FolderCard = ({ folder, onClick, onEdit, onDelete }: FolderCardProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { hasAdminAccess } = useAuth();
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const isMenuOpen = Boolean(menuAnchor);

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
				cursor: 'pointer',
				position: 'relative',
				width: isMobileSize ? '12rem' : '16rem',
				transition: 'all 0.2s ease',
				borderRadius: '0.5rem',
				'&:hover': {
					transform: 'translateY(-2px)',
					'& .menu-button': {
						opacity: 1,
					},
				},
				mb: '1rem',
			}}
			onClick={onClick}>
			{/* Three-dot menu - Google Drive style */}
			{hasAdminAccess && (onEdit || onDelete) && (
				<Box
					sx={{
						position: 'absolute',
						top: isMobileSize ? '1.75rem' : '1.75rem',
						right: isMobileSize ? '1rem' : '0.75rem',
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
								<Typography variant='body2' sx={{fontSize:isMobileSize? '0.7rem': '0.8rem'}}>Edit</Typography>
							</MenuItem>
						)}
						{onDelete && (
							<MenuItem onClick={handleDelete} sx={{ gap: '0.5rem', color: 'error.main' }}>
								<Delete fontSize='small' sx={{fontSize: isMobileSize ? '0.85rem' : '0.95rem'}}/>
								<Typography variant='body2' sx={{fontSize:isMobileSize? '0.7rem': '0.8rem'}}>Delete</Typography>
							</MenuItem>
						)}
					</Menu>
				</Box>
			)}

			{/* Folder Icon */}
			<Box
				sx={{
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					mb: '0.5rem',
					'&:hover ~ .menu-button, & ~ .menu-button:hover': {
						opacity: 1,
					},
				}}>
				<Folder
					sx={{
						fontSize: isMobileSize ? '6rem' : '7rem',
						color: 'primary.main',
					}}
				/>
			</Box>	

			{/* Folder Name */}
			<Typography
				variant='body2'
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
				{folder.name}
			</Typography>
		</Box>
	);
};

export default FolderCard;
