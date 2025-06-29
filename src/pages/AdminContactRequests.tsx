import { Box, DialogActions, DialogContent, FormControl, InputAdornment, MenuItem, Select, TableCell } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import DownloadIcon from '@mui/icons-material/Download';
import { Typography, Table, TableBody, TableRow } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { ContactRequestsContext } from '../contexts/ContactRequestsContextProvider';
import { ContactRequest } from '../interfaces/contactRequest';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { dateFormatter, dateTimeFormatter } from '@utils/dateFormatter';
import { Delete, Search, Visibility } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { truncateText } from '@utils/utilText';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import theme from '../themes';
import EmailSender from '../components/EmailSender';
import EmailIcon from '@mui/icons-material/Email';

const columns = [
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'country', label: 'Country' },
	{ key: 'message', label: 'Message' },
	{ key: 'date', label: 'Date' },
	{ key: 'actions', label: 'Actions' },
];

const AdminContactRequests = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { contactRequests, loading, error, removeRequest, fetchContactRequests } = useContext(ContactRequestsContext);

	const [requestsPageNumber, setRequestsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const pageSize = 50;

	const filteredRequests = contactRequests.filter((req: ContactRequest) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return (
				req.firstName.toLowerCase().includes(lowerSearch) ||
				req.lastName.toLowerCase().includes(lowerSearch) ||
				req.email.toLowerCase().includes(lowerSearch) ||
				req.message?.toLowerCase().includes(lowerSearch)
			);
		}

		if (filterValue) {
			if (filterValue === 'from home page') return req.category === 'HeroSection';
			if (filterValue === 'from contact us') return req.category === 'ContactUs';
			if (filterValue === 'from about us') return req.category === 'AboutUs';
		}

		return !searchValue && !filterValue;
	});

	const requestsNumberOfPages = Math.ceil(filteredRequests.length / pageSize);

	const paginatedRequests = filteredRequests.slice((requestsPageNumber - 1) * pageSize, requestsPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof ContactRequest>('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState<{ [key: number]: boolean }>({});
	const [deleteModalOpen, setDeleteModalOpen] = useState<{ [key: number]: boolean }>({});
	const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);

	useEffect(() => {
		fetchContactRequests(requestsPageNumber);
	}, [requestsPageNumber]);

	const handlePageChange = (newPage: number) => {
		setRequestsPageNumber(newPage);
	};

	const handleSort = (property: keyof ContactRequest) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleViewRequest = (index: number, request: ContactRequest) => {
		setSelectedRequest(request);
		setViewModalOpen((prev) => ({ ...prev, [index]: true }));
	};

	const handleCloseViewModal = (index: number) => {
		setViewModalOpen((prev) => ({ ...prev, [index]: false }));
		setSelectedRequest(null);
	};

	const handleDeleteRequest = (index: number, request: ContactRequest) => {
		setSelectedRequest(request);
		setDeleteModalOpen((prev) => ({ ...prev, [index]: true }));
	};

	const handleCloseDeleteModal = (index: number) => {
		setDeleteModalOpen((prev) => ({ ...prev, [index]: false }));
		setSelectedRequest(null);
	};

	const handleConfirmDelete = async () => {
		if (!selectedRequest) return;

		try {
			await axios.delete(`${base_url}/contact-requests/${selectedRequest._id}`);
			removeRequest(selectedRequest._id);
			// Close all modals
			setDeleteModalOpen({});
			setViewModalOpen({});
			setSelectedRequest(null);
		} catch (error) {
			console.error('Error deleting request:', error);
		}
	};

	const handleDownload = () => {
		const excelData = contactRequests.map((request: ContactRequest) => ({
			'First Name': request.firstName,
			'Last Name': request.lastName,
			'Email': request.email,
			'Phone': request.phone,
			'Country': request.countryCode,
			'Message': request.message || '',
			'Submitted At': format(new Date(request.createdAt), 'yyyy-MM-dd HH:mm:ss'),
		}));

		const ws = XLSX.utils.json_to_sheet(excelData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Contact Requests');
		XLSX.writeFile(wb, `contact-requests-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
	};

	if (loading) return <Typography>Loading...</Typography>;
	if (error) return <Typography color='error'>{error}</Typography>;

	return (
		<DashboardPagesLayout pageName='Inquiries' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '100%', height: '100%' }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
						width: '100%',
						mb: '1.25rem',
					}}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flex: 4 }}>
						<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : '30rem' }}>
							<Box sx={{ mr: '1rem' }}>
								<FormControl>
									<Select
										size='small'
										value={filterValue}
										onChange={(e) => {
											setSearchValue('');
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
											Filter Requests
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
											All Inquiries
										</MenuItem>
										{['From Home Page', 'From Contact Us', 'From About Us'].map((type) => (
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
								placeholder={'Search in name, email, message'}
								onChange={(e) => {
									setSearchValue(e.target.value);
									setFilterValue('filter');
									if (e.target.value === '') {
										setFilterValue('');
									}
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
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem' }}>
						<CustomSubmitButton
							startIcon={<DownloadIcon />}
							onClick={handleDownload}
							sx={{
								fontSize: isMobileSize ? '0.7rem' : undefined,
							}}
							disabled={contactRequests.length === 0}>
							Download Inquiries
						</CustomSubmitButton>
						<CustomSubmitButton
							startIcon={<EmailIcon />}
							onClick={() => setEmailDialogOpen(true)}
							sx={{
								fontSize: isMobileSize ? '0.7rem' : undefined,
								width: 'fit-content',
							}}>
							Send Bulk Email
						</CustomSubmitButton>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
						width: '100%',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<ContactRequest> orderBy={orderBy} order={order} handleSort={handleSort} columns={columns} />
						<TableBody>
							{paginatedRequests &&
								paginatedRequests?.map((req: ContactRequest, index) => {
									return (
										<TableRow key={req._id}>
											<CustomTableCell value={req.firstName + ' ' + req.lastName} />
											<CustomTableCell value={req.email} />
											<CustomTableCell value={req.phone} />
											<CustomTableCell value={req.countryCode} />
											<CustomTableCell value={truncateText(req.message || '', 25)} />
											<CustomTableCell value={dateFormatter(req.createdAt)} />
											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='View'
													onClick={() => handleViewRequest(index, req)}
													icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>

												<CustomDialog
													openModal={viewModalOpen[index]}
													closeModal={() => handleCloseViewModal(index)}
													maxWidth='sm'
													title='Request Details'>
													{selectedRequest && (
														<DialogContent>
															<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
																<Box>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Name:</strong> {selectedRequest.firstName} {selectedRequest.lastName}
																	</Typography>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Phone:</strong> {selectedRequest.phone}
																	</Typography>
																</Box>
																<Box>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Email:</strong> {selectedRequest.email}
																	</Typography>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Country:</strong> {selectedRequest.countryCode}
																	</Typography>
																</Box>
															</Box>
															<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																<strong>Message:</strong> {selectedRequest.message || '-'}
															</Typography>
															<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																<strong>Submitted:</strong> {dateTimeFormatter(selectedRequest.createdAt)}
															</Typography>
															<Typography variant='body2'>
																<strong>From:</strong>{' '}
																{selectedRequest.category === 'HeroSection'
																	? 'Home Page'
																	: selectedRequest.category === 'ContactUs'
																		? 'Contact Us'
																		: 'About Us'}
															</Typography>
														</DialogContent>
													)}
													<DialogActions>
														<CustomCancelButton
															onClick={() => handleCloseViewModal(index)}
															sx={{
																margin: '0 1rem 1rem 0',
															}}>
															Cancel
														</CustomCancelButton>
													</DialogActions>
												</CustomDialog>

												<CustomActionBtn
													title='Delete'
													onClick={() => handleDeleteRequest(index, req)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>

												<CustomDialog
													openModal={deleteModalOpen[index]}
													closeModal={() => handleCloseDeleteModal(index)}
													title='Delete Request'
													content='Are you sure you want to delete this request?'
													maxWidth='sm'>
													<CustomDialogActions onCancel={() => handleCloseDeleteModal(index)} deleteBtn={true} onDelete={handleConfirmDelete} />
												</CustomDialog>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={requestsNumberOfPages} page={requestsPageNumber} onChange={handlePageChange} />
				</Box>
			</Box>
			<CustomDialog openModal={emailDialogOpen} closeModal={() => setEmailDialogOpen(false)} maxWidth='md' title='Send Bulk Email'>
				<DialogContent>
					<EmailSender setEmailDialogOpen={setEmailDialogOpen} />
				</DialogContent>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default AdminContactRequests;
