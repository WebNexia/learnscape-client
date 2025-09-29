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
import { useFilterSearch } from '../../../hooks/useFilterSearch';

const AdminPromoCodesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { promoCodes, totalItems, loadedPages, promoCodesPageNumber, setPromoCodesPageNumber, fetchMorePromoCodes, removePromoCode } =
		useContext(PromoCodesContext);

	const { isSmallScreen, isRotatedMedium, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isMobileSize || isRotated;

	const { orgId } = useContext(OrganisationContext);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayPromoCodes,
		numberOfPages: promoCodesNumberOfPages,
		searchResultsPage,
		searchResultsTotalItems,
		searchButtonClicked,
		searchedValue,
		orderBy,
		order,
		isSearchActive,
		isLoading: isSearchLoading,
		handleSearch,
		handleFilterChange,
		handlePageChange,
		handleSort,
		resetSearch,
		resetFilter,
		resetAll,
		removeFromSearchResults,
	} = useFilterSearch<PromoCode>({
		getEndpoint: () => `${base_url}/promoCodes/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: promoCodes || [],
		setContextPageNumber: setPromoCodesPageNumber,
		fetchMoreContextData: fetchMorePromoCodes,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : promoCodesPageNumber;

	const sortedPromoCodes = [...(displayPromoCodes || [])]?.sort((a, b) => {
		const aValue = a[orderBy as keyof PromoCode] ?? '';
		const bValue = b[orderBy as keyof PromoCode] ?? '';

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedPromoCodes = sortedPromoCodes?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	const [isNewCodeModalOpen, setIsNewCodeModalOpen] = useState<boolean>(false);
	const [isEditCodeModalOpen, setIsEditCodeModalOpen] = useState<boolean[]>([]);
	const [isDeleteCodeModalOpen, setIsDeleteCodeModalOpen] = useState<boolean[]>([]);

	const [singleCode, setSingleCode] = useState<PromoCode | null>(null);

	useEffect(() => {
		setPromoCodesPageNumber(1);
		// Trigger initial fetch for context data
		if (promoCodes && promoCodes.length === 0) {
			// This will trigger the context to fetch data
		}
	}, []);

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

	const deleteCode = async (code: string): Promise<void> => {
		try {
			// Find the promo code to get its ID
			const promoCodeToDelete = promoCodes?.find((pc) => pc.code === code);
			if (!promoCodeToDelete) return;

			await axios.delete(`${base_url}/promocodes/${code}`);
			removePromoCode(promoCodeToDelete._id);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				removeFromSearchResults(promoCodeToDelete._id);
			}
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
		<>
			{/* Sticky Filter/Search Row */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 0rem 2rem',
					width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
					position: 'fixed',
					top: isMobileSize ? '7.5rem' : '6.5rem', // Account for header + tabs
					left: isMobileSize ? 0 : '10rem',
					right: 0,
					zIndex: 99,
					backgroundColor: theme.palette.background.paper,
					backdropFilter: 'blur(10px)',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
					<Box sx={{ display: 'flex', width: '100%' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => handleFilterChange(e.target.value)}
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
									{['Active', 'Inactive', 'Unlimited Usage', 'Limited Usage', 'Expired', 'Unexpired']?.map((type) => (
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
						<Box sx={{ display: 'flex', width: '45%' }}>
							<CustomTextField
								value={searchValue}
								placeholder={isMobileSize ? 'Search Code' : 'Search Promo Code'}
								onChange={(e) => {
									setSearchValue(e.target.value);
								}}
								sx={{ backgroundColor: '#fff' }}
								required={false}
								InputProps={{
									onKeyDown: (e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											if (searchValue.trim() && !isSearchLoading) {
												handleSearch();
											}
										}
									},
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
									height: isMobileSize ? '1.75rem' : '2rem',
									marginLeft: '0.5rem',
									fontSize: isMobileSize ? '0.7rem' : undefined,
								}}
								type='button'
								disabled={!searchValue || isSearchLoading}
								onClick={handleSearch}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								sx={{
									height: isMobileSize ? '1.75rem' : '2rem',
									marginLeft: '0.5rem',
									fontSize: isMobileSize ? '0.7rem' : undefined,
								}}
								type='button'
								onClick={resetAll}>
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
					</Box>
					<Box
						sx={{
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'flex-start',
							padding: '0.5rem 1rem 0.5rem 0rem',
							borderRadius: '4px',
							backgroundColor: theme.palette.background.paper,
						}}>
						{filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: ${filterValue}`}
								onDelete={resetFilter}
								color='secondary'
								variant='outlined'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{searchedValue && searchButtonClicked && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={resetSearch}
								variant='outlined'
								color='secondary'
								size='small'
								sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						width: '20%',
						height: isMobileSize ? '1.75rem' : '2rem',
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
					height: '3.5rem',
					width: '100%',
				}}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '0rem 0rem 2rem rem' : '0rem 0rem 2rem 0rem',
					width: '100%',
				}}>
				{/* Spacer for sticky table header */}
				<Box
					sx={{
						height: (isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()) ? '4rem' : '2rem',
						width: '100%',
					}}
				/>
				<Table
					sx={{
						'mb': '2rem',
						'width': '100%',
						'tableLayout': 'fixed',
						'& .MuiTableHead-root': {
							position: 'fixed',
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '12.5rem'
									: '12rem'
								: isMobileSize
									? '14rem'
									: '14rem', // Account for header + tabs + filter row
							left: isMobileSize ? 0 : '10rem',
							right: 0,
							zIndex: 98,
							backgroundColor: theme.palette.background.paper,
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							display: 'table',
							tableLayout: 'fixed',
							width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						},
						'& .MuiTableHead-root .MuiTableCell-root': {
							backgroundColor: theme.palette.background.paper,
							padding: '0.25rem 1rem',
						},
					}}
					size='small'
					aria-label='a dense table'>
					<CustomTableHead<PromoCode>
						orderBy={orderBy as keyof PromoCode}
						order={order}
						handleSort={handleSort}
						columns={
							isMobileSize
								? [
										{ key: 'code', label: isMobileSize ? 'Code' : 'Promo Code' },
										{ key: 'discountAmount', label: isMobileSize ? 'Discount' : 'Discount Amount' },
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
										{!isMobileSize && (
											<CustomTableCell
												value={new Date(promoCode.expirationDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
											/>
										)}
										{!isMobileSize && <CustomTableCell value={promoCode.usageLimit === 0 ? 'Unlimited' : promoCode.usageLimit} />}
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
				{isMobileSize && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={promoCodesNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>
		</>
	);
};

export default AdminPromoCodesTab;
