import { Box, FormControlLabel, Checkbox, Typography, Grid } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import HandleDocUploadURL from '../forms/uploadImageVideoDocument/HandleDocUploadURL';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../forms/uploadImageVideoDocument/ImageThumbnail';
import CustomTextField from '../forms/customFields/CustomTextField';
import { Document, Price } from '../../interfaces/document';
import { Dispatch, SetStateAction, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface EditDocumentDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	document: Document | null;
	setDocument: (doc: Document | null) => void;
	enterDocUrl: boolean;
	setEnterDocUrl: Dispatch<SetStateAction<boolean>>;
	enterDocImageUrl: boolean;
	setEnterDocImageUrl: Dispatch<SetStateAction<boolean>>;
	enterSamplePageImageUrl: boolean;
	setEnterSamplePageImageUrl: Dispatch<SetStateAction<boolean>>;
	fileUploaded: boolean;
	setFileUploaded: Dispatch<SetStateAction<boolean>>;
	isFree: boolean;
	setIsFree: Dispatch<SetStateAction<boolean>>;
	GBP: Price;
	setGBP: (price: Price) => void;
	USD: Price;
	setUSD: (price: Price) => void;
	EUR: Price;
	setEUR: (price: Price) => void;
	TRY: Price;
	setTRY: (price: Price) => void;
	isUpdating?: boolean;
}

