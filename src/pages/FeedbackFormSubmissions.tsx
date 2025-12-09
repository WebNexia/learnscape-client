import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	Snackbar,
	Alert,
	DialogContent,
	DialogActions,
	Paper,
	Chip,
	Tooltip,
} from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Delete, Visibility, ArrowBack, Person, Email, Download as DownloadIcon, AccessTime } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { FeedbackFormSubmission } from '../interfaces/feedbackFormSubmission';
import { FeedbackForm } from '../interfaces/feedbackForm';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { dateTimeFormatter } from '../utils/dateFormatter';
import { feedbackFormsService } from '../services/feedbackFormsService';
import { useQuery, useQueryClient } from 'react-query';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { Rating } from '@mui/material';
import { truncateText } from '../utils/utilText';

const FeedbackFormSubmissions = () => {
	const { formId, courseId } = useParams<{ formId: string; courseId?: string }>();
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const queryClient = useQueryClient();

	const [form, setForm] = useState<FeedbackForm | null>(null);
	const [submissions, setSubmissions] = useState<FeedbackFormSubmission[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successSnackbarOpen, setSuccessSnackbarOpen] = useState<boolean>(false);
	const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);

	// Modal states
	const [isSubmissionViewModalOpen, setIsSubmissionViewModalOpen] = useState<boolean[]>([]);
	const [isSubmissionDeleteModalOpen, setIsSubmissionDeleteModalOpen] = useState<boolean[]>([]);
	const [selectedSubmission, setSelectedSubmission] = useState<FeedbackFormSubmission | null>(null);
	const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number>(-1);
	const [submissionToDelete, setSubmissionToDelete] = useState<FeedbackFormSubmission | null>(null);

	// Helper functions for submitter info
	const getSubmitterName = (submission: FeedbackFormSubmission): string => {
		if (submission.isAnonymous) {
			return submission.userName || 'Anonymous';
		}
		if (typeof submission.userId === 'object' && submission.userId) {
			const firstName = (submission.userId as any).firstName || '';
			const lastName = (submission.userId as any).lastName || '';
			const username = (submission.userId as any).username || '';
			return `${firstName} ${lastName}`.trim() || username || 'N/A';
		}
		return submission.userName || 'N/A';
	};

	const getSubmitterEmail = (submission: FeedbackFormSubmission): string => {
		if (submission.isAnonymous) {
			return submission.userEmail || 'N/A';
		}
		if (typeof submission.userId === 'object' && submission.userId) {
			return (submission.userId as any).email || 'N/A';
		}
		return submission.userEmail || 'N/A';
	};

	const getSubmitterInfo = (submission: FeedbackFormSubmission): string => {
		const name = getSubmitterName(submission);
		const email = getSubmitterEmail(submission);
		if (email && email !== 'N/A') {
			return `${name} (${email})`;
		}
		return name;
	};

	// Sorting
	const [orderBy, setOrderBy] = useState<string>('submittedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	// Pagination
	const [currentPage, setCurrentPage] = useState<number>(1);
	const pageSize = 25;

	// Sort submissions
	const sortedSubmissions = useMemo(() => {
		if (!submissions || submissions.length === 0) return [];
		return [...submissions].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			if (orderBy === 'submittedAt') {
				aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
				bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
			} else if (orderBy === 'submitter') {
				// Sort by submitter name/email
				aValue = getSubmitterInfo(a).toLowerCase();
				bValue = getSubmitterInfo(b).toLowerCase();
			} else {
				aValue = (a as any)[orderBy] ?? '';
				bValue = (b as any)[orderBy] ?? '';
			}

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});
	}, [submissions, orderBy, order]);

	const totalPages = Math.ceil(sortedSubmissions.length / pageSize);
	const paginatedSubmissions = sortedSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const prevLengthRef = useRef<number>(0);

	// Fetch form details
	useEffect(() => {
		const fetchForm = async () => {
			if (!formId) {
				setError('Form ID is required');
				setLoading(false);
				return;
			}

			try {
				const formData = await feedbackFormsService.getFeedbackFormById(formId);
				setForm(formData);
			} catch (err: any) {
				setError(err?.response?.data?.message || 'Failed to fetch form details');
			}
		};

		fetchForm();
	}, [formId]);

	// Fetch submissions
	useEffect(() => {
		const fetchSubmissions = async () => {
			if (!formId) return;

			try {
				setLoading(true);
				const submissionsData = await feedbackFormsService.getFormSubmissions(formId);
				setSubmissions(submissionsData);
				setError(null);
			} catch (err: any) {
				setError(err?.response?.data?.message || 'Failed to fetch submissions');
				setSubmissions([]);
			} finally {
				setLoading(false);
			}
		};

		if (form) {
			fetchSubmissions();
		}
	}, [formId, form]);

	// Initialize modal states
	useEffect(() => {
		if (paginatedSubmissions.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedSubmissions.length;
			setIsSubmissionViewModalOpen(Array(paginatedSubmissions.length).fill(false));
			setIsSubmissionDeleteModalOpen(Array(paginatedSubmissions.length).fill(false));
		}
	}, [currentPage, paginatedSubmissions.length]);

	const openSubmissionViewModal = (index: number) => {
		const submission = paginatedSubmissions[index];
		setSelectedSubmission(submission);
		setSelectedSubmissionIndex(index);
		const updatedState = [...isSubmissionViewModalOpen];
		updatedState[index] = true;
		setIsSubmissionViewModalOpen(updatedState);
	};

	const closeSubmissionViewModal = (index: number) => {
		const updatedState = [...isSubmissionViewModalOpen];
		updatedState[index] = false;
		setIsSubmissionViewModalOpen(updatedState);
		setSelectedSubmission(null);
		setSelectedSubmissionIndex(-1);
	};

	const openDeleteSubmissionModal = (index: number) => {
		const updatedState = [...isSubmissionDeleteModalOpen];
		updatedState[index] = true;
		setIsSubmissionDeleteModalOpen(updatedState);
		setSubmissionToDelete(paginatedSubmissions[index]);
	};

	const closeDeleteSubmissionModal = (index: number) => {
		const updatedState = [...isSubmissionDeleteModalOpen];
		updatedState[index] = false;
		setIsSubmissionDeleteModalOpen(updatedState);
		setSubmissionToDelete(null);
	};

	const handleDeleteSubmission = async () => {
		if (!submissionToDelete) return;
		try {
			await feedbackFormsService.deleteSubmission(submissionToDelete._id);
			setSubmissions((prev) => prev.filter((s) => s._id !== submissionToDelete._id));
			setSuccessMessage('Submission deleted successfully');
			setSuccessSnackbarOpen(true);

			// Update form submission count if available
			if (form) {
				setForm({ ...form, submissionCount: Math.max(0, (form.submissionCount || 0) - 1) });
			}

			// Close modal
			const index = paginatedSubmissions.findIndex((s) => s._id === submissionToDelete._id);
			if (index !== -1) {
				closeDeleteSubmissionModal(index);
			}
		} catch (error: any) {
			console.error('Delete submission error:', error);
			setErrorMessage(error?.response?.data?.message || 'Failed to delete submission');
			setErrorSnackbarOpen(true);
		}
	};

	const renderFieldValue = (field: any, response: any): React.ReactNode => {
		const value = response.value;

		switch (field.type) {
			case 'rating':
				return (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Rating value={Number(value) || 0} readOnly size='small' />
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{value || 'N/A'}
						</Typography>
					</Box>
				);
			case 'multiple-choice':
				return (
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{value || 'N/A'}
					</Typography>
				);
			case 'checkbox':
				return (
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
						{Array.isArray(value) && value.length > 0 ? (
							value.map((item: string, idx: number) => (
								<Chip key={idx} label={item} size='small' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }} />
							))
						) : (
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>
								N/A
							</Typography>
						)}
					</Box>
				);
			case 'date':
				return (
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{value ? new Date(value).toLocaleDateString() : 'N/A'}
					</Typography>
				);
			case 'textarea':
				return (
					<Typography
						variant='body2'
						sx={{
							fontSize: isMobileSize ? '0.75rem' : '0.85rem',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							maxWidth: '500px',
						}}>
						{value || 'N/A'}
					</Typography>
				);
			default:
				return (
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{value || 'N/A'}
					</Typography>
				);
		}
	};

	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'submitter', label: 'Submitter' },
					{ key: 'submittedAt', label: 'Submitted' },
					{ key: 'actions', label: 'Actions' },
				]
			: [
					{ key: 'submitter', label: 'Submitter' },
					{ key: 'submittedAt', label: 'Submitted At' },
					{ key: 'actions', label: 'Actions' },
				];
	};

	const handleSort = (property: keyof FeedbackFormSubmission | string) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property as string);
	};

	const handleBack = () => {
		if (courseId) {
			const routePrefix = window.location.pathname.includes('/instructor') ? '/instructor' : '/admin';
			navigate(`${routePrefix}/course/${courseId}/forms`);
		} else {
			const routePrefix = window.location.pathname.includes('/instructor') ? '/instructor' : '/admin';
			navigate(`${routePrefix}/forms`);
		}
	};

	const handleDownloadSubmissions = async () => {
		try {
			if (!form || sortedSubmissions.length === 0) {
				setErrorMessage('No submissions to download');
				setErrorSnackbarOpen(true);
				return;
			}

			// Format field value for Excel
			const formatFieldValue = (field: any, response: any): string => {
				if (!response || response.value === undefined || response.value === null) {
					return 'N/A';
				}

				const value = response.value;

				switch (field.type) {
					case 'rating':
						return String(value || 'N/A');
					case 'checkbox':
						return Array.isArray(value) ? value.join(', ') : String(value);
					case 'multiple-choice':
						return String(value);
					case 'date':
						return value ? new Date(value).toLocaleDateString() : 'N/A';
					case 'textarea':
					case 'text':
					default:
						return String(value || 'N/A');
				}
			};

			// Create Excel data
			const excelData = sortedSubmissions.map((submission: FeedbackFormSubmission) => {
				const row: any = {
					'Submitter Name': getSubmitterName(submission),
					'Submitter Email': getSubmitterEmail(submission),
					'Anonymous': submission.isAnonymous ? 'Yes' : 'No',
					'Submitted At': submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A',
				};

				// Add each form field as a column
				form.fields
					.sort((a, b) => a.order - b.order)
					.forEach((field) => {
						const response = submission.responses.find((r) => r.fieldId === field.fieldId);
						row[field.label] = formatFieldValue(field, response);
					});

				return row;
			});

			// Create and download Excel file
			const XLSX = await import('xlsx');
			const ws = XLSX.utils.json_to_sheet(excelData);

			// Auto-fit column widths based on content (approximate fit)
			if (excelData.length > 0) {
				const headers = Object.keys(excelData[0]);
				const cols = headers.map((key) => {
					const headerLength = key.length;
					const maxCellLength = excelData.reduce((max, row) => {
						const cellValue = row[key];
						const cellLength = cellValue === undefined || cellValue === null ? 0 : String(cellValue).length;
						return Math.max(max, cellLength);
					}, headerLength);

					// Add a little padding, clamp to reasonable range
					const width = Math.min(Math.max(maxCellLength + 2, 10), 60);
					return { wch: width };
				});
				(ws as any)['!cols'] = cols;
			}

			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

			// Build filename
			const formTitleForFilename = form.title.replace(/[^a-zA-Z0-9]/g, '_');
			const filename = `${formTitleForFilename}_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`;

			XLSX.writeFile(wb, filename);

			setSuccessMessage('Submissions downloaded successfully');
			setSuccessSnackbarOpen(true);
		} catch (error: any) {
			console.error('Download error:', error);
			setErrorMessage(error?.message || 'Failed to download submissions');
			setErrorSnackbarOpen(true);
		}
	};

	if (loading && !form) {
		return (
			<DashboardPagesLayout pageName='Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={3} />
			</DashboardPagesLayout>
		);
	}

	if (error && !form) {
		return (
			<DashboardPagesLayout pageName='Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ p: 3 }}>
					<Alert severity='error'>{error}</Alert>
				</Box>
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='Form Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', padding: isMobileSize ? '1rem' : '2rem' }}>
					{/* Header with back button and form title */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
						<Box
							sx={{
								'cursor': 'pointer',
								'display': 'flex',
								'alignItems': 'center',
								'&:hover': { opacity: 0.7 },
							}}
							onClick={handleBack}>
							<ArrowBack sx={{ fontSize: isMobileSize ? '1.2rem' : '1.5rem' }} />
						</Box>
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography variant='h5' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', fontWeight: 600, mb: 0.5 }}>
								{form?.title || 'Form Submissions'}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
							<Typography variant='body2' sx={{ color: 'text.secondary', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{submissions.length} {submissions.length === 1 ? 'item' : 'items'}
							</Typography>
							<CustomSubmitButton
								type='button'
								size='small'
								onClick={handleDownloadSubmissions}
								disabled={submissions.length === 0}
								startIcon={<DownloadIcon />}
								sx={{
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									height: isMobileSize ? '1.8rem' : '2rem',
									minWidth: isMobileSize ? 'auto' : '120px',
									padding: isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem',
									mb: '0.5rem',
								}}>
								{isMobileSize ? 'Download' : 'Download All Feedback'}
							</CustomSubmitButton>
						</Box>
					</Box>

					{loading ? (
						<AdminTableSkeleton rows={8} columns={3} />
					) : (
						<>
							<Box sx={{ overflowX: 'auto' }}>
								<Table size='small'>
									<CustomTableHead<FeedbackFormSubmission>
										columns={getColumns(isMobileSize)}
										orderBy={orderBy as keyof FeedbackFormSubmission}
										order={order}
										handleSort={handleSort}
									/>
									<TableBody>
										{paginatedSubmissions.map((submission: FeedbackFormSubmission, index: number) => {
											return (
												<TableRow key={submission._id} hover>
													<CustomTableCell>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																{truncateText(getSubmitterInfo(submission), isMobileSize ? 20 : 40)}
															</Typography>
														</Box>
													</CustomTableCell>
													<CustomTableCell value={submission.submittedAt ? dateTimeFormatter(submission.submittedAt) : 'N/A'} />
													<TableCell sx={{ textAlign: 'center' }}>
														<CustomActionBtn
															title='View Details'
															onClick={() => openSubmissionViewModal(index)}
															icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
														<CustomActionBtn
															title='Delete'
															onClick={() => openDeleteSubmissionModal(index)}
															icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</Box>

							{paginatedSubmissions.length === 0 && (
								<CustomInfoMessageAlignedLeft
									message='No submissions found for this form.'
									sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
								/>
							)}

							{totalPages > 1 && <CustomTablePagination count={totalPages} page={currentPage} onChange={(page) => setCurrentPage(page)} />}
						</>
					)}

					{/* Submission Details Modal */}
					{selectedSubmission && form && (
						<CustomDialog
							openModal={isSubmissionViewModalOpen[selectedSubmissionIndex]}
							closeModal={() => closeSubmissionViewModal(selectedSubmissionIndex)}
							title='Feedback Details'
							maxWidth='sm'>
							<DialogContent>
								<Box sx={{ p: 2 }}>
									{/* Submitter Info */}
									<Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: theme.bgColor?.secondary }}>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', mb: 2, fontWeight: 600 }}>
											Submitter Information
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Person fontSize='small' sx={{ color: 'text.secondary' }} />
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
														Name:
													</Typography>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 500 }}>
														{getSubmitterName(selectedSubmission)}
													</Typography>
												</Box>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Email fontSize='small' sx={{ color: 'text.secondary' }} />
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
														Email:
													</Typography>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 500 }}>
														{getSubmitterEmail(selectedSubmission)}
													</Typography>
												</Box>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<AccessTime fontSize='small' sx={{ color: 'text.secondary' }} />
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
													Submitted At:
												</Typography>
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 500 }}>
													{selectedSubmission.submittedAt ? dateTimeFormatter(selectedSubmission.submittedAt) : 'N/A'}
												</Typography>
											</Box>
										</Box>
									</Paper>

									{/* Responses */}
									<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', mb: 2, fontWeight: 600 }}>
										Responses
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										{form.fields
											.sort((a, b) => a.order - b.order)
											.map((field) => {
												const response = selectedSubmission.responses.find((r) => r.fieldId === field.fieldId);
												return (
													<Paper key={field.fieldId} elevation={1} sx={{ p: 2, backgroundColor: theme.bgColor?.secondary }}>
														<Typography
															variant='body2'
															sx={{
																fontSize: isMobileSize ? '0.8rem' : '0.9rem',
																fontWeight: 600,
																mb: 1,
																display: 'flex',
																alignItems: 'center',
																gap: 0.5,
															}}>
															{field.label}
															{field.required && <span style={{ color: 'red' }}>*</span>}
														</Typography>
														{response ? (
															renderFieldValue(field, response)
														) : (
															<Typography
																variant='body2'
																sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}>
																No response provided
															</Typography>
														)}
													</Paper>
												);
											})}
									</Box>
								</Box>
							</DialogContent>
							<DialogActions sx={{ margin: '0.5rem 0.5rem 0.5rem 0' }}>
								<CustomCancelButton onClick={() => closeSubmissionViewModal(selectedSubmissionIndex)}>Close</CustomCancelButton>
							</DialogActions>
						</CustomDialog>
					)}

					{/* Delete Confirmation Modal */}
					{paginatedSubmissions.map((submission: FeedbackFormSubmission, index: number) => {
						const deleteModalOpen = isSubmissionDeleteModalOpen[index] || false;
						return (
							deleteModalOpen && (
								<CustomDialog
									key={`delete-${submission._id}`}
									openModal={deleteModalOpen}
									closeModal={() => closeDeleteSubmissionModal(index)}
									title='Delete Submission'
									maxWidth='xs'>
									<DialogContent>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
											Are you sure you want to delete this submission?
										</Typography>
										<Box sx={{ mt: 2, p: 2, backgroundColor: theme.bgColor?.secondary, borderRadius: 1 }}>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>
												Submitter: {getSubmitterInfo(submission)}
											</Typography>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary', mt: 1 }}>
												Submitted: {submission.submittedAt ? dateTimeFormatter(submission.submittedAt) : 'N/A'}
											</Typography>
										</Box>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: '1.5rem' }}>
											This action cannot be undone.
										</Typography>
									</DialogContent>
									<CustomDialogActions
										onCancel={() => closeDeleteSubmissionModal(index)}
										deleteBtn={true}
										onDelete={handleDeleteSubmission}
										actionSx={{ mb: '0.5rem' }}
									/>
								</CustomDialog>
							)
						);
					})}

					{/* Success Snackbar */}
					<Snackbar
						open={successSnackbarOpen}
						autoHideDuration={5000}
						anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
						sx={{ mt: '4rem' }}
						onClose={() => setSuccessSnackbarOpen(false)}>
						<Alert
							onClose={() => setSuccessSnackbarOpen(false)}
							severity='success'
							sx={{
								'width': isMobileSize ? '60%' : '100%',
								'backgroundColor': theme.bgColor?.greenSecondary,
								'color': theme.textColor?.common.main,
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'& .MuiAlert-icon': {
									color: 'white',
								},
							}}>
							{successMessage}
						</Alert>
					</Snackbar>

					{/* Error Snackbar */}
					<Snackbar
						open={errorSnackbarOpen}
						autoHideDuration={6000}
						onClose={() => setErrorSnackbarOpen(false)}
						anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
						<Alert onClose={() => setErrorSnackbarOpen(false)} severity='error' sx={{ width: '100%' }}>
							{errorMessage}
						</Alert>
					</Snackbar>
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default FeedbackFormSubmissions;
