import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import { useContext, useEffect, useRef, useState } from 'react';
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
		fetchPromoCodes,
	} = useContext(PromoCodesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { orgId } = useContext(OrganisationContext);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const [searchResults, setSearchResults] = useState<PromoCode[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const displayPromoCodes = isSearchActive ? searchResults : promoCodes;

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const promoCodesNumberOfPages = isSearchActive ? Math.ceil(displayPromoCodes.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedPromoCodes = displayPromoCodes.slice((promoCodesPageNumber - 1) * pageSize, promoCodesPageNumber * pageSize);

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

		// If in search mode, trigger new search with sort parameters
		if (isSearchActive) {
			handleSearch();
		} else {
			// Otherwise use client-side sorting
			sortPromoCodesData(property, isAsc ? 'desc' : 'asc');
		}
	};

	const handlePageChange = async (newPage: number) => {
		setPromoCodesPageNumber(newPage);

		// Only fetch more data if not searching
		if (!isSearchActive) {
			// Check if we need to fetch more data
			const requiredRecords = newPage * pageSize;
			if (promoCodes.length < requiredRecords && newPage <= promoCodesNumberOfPages) {
				// Calculate which batch of 150 records we need (context fetches 150 at a time)
				const startBatch = Math.floor(((newPage - 1) * pageSize) / 150) + 1;
				const endBatch = Math.ceil((newPage * pageSize) / 150);

				// Check if we already have the required batches loaded
				const batchesNeeded = [];
				for (let batch = startBatch; batch <= endBatch; batch++) {
					if (!loadedPages.includes(batch)) {
						batchesNeeded.push(batch);
					}
				}

				if (batchesNeeded.length > 0) {
					await fetchMorePromoCodes(startBatch, endBatch);
				}
			}
		}
	};

	const handleSearch = async () => {
		if (!searchValue && !filterValue) {
			setIsSearchActive(false);
			setSearchResults([]);
			setPromoCodesPageNumber(1);
			return;
		}

		setIsSearchActive(true);
		setPromoCodesPageNumber(1);

		try {
			const params = new URLSearchParams({
				limit: '150',
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
			const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?${params}`);
			console.log('Search response:', response.data.data.length, 'results');
			setSearchResults(response.data.data);
		} catch (error) {
			console.error('Search error:', error);
			// Reset search state on error
			setIsSearchActive(false);
			setSearchResults([]);
		}
	};

	// Check if search button should be disabled
	const isSearchDisabled = !searchValue && !filterValue;

	useEffect(() => {
		setPromoCodesPageNumber(1);
	}, []);

	useEffect(() => {
		setIsDeleteCodeModalOpen(Array(promoCodes.length).fill(false));
		setIsEditCodeModalOpen(Array(promoCodes.length).fill(false));
	}, [promoCodes, promoCodesPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchPromoCodes(1);
		}
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
			await axios.delete(`${base_url}/promocodes/${codeId}`);
			fetchPromoCodes(1);
		} catch (error) {
			console.log(error);
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
								onChange={(e) => {
									setFilterValue(e.target.value);
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
									selected
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
							setIsSearchActive(false);
							setSearchResults([]);
							setPromoCodesPageNumber(1);
						}}>
						Reset
					</CustomDeleteButton>
					{isSearchActive && (
						<Box sx={{ display: 'flex', ml: '1rem', alignItems: 'center', height: '2rem' }}>
							<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem', whiteSpace: 'nowrap' }}>
								{searchResults.length} results
							</Typography>
						</Box>
					)}
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
									<TableRow key={promoCode._id}>
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
												content='Are you sure you want to delete this promo code?'
												maxWidth='sm'>
												<CustomDialogActions
													onCancel={() => {
														closeDeleteCodeModal(index);
													}}
													deleteBtn={true}
													onDelete={() => {
														deleteCode(promoCode.code);
														closeDeleteCodeModal(index);
													}}
												/>
											</CustomDialog>
										)}
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={promoCodesNumberOfPages} page={promoCodesPageNumber} onChange={handlePageChange} />
			</Box>
		</Box>
	);
};

export default AdminPromoCodesTab;
