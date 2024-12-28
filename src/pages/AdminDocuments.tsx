import { Box, InputAdornment, Link, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Delete, Edit, Search } from '@mui/icons-material';
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
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const AdminDocuments = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { userId } = useParams();

	const { addNewDocument, sortDocumentsData, sortedDocumentsData, removeDocument, fetchDocuments } = useContext(DocumentsContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [documentsPageNumber, setDocumentsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');

	const pageSize = 50;

	const filteredDocuments = sortedDocumentsData.filter((doc) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return doc?.name?.toLowerCase().includes(lowerSearch);
		}

		return !searchValue;
	});

	const documentsNumberOfPages = Math.ceil(filteredDocuments.length / pageSize);

	const paginatedDocuments = filteredDocuments.slice((documentsPageNumber - 1) * pageSize, documentsPageNumber * pageSize);

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
			fetchDocuments();
		}
	}, []);

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

				fetchDocuments();
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
			fetchDocuments();
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
		<DashboardPagesLayout pageName='Documents' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'flex-end',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
					<Box sx={{ alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : '20rem' }}>
						<CustomTextField
							value={searchValue}
							placeholder={'Search Document'}
							onChange={(e) => {
								setSearchValue(e.target.value);
							}}
							sx={{ backgroundColor: '#fff' }}
							required={false}
							InputProps={{
								endAdornment: (
									<InputAdornment position='end'>
										<Search
											sx={{
												mr: '-0.5rem',
											}}
											fontSize={isMobileSize ? 'small' : 'medium'}
										/>
									</InputAdornment>
								),
							}}
						/>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						width: '100%',
					}}>
					<CustomSubmitButton
						onClick={() => {
							setIsDocumentCreateModalOpen(true);
							setEnterDocUrl(true);
							setFileUploaded(false);
						}}
						sx={{ height: isVerySmallScreen ? '1.75rem' : '2.1rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
						type='button'>
						{isVerySmallScreen ? 'New' : 'New Document'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<CustomDialog
				openModal={isDocumentCreateModalOpen}
				closeModal={() => {
					setIsDocumentCreateModalOpen(false);
					setEnterDocUrl(true);
				}}
				maxWidth='sm'>
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
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
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
						{paginatedDocuments &&
							paginatedDocuments?.map((document: Document, index) => {
								return (
									<TableRow key={document._id}>
										<CustomTableCell value={document.name} />
										<CustomTableCell>
											<Link
												href={document.documentUrl}
												target='_blank'
												rel='noopener noreferrer'
												sx={{ fontSize: isMobileSize ? '0.6rem' : undefined }}>
												{isVerySmallScreen ? truncateText(document.documentUrl, 25) : truncateText(document.documentUrl, 40)}
											</Link>
										</CustomTableCell>

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Rename'
												onClick={() => {
													toggleDocumentEditModal(index);
													openEditDocumentModal(index);
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>

											<CustomDialog
												openModal={editDocumentModalOpen[index]}
												closeModal={() => closeDocumentEditModal(index)}
												maxWidth='sm'
												title='Rename Document'>
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
														fullWidth={false}
														required={true}
														sx={{ margin: '0.75rem 1rem' }}
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
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
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
				<CustomTablePagination count={documentsNumberOfPages} page={documentsPageNumber} onChange={setDocumentsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDocuments;
