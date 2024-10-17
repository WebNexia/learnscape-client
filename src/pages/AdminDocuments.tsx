import { Box, Link, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Delete, Edit } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { DocumentsContext } from '../contexts/DocumentsContextProvider';
import { Document } from '../interfaces/document';
import { truncateText } from '../utils/utilText';
import HandleDocUploadURL from '../components/forms/uploadImageVideoDocument/HandleDocUploadURL';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useParams } from 'react-router-dom';
import CustomTextField from '../components/forms/customFields/CustomTextField';

const AdminDocuments = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const {
		addNewDocument,
		sortDocumentsData,
		sortedDocumentsData,
		removeDocument,
		numberOfPages,
		documentsPageNumber,
		setDocumentsPageNumber,
		fetchDocuments,
	} = useContext(DocumentsContext);

	const { orgId } = useContext(OrganisationContext);
	const { userId } = useParams();

	const [orderBy, setOrderBy] = useState<keyof Document>('name');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Document) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortDocumentsData(property, isAsc ? 'desc' : 'asc');
	};

	const [isDocumentDeleteModalOpen, setIsDocumentDeleteModalOpen] = useState<boolean[]>([]);
	const [editDocumentModalOpen, setEditDocumentModalOpen] = useState<boolean[]>([]);
	const [isDocumentCreateModalOpen, setIsDocumentCreateModalOpen] = useState<boolean>(false);

	const [singleDocument, setSingleDocument] = useState<Document | null>(null);

	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);

	const [documentUrl, setDocumentUrl] = useState<string>('');
	const [documentName, setDocumentName] = useState<string>('');
	const [fileUploaded, setFileUploaded] = useState<boolean>(false);

	useEffect(() => {
		setDocumentsPageNumber(1);
	}, []);

	useEffect(() => {
		setIsDocumentDeleteModalOpen(Array(sortedDocumentsData.length).fill(false));
		setEditDocumentModalOpen(Array(sortedDocumentsData.length).fill(false));
	}, [sortedDocumentsData, documentsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchDocuments(documentsPageNumber);
		}
	}, [documentsPageNumber]);

	const createDocument = async (): Promise<void> => {
		try {
			const documentResponse = await axios.post(`${base_url}/documents`, {
				name: documentName.trim(),
				documentUrl,
				userId,
				orgId,
			});

			addNewDocument({
				_id: documentResponse.data._id,
				name: documentName.trim(),
				documentUrl,
				userId,
				orgId,
			});
		} catch (error) {
			console.log(error);
		}
	};

	const handleDocUpdate = async (): Promise<void> => {
		if (singleDocument) {
			try {
				axios.patch(`${base_url}/documents/${singleDocument._id}`, {
					name: singleDocument.name.trim(),
				});

				fetchDocuments(documentsPageNumber);
				setSingleDocument(null);
			} catch (error) {
				console.log(error);
			}
		}
	};

	const deleteDocument = async (documentId: string): Promise<void> => {
		try {
			removeDocument(documentId);
			await axios.delete(`${base_url}/documents/${documentId}`);
			fetchDocuments(documentsPageNumber);
		} catch (error) {
			console.log(error);
		}
	};

	const openDeleteDocumentModal = (index: number) => {
		const updatedState = [...isDocumentDeleteModalOpen];
		updatedState[index] = true;
		setIsDocumentDeleteModalOpen(updatedState);
	};
	const closeDeleteDocumentModal = (index: number) => {
		const updatedState = [...isDocumentDeleteModalOpen];
		updatedState[index] = false;
		setIsDocumentDeleteModalOpen(updatedState);
	};

	// Function to toggle edit modal for a specific doc
	const toggleDocumentEditModal = (index: number) => {
		const newEditModalOpen = [...editDocumentModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setEditDocumentModalOpen(newEditModalOpen);
	};

	const openEditDocumentModal = (index: number) => {
		const documentToEdit = sortedDocumentsData[index];
		setSingleDocument(documentToEdit);
		toggleDocumentEditModal(index);
	};

	const closeDocumentEditModal = (index: number) => {
		const newEditModalOpen = [...editDocumentModalOpen];
		newEditModalOpen[index] = false;
		setEditDocumentModalOpen(newEditModalOpen);
	};

	return (
		<DashboardPagesLayout pageName='Documents' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton
					onClick={() => {
						setIsDocumentCreateModalOpen(true);
						setEnterDocUrl(true);
						setFileUploaded(false);
					}}
					type='button'>
					New Document
				</CustomSubmitButton>
			</Box>

			<CustomDialog
				openModal={isDocumentCreateModalOpen}
				closeModal={() => {
					setIsDocumentCreateModalOpen(false);
					setEnterDocUrl(true);
				}}>
				<form
					onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						createDocument();
						setIsDocumentCreateModalOpen(false);
					}}
					style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
					<Box sx={{ margin: '0 1rem' }}>
						<HandleDocUploadURL
							enterDocUrl={enterDocUrl}
							setEnterDocUrl={setEnterDocUrl}
							docFolderName='Materials'
							fromAdminDocs={true}
							setDocumentUrl={setDocumentUrl}
							setDocumentName={setDocumentName}
							setFileUploaded={setFileUploaded}
						/>
					</Box>
					<CustomDialogActions
						onCancel={() => setIsDocumentCreateModalOpen(false)}
						submitBtnType='submit'
						disableBtn={!fileUploaded}
						actionSx={{ mt: '1rem' }}
					/>
				</form>
			</CustomDialog>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '1rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<Document>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'name', label: 'Document Name' },
							{ key: 'documentId', label: 'Document URL' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedDocumentsData &&
							sortedDocumentsData?.map((document: Document, index) => {
								return (
									<TableRow key={document._id}>
										<CustomTableCell value={document.name} />
										<CustomTableCell>
											<Link href={document.documentUrl} target='_blank' rel='noopener noreferrer'>
												{truncateText(document.documentUrl, 40)}
											</Link>
										</CustomTableCell>

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													toggleDocumentEditModal(index);
													openEditDocumentModal(index);
												}}
												icon={<Edit fontSize='small' />}
											/>

											<CustomDialog openModal={editDocumentModalOpen[index]} closeModal={() => closeDocumentEditModal(index)} maxWidth='sm'>
												<form
													style={{ display: 'flex', flexDirection: 'column' }}
													onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
														e.preventDefault();
														if (singleDocument?.name && singleDocument.name.trim()) {
															handleDocUpdate();
															closeDocumentEditModal(index);
														}
													}}>
													<CustomTextField
														label='Rename Document'
														fullWidth={false}
														required={true}
														sx={{ margin: '2rem 1rem' }}
														value={singleDocument?.name}
														onChange={(e) => {
															if (singleDocument) {
																setSingleDocument({ ...singleDocument, name: e.target.value });
															}
														}}
													/>
													<CustomDialogActions
														onCancel={() => closeDocumentEditModal(index)}
														submitBtnText='Rename'
														actionSx={{ mt: '1rem' }}
														submitBtnType='submit'
													/>
												</form>
											</CustomDialog>

											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteDocumentModal(index);
												}}
												icon={<Delete fontSize='small' />}
											/>
											{isDocumentDeleteModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isDocumentDeleteModalOpen[index]}
													closeModal={() => closeDeleteDocumentModal(index)}
													title='Delete Document'
													content='Are you sure you want to delete this document?'
													maxWidth='sm'>
													<CustomDialogActions
														onCancel={() => {
															closeDeleteDocumentModal(index);
															setEnterDocUrl(true);
														}}
														deleteBtn={true}
														onDelete={() => {
															deleteDocument(document._id);
															closeDeleteDocumentModal(index);
														}}
													/>
												</CustomDialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={numberOfPages} page={documentsPageNumber} onChange={setDocumentsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDocuments;
