import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { ResourceItem } from '../../interfaces/resource';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import HandleDocUploadURL from '../forms/uploadImageVideoDocument/HandleDocUploadURL';

interface CreateResourceItemDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	item: Partial<ResourceItem> | null;
	setItem: (item: Partial<ResourceItem> | null) => void;
	folderId: string;
	isCreating?: boolean;
	duplicateNameError?: string | null;
	onClearError?: () => void;
}

const CreateResourceItemDialog = ({ isOpen, onClose, onSubmit, item, setItem, folderId, isCreating = false, duplicateNameError, onClearError }: CreateResourceItemDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [resourceType, setResourceType] = useState<'file' | 'video'>('file');
	const [fileUploaded, setFileUploaded] = useState<boolean>(false);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true); // Default to URL entry mode

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setResourceType('file');
			setFileUploaded(false);
			setVideoUrl('');
			setEnterDocUrl(true); // Default to URL entry mode
			if (setItem) {
				setItem({ type: 'file', folderId });
			}
		}
	}, [isOpen, folderId, setItem]);

	const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: 'file' | 'video' | null) => {
		if (newType !== null) {
			setResourceType(newType);
			setFileUploaded(false);
			setVideoUrl('');
			setEnterDocUrl(true); // Reset to URL entry mode when switching types
			if (setItem) {
				setItem({ ...item, type: undefined, url: '', title: '' });
			}
		}
	};

	return (
		<CustomDialog title='Add Resource' openModal={isOpen} closeModal={onClose} maxWidth='sm'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.5rem 0' : '0.5rem 1rem' }}>
					{/* Resource Type Toggle */}
					<ToggleButtonGroup
						value={resourceType}
						exclusive
						onChange={handleTypeChange}
						aria-label='resource type'
						sx={{ mb: '1rem', width: '100%' }}>
						<ToggleButton value='file' aria-label='upload file' sx={{ textTransform: 'capitalize' }}>
							Upload File
						</ToggleButton>
						<ToggleButton value='video' aria-label='video url' sx={{ textTransform: 'capitalize' }}>
							Video URL
						</ToggleButton>
					</ToggleButtonGroup>

					{resourceType === 'file' ? (
						<>
							<HandleDocUploadURL
								label=''
								enterDocUrl={enterDocUrl}
								setEnterDocUrl={setEnterDocUrl}
								docFolderName='resources'
								fromAdminDocs={true}
								maxSizeMB={25}
								setDocumentName={(name) => {
									if (item && typeof name === 'string') {
										setItem({ ...item, title: name || item.title, type: 'file' });
									} else if (typeof name === 'string') {
										setItem({ title: name, folderId, type: 'file' });
									}
									if (duplicateNameError && onClearError) {
										onClearError();
									}
								}}
								setFileUploaded={setFileUploaded}
								setDocumentUrl={(url) => {
									if (item && typeof url === 'string') {
										setItem({
											...item,
											type: 'file',
											url,
										});
									} else if (typeof url === 'string') {
										setItem({
											type: 'file',
											url,
											folderId,
										});
									}
								}}
							/>
							{/* Character counter only shown when manually entering doc name (not from file upload) */}
							{enterDocUrl && item?.title && (
								<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>
									{(item?.title || '').length}/50 Characters
								</Typography>
							)}
						</>
					) : (
						<>
							<CustomTextField
								label='Video URL'
								required
								value={videoUrl}
								onChange={(e) => {
									const url = e.target.value;
									setVideoUrl(url);
									if (item) {
										setItem({
											...item,
											type: 'video',
											url: url.trim(),
										});
									} else {
										setItem({
											type: 'video',
											url: url.trim(),
											folderId,
										});
									}
									if (duplicateNameError && onClearError) {
										onClearError();
									}
								}}
								placeholder='https://example.com/video.mp4'
								sx={{ width: '100%', mb: '1rem' }}
							/>
							<CustomTextField
								label='Title'
								required
								value={item?.title || ''}
								onChange={(e) => {
									if (item) {
										setItem({ ...item, title: e.target.value });
									} else {
										setItem({ title: e.target.value, folderId, type: 'video' });
									}
									if (duplicateNameError && onClearError) {
										onClearError();
									}
								}}
								sx={{ width: '100%' }}
								InputProps={{ inputProps: { maxLength: 50 } }}
							/>
							<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>
								{(item?.title || '').length}/50 Characters
							</Typography>
						</>
					)}

					{duplicateNameError && <CustomErrorMessage>{duplicateNameError}</CustomErrorMessage>}
				</Box>
				<CustomDialogActions
					onCancel={onClose}
					submitBtnText={isCreating ? 'Adding...' : 'Add'}
					submitBtnType='submit'
					disableBtn={
						!item?.title?.trim() ||
						!item?.url?.trim() ||
						isCreating ||
						(resourceType === 'file' && !fileUploaded)
					}
					isSubmitting={isCreating}
					actionSx={{ margin: '0rem 0rem 0.5rem 0' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateResourceItemDialog;
