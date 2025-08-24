import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import { useContext, useEffect, useState } from 'react';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CreateCodeDialog from './CreateCodeDialog';
import EditCodeDialog from './EditCodeDialog';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import { Delete, Edit, Search } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTextField from '../../forms/customFields/CustomTextField';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';

const AdminPromoCodesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const {
		promoCodes,
		sortPromoCodesData,
		totalItems,
		loadedPages,
		promoCodesPageNumber,
		setPromoCodesPageNumber,
		fetchMorePromoCodes,
		removePromoCode,
	} = useContext(PromoCodesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { orgId } = useContext(OrganisationContext);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<PromoCode[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayPromoCodes = isSearchActive ? searchResults : promoCodes;

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const promoCodesNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : promoCodesPageNumber;

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedPromoCodes = isSearchActive
		? searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
		: displayPromoCodes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const [orderBy, setOrderBy] = useState<keyof PromoCode>('updatedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const [isNewCodeModalOpen, setIsNewCodeModalOpen] = useState<boolean>(false);
	const [isEditCodeModalOpen, setIsEditCodeModalOpen] = useState<boolean[]>([]);
	const [isDeleteCodeModalOpen, setIsDeleteCodeModalOpen] = useState<boolean[]>([]);

	const [singleCode, setSingleCode] = useState<PromoCode | null>(null);

	const handleSort = (property: keyof PromoCode) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// If search is active, trigger server-side sort
		if (isSearchActive) {
			handleSearch();
		} else {
			// Client-side sort for context data
			sortPromoCodesData(property, isAsc ? 'desc' : 'asc');
		}
	};

	useEffect(() => {
		setPromoCodesPageNumber(1);
		// Trigger initial fetch for context data
		if (promoCodes.length === 0) {
			// This will trigger the context to fetch data
		}
	}, []);

	const handlePageChange = async (newPage: number) => {
		if (isSearchActive) {
			setSearchResultsPage(newPage);

			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages.includes(page)) {
						await fetchMoreSearchResults(page);
					}
				}
			}
		} else {
			setPromoCodesPageNumber(newPage);

			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (promoCodes.length < requiredRecords && newPage <= promoCodesNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMorePromoCodes(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setPromoCodesPageNumber(1);
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

				const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
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
				setSearchedValue('');
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number) => {
		try {
			// Build query parameters
			const params = new URLSearchParams({
				limit: '200',
				page: page.toString(),
			});

			if (searchedValue) {
				params.append('search', searchedValue);
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

			const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?${params.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...response.data.data];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

	// Check if search button should be disabled
	const isSearchDisabled = !searchValue;

	useEffect(() => {
		setIsDeleteCodeModalOpen(Array(promoCodes.length).fill(false));
		setIsEditCodeModalOpen(Array(promoCodes.length).fill(false));
	}, [promoCodes, promoCodesPageNumber]);

	useEffect(() => {
		setPromoCodesPageNumber(1);
	}, []);

	const openDeleteCodeModal = (index: number) => {
		const updatedState = [...isDeleteCodeModalOpen];
		updatedState[index] = true;
		setIsDeleteCodeModalOpen(updatedState);
	};
	const closeDeleteCodeModal = (index: number) => {
		const updatedState = [...isDeleteCodeModalOpen];
		updatedState[index] = false;
		setIsDeleteCodeModalOpen(updatedState);
	};

	const deleteCode = async (codeId: string): Promise<void> => {
		try {
			removePromoCode(codeId);
			// Also remove from search results if search is active
			if (isSearchActive) {
				setSearchResults((prev) => prev.filter((code) => code._id !== codeId));
				setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
			}
			await axios.delete(`${base_url}/promocodes/${codeId}`);
		} catch (error) {
			console.error('Delete promo code error:', error);
		}
	};

	const toggleCodeEditModal = (index: number) => {
		const newEditModalOpen = [...isEditCodeModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setIsEditCodeModalOpen(newEditModalOpen);
	};

	const closeCodeEditModal = (index: number) => {
		const newEditModalOpen = [...isEditCodeModalOpen];
		newEditModalOpen[index] = false;
		setIsEditCodeModalOpen(newEditModalOpen);
	};

	return (
		<Box sx={{ width: '100%' }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: 'fit-content' }}>
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
										setPromoCodesPageNumber(1);
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

											const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?${params.toString()}`);
											setSearchResults(response.data.data);
											setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
											setSearchResultsLoadedPages([1]);
										} catch (error) {
											console.error('Filter search error:', error);
										}
									} else {
										// If filter is cleared but search value exists, auto-search with search value
										if (searchValue && searchValue.trim()) {
											setPromoCodesPageNumber(1);
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

												const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?${params.toString()}`);
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
											} catch (error) {
												console.error('Search error:', error);
											}
										} else {
											// If no filter and no search, clear search results
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchButtonClicked(false);
											setSearchedValue('');
										}
									}
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									textTransform: 'capitalize',
								}}>
								<MenuItem
									disabled
									value='filter'
									selected
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										fontStyle: 'italic',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Filter Codes
								</MenuItem>
								<MenuItem
									value=''
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									All Codes
								</MenuItem>
								{['Active', 'Inactive', 'Unlimited Usage', 'Limited Usage', 'Expired', 'Unexpired'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<CustomTextField
						value={searchValue}
						placeholder={isVerySmallScreen ? 'Search Code' : 'Search Promo Code'}
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
					<CustomSubmitButton
						sx={{
							height: isVerySmallScreen ? '1.75rem' : '2rem',
							marginLeft: '0.5rem',
							fontSize: isMobileSize ? '0.7rem' : undefined,
						}}
						type='button'
						disabled={isSearchDisabled}
						onClick={handleSearch}>
						Search
					</CustomSubmitButton>
					<CustomDeleteButton
						sx={{
							height: isVerySmallScreen ? '1.75rem' : '2rem',
							marginLeft: '0.5rem',
							fontSize: isMobileSize ? '0.7rem' : undefined,
						}}
						type='button'
						onClick={() => {
							setSearchValue('');
							setFilterValue('');
							setSearchResults([]);
							setSearchResultsLoadedPages([]);
							setSearchResultsTotalItems(0);
							setIsSearchActive(false);
							setSearchButtonClicked(false);
							setSearchedValue('');
							setPromoCodesPageNumber(1);
							setSearchResultsPage(1);
						}}>
						Reset
					</CustomDeleteButton>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center', ml: '1rem' }}>
						{isSearchActive ? (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									whiteSpace: 'nowrap',
								}}>
								{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
							</Typography>
						) : (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									whiteSpace: 'nowrap',
								}}>
								{totalItems} {totalItems === 1 ? 'item' : 'items'}
							</Typography>
						)}
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						width: '20%',
						height: isVerySmallScreen ? '1.75rem' : '2rem',
						alignItems: 'center',
					}}>
					<CustomSubmitButton
						onClick={() => {
							setIsNewCodeModalOpen(true);
						}}
						sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}
						type='button'>
						{isMobileSize ? 'New' : 'New Promo Code'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<CreateCodeDialog isNewCodeModalOpen={isNewCodeModalOpen} setIsNewCodeModalOpen={setIsNewCodeModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '0rem 2rem 2rem 2rem',
					width: '100%',
					mt: '1rem',
				}}>
				{/* Chips for active search and filter */}
				{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
					<Box
						sx={{
							mb: '1rem',
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'center',
							borderRadius: '4px',
							alignSelf: 'flex-start',
							marginBottom: '1rem',
							marginTop: '-1rem',
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
											.get(`${base_url}/promoCodes/organisation/${orgId}?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
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
					<CustomTableHead<PromoCode>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={
							isVerySmallScreen
								? [
										{ key: 'code', label: 'Promo Code' },
										{ key: 'discountAmount', label: 'Discount Amount' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'code', label: 'Promo Code' },
										{ key: 'discountAmount', label: 'Discount Percentage' },
										{ key: 'expirationDate', label: 'Expiration Date' },
										{ key: 'usageLimit', label: 'Usage Limit' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedPromoCodes &&
							paginatedPromoCodes?.map((promoCode: PromoCode, index) => {
								return (
									<TableRow key={promoCode._id} hover>
										<CustomTableCell value={promoCode.code} />
										<CustomTableCell value={promoCode.discountAmount} />
										{!isVerySmallScreen && (
											<CustomTableCell
												value={new Date(promoCode.expirationDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
											/>
										)}
										{!isVerySmallScreen && <CustomTableCell value={promoCode.usageLimit === 0 ? 'Unlimited' : promoCode.usageLimit} />}
										<CustomTableCell value={promoCode.isActive ? 'Active' : 'Inactive'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													toggleCodeEditModal(index);
													setSingleCode(promoCode);
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<EditCodeDialog
												isEditCodeModalOpen={isEditCodeModalOpen}
												closeCodeEditModal={closeCodeEditModal}
												index={index}
												singleCode={singleCode}
												setSingleCode={setSingleCode}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteCodeModal(index);
												}}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
										{isDeleteCodeModalOpen[index] !== undefined && (
											<CustomDialog
												openModal={isDeleteCodeModalOpen[index]}
												closeModal={() => closeDeleteCodeModal(index)}
												title='Delete Promo Code'
												content={`Are you sure you want to delete "${promoCode.code}"?`}
												maxWidth='xs'>
												<CustomDialogActions
													onCancel={() => {
														closeDeleteCodeModal(index);
													}}
													deleteBtn={true}
													onDelete={() => {
														deleteCode(promoCode.code);
														closeDeleteCodeModal(index);
													}}
													actionSx={{ mb: '0.5rem' }}
												/>
											</CustomDialog>
										)}
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={promoCodesNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>
		</Box>
	);
};

export default AdminPromoCodesTab;
