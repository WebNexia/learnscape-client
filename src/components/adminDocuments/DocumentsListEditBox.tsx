import { Box, Link, Typography } from '@mui/material';
import React, { useContext } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { Document } from '../../interfaces/document';
import { decodeHtmlEntities } from '../../utils/utilText';
import { DocumentUpdateTrack } from '../../pages/AdminLessonEditPage';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface DocumentsListEditBoxProps {
	documentsSource: Document[] | undefined;
	toggleDocRenameModal: (index: number, document: Document) => void;
	closeDocRenameModal: (index: number, document: Document) => void;
	isDocRenameModalOpen: boolean[];
	saveDocRename: (index: number) => void;
	removeDocOnClick: (document: Document) => void;
	renameDocOnChange: (e: React.ChangeEvent<HTMLInputElement>, document: Document) => void;
	setIsDocumentUpdated: React.Dispatch<React.SetStateAction<DocumentUpdateTrack[]>>;
	setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const DocumentsListEditBox = ({
	documentsSource,
	toggleDocRenameModal,
	closeDocRenameModal,
	isDocRenameModalOpen,
	saveDocRename,
	removeDocOnClick,
	renameDocOnChange,
	setIsDocumentUpdated,
	setHasUnsavedChanges,
}: DocumentsListEditBoxProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Box sx={{ marginBottom: isMobileSize ? '3rem' : '5rem' }}>
			{documentsSource &&
				documentsSource?.length > 0 &&
				documentsSource
					?.filter(
						(document: Document) =>
							document !== null && document?.createdByName !== ' ' && document?.name && document?.name.trim() !== '' && document?._id
					)
					?.map((document, index) => (
						<Box
							key={index}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								mb: '1rem',
								width: '100%',
							}}>
							<Box sx={{ mb: '0.25rem' }}>
								<Link
									href={document?.documentUrl}
									target='_blank'
									rel='noopener noreferrer'
									variant='body2'
									sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{decodeHtmlEntities(document?.name || '')}
								</Link>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Typography
									variant='body2'
									sx={{
										'mr': '0.5rem',
										':hover': {
											textDecoration: 'underline',
											cursor: 'pointer',
										},
										'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
									}}
									onClick={() => removeDocOnClick(document)}>
									Remove
								</Typography>
								<Typography
									variant='body2'
									onClick={() => toggleDocRenameModal(index, document)}
									sx={{
										':hover': {
											textDecoration: 'underline',
											cursor: 'pointer',
										},
										'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
									}}>
									Rename
								</Typography>
								<CustomDialog openModal={isDocRenameModalOpen[index] || false} closeModal={() => closeDocRenameModal(index, document)} maxWidth='xs'>
									<form
										style={{ display: 'flex', flexDirection: 'column', paddingTop: '1.5rem' }}
										onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
											e.preventDefault();
										}}>
										<CustomTextField
											fullWidth={false}
											required={true}
											label='Rename Document'
											value={document.name}
											sx={{ margin: '1rem' }}
											onChange={(e) => renameDocOnChange(e, document)}
										/>

										<CustomDialogActions
											onCancel={() => closeDocRenameModal(index, document)}
											submitBtnText='Save'
											submitBtnType='button'
											actionSx={{ mt: '0.5rem', mb: '0.5rem' }}
											onSubmit={() => {
												saveDocRename(index);
												setIsDocumentUpdated((prevData) => {
													if (prevData) {
														return prevData?.map((data) => {
															if (data.documentId === document._id) {
																return { ...data, isUpdated: true };
															}
															return data;
														});
													}
													return prevData;
												});
												setHasUnsavedChanges(true);
											}}
											disableBtn={!document.name || document.name.trim() === ''}
										/>
									</form>
								</CustomDialog>
							</Box>
						</Box>
					))}
		</Box>
	);
};

export default DocumentsListEditBox;
