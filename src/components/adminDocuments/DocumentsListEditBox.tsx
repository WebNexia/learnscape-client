import { Box, Link, Typography } from '@mui/material';
import React from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { Lesson } from '../../interfaces/lessons';
import { SingleCourse } from '../../interfaces/course';
import { Document } from '../../interfaces/document';
import { DocumentUpdateTrack } from '../../pages/AdminLessonEditPage';

interface DocumentsListEditBoxProps {
	documentsSource: Lesson | (SingleCourse | undefined);
	toggleDocRenameModal: (index: number, document: Document) => void;
	closeDocRenameModal: (index: number, document: Document) => void;
	isDocRenameModalOpen: boolean[];
	saveDocRename: (index: number) => void;
	removeDocOnClick: (document: Document) => void;
	renameDocOnChange: (e: React.ChangeEvent<HTMLInputElement>, document: Document) => void;
	setIsDocumentUpdated: React.Dispatch<React.SetStateAction<DocumentUpdateTrack[]>>;
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
}: DocumentsListEditBoxProps) => {
	return (
		<Box sx={{ marginBottom: '5rem' }}>
			{documentsSource?.documents &&
				documentsSource.documents
					.filter((document) => document !== null)
					.map((document, index) => (
						<Box
							key={index}
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								mb: '1rem',
								width: '30%',
							}}>
							<Box sx={{ mb: '0.25rem' }}>
								<Link href={document.documentUrl} target='_blank' rel='noopener noreferrer' variant='body2'>
									{document.name}
								</Link>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Typography
									variant='body2'
									sx={{
										mr: '0.5rem',
										':hover': {
											textDecoration: 'underline',
											cursor: 'pointer',
										},
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
									}}>
									Rename
								</Typography>
								<CustomDialog openModal={isDocRenameModalOpen[index]} closeModal={() => closeDocRenameModal(index, document)}>
									<form
										style={{ display: 'flex', flexDirection: 'column' }}
										onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
											e.preventDefault();
										}}>
										<CustomTextField
											fullWidth={false}
											required={true}
											label='Rename Document'
											value={document.name}
											sx={{ margin: '2rem 1rem 3rem 1rem' }}
											onChange={(e) => renameDocOnChange(e, document)}
										/>
										<CustomDialogActions
											onCancel={() => closeDocRenameModal(index, document)}
											submitBtnText='Save'
											submitBtnType='button'
											actionSx={{ mt: '1rem' }}
											onSubmit={() => {
												saveDocRename(index);
												setIsDocumentUpdated((prevData) => {
													if (prevData) {
														return prevData.map((data) => {
															if (data.documentId === document._id) {
																return { ...data, isUpdated: true };
															}
															return data;
														});
													}
													return prevData;
												});
											}}
											disableBtn={document.name.trim() === ''}
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
