import { Box, Typography } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { ResourceItem } from '../../interfaces/resource';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface EditResourceItemDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	item: ResourceItem | null;
	setItem: (item: ResourceItem | null) => void;
	isUpdating?: boolean;
	duplicateNameError?: string | null;
	onClearError?: () => void;
}

const EditResourceItemDialog = ({ isOpen, onClose, onSubmit, item, setItem, isUpdating = false, duplicateNameError, onClearError }: EditResourceItemDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<CustomDialog title='Edit Resource' openModal={isOpen} closeModal={onClose} maxWidth='xs'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 0.5rem' }}>
					<CustomTextField
						label='Title'
						required
						value={item?.title || ''}
						onChange={(e) => {
							if (item) {
								setItem({ ...item, title: e.target.value });
							}
							if (duplicateNameError && onClearError) {
								onClearError();
							}
						}}
						sx={{ width: '100%', mb: '0.25rem' }}
						InputProps={{ inputProps: { maxLength: 50 } }}
					/>
					<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right', mb: '1rem' }}>
						{(item?.title || '').length}/50 Characters
					</Typography>

					{(item?.type === 'url' || item?.type === 'video') && (
						<CustomTextField
							label={item?.type === 'video' ? 'Video URL' : 'URL'}
							required
							value={item?.url || ''}
							onChange={(e) => {
								if (item) {
									setItem({ ...item, url: e.target.value });
								}
							}}
							sx={{ width: '100%' }}
						/>
					)}

					{duplicateNameError && <CustomErrorMessage>{duplicateNameError}</CustomErrorMessage>}
				</Box>
				<CustomDialogActions
					actionSx={{ margin: '0rem -0.5rem 0.5rem 0' }}
					disableBtn={!item?.title?.trim() || isUpdating}
					isSubmitting={isUpdating}
					submitBtnText={isUpdating ? 'Updating...' : 'Update'}
					submitBtnType='submit'
					onCancel={onClose}
				/>
			</form>
		</CustomDialog>
	);
};

export default EditResourceItemDialog;
