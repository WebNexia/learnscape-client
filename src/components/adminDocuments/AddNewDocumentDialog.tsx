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
	Chip,
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
	setHasUnsavedChanges?: React.Dispatch<React.SetStateAction<boolean>> | undefined;
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
	setHasUnsavedChanges,
}: AddNewDocumentDialogProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { sortDocumentsData, documents, fetchMoreDocuments, loadedPages, updateDocument } = useContext(DocumentsContext);

	const [documentsPageNumber, setDocumentsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Document[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const pageSize = 25;

	// Use search results if active, otherwise use context data (filtered to exclude already added documents)
	const displayDocuments = isSearchActive
		? searchResults
		: (documents || [])?.filter?.((doc: Document) => {
				if (fromAdminCourses) {
					return !singleCourse?.documentIds?.includes?.(doc._id);
				} else {
					return !singleLessonBeforeSave?.documentIds?.includes?.(doc._id);
				}
			});

	// Calculate total pages based on filtered results when searching, otherwise use available documents count
	const documentsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(displayDocuments.length / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : documentsPageNumber;
	const paginatedDocuments = displayDocuments?.slice?.((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
	const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof Document>('name');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		if (addNewDocumentModalOpen) {
			setDocumentsPageNumber(1);
			setSearchResultsPage(1);
		}
	}, [addNewDocumentModalOpen]);

	const handleSort = (property: keyof Document) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// If search is active, trigger server-side sort
		if (isSearchActive) {
			handleSearch();
		} else {
			// Client-side sort for context data
			sortDocumentsData(property, isAsc ? 'desc' : 'asc');
		}
	};

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setDocumentsPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '200',
				});

				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes?.(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (documents.length < requiredRecords && newPage <= documentsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreDocuments(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${searchParams.toString()}`);

			// Filter out already added documents from search results
			const filteredResults = response.data.data?.filter?.((doc: Document) => {
				if (fromAdminCourses) {
					return !singleCourse?.documentIds?.includes?.(doc._id);
				} else {
					return !singleLessonBeforeSave?.documentIds?.includes?.(doc._id);
				}
			});

			if (page === 1) {
				// First page - replace all data
				setSearchResults(filteredResults);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...filteredResults];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			// Update total based on accumulated filtered results
			setSearchResultsTotalItems((prev) => {
				if (page === 1) {
					return filteredResults.length;
				} else {
					return prev + filteredResults.length;
				}
			});
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setDocumentsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '200',
					search: searchValue.trim(),
				});

				// Add filter if it exists
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`);

				// Filter out already added documents from search results
				const filteredResults = response.data.data?.filter?.((doc: Document) => {
					if (fromAdminCourses) {
						return !singleCourse?.documentIds?.includes?.(doc._id);
					} else {
						return !singleLessonBeforeSave?.documentIds?.includes?.(doc._id);
					}
				});

				setSearchResults(filteredResults);
				setSearchResultsTotalItems(filteredResults.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const handleCheckboxChange = (document: Document) => {
		const selectedIndex = selectedDocumentIds?.indexOf?.(document._id) || -1;
		let newSelectedDocumentIds: string[] = [];
		let newSelectedDocuments: Document[] = [];

		if (selectedIndex === -1) {
			newSelectedDocumentIds = [...selectedDocumentIds, document._id];
			newSelectedDocuments = [...selectedDocuments, document];
		} else {
			newSelectedDocumentIds = selectedDocumentIds?.filter?.((id) => id !== document._id) || [];
			newSelectedDocuments = selectedDocuments?.filter?.((selectedDocument) => selectedDocument._id !== document._id) || [];
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
						const updatedSelectedDocuments = selectedDocuments?.map?.((doc) => {
							const updatedDoc = {
								...doc,
								usedInLessons: doc.usedInLessons ? [...doc.usedInLessons, prevData._id] : [prevData._id],
								updatedAt: new Date().toISOString(),
								updatedByName: doc.updatedByName,
								updatedByImageUrl: doc.updatedByImageUrl,
								updatedByRole: doc.updatedByRole,
							};
							// Update document in DocumentsContext
							updateDocument(updatedDoc);
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
						const updatedSelectedDocuments = selectedDocuments?.map?.((doc) => {
							const updatedDoc = {
								...doc,
								usedInCourses: doc.usedInCourses ? [...doc.usedInCourses, prevData._id] : [prevData._id],
								updatedAt: new Date().toISOString(),
								updatedByName: doc.updatedByName,
								updatedByImageUrl: doc.updatedByImageUrl,
								updatedByRole: doc.updatedByRole,
							};
							// Update document in DocumentsContext
							updateDocument(updatedDoc);
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
		if (setHasUnsavedChanges) setHasUnsavedChanges(true);
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
		setSearchResultsPage(1);
		setSearchedValue('');
		setSearchButtonClicked(false);
		setSearchResultsLoadedPages([]);
		setSearchResultsTotalItems(0);
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
									onChange={async (e) => {
										const newFilterValue = e.target.value;
										setFilterValue(newFilterValue);

										// Auto-search when filter is selected
										if (newFilterValue && newFilterValue.trim()) {
											setDocumentsPageNumber(1);
											setSearchResultsPage(1);
											setIsSearchActive(true);
											setSearchResultsLoadedPages([]);

											try {
												const params = new URLSearchParams({
													limit: '200',
													filter: newFilterValue.trim(),
												});

												// Include existing search value if it exists
												if (searchValue && searchValue.trim()) {
													params.append('search', searchValue.trim());
												}

												if (orderBy) {
													params.append('sortBy', orderBy);
												}
												if (order) {
													params.append('sortOrder', order);
												}

												const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`);

												// Filter out already added documents from search results
												const filteredResults = response.data.data?.filter?.((doc: Document) => {
													if (fromAdminCourses) {
														return !singleCourse?.documentIds?.includes?.(doc._id);
													} else {
														return !singleLessonBeforeSave?.documentIds?.includes?.(doc._id);
													}
												});

												setSearchResults(filteredResults);
												setSearchResultsTotalItems(filteredResults.length);
												setSearchResultsLoadedPages([1]);
											} catch (error) {
												console.error('Filter search error:', error);
											}
										} else {
											// If filter is cleared but search value exists, auto-search with search value
											if (searchValue && searchValue.trim()) {
												setDocumentsPageNumber(1);
												setSearchResultsPage(1);
												setIsSearchActive(true);
												setSearchResultsLoadedPages([]);

												try {
													const params = new URLSearchParams({
														limit: '200',
														search: searchValue.trim(),
													});

													if (orderBy) {
														params.append('sortBy', orderBy);
													}
													if (order) {
														params.append('sortOrder', order);
													}

													const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`);

													// Filter out already added documents from search results
													const filteredResults = response.data.data?.filter?.((doc: Document) => {
														if (fromAdminCourses) {
															return !singleCourse?.documentIds?.includes?.(doc._id);
														} else {
															return !singleLessonBeforeSave?.documentIds?.includes?.(doc._id);
														}
													});

													setSearchResults(filteredResults);
													setSearchResultsTotalItems(filteredResults.length);
													setSearchResultsLoadedPages([1]);
												} catch (error) {
													console.error('Auto-search error:', error);
												}
											} else {
												// If no search value, reset to context data
												setIsSearchActive(false);
												setSearchResults([]);
												setSearchResultsLoadedPages([]);
												setSearchResultsTotalItems(0);
											}
										}
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
									{['Paid Documents', 'Free Documents']?.map?.((type) => (
										<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
											{type}
										</MenuItem>
									))}
									<MenuItem disabled value='visibility' selected sx={{ fontSize: '0.7rem', textTransform: 'inherit', fontWeight: 'lighter' }}>
										----- Filter by Visibility -----
									</MenuItem>
									{['On Landing Page', 'On Platform Only']?.map?.((type) => (
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
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							onClick={() => {
								setSearchValue('');
								setFilterValue('');
								setSearchedValue('');
								setSearchButtonClicked(false);
								setSearchResults([]);
								setSearchResultsLoadedPages([]);
								setSearchResultsTotalItems(0);
								setIsSearchActive(false);
								setDocumentsPageNumber(1);
								setSearchResultsPage(1);
							}}>
							Reset
						</CustomDeleteButton>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.8rem', alignItems: 'center' }}>
						{isSearchActive ? (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.85rem',
									ml: 1,
									whiteSpace: 'nowrap',
								}}>
								{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
							</Typography>
						) : (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: '0.85rem',
									ml: 1,
									whiteSpace: 'nowrap',
								}}>
								{displayDocuments.length} {displayDocuments.length === 1 ? 'item' : 'items'}
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
					{/* Chips for active search and filter */}
					{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'center',
								borderRadius: '4px',
								alignSelf: 'flex-start',
								marginBottom: '1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={() => {
										setFilterValue('');
										// If search value exists, auto-search with search value
										if (searchValue && searchValue.trim()) {
											handleSearch();
										} else {
											// Clear search results
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchButtonClicked(false);
											setSearchedValue('');
										}
									}}
									variant='outlined'
									color='secondary'
									size='small'
									sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
							{isSearchActive && searchedValue && searchButtonClicked && (
								<Chip
									label={`Search: "${searchedValue}"`}
									onDelete={() => {
										setSearchValue('');
										setSearchedValue('');
										setSearchButtonClicked(false);
										// If filter is still active, keep filter results
										if (filterValue) {
											// Re-trigger filter search without search value
											const params = new URLSearchParams({
												limit: '200',
												filter: filterValue,
											});
											if (orderBy) {
												params.append('sortBy', orderBy);
											}
											if (order) {
												params.append('sortOrder', order);
											}
											axios
												.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													// Filter out already added documents from search results
													const filteredResults = response.data.data?.filter?.((doc: Document) => {
														if (fromAdminCourses) {
															return !singleCourse?.documentIds?.includes?.(doc._id);
														} else {
															return !singleLessonBeforeSave?.documentIds?.includes?.(doc._id);
														}
													});
													setSearchResults(filteredResults);
													setSearchResultsTotalItems(filteredResults.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setSearchResultsPage(1);
												})
												.catch((error) => {
													console.error('Filter error:', error);
												});
										} else {
											// Clear everything and go back to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
										}
									}}
									color='primary'
									variant='filled'
									size='small'
									sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
						</Box>
					)}
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
									?.filter?.((document) =>
										!fromAdminCourses
											? !singleLessonBeforeSave?.documentIds?.includes?.(document._id)
											: !singleCourse?.documentIds?.includes?.(document._id)
									)
									?.map?.((document: Document) => {
										const isSelected = selectedDocumentIds?.indexOf?.(document._id) !== -1;
										return (
											<TableRow key={document._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
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
					<CustomTablePagination count={documentsNumberOfPages} page={currentPage} onChange={handlePageChange} />
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
					setSearchResultsPage(1);
					setSearchedValue('');
					setSearchButtonClicked(false);
					setSearchResultsLoadedPages([]);
					setSearchResultsTotalItems(0);
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