const EditDocumentDialog = ({
	isOpen,
	onClose,
	onSubmit,
	document,
	setDocument,
	enterDocUrl,
	setEnterDocUrl,
	enterDocImageUrl,
	setEnterDocImageUrl,
	enterSamplePageImageUrl,
	setEnterSamplePageImageUrl,
	fileUploaded,
	setFileUploaded,
	isFree,
	setIsFree,
	GBP,
	setGBP,
	USD,
	setUSD,
	EUR,
	setEUR,
	TRY,
	setTRY,
	isUpdating = false,
}: EditDocumentDialogProps) => {
	const { isInstructor } = useAuth();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<CustomDialog title='Edit Document' openModal={isOpen} closeModal={onClose} maxWidth='lg'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<HandleDocUploadURL
						enterDocUrl={enterDocUrl}
						setEnterDocUrl={setEnterDocUrl}
						docFolderName='Materials'
						fromAdminDocs={true}
						setDocumentUrl={(url) => {
							if (document) {
								setDocument({ ...document, documentUrl: typeof url === 'string' ? url : '' });
							}
						}}
						setDocumentName={(name) => {
							if (document) {
								setDocument({ ...document, name: typeof name === 'string' ? name : '' });
							}
						}}
						setFileUploaded={setFileUploaded}
						initialDocumentUrl={document?.documentUrl}
						initialDocumentName={document?.name}
					/>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row' }}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: isMobileSize ? 'column' : 'row',
							margin: isMobileSize ? '1rem 0' : '1rem 1rem',
							justifyContent: 'space-between',
							alignItems: isMobileSize ? 'center' : 'flex-start',
							flex: 1,
						}}>
						<Box sx={{ flex: 1, width: isMobileSize ? '100%' : undefined }}>
							<HandleImageUploadURL
								label='Cover Image'
								onImageUploadLogic={(url) => {
									if (document) {
										setDocument({ ...document, imageUrl: url });
									}
								}}
								onChangeImgUrl={(e) => {
									if (document) {
										setDocument({ ...document, imageUrl: e.target.value });
									}
								}}
								imageUrlValue={document?.imageUrl || ''}
								imageFolderName='DocumentImages'
								enterImageUrl={enterDocImageUrl}
								setEnterImageUrl={setEnterDocImageUrl}
							/>
						</Box>
						<Box sx={{ ml: isMobileSize ? '0rem' : '3rem' }}>
							<ImageThumbnail
								imgSource={document?.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Document+Cover'}
								removeImage={() => {
									if (document) {
										setDocument({ ...document, imageUrl: '' });
									}
								}}
								boxStyle={{ width: '8rem', height: '8rem' }}
								imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
							/>
						</Box>
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: isMobileSize ? 'column' : 'row',
							margin: isMobileSize ? '1rem 0' : '1rem 1rem 1rem 6rem',
							justifyContent: 'space-between',
							alignItems: isMobileSize ? 'center' : 'flex-start',
							flex: 1,
						}}>
						<Box sx={{ flex: 1, width: isMobileSize ? '100%' : undefined }}>
							<HandleImageUploadURL
								label='Sample Page Image'
								onImageUploadLogic={(url) => {
									if (document) {
										setDocument({ ...document, samplePageImageUrl: url });
									}
								}}
								onChangeImgUrl={(e) => {
									if (document) {
										setDocument({ ...document, samplePageImageUrl: e.target.value });
									}
								}}
								imageUrlValue={document?.samplePageImageUrl || ''}
								imageFolderName='DocumentImages'
								enterImageUrl={enterSamplePageImageUrl}
								setEnterImageUrl={setEnterSamplePageImageUrl}
							/>
						</Box>
						<Box sx={{ ml: isMobileSize ? '0rem' : '3rem' }}>
							<ImageThumbnail
								imgSource={document?.samplePageImageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Sample+Page'}
								removeImage={() => {
									if (document) {
										setDocument({ ...document, samplePageImageUrl: '' });
									}
								}}
								boxStyle={{ width: '8rem', height: '8rem' }}
								imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
							/>
						</Box>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isMobileSize ? 'column' : 'row',
						margin: isMobileSize ? '1rem 0' : '1rem',
						alignItems: isMobileSize ? 'flex-start' : 'flex-end',
					}}>
					<Box sx={{ flex: 1, width: isMobileSize ? '100%' : undefined }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '0.5rem' }}>
							<Typography variant='h6'>Prices</Typography>
							<FormControlLabel
								control={
									<Checkbox
										checked={isFree}
										onChange={(e) => {
											setIsFree(e.target.checked);
											if (e.target.checked) {
												setGBP({ currency: 'gbp', amount: '0' });
												setUSD({ currency: 'usd', amount: '0' });
												setEUR({ currency: 'eur', amount: '0' });
												setTRY({ currency: 'try', amount: '0' });
											}
										}}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: '1rem',
											},
										}}
									/>
								}
								label='Free Document'
								sx={{
									'mr': '0rem',
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.7rem' : '0.75rem',
									},
								}}
								disabled={isInstructor}
							/>
						</Box>

						<Grid container spacing={2}>
							<Grid item xs={6} sx={{ width: isMobileSize ? '100%' : undefined }}>
								<CustomTextField
									label='GBP'
									value={isFree ? '0' : GBP.amount}
									onChange={(e) => {
										const value = e.target.value;
										if (value === '' || parseFloat(value) >= 0) {
											setGBP({ currency: 'gbp', amount: value });
										}
									}}
									type='number'
									disabled={isFree || isInstructor}
									sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
									InputLabelProps={{
										sx: { fontSize: '0.8rem' },
									}}
									InputProps={{
										inputProps: { min: 0 },
									}}
								/>
							</Grid>
							<Grid item xs={6}>
								<CustomTextField
									label='USD'
									value={isFree ? '0' : USD.amount}
									onChange={(e) => {
										const value = e.target.value;
										if (value === '' || parseFloat(value) >= 0) {
											setUSD({ currency: 'usd', amount: value });
										}
									}}
									type='number'
									disabled={isFree || isInstructor}
									sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
									InputLabelProps={{
										sx: { fontSize: '0.8rem' },
									}}
									InputProps={{
										inputProps: { min: 0 },
									}}
								/>
							</Grid>
							<Grid item xs={6}>
								<CustomTextField
									label='EUR'
									value={isFree ? '0' : EUR.amount}
									onChange={(e) => {
										const value = e.target.value;
										if (value === '' || parseFloat(value) >= 0) {
											setEUR({ currency: 'eur', amount: value });
										}
									}}
									type='number'
									disabled={isFree || isInstructor}
									sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
									InputLabelProps={{
										sx: { fontSize: '0.8rem' },
									}}
									InputProps={{
										inputProps: { min: 0 },
									}}
								/>
							</Grid>
							<Grid item xs={6}>
								<CustomTextField
									label='TRY'
									value={isFree ? '0' : TRY.amount}
									onChange={(e) => {
										const value = e.target.value;
										if (value === '' || parseFloat(value) >= 0) {
											setTRY({ currency: 'try', amount: value });
										}
									}}
									type='number'
									disabled={isFree || isInstructor}
									sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
									InputLabelProps={{
										sx: { fontSize: '0.8rem' },
									}}
									InputProps={{
										inputProps: { min: 0 },
									}}
								/>
							</Grid>
						</Grid>
					</Box>
					<Box sx={{ flex: 1, ml: isMobileSize ? '0rem' : '7rem', mt: isMobileSize ? '1rem' : undefined, width: isMobileSize ? '100%' : undefined }}>
						<CustomTextField
							label='Description'
							value={document?.description || ''}
							onChange={(e) => {
								if (document) {
									setDocument({ ...document, description: e.target.value });
								}
							}}
							multiline
							required={false}
							rows={5}
							sx={{ backgroundColor: '#fff' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
							InputProps={{
								inputProps: {
									maxLength: 100,
								},
							}}
						/>
						<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
							{document?.description.length}/100 Characters
						</Typography>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: isMobileSize ? 'space-between' : 'flex-end', margin: isMobileSize ? '0rem 0' : '0 1rem' }}>
					<Box sx={{ flex: 1, display: isMobileSize ? 'none' : 'block' }}></Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1, ml: isMobileSize ? '0rem' : '7rem' }}>
						<Box>
							<CustomTextField
								label='Page Count'
								type='number'
								value={document?.pageCount || ''}
								onChange={(e) => {
									if (document) {
										setDocument({ ...document, pageCount: +e.target.value });
									}
								}}
								sx={{ backgroundColor: '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
							/>
						</Box>
						<Box>
							<FormControlLabel
								control={
									<Checkbox
										checked={document?.isOnLandingPage}
										onChange={(e) => {
											if (document) {
												setDocument({ ...document, isOnLandingPage: e.target.checked });
											}
										}}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: '1rem',
											},
										}}
										disabled={isInstructor}
									/>
								}
								label='Display on Landing Page'
								sx={{
									'mr': '0rem',
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.7rem' : '0.75rem',
									},
								}}
							/>
						</Box>
					</Box>
				</Box>
				<CustomDialogActions
					onCancel={onClose}
					disableCancelBtn={isUpdating}
					submitBtnType='submit'
					actionSx={{ mt: '1rem' }}
					disableBtn={!fileUploaded || isUpdating}
					submitBtnText={isUpdating ? 'Saving...' : 'Save'}
				/>
			</form>
		</CustomDialog>
	);
};

export default EditDocumentDialog;
