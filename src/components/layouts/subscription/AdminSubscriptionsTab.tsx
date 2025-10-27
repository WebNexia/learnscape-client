import { Box, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert, DialogContent, DialogActions } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { UserSubscription } from '../../../interfaces/subscription';
import { Visibility, Delete, Cancel } from '@mui/icons-material';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomActionBtn from '../table/CustomActionBtn';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { SubscriptionsContext } from '../../../contexts/SubscriptionsContextProvider';
import axios from '@utils/axiosInstance';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import { dateFormatter } from '../../../utils/dateFormatter';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import DownloadIcon from '@mui/icons-material/Download';
import CustomCancelButton from '../../../components/forms/customButtons/CustomCancelButton';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import FilterSearchRow from '../FilterSearchRow';

const AdminSubscriptionsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId, organisation } = useContext(OrganisationContext);
	const {
		subscriptions,
		totalItems,
		loadedPages,
		fetchMoreSubscriptions,
		removeSubscription,
		updateSubscription,
		enableSubscriptionsFetch,
		setSubscriptionsPageNumber,
	} = useContext(SubscriptionsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Dialog states
	const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean[]>([]);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean[]>([]);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean[]>([]);
	const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);

	// Snackbar states
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displaySubscriptions,
		numberOfPages: subscriptionsNumberOfPages,
		currentPage: subscriptionsCurrentPage,
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
	} = useFilterSearch<UserSubscription>({
		getEndpoint: () => `${base_url}/subscriptions/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: subscriptions || [],
		setContextPageNumber: setSubscriptionsPageNumber,
		fetchMoreContextData: fetchMoreSubscriptions,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	const sortedSubscriptions = useMemo(() => {
		if (!displaySubscriptions) return [];

		const getNestedValue = (obj: any, path: string) => {
			return path.split('.').reduce((current, key) => current?.[key], obj) ?? '';
		};

		return [...displaySubscriptions].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			if (orderBy === 'userId') {
				aValue =
					typeof a.userId === 'object'
						? `${a.userId?.firstName || ''} ${a.userId?.lastName || ''}`.trim() || a.userId?.email || a.userId?._id || ''
						: a.userId || '';
				bValue =
					typeof b.userId === 'object'
						? `${b.userId?.firstName || ''} ${b.userId?.lastName || ''}`.trim() || b.userId?.email || b.userId?._id || ''
						: b.userId || '';
			} else if (orderBy.includes('.')) {
				aValue = getNestedValue(a, orderBy);
				bValue = getNestedValue(b, orderBy);
			} else {
				aValue = a[orderBy as keyof UserSubscription] ?? '';
				bValue = b[orderBy as keyof UserSubscription] ?? '';
			}

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});
	}, [displaySubscriptions, orderBy, order]);

	const paginatedSubscriptions = sortedSubscriptions;

	useEffect(() => {
		enableSubscriptionsFetch();
	}, [enableSubscriptionsFetch]);

	const handleDownloadSubscriptions = async () => {
		try {
			// Build query parameters for download
			const params = new URLSearchParams();
			if (searchValue && isSearchActive) {
				params.append('search', searchValue);
			}
			if (filterValue && isSearchActive) {
				params.append('filter', filterValue);
			}

			const response = await axios.get(`${base_url}/subscriptions/export-excel/${orgId}?${params}`, { responseType: 'blob' });

			// Get filename from Content-Disposition header if available
			let filename = `${organisation?.orgName}_Subscriptions.xlsx`;
			const disposition = response.headers['content-disposition'];
			if (disposition && disposition?.indexOf('filename=') !== -1) {
				filename = disposition.split('filename=')[1].replace(/['"]/g, '').trim();
			}

			// Create a blob URL and trigger download
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download error:', error);
		}
	};

	// Dialog handler functions
	const openViewDialog = (index: number, subscription: UserSubscription) => {
		const updatedState = Array(paginatedSubscriptions.length).fill(false);
		updatedState[index] = true;
		setIsViewDialogOpen(updatedState);
		setSelectedSubscription(subscription);
	};

	const closeViewDialog = (index: number) => {
		const updatedState = [...isViewDialogOpen];
		updatedState[index] = false;
		setIsViewDialogOpen(updatedState);
		setSelectedSubscription(null);
	};

	const openCancelDialog = (index: number, subscription: UserSubscription) => {
		const updatedState = Array(paginatedSubscriptions.length).fill(false);
		updatedState[index] = true;
		setIsCancelDialogOpen(updatedState);
		setSelectedSubscription(subscription);
	};

	const closeCancelDialog = (index: number) => {
		const updatedState = [...isCancelDialogOpen];
		updatedState[index] = false;
		setIsCancelDialogOpen(updatedState);
		setSelectedSubscription(null);
	};

	const openDeleteDialog = (index: number, subscription: UserSubscription) => {
		const updatedState = Array(paginatedSubscriptions.length).fill(false);
		updatedState[index] = true;
		setIsDeleteDialogOpen(updatedState);
		setSelectedSubscription(subscription);
	};

	const closeDeleteDialog = (index: number) => {
		const updatedState = [...isDeleteDialogOpen];
		updatedState[index] = false;
		setIsDeleteDialogOpen(updatedState);
		setSelectedSubscription(null);
	};

	const handleCancelSubscription = async (subscriptionId: string) => {
		try {
			const response = await axios.delete(`${base_url}/subscriptions/${subscriptionId}`);

			if (response.data.status === 200) {
				// Find the subscription to update
				const subscriptionToUpdate = subscriptions.find((sub) => sub._id === subscriptionId);
				if (subscriptionToUpdate) {
					// Update the subscription status to 'canceled'
					const updatedSubscription = {
						...subscriptionToUpdate,
						status: 'canceled' as const,
						isActive: false,
					};

					// Update local state - update in context data
					if (!isSearchActive) {
						updateSubscription(updatedSubscription);
					}

					// If search is active, also update search results
					if (isSearchActive) {
						// The hook will handle updating search results automatically
					}
				}

				// Show success message
				setSnackbarMessage('Subscription canceled successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			}
		} catch (error) {
			console.error('Error cancelling subscription:', error);

			// Show error message
			setSnackbarMessage('Failed to cancel subscription');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleDeleteSubscription = async (subscriptionId: string) => {
		try {
			const response = await axios.delete(`${base_url}/subscriptions/${subscriptionId}/hard-delete`);

			if (response.data.status === 200) {
				// Update local state - remove from context data
				removeSubscription(subscriptionId);

				// If search is active, remove from search results; otherwise context data is already updated
				if (isSearchActive) {
					removeFromSearchResults(subscriptionId);
				}

				// Show success message
				setSnackbarMessage('Subscription deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			}
		} catch (error) {
			console.error('Error hard deleting subscription:', error);

			// Show error message
			setSnackbarMessage('Failed to delete subscription');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	return (
		<>
			<FilterSearchRow
				filterValue={filterValue}
				onFilterChange={handleFilterChange}
				filterOptions={[
					{ value: '', label: 'All Subscriptions' },
					{ value: 'active', label: 'Active' },
					{ value: 'canceled', label: 'Canceled' },
					{ value: 'past due', label: 'Past Due' },
					{ value: 'unpaid', label: 'Unpaid' },
					{ value: 'incomplete', label: 'Incomplete' },
					{ value: 'trialing', label: 'Trialing' },
					{ value: 'monthly', label: 'Monthly' },
					{ value: 'yearly', label: 'Yearly' },
				]}
				filterPlaceholder='Filter Subscriptions'
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				onSearch={handleSearch}
				onReset={resetAll}
				searchPlaceholder={isMobileSize ? 'Search User' : 'Search in User Email and Name'}
				isSearchLoading={isSearchLoading}
				isSearchActive={isSearchActive}
				searchResultsTotalItems={searchResultsTotalItems}
				totalItems={totalItems || subscriptions?.length || 0}
				searchedValue={searchedValue}
				onResetSearch={resetSearch}
				onResetFilter={resetFilter}
				actionButtons={[
					{
						label: isSearchActive
							? isMobileSize
								? 'Download Filtered'
								: 'Download Filtered Subscriptions'
							: isMobileSize
								? 'Download All'
								: 'Download All Subscriptions',
						onClick: handleDownloadSubscriptions,
						startIcon: <DownloadIcon />,
					},
				]}
				isSticky={true}
				isPayments={true}
			/>

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
							padding: isMobileSize ? '0.75rem 1rem' : '0.75rem 1rem',
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
							width: isMobileSize ? '30%' : '17.5%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '20%' : '10%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '20%' : '10%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '30%' : '10%',
						},
						// Desktop columns (8 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '10%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '12.5%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
							minWidth: isMobileSize ? '0px' : '120px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(8)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '10%',
						},
					}}
					size='small'
					aria-label='a dense table'>
					{/* Spacer row to ensure header alignment */}
					<TableRow sx={{ height: 0, visibility: 'hidden' }}>
						<TableCell sx={{ width: isMobileSize ? '30%' : '17.5%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '30%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '12.5%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
					</TableRow>
					<CustomTableHead<UserSubscription>
						orderBy={orderBy as keyof UserSubscription}
						order={order}
						handleSort={handleSort}
						columns={
							isMobileSize
								? [
										{ key: 'userId', label: 'User' },
										{ key: 'subscriptionType', label: 'Type' },
										{ key: 'status', label: 'Status' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'userId', label: 'User' },
										{ key: 'subscriptionType', label: 'Type' },
										{ key: 'currentAmount', label: 'Amount' },
										{ key: 'currentCurrency', label: 'Currency' },
										{ key: 'status', label: 'Status' },
										{ key: 'currentPeriodEnd', label: 'Next Billing' },
										{ key: 'createdAt', label: 'Created' },
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedSubscriptions &&
							paginatedSubscriptions?.map((subscription: UserSubscription, index: number) => {
								return (
									<TableRow key={subscription._id} hover>
										<CustomTableCell
											value={
												isMobileSize
													? typeof subscription.userId === 'object'
														? subscription.userId?.username || subscription.userId?._id || 'N/A'
														: subscription.userId || 'N/A'
													: typeof subscription.userId === 'object'
														? `${subscription.userId?.firstName || ''} ${subscription.userId?.lastName || ''}`.trim() ||
															subscription.userId?.email ||
															subscription.userId?._id ||
															'N/A'
														: subscription.userId || 'N/A'
											}
										/>
										<CustomTableCell value={subscription.subscriptionType.charAt(0).toUpperCase() + subscription.subscriptionType.slice(1)} />
										{!isMobileSize && <CustomTableCell value={`${setCurrencySymbol(subscription.currentCurrency)}${subscription.currentAmount}`} />}
										{!isMobileSize && <CustomTableCell value={subscription.currentCurrency.toUpperCase()} />}
										<CustomTableCell value={subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)} />
										{!isMobileSize && <CustomTableCell value={dateFormatter(subscription.currentPeriodEnd)} />}
										{!isMobileSize && <CustomTableCell value={dateFormatter(subscription.createdAt)} />}

										<TableCell
											sx={{
												textAlign: 'center',
												display: 'flex',
												gap: '0.5rem',
												justifyContent: 'center',
											}}>
											<CustomActionBtn
												title='View Subscription'
												onClick={() => openViewDialog(index, subscription)}
												icon={
													<Visibility
														fontSize='small'
														sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '-0.35rem' : '-0.75rem' }}
													/>
												}
											/>
											{
												<CustomActionBtn
													title='Cancel Subscription'
													onClick={() => openCancelDialog(index, subscription)}
													icon={
														<Cancel
															fontSize='small'
															sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '-0.35rem' : '-0.75rem' }}
														/>
													}
													disabled={['canceled', 'incomplete', 'unpaid'].includes(subscription.status)}
												/>
											}
											<CustomActionBtn
												title='Delete Subscription'
												onClick={() => openDeleteDialog(index, subscription)}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{displaySubscriptions && displaySubscriptions.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No subscriptions found matching your search criteria.' : 'No subscriptions found.'}
						sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
					/>
				)}
				{isMobileSize && !(displaySubscriptions && displaySubscriptions.length === 0) && (
					<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
				)}

				<CustomTablePagination count={subscriptionsNumberOfPages} page={subscriptionsCurrentPage} onChange={handlePageChange} />
			</Box>

			{/* View Subscription Dialog */}
			{paginatedSubscriptions &&
				paginatedSubscriptions?.map((subscription: UserSubscription, index) => (
					<CustomDialog
						key={`view-${subscription._id}`}
						openModal={isViewDialogOpen[index] || false}
						closeModal={() => closeViewDialog(index)}
						title='Subscription Details'
						maxWidth='xs'>
						<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', p: '2rem 2rem 1rem 2rem' }}>
							<Box>
								<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.85rem' : '0.95rem' }}>
									User Information:
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Name:</span>
									{typeof subscription.userId === 'object'
										? `${subscription.userId?.firstName || ''} ${subscription.userId?.lastName || ''}`.trim() || 'N/A'
										: 'N/A'}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Email:</span>
									{typeof subscription.userId === 'object' ? subscription.userId?.email || 'N/A' : 'N/A'}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Username:</span>
									{typeof subscription.userId === 'object' ? subscription.userId?.username || 'N/A' : 'N/A'}
								</Typography>
							</Box>
							<Box>
								<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.85rem' : '0.95rem' }}>
									Subscription Details:
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Type:</span>{' '}
									{subscription.subscriptionType.charAt(0).toUpperCase() + subscription.subscriptionType.slice(1)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Status:</span>{' '}
									{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Amount:</span>{' '}
									{setCurrencySymbol(subscription.currentCurrency)}
									{subscription.currentAmount}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
										Current Period Start:
									</span>{' '}
									{dateFormatter(subscription.currentPeriodStart)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
										Current Period End:
									</span>{' '}
									{dateFormatter(subscription.currentPeriodEnd)}
								</Typography>
								{subscription.nextBillingDate && (
									<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
											Next Billing Date:
										</span>{' '}
										{dateFormatter(subscription.nextBillingDate)}
									</Typography>
								)}
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
										Stripe Subscription ID:
									</span>{' '}
									{subscription.stripeSubscriptionId}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Created:</span>{' '}
									{dateFormatter(subscription.createdAt)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Updated:</span>{' '}
									{dateFormatter(subscription.updatedAt)}
								</Typography>
							</Box>
						</DialogContent>
						<DialogActions>
							<CustomCancelButton onClick={() => closeViewDialog(index)} sx={{ margin: '0 1rem 0.5rem 0' }}>
								Close
							</CustomCancelButton>
						</DialogActions>
					</CustomDialog>
				))}

			{paginatedSubscriptions &&
				paginatedSubscriptions?.map((subscription: UserSubscription, index) => (
					<CustomDialog
						key={`cancel-${subscription._id}`}
						openModal={isCancelDialogOpen[index] || false}
						closeModal={() => closeCancelDialog(index)}
						title='Cancel Subscription'
						maxWidth='xs'>
						<DialogContent>
							<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{`Are you sure you want to cancel the subscription for "${
									typeof subscription.userId === 'object'
										? subscription.userId?.email || subscription.userId?._id || 'N/A'
										: subscription.userId || 'N/A'
								}"? `}
							</Typography>
							<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								This action will cancel the subscription but preserve the record for audit purposes.
							</Typography>
						</DialogContent>
						<CustomDialogActions
							onCancel={() => closeCancelDialog(index)}
							deleteBtn={true}
							deleteBtnText='Cancel'
							cancelBtnText='Close'
							onDelete={() => {
								if (selectedSubscription) {
									handleCancelSubscription(selectedSubscription._id);
									closeCancelDialog(index);
								}
							}}
							actionSx={{ mb: '0.5rem' }}
						/>
					</CustomDialog>
				))}

			{/* Delete Subscription Dialog */}
			{paginatedSubscriptions &&
				paginatedSubscriptions?.map((subscription: UserSubscription, index) => (
					<CustomDialog
						key={`delete-${subscription._id}`}
						openModal={isDeleteDialogOpen[index] || false}
						closeModal={() => closeDeleteDialog(index)}
						title='Delete Subscription'
						maxWidth='xs'>
						<Box sx={{ p: '1rem' }}>
							<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Are you sure you want to hard delete the subscription for "
								{typeof subscription.userId === 'object'
									? subscription.userId?.email || subscription.userId?._id || 'N/A'
									: subscription.userId || 'N/A'}
								"?
							</Typography>
							<Typography variant='body2' sx={{ mt: '1rem', color: 'error.main', lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								This action cannot be undone and will remove the subscription from both the database and Stripe.
							</Typography>
						</Box>
						<CustomDialogActions
							onCancel={() => closeDeleteDialog(index)}
							deleteBtn={true}
							onDelete={() => {
								if (selectedSubscription) {
									handleDeleteSubscription(selectedSubscription._id);
									closeDeleteDialog(index);
								}
							}}
							actionSx={{ mb: '0.5rem' }}
							cancelBtnText='Close'
						/>
					</CustomDialog>
				))}

			{/* Success/Error Snackbar */}
			<Snackbar
				open={snackbarOpen}
				autoHideDuration={5000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ mt: '4rem' }}
				onClose={() => setSnackbarOpen(false)}>
				<Alert
					onClose={() => setSnackbarOpen(false)}
					severity={snackbarSeverity}
					sx={{
						'width': isMobileSize ? '60%' : '100%',
						'backgroundColor': theme.bgColor?.greenSecondary,
						'color': theme.textColor?.common.main,
						'fontSize': isMobileSize ? '0.75rem' : undefined,
						'& .MuiAlert-icon': {
							color: 'white',
						},
					}}>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</>
	);
};

export default AdminSubscriptionsTab;
