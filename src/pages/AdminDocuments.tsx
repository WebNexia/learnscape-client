import { Box, InputAdornment, Link, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Delete, Edit, Info, Search } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { DocumentsContext } from '../contexts/DocumentsContextProvider';
import { Document, Price } from '../interfaces/document';
import { truncateText } from '../utils/utilText';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useParams } from 'react-router-dom';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import { useTheme } from '@mui/material/styles';
import DocumentInfoModal from '../components/documents/DocumentInfoModal';
import CreateNewDocumentDialog from '../components/documents/CreateNewDocumentDialog';
import EditDocumentDialog from '../components/documents/EditDocumentDialog';

const AdminDocuments = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { userId } = useParams();

	const { addNewDocument, sortDocumentsData, sortedDocumentsData, removeDocument, fetchDocuments, updateDocuments } = useContext(DocumentsContext);

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
	const [isDocumentInfoModalOpen, setIsDocumentInfoModalOpen] = useState<boolean[]>([]);
	const [isDocumentCreateModalOpen, setIsDocumentCreateModalOpen] = useState<boolean>(false);

	const [singleDocument, setSingleDocument] = useState<Document | null>(null);

	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);
	const [enterDocImageUrl, setEnterDocImageUrl] = useState<boolean>(true);
	const [enterSamplePageImageUrl, setEnterSamplePageImageUrl] = useState<boolean>(true);

	const [fileUploaded, setFileUploaded] = useState<boolean>(false);
	const [isFree, setIsFree] = useState<boolean>(false);
	const [GBP, setGBP] = useState<Price>({ currency: 'gbp', amount: '0' });
	const [USD, setUSD] = useState<Price>({ currency: 'usd', amount: '0' });
	const [EUR, setEUR] = useState<Price>({ currency: 'eur', amount: '0' });
	const [TRY, setTRY] = useState<Price>({ currency: 'try', amount: '0' });

	const theme = useTheme();

	useEffect(() => {
		setDocumentsPageNumber(1);
	}, []);

	useEffect(() => {
		setIsDocumentDeleteModalOpen(Array(sortedDocumentsData.length).fill(false));
		setEditDocumentModalOpen(Array(sortedDocumentsData.length).fill(false));
		setIsDocumentInfoModalOpen(Array(sortedDocumentsData.length).fill(false));
	}, [sortedDocumentsData, documentsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchDocuments();
		}
	}, []);

	const resetForm = () => {
		setIsDocumentCreateModalOpen(false);
		setEnterDocUrl(true);
		setEnterDocImageUrl(true);
		setEnterSamplePageImageUrl(true);
		setSingleDocument(null);
		setGBP({ currency: 'gbp', amount: '0' });
		setUSD({ currency: 'usd', amount: '0' });
		setEUR({ currency: 'eur', amount: '0' });
		setTRY({ currency: 'try', amount: '0' });
		setIsFree(false);
		setFileUploaded(false);
	};

	const createDocument = async (): Promise<void> => {
		try {
			const prices: Price[] = [
				{ currency: 'gbp', amount: isFree ? 'Free' : GBP.amount },
				{ currency: 'usd', amount: isFree ? 'Free' : USD.amount },
				{ currency: 'eur', amount: isFree ? 'Free' : EUR.amount },
				{ currency: 'try', amount: isFree ? 'Free' : TRY.amount },
			];

			const documentResponse = await axios.post(`${base_url}/documents`, {
				name: singleDocument?.name.trim(),
				documentUrl: singleDocument?.documentUrl,
				userId,
				orgId,
				imageUrl: singleDocument?.imageUrl,
				samplePageImageUrl: singleDocument?.samplePageImageUrl,
				isOnLandingPage: singleDocument?.isOnLandingPage,
				prices,
				description: singleDocument?.description,
				pageCount: singleDocument?.pageCount,
			});

			const documentResponseData = documentResponse.data;

			addNewDocument({
				_id: documentResponseData._id,
				name: singleDocument?.name.trim(),
				documentUrl: singleDocument?.documentUrl,
				userId,
				orgId,
				imageUrl: singleDocument?.imageUrl,
				samplePageImageUrl: singleDocument?.samplePageImageUrl,
				isOnLandingPage: singleDocument?.isOnLandingPage,
				prices,
				description: singleDocument?.description,
				pageCount: singleDocument?.pageCount,
				createdAt: documentResponseData.createdAt,
				createdByImageUrl: documentResponseData.createdByImageUrl,
				createdByName: documentResponseData.createdByName,
				createdByRole: documentResponseData.createdByRole,
				updatedAt: documentResponseData.updatedAt,
				updatedByImageUrl: documentResponseData.updatedByImageUrl,
				updatedByName: documentResponseData.updatedByName,
				updatedByRole: documentResponseData.updatedByRole,
			});
		} catch (error) {
			console.log(error);
		}
	};

	const handleDocUpdate = async (): Promise<void> => {
		if (singleDocument) {
			try {
				const prices: Price[] = [
					{ currency: 'gbp', amount: isFree ? 'Free' : GBP.amount },
					{ currency: 'usd', amount: isFree ? 'Free' : USD.amount },
					{ currency: 'eur', amount: isFree ? 'Free' : EUR.amount },
					{ currency: 'try', amount: isFree ? 'Free' : TRY.amount },
				];

				// Ensure we have all required fields
				if (!singleDocument.name || !singleDocument.documentUrl) {
					console.error('Missing required fields');
					return;
				}

				const updateData = {
					name: singleDocument.name.trim(),
					documentUrl: singleDocument.documentUrl,
					imageUrl: singleDocument.imageUrl || '',
					samplePageImageUrl: singleDocument.samplePageImageUrl || '',
					isOnLandingPage: singleDocument.isOnLandingPage || false,
					prices,
					description: singleDocument.description || '',
					pageCount: singleDocument.pageCount || 0,
				};

				const response = await axios.patch(`${base_url}/documents/${singleDocument._id}`, updateData);

				if (!response.data || !response.data.data) {
					throw new Error('Invalid response format from server');
				}

				const responseData = response.data.data;

				setSingleDocument(null);
				updateDocuments({
					...singleDocument,
					...updateData,
					_id: responseData._id,
					updatedAt: responseData.updatedAt,
					updatedByImageUrl: responseData.updatedByImageUrl,
					updatedByName: responseData.updatedByName,
					updatedByRole: responseData.updatedByRole,
				});
			} catch (error: any) {
				console.error('Error updating document:', error);
				if (error.response) {
					// The request was made and the server responded with a status code
					// that falls out of the range of 2xx
					console.error('Error response:', error.response.data);
					console.error('Error status:', error.response.status);
					if (error.response.status === 401) {
						console.error('Authentication error: Please make sure you are logged in');
					} else if (error.response.status === 403) {
						console.error('Authorization error: You do not have permission to update documents');
					}
				} else if (error.request) {
					// The request was made but no response was received
					console.error('Error request:', error.request);
					console.error('No response received. Please check if the server is running.');
				} else {
					// Something happened in setting up the request that triggered an Error
					console.error('Error message:', error.message);
				}
			}
		}
	};

	const deleteDocument = async (documentId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}/documents/${documentId}`);
			removeDocument(response.data.data._id);
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

		// Set initial price states
		const gbpPrice = documentToEdit.prices.find((p) => p.currency === 'gbp');
		const usdPrice = documentToEdit.prices.find((p) => p.currency === 'usd');
		const eurPrice = documentToEdit.prices.find((p) => p.currency === 'eur');
		const tryPrice = documentToEdit.prices.find((p) => p.currency === 'try');

		setGBP(gbpPrice || { currency: 'gbp', amount: '0' });
		setUSD(usdPrice || { currency: 'usd', amount: '0' });
		setEUR(eurPrice || { currency: 'eur', amount: '0' });
		setTRY(tryPrice || { currency: 'try', amount: '0' });

		setIsFree(documentToEdit.prices.every((p) => p.amount === '0' || p.amount === 'Free'));
		setFileUploaded(true);

		// Set initial URL states
		setEnterDocUrl(true);
		setEnterDocImageUrl(true);
		setEnterSamplePageImageUrl(true);

		toggleDocumentEditModal(index);
	};

	const closeDocumentEditModal = (index: number) => {
		const newEditModalOpen = [...editDocumentModalOpen];
		newEditModalOpen[index] = false;
		setEditDocumentModalOpen(newEditModalOpen);
	};

	const openDocumentInfoModal = (index: number) => {
		const updatedState = [...isDocumentInfoModalOpen];
		updatedState[index] = true;
		setIsDocumentInfoModalOpen(updatedState);
	};

	const closeDocumentInfoModal = (index: number) => {
		const updatedState = [...isDocumentInfoModalOpen];
		updatedState[index] = false;
		setIsDocumentInfoModalOpen(updatedState);
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
							setSingleDocument({
								_id: '',
								name: '',
								orgId,
								userId: userId || '',
								documentUrl: '',
								imageUrl: '',
								prices: [
									{ currency: 'gbp', amount: '0' },
									{ currency: 'usd', amount: '0' },
									{ currency: 'eur', amount: '0' },
									{ currency: 'try', amount: '0' },
								],
								description: '',
								pageCount: 0,
								createdAt: '',
								updatedAt: '',
								clonedFromId: '',
								clonedFromTitle: '',
								usedInLessons: [],
								usedInCourses: [],
								samplePageImageUrl: '',
								isOnLandingPage: false,
								createdBy: '',
								updatedBy: '',
								createdByName: '',
								updatedByName: '',
								createdByImageUrl: '',
								updatedByImageUrl: '',
								createdByRole: '',
								updatedByRole: '',
							});
						}}
						sx={{ height: isVerySmallScreen ? '1.75rem' : '2.1rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
						type='button'>
						{isVerySmallScreen ? 'New' : 'New Document'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<CreateNewDocumentDialog
				isOpen={isDocumentCreateModalOpen}
				onClose={resetForm}
				onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
					e.preventDefault();
					createDocument();
					resetForm();
				}}
				singleDocument={singleDocument}
				setSingleDocument={setSingleDocument}
				enterDocUrl={enterDocUrl}
				setEnterDocUrl={setEnterDocUrl}
				enterDocImageUrl={enterDocImageUrl}
				setEnterDocImageUrl={setEnterDocImageUrl}
				enterSamplePageImageUrl={enterSamplePageImageUrl}
				setEnterSamplePageImageUrl={setEnterSamplePageImageUrl}
				fileUploaded={fileUploaded}
				setFileUploaded={setFileUploaded}
				isFree={isFree}
				setIsFree={setIsFree}
				GBP={GBP}
				setGBP={setGBP}
				USD={USD}
				setUSD={setUSD}
				EUR={EUR}
				setEUR={setEUR}
				TRY={TRY}
				setTRY={setTRY}
			/>

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
							{ key: 'clone', label: '' },
							{ key: 'name', label: 'Document Name' },
							{ key: 'documentId', label: 'Document URL' },
							{ key: 'createdAt', label: 'Created At' },
							{ key: 'updatedAt', label: 'Updated At' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedDocuments &&
							paginatedDocuments?.map((document: Document, index) => {
								return (
									<TableRow key={document._id}>
										{' '}
										<TableCell sx={{ textAlign: 'center', width: '0px' }}>
											{document.clonedFromId && (
												<Box
													sx={{
														backgroundColor: theme.palette.info.main,
														color: 'white',
														borderRadius: '50%',
														width: '15px',
														height: '15px',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '0.65rem',
														margin: '0 auto',
													}}>
													C
												</Box>
											)}
										</TableCell>
										<CustomTableCell value={document.name} />
										<TableCell sx={{ textAlign: 'center' }}>
											<Link
												href={document.documentUrl}
												target='_blank'
												rel='noopener noreferrer'
												sx={{ fontSize: isMobileSize ? '0.6rem' : undefined }}>
												{isVerySmallScreen ? truncateText(document.documentUrl, 25) : truncateText(document.documentUrl, 40)}
											</Link>
										</TableCell>
										<CustomTableCell value={dateFormatter(document.createdAt)} />
										<CustomTableCell value={dateFormatter(document.updatedAt)} />
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
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>

											<EditDocumentDialog
												isOpen={editDocumentModalOpen[index]}
												onClose={() => closeDocumentEditModal(index)}
												onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
													e.preventDefault();
													if (singleDocument?.name && singleDocument.name.trim()) {
														handleDocUpdate();
														closeDocumentEditModal(index);
													}
												}}
												document={singleDocument}
												setDocument={setSingleDocument}
												enterDocUrl={enterDocUrl}
												setEnterDocUrl={setEnterDocUrl}
												enterDocImageUrl={enterDocImageUrl}
												setEnterDocImageUrl={setEnterDocImageUrl}
												enterSamplePageImageUrl={enterSamplePageImageUrl}
												setEnterSamplePageImageUrl={setEnterSamplePageImageUrl}
												setFileUploaded={setFileUploaded}
												isFree={isFree}
												setIsFree={setIsFree}
												GBP={GBP}
												setGBP={setGBP}
												USD={USD}
												setUSD={setUSD}
												EUR={EUR}
												setEUR={setEUR}
												TRY={TRY}
												setTRY={setTRY}
											/>

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

											<CustomActionBtn
												title='More Info'
												onClick={() => {
													openDocumentInfoModal(index);
												}}
												icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={documentsNumberOfPages} page={documentsPageNumber} onChange={setDocumentsPageNumber} />
			</Box>

			{isDocumentInfoModalOpen.map(
				(isOpen, index) =>
					isOpen && (
						<CustomDialog openModal={isOpen} closeModal={() => closeDocumentInfoModal(index)} title={sortedDocumentsData[index].name} maxWidth='sm'>
							<DocumentInfoModal document={sortedDocumentsData[index]} onClose={() => closeDocumentInfoModal(index)} />
						</CustomDialog>
					)
			)}
		</DashboardPagesLayout>
	);
};

export default AdminDocuments;
