import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Folder, Edit, Delete } from '@mui/icons-material';
import { ResourceFolder } from '../../interfaces/resource';
import { useContext } from 'react';
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
				width: isMobileSize ? '12rem' : '14rem',
				transition: 'all 0.2s ease',
				boxShadow: '0 0 0.85rem 0.1rem rgba(0,0,0,0.2)',
				borderRadius: '0.5rem',
				'&:hover': {
					transform: 'translateY(-2px)',
				},
				mb: '1rem',
			}}
			onClick={onClick}>
			{/* Action Buttons */}
			{hasAdminAccess && (onEdit || onDelete) && (
				<Box
					sx={{
						position: 'absolute',
						top:isMobileSize? '1.5rem' : '1.75rem',
						right: '0.25rem',
						display: 'flex',
						flexDirection: 'column',
						gap:isMobileSize? '0.25rem' : '0.5rem',
						zIndex: 1,
					}}
					onClick={(e) => e.stopPropagation()}>
					{onEdit && (
						<Tooltip title='Edit Folder' placement='right' arrow>
							<IconButton
								size='small'
								onClick={onEdit}
								sx={{
									backgroundColor: 'transparent',
									'&:hover': { backgroundColor: 'action.hover' },
								}}>
								<Edit fontSize='small' sx={{fontSize: isMobileSize? '1.05rem' : '1.25rem'}}/>
							</IconButton>
						</Tooltip>
					)}
					{onDelete && (
						<Tooltip title='Delete Folder' placement='right' arrow>
							<IconButton
								size='small'
								onClick={onDelete}
								sx={{
									backgroundColor: 'transparent',
									'&:hover': { backgroundColor: 'action.hover' },
								}}>
								<Delete fontSize='small' color='error' sx={{fontSize: isMobileSize? '1.05rem' : '1.25rem'}}/>
							</IconButton>
						</Tooltip>
					)}
				</Box>
			)}

			{/* Folder Icon */}
			<Folder
				sx={{
					fontSize: isMobileSize ? '3.5rem' : '5rem',
					color: 'primary.main',
					mb: '0.5rem',
				}}
			/>

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
