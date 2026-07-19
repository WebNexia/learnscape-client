import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { PromoCode } from '../../../interfaces/promoCode';
import { useContext, useEffect, useMemo, useState } from 'react';
import { PromoCodesContext } from '../../../contexts/PromoCodesContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import CreateCodeDialog from './CreateCodeDialog';
import EditCodeDialog from './EditCodeDialog';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import { Delete, Edit } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import FilterSearchRow from '../FilterSearchRow';

const AdminPromoCodesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { promoCodes, totalItems, loadedPages, fetchMorePromoCodes, removePromoCode, setPromoCodesPageNumber, enablePromoCodesFetch, disablePromoCodesFetch } =
		useContext(PromoCodesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { orgId } = useContext(OrganisationContext);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayPromoCodes,
		numberOfPages: promoCodesNumberOfPages,
		currentPage: promoCodesCurrentPage,
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
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	const sortedPromoCodes = useMemo(() => {
		if (!displayPromoCodes) return [];

		return [...displayPromoCodes].sort((a, b) => {
			const aValue = a[orderBy as keyof PromoCode] ?? '';
			const bValue = b[orderBy as keyof PromoCode] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});
	}, [displayPromoCodes, orderBy, order]);

	const paginatedPromoCodes = sortedPromoCodes;

	const [isNewCodeModalOpen, setIsNewCodeModalOpen] = useState<boolean>(false);
	const [codeToEdit, setCodeToEdit] = useState<PromoCode | null>(null);
	const [codeToDelete, setCodeToDelete] = useState<PromoCode | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		enablePromoCodesFetch();
		return disablePromoCodesFetch;
	}, [enablePromoCodesFetch, disablePromoCodesFetch]);

	const deleteCode = async (): Promise<void> => {
		if (!codeToDelete || isDeleting) return;
		setIsDeleting(true);
		try {
			await axios.delete(`${base_url}/promocodes/${codeToDelete.code}`);
			removePromoCode(codeToDelete._id);

			if (isSearchActive) {
				removeFromSearchResults(codeToDelete._id);
			}
			setCodeToDelete(null);
		} catch (error) {
			console.error('Delete promo code error:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<FilterSearchRow
				filterValue={filterValue}
				onFilterChange={handleFilterChange}
				filterOptions={[
					{ value: '', label: 'All Codes' },
					{ value: 'active', label: 'Active' },
					{ value: 'inactive', label: 'Inactive' },
					{ value: 'unlimited usage', label: 'Unlimited Usage' },
					{ value: 'limited usage', label: 'Limited Usage' },
					{ value: 'expired', label: 'Expired' },
					{ value: 'unexpired', label: 'Unexpired' },
				]}
				filterPlaceholder='Filter Codes'
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				onSearch={handleSearch}
				onReset={resetAll}
				searchPlaceholder={isMobileSize ? 'Search Code' : 'Search Promo Code'}
				isSearchLoading={isSearchLoading}
				isSearchActive={isSearchActive}
				searchResultsTotalItems={searchResultsTotalItems}
				totalItems={totalItems || promoCodes?.length || 0}
				searchedValue={searchedValue}
				onResetSearch={resetSearch}
				onResetFilter={resetFilter}
				actionButtons={[
					{
						label: isMobileSize ? 'New' : 'New Promo Code',
						onClick: () => setIsNewCodeModalOpen(true),
					},
				]}
				isSticky={true}
				isPayments={true}
			/>

			{isNewCodeModalOpen && (
				<CreateCodeDialog isNewCodeModalOpen={true} setIsNewCodeModalOpen={setIsNewCodeModalOpen} />
			)}

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
					width: '100%',
				}}>
				<Table
					sx={{
						'mb': '2rem',
						'tableLayout': 'fixed',
						'width': '100%',
						'borderCollapse': 'collapse',
						'borderSpacing': 0,
						'& .MuiTableHead-root': {
							position: 'fixed',
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '13.5rem'
									: '11rem'
								: isMobileSize
									? '16rem'
									: '13.25rem',
							left: isMobileSize ? 0 : '10rem',
							right: 0,
							zIndex: 98,
							backgroundColor: theme.bgColor?.secondary,
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							display: 'table',
							tableLayout: 'fixed',
							width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						},
						'& .MuiTableHead-root .MuiTableCell-root': {
							backgroundColor: theme.bgColor?.secondary,
							padding: '0.75rem 1rem',
							boxSizing: 'border-box',
							margin: 0,
							verticalAlign: 'center',
						},
						'& .MuiTableHead-root .MuiTableCell-root:last-child': {
							borderRight: 'none',
						},
						'& .MuiTableBody-root .MuiTableCell-root': {
							padding: '0.5rem 1rem',
							boxSizing: 'border-box',
							margin: 0,
							verticalAlign: 'center',
						},
						'& .MuiTableBody-root .MuiTableCell-root:last-child': {
							borderRight: 'none',
						},
						// Column widths for mobile (4 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
							minWidth: isMobileSize ? '120px' : '150px',
							width: isMobileSize ? '30%' : '20%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '25%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '20%' : '20%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '25%' : '15%',
						},
						// Desktop columns (6 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
							minWidth: isMobileSize ? '0px' : '120px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '15%',
						},
					}}
					size='small'
					aria-label='a dense table'>
					{/* Spacer row to ensure header alignment */}
					<TableRow sx={{ height: 0, visibility: 'hidden' }}>
						<TableCell sx={{ width: isMobileSize ? '30%' : '20%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '20%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
					</TableRow>
					<CustomTableHead<PromoCode>
						orderBy={orderBy as keyof PromoCode}
						order={order}
						handleSort={handleSort}
						columns={
							isMobileSize
								? [
										{ key: 'code', label: isMobileSize ? 'Code' : 'Promo Code' },
										{ key: 'discountAmount', label: 'Percentage' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'code', label: 'Promo Code' },
										{ key: 'discountAmount', label: 'Percentage' },
										{ key: 'expirationDate', label: 'Expiration Date' },
										{ key: 'usageLimit', label: 'Usage Limit' },
										{ key: 'isActive', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedPromoCodes &&
							paginatedPromoCodes?.map((promoCode: PromoCode) => {
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
												onClick={() => setCodeToEdit(promoCode)}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => setCodeToDelete(promoCode)}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{displayPromoCodes && displayPromoCodes.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No promo codes found matching your search criteria.' : 'No promo codes found.'}
						sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
					/>
				)}
				{isMobileSize && !(displayPromoCodes && displayPromoCodes.length === 0) && (
					<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
				)}
				<CustomTablePagination count={promoCodesNumberOfPages} page={promoCodesCurrentPage} onChange={handlePageChange} />
			</Box>

			{codeToEdit && (
				<EditCodeDialog
					singleCode={codeToEdit}
					setSingleCode={setCodeToEdit}
					onClose={() => setCodeToEdit(null)}
				/>
			)}

			{codeToDelete && (
				<CustomDialog
					openModal={true}
					closeModal={() => {
						if (!isDeleting) setCodeToDelete(null);
					}}
					title='Delete Promo Code'
					content={`Are you sure you want to delete "${codeToDelete.code}"?`}
					maxWidth='xs'>
					<CustomDialogActions
						onCancel={() => {
							if (!isDeleting) setCodeToDelete(null);
						}}
						deleteBtn={true}
						onDelete={deleteCode}
						isDeleting={isDeleting}
						disableBtn={isDeleting}
						disableCancelBtn={isDeleting}
						actionSx={{ mb: '0.5rem' }}
					/>
				</CustomDialog>
			)}
		</>
	);
};

export default AdminPromoCodesTab;
