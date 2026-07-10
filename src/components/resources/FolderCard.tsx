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

	const formattedUpdatedAt = folder.updatedAt
		? new Date(folder.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
		: null;
	const itemCountLabel = folder.itemCount === 1 ? '1 file' : `${folder.itemCount ?? 0} files`;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				justifyContent: 'flex-start',
				padding: isMobileSize ? '1rem' : '1.25rem',
				cursor: 'pointer',
				position: 'relative',
				width: isMobileSize ? '12rem' : '16rem',
				backgroundColor: '#FFFFFF',
				border: '1px solid #E2E8F0',
				borderRadius: '12px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
				'&:hover': {
					transform: 'translateY(-3px)',
					boxShadow: '0 10px 24px rgba(15, 23, 42, 0.1)',
					borderColor: '#CBD5E1',
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
						top: '0.5rem',
						right: '0.5rem',
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

			{/* Folder Icon tile */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: isMobileSize ? '2.75rem' : '3rem',
					height: isMobileSize ? '2.75rem' : '3rem',
					borderRadius: '10px',
					backgroundColor: 'rgba(1, 67, 90, 0.06)',
					mb: '0.85rem',
				}}>
				<Folder
					sx={{
						fontSize: isMobileSize ? '1.6rem' : '1.85rem',
						color: 'primary.main',
					}}
				/>
			</Box>

			{/* Folder Name */}
			<Typography
				sx={{
					fontWeight: 600,
					color: '#0F172A',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					display: '-webkit-box',
					WebkitLineClamp: 1,
					WebkitBoxOrient: 'vertical',
					width: '100%',
					fontSize: isMobileSize ? '0.85rem' : '0.95rem',
					mb: '0.35rem',
				}}>
				{folder.name}
			</Typography>

			{/* Metadata */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
				<Typography sx={{ fontSize: isMobileSize ? '0.68rem' : '0.72rem', color: '#64748B' }}>{itemCountLabel}</Typography>
				{formattedUpdatedAt && (
					<>
						<Box sx={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />
						<Typography sx={{ fontSize: isMobileSize ? '0.68rem' : '0.72rem', color: '#64748B' }}>
							Updated {formattedUpdatedAt}
						</Typography>
					</>
				)}
			</Box>
		</Box>
	);
};

export default FolderCard;
