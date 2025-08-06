import {
	Box,
	Checkbox,
	DialogContent,
	FormControl,
	FormControlLabel,
	InputAdornment,
	Link,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
} from '@mui/material';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import { useContext, useEffect, useState } from 'react';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTableCell from '../layouts/table/CustomTableCell';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import { DocumentsContext } from '../../contexts/DocumentsContextProvider';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { Document } from '../../interfaces/document';
import { truncateText } from '../../utils/utilText';
import { Lesson } from '../../interfaces/lessons';
import { SingleCourse } from '../../interfaces/course';
import CustomTextField from '../forms/customFields/CustomTextField';
import { Search } from '@mui/icons-material';
import theme from '../../themes';
import axios from '@utils/axiosInstance';

interface AddNewDocumentDialogProps {
	addNewDocumentModalOpen?: boolean;
	setAddNewDocumentModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	singleLessonBeforeSave: Lesson | undefined;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>> | undefined;
	fromAdminCourses?: boolean;
	singleCourse: SingleCourse | undefined;
	setSingleCourse: React.Dispatch<React.SetStateAction<SingleCourse | undefined>> | undefined;
}

const AddNewDocumentDialog = ({
	addNewDocumentModalOpen,
	setAddNewDocumentModalOpen,
	setSingleLessonBeforeSave,
	singleLessonBeforeSave,
	setIsLessonUpdated,
	fromAdminCourses,
	singleCourse,
	setSingleCourse,
}: AddNewDocumentDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { sortDocumentsData, documents, fetchMoreDocuments, totalItems, loadedPages, updateDocuments } = useContext(DocumentsContext);

	const [documentsPageNumber, setDocumentsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Document[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const pageSize = 25;

	// Use search results if active, otherwise use context data (filtered to exclude already added documents)
	const displayDocuments = isSearchActive
		? searchResults
		: documents.filter((doc: Document) => {
				if (fromAdminCourses) {
					return !singleCourse?.documentIds?.includes(doc._id);
				} else {
					return !singleLessonBeforeSave?.documentIds?.includes(doc._id);
				}
			});

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const documentsNumberOfPages = isSearchActive ? Math.ceil(displayDocuments.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedDocuments = displayDocuments.slice((documentsPageNumber - 1) * pageSize, documentsPageNumber * pageSize);

	const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
	const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof Document>('name');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		if (addNewDocumentModalOpen) {
			setDocumentsPageNumber(1);
		}
	}, [addNewDocumentModalOpen, setDocumentsPageNumber]);

	const handleSort = (property: keyof Document) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortDocumentsData(property, isAsc ? 'desc' : 'asc');
	};

	const handlePageChange = async (newPage: number) => {
		setDocumentsPageNumber(newPage);

		// Only fetch more data if not searching
		if (!isSearchActive) {
			// Check if we need to fetch more data
			const requiredRecords = newPage * pageSize;
			if (documents.length < requiredRecords && newPage <= documentsNumberOfPages) {
				// Calculate which batch of 100 records we need (context fetches 100 at a time)
				const startBatch = Math.floor(((newPage - 1) * pageSize) / 100) + 1;
				const endBatch = Math.ceil((newPage * pageSize) / 100);

				// Check if we already have the required batches loaded
				const batchesNeeded = [];
				for (let batch = startBatch; batch <= endBatch; batch++) {
					if (!loadedPages.includes(batch)) {
						batchesNeeded.push(batch);
					}
				}

				if (batchesNeeded.length > 0) {
					await fetchMoreDocuments(startBatch, endBatch);
				}
			}
		}
	};

	const handleSearch = async () => {
		if (!searchValue && !filterValue) {
			setIsSearchActive(false);
			setSearchResults([]);
			setDocumentsPageNumber(1);
			return;
		}

		setIsSearchActive(true);
		setDocumentsPageNumber(1);

		try {
			const params = new URLSearchParams({
				limit: '200',
			});

			if (searchValue) {
				params.append('search', searchValue);
			}

			if (filterValue) {
				params.append('filter', filterValue);
			}

			if (orderBy && order) {
				params.append('sortBy', orderBy.toString());
				params.append('sortOrder', order);
			}

			console.log('Search params:', { searchValue, filterValue, params: params.toString() });
			const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${params}`);
			console.log('Search response:', response.data.data.length, 'results');

			// Filter out already added documents from search results
			const filteredResults = response.data.data.filter((doc: Document) => {
				if (fromAdminCourses) {
					return !singleCourse?.documentIds?.includes(doc._id);
				} else {
					return !singleLessonBeforeSave?.documentIds?.includes(doc._id);
				}
			});

			setSearchResults(filteredResults);
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const handleCheckboxChange = (document: Document) => {
		const selectedIndex = selectedDocumentIds.indexOf(document._id);
		let newSelectedDocumentIds: string[] = [];
		let newSelectedDocuments: Document[] = [];

		if (selectedIndex === -1) {
			newSelectedDocumentIds = [...selectedDocumentIds, document._id];
			newSelectedDocuments = [...selectedDocuments, document];
		} else {
			newSelectedDocumentIds = selectedDocumentIds?.filter((id) => id !== document._id);
			newSelectedDocuments = selectedDocuments?.filter((selectedDocument) => selectedDocument._id !== document._id);
		}

		setSelectedDocumentIds(newSelectedDocumentIds);
		setSelectedDocuments(newSelectedDocuments);
	};
	const handleAddDocuments = () => {
		if (!fromAdminCourses) {
			if (setSingleLessonBeforeSave) {
				setSingleLessonBeforeSave((prevData) => {
					if (prevData) {
						// Update selected documents with usedInLessons and temp update info
						const updatedSelectedDocuments = selectedDocuments.map((doc) => {
							const updatedDoc = {
								...doc,
								usedInLessons: doc.usedInLessons ? [...doc.usedInLessons, prevData._id] : [prevData._id],
								updatedAt: new Date().toISOString(),
								updatedByName: doc.updatedByName,
								updatedByImageUrl: doc.updatedByImageUrl,
								updatedByRole: doc.updatedByRole,
							};
							// Update document in DocumentsContext
							updateDocuments(updatedDoc);
							return updatedDoc;
						});

						return {
							...prevData,
							documents: [...updatedSelectedDocuments, ...prevData?.documents],
							documentIds: [...selectedDocumentIds, ...prevData?.documentIds],
						};
					}
					return prevData;
				});
			}
			if (setIsLessonUpdated) setIsLessonUpdated(true);
		} else {
			if (setSingleCourse) {
				setSingleCourse((prevData) => {
					if (prevData) {
						// Update selected documents with usedInCourses and temp update info
						const updatedSelectedDocuments = selectedDocuments.map((doc) => {
							const updatedDoc = {
								...doc,
								usedInCourses: doc.usedInCourses ? [...doc.usedInCourses, prevData._id] : [prevData._id],
								updatedAt: new Date().toISOString(),
								updatedByName: doc.updatedByName,
								updatedByImageUrl: doc.updatedByImageUrl,
								updatedByRole: doc.updatedByRole,
							};
							// Update document in DocumentsContext
							updateDocuments(updatedDoc);
							return updatedDoc;
						});

						return {
							...prevData,
							documents: [...updatedSelectedDocuments, ...prevData?.documents],
							documentIds: [...selectedDocumentIds, ...prevData?.documentIds],
						};
					}
					return prevData;
				});
			}
		}

		// Close the dialog
		if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(false);
		setSelectedDocuments([]);
		setSelectedDocumentIds([]);
	};

	const handleResetCheckboxes = () => {
		setSelectedDocuments([]);
		setSelectedDocumentIds([]);
	};

	const closeAddNewDocumentModalOpen = () => {
		if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(false);
		setSelectedDocuments([]);
		setSelectedDocumentIds([]);
		setSearchValue('');
		setFilterValue('');
		setSearchResults([]);
		setIsSearchActive(false);
		setDocumentsPageNumber(1);
	};
	return (
		<CustomDialog openModal={addNewDocumentModalOpen} closeModal={closeAddNewDocumentModalOpen} title='Add New Document'>
			<DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '1rem 2rem 0 2rem' }}>
					<Box sx={{ display: 'flex', width: '85%' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => {
										setFilterValue(e.target.value);
									}}
									displayEmpty
									sx={{
										backgroundColor: theme.bgColor?.common,
										width: '12rem',
										fontSize: '0.85rem',
										textTransform: 'capitalize',
									}}>
									<MenuItem disabled value='filter' selected sx={{ fontSize: '0.85rem', fontStyle: 'italic', textTransform: 'capitalize' }}>
										Filter Documents
									</MenuItem>
									<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
										All Documents
									</MenuItem>
									{['Paid Documents', 'Free Documents'].map((type) => (
										<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
											{type}
										</MenuItem>
									))}
									<MenuItem disabled value='visibility' selected sx={{ fontSize: '0.7rem', textTransform: 'inherit', fontWeight: 'lighter' }}>
										----- Filter by Visibility -----
									</MenuItem>
									{['On Landing Page', 'On Platform Only'].map((type) => (
										<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
											{type}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>

						<CustomTextField
							value={searchValue}
							placeholder={'Search in name and description'}
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
										/>
									</InputAdornment>
								),
							}}
						/>
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue && !filterValue}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							onClick={() => {
								setSearchValue('');
								setFilterValue('');
								setSearchResults([]);
								setIsSearchActive(false);
								setDocumentsPageNumber(1);
							}}>
							Reset
						</CustomDeleteButton>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.8rem', alignItems: 'center' }}>
						{isSearchActive && (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.85rem',
									ml: 1,
								}}>
								{searchResults.length} results
							</Typography>
						)}
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '1rem 2rem 2rem 2rem',
						width: '100%',
						height: '20rem',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Document>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'name', label: 'Name' },
								{ key: 'documentUrl', label: 'URL' },
								{ key: 'actions', label: 'Add Documents' },
							]}
						/>
						<TableBody>
							{paginatedDocuments &&
								paginatedDocuments
									?.filter((document) =>
										!fromAdminCourses
											? !singleLessonBeforeSave?.documentIds?.includes(document._id)
											: !singleCourse?.documentIds?.includes(document._id)
									)
									?.map((document: Document) => {
										const isSelected = selectedDocumentIds.indexOf(document._id) !== -1;
										return (
											<TableRow key={document._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
												<CustomTableCell value={document.name} />

												<CustomTableCell>
													<Link href={document.documentUrl} target='_blank' rel='noopener noreferrer'>
														{truncateText(document.documentUrl, 30)}
													</Link>
												</CustomTableCell>

												<TableCell
													sx={{
														textAlign: 'center',
													}}>
													<FormControlLabel
														control={
															<Checkbox
																checked={isSelected}
																onChange={() => handleCheckboxChange(document)}
																sx={{
																	'& .MuiSvgIcon-root': {
																		fontSize: '1.25rem',
																	},
																}}
															/>
														}
														label=''
													/>
												</TableCell>
											</TableRow>
										);
									})}
						</TableBody>
					</Table>
					<CustomTablePagination count={documentsNumberOfPages} page={documentsPageNumber} onChange={handlePageChange} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					if (setAddNewDocumentModalOpen) setAddNewDocumentModalOpen(false);
					handleResetCheckboxes();
					setSearchValue('');
					setFilterValue('');
					setSearchResults([]);
					setIsSearchActive(false);
					setDocumentsPageNumber(1);
				}}
				onSubmit={handleAddDocuments}
				submitBtnText='Add'
				actionSx={{ margin: '1.5rem 1rem 1.5rem 0' }}
				disableBtn={selectedDocuments.length === 0}>
				<CustomCancelButton
					onClick={() => {
						handleResetCheckboxes();
					}}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}>
					Deselect All
				</CustomCancelButton>
			</CustomDialogActions>
		</CustomDialog>
	);
};

export default AddNewDocumentDialog;
