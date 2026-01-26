import { Box, Typography } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { ResourceFolder } from '../../interfaces/resource';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface CreateResourceFolderDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	folder: Partial<ResourceFolder> | null;
	setFolder: (folder: Partial<ResourceFolder> | null) => void;
	isCreating?: boolean;
}

const CreateResourceFolderDialog = ({ isOpen, onClose, onSubmit, folder, setFolder, isCreating = false }: CreateResourceFolderDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<CustomDialog title='Create New Folder' openModal={isOpen} closeModal={onClose} maxWidth='xs'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.5rem 0' : '0.5rem 1rem' }}>
					<CustomTextField
						label='Folder Name'
						required
						value={folder?.name || ''}
						onChange={(e) => {
							if (folder) {
								setFolder({ ...folder, name: e.target.value });
							} else {
								setFolder({ name: e.target.value });
							}
						}}
						sx={{ width: '100%' }}
						InputProps={{ inputProps: { maxLength: 25 } }}
					/>
					<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>{folder?.name?.length}/25 Characters</Typography>
				</Box>
				<CustomDialogActions
					onCancel={onClose}
					submitBtnText={isCreating ? 'Creating...' : 'Create'}
					submitBtnType='submit'
					disableBtn={!folder?.name?.trim() || isCreating}
					isSubmitting={isCreating}
					actionSx={{ margin: '0.5rem 0rem 0.5rem 0' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateResourceFolderDialog;
