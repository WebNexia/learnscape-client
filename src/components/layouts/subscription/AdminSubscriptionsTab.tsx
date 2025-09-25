import {
	Box,
	FormControl,
	InputAdornment,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	Chip,
	Snackbar,
	Alert,
	DialogContent,
	DialogActions,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { UserSubscription } from '../../../interfaces/subscription';
import { Search, Visibility, Delete, Cancel } from '@mui/icons-material';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
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

const AdminSubscriptionsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId, organisation } = useContext(OrganisationContext);
	const {
		subscriptions = [],
		totalItems = 0,
		loadedPages = [],
		subscriptionsPageNumber = 1,
		setSubscriptionsPageNumber,
		fetchMoreSubscriptions,
		removeSubscription,
		updateSubscription,
	} = useContext(SubscriptionsContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

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
	} = useFilterSearch<UserSubscription>({
		getEndpoint: () => `${base_url}/subscriptions/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: subscriptions || [],
		setContextPageNumber: setSubscriptionsPageNumber,
		fetchMoreContextData: fetchMoreSubscriptions,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : subscriptionsPageNumber;

	const sortedSubscriptions = [...(displaySubscriptions || [])]?.sort((a, b) => {
		const aValue = a[orderBy as keyof UserSubscription] ?? '';
		const bValue = b[orderBy as keyof UserSubscription] ?? '';

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});

	const paginatedSubscriptions = sortedSubscriptions?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	useEffect(() => {
		setSubscriptionsPageNumber(1);
	}, []);

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
				console.log(`Subscription ${subscriptionId} canceled successfully.`);

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
				if (!isSearchActive) {
					removeSubscription(subscriptionId);
				}

				// If search is active, also remove from search results
				if (isSearchActive) {
					// The hook will handle updating search results automatically
				}

				console.log(`Subscription ${subscriptionId} hard deleted.`);

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
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				width: '100%',
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: isMobileSize ? 'center' : 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
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
									Filter Subscriptions
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
									All Subscriptions
								</MenuItem>
								<MenuItem
									disabled
									value='types'
									selected
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										textTransform: 'inherit',
										fontWeight: 'lighter',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									------ Filter by Status ------
								</MenuItem>
								{['Active', 'Canceled', 'Past Due', 'Unpaid', 'Incomplete', 'Trialing']?.map((type) => (
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
								<MenuItem
									disabled
									value='types2'
									selected
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										textTransform: 'inherit',
										fontWeight: 'lighter',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									------ Filter by Type ------
								</MenuItem>
								{['Monthly', 'Yearly']?.map((type) => (
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

					<Box sx={{ display: 'flex', width: '65%' }}>
						<CustomTextField
							value={searchValue}
							placeholder={isVerySmallScreen ? 'Search User' : 'Search in User Email and Name'}
							onChange={(e) => {
								setSearchValue(e.target.value);
							}}
							sx={{
								'backgroundColor': '#fff',
								'& .MuiInputBase-input::placeholder': {
									fontSize: '0.75rem', // Change this to your desired font size
								},
							}}
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
								height: isVerySmallScreen ? '1.75rem' : '2rem',
								marginLeft: '0.5rem',
								fontSize: isMobileSize ? '0.7rem' : undefined,
							}}
							type='button'
							disabled={!searchValue || isSearchLoading}
							onClick={handleSearch}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							sx={{ height: isVerySmallScreen ? '1.75rem' : '2rem', marginLeft: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
							type='button'
							onClick={resetAll}>
							Reset
						</CustomDeleteButton>
						<Box sx={{ height: '2rem', ml: '1rem', display: 'flex', alignItems: 'center' }}>
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									whiteSpace: 'nowrap',
								}}>
								{isSearchActive ? searchResultsTotalItems : totalItems}{' '}
								{isSearchActive ? (searchResultsTotalItems === 1 ? 'result' : 'results') : totalItems === 1 ? 'item' : 'items'}
							</Typography>
						</Box>
					</Box>
				</Box>

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						width: isVerySmallScreen ? '5%' : isMobileSize ? '20%' : '35%',
						height: isVerySmallScreen ? '1.75rem' : '2rem',
						fontSize: isMobileSize ? '0.65rem' : '0.85rem',
						alignItems: 'center',
					}}>
					<CustomSubmitButton
						startIcon={<DownloadIcon />}
						sx={{ fontSize: isMobileSize ? '0.7rem' : undefined, width: 'fit-content' }}
						onClick={handleDownloadSubscriptions}>
						{isSearchActive ? 'Download Filtered Subscriptions' : 'Download All Subscriptions'}
					</CustomSubmitButton>
				</Box>
			</Box>

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
				<Box
					sx={{
						display: 'flex',
						gap: 1,
						flexWrap: 'wrap',
						justifyContent: 'flex-start',
						borderRadius: '4px',
						alignSelf: 'flex-start',
						marginBottom: '1rem',
						marginTop: '-1rem',
						width: '100%',
					}}>
					{isSearchActive && filterValue && filterValue.trim() && (
						<Chip
							label={`Filter: "${filterValue}"`}
							onDelete={resetFilter}
							color='secondary'
							variant='outlined'
							size='small'
							sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
						/>
					)}
					{isSearchActive && searchedValue && searchButtonClicked && (
						<Chip
							label={`Search: "${searchedValue}"`}
							onDelete={resetSearch}
							color='primary'
							variant='filled'
							size='small'
							sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
						/>
					)}
				</Box>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<UserSubscription>
						orderBy={orderBy as keyof UserSubscription}
						order={order}
						handleSort={handleSort}
						columns={
							isVerySmallScreen
								? [
										{ key: 'userId', label: 'User' },
										{ key: 'subscriptionType', label: 'Type' },
										{ key: 'currentAmount', label: 'Amount' },
										{ key: 'status', label: 'Status' },
										{ key: 'createdAt', label: 'Created' },
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
												isVerySmallScreen
													? typeof subscription.userId === 'object'
														? subscription.userId?.email || subscription.userId?._id || 'N/A'
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
										<CustomTableCell value={`${setCurrencySymbol(subscription.currentCurrency)}${subscription.currentAmount}`} />
										{!isVerySmallScreen && <CustomTableCell value={subscription.currentCurrency.toUpperCase()} />}
										<CustomTableCell value={subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)} />
										{!isVerySmallScreen && <CustomTableCell value={dateFormatter(subscription.currentPeriodEnd)} />}
										<CustomTableCell value={dateFormatter(subscription.createdAt)} />

										{!isVerySmallScreen && (
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
													icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												{!['canceled', 'incomplete', 'unpaid'].includes(subscription.status) && (
													<CustomActionBtn
														title='Cancel Subscription'
														onClick={() => openCancelDialog(index, subscription)}
														icon={<Cancel fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												)}
												<CustomActionBtn
													title='Delete Subscription'
													onClick={() => openDeleteDialog(index, subscription)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											</TableCell>
										)}
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={subscriptionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>

			{/* View Subscription Dialog */}
			{paginatedSubscriptions &&
				paginatedSubscriptions?.map((subscription: UserSubscription, index) => (
					<CustomDialog
						key={`view-${subscription._id}`}
						openModal={isViewDialogOpen[index] || false}
						closeModal={() => closeViewDialog(index)}
						title='Subscription Details'
						maxWidth='sm'>
						<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', p: '2rem 2rem 1rem 2rem' }}>
							<Box>
								<Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
									User Information:
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Name:</span>
									{typeof subscription.userId === 'object'
										? `${subscription.userId?.firstName || ''} ${subscription.userId?.lastName || ''}`.trim() || 'N/A'
										: 'N/A'}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Email:</span>
									{typeof subscription.userId === 'object' ? subscription.userId?.email || 'N/A' : 'N/A'}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Username:</span>
									{typeof subscription.userId === 'object' ? subscription.userId?.username || 'N/A' : 'N/A'}
								</Typography>
							</Box>
							<Box>
								<Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
									Subscription Details:
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem', mt: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Type:</span>{' '}
									{subscription.subscriptionType.charAt(0).toUpperCase() + subscription.subscriptionType.slice(1)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Status:</span>{' '}
									{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Amount:</span>{' '}
									{setCurrencySymbol(subscription.currentCurrency)}
									{subscription.currentAmount}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
										Current Period Start:
									</span>{' '}
									{dateFormatter(subscription.currentPeriodStart)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
										Current Period End:
									</span>{' '}
									{dateFormatter(subscription.currentPeriodEnd)}
								</Typography>
								{subscription.nextBillingDate && (
									<Typography variant='body2' sx={{ mb: '0.5rem' }}>
										<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
											Next Billing Date:
										</span>{' '}
										{dateFormatter(subscription.nextBillingDate)}
									</Typography>
								)}
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>
										Stripe Subscription ID:
									</span>{' '}
									{subscription.stripeSubscriptionId}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
									<span style={{ color: theme.textColor?.primary.main, textDecoration: 'underline', marginRight: '0.5rem' }}>Created:</span>{' '}
									{dateFormatter(subscription.createdAt)}
								</Typography>
								<Typography variant='body2' sx={{ mb: '0.5rem' }}>
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
							<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
								{`Are you sure you want to cancel the subscription for "${
									typeof subscription.userId === 'object'
										? subscription.userId?.email || subscription.userId?._id || 'N/A'
										: subscription.userId || 'N/A'
								}"? `}
							</Typography>
							<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
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
						'width': '100%',
						'backgroundColor': theme.bgColor?.greenSecondary,
						'color': theme.textColor?.common.main,
						'& .MuiAlert-icon': {
							color: 'white',
						},
					}}>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default AdminSubscriptionsTab;
