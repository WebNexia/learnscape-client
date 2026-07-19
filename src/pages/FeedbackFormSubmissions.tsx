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
	CircularProgress,
} from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Delete, Visibility, ArrowBack, Person, Email, Download as DownloadIcon, AccessTime } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { FeedbackFormSubmission, FeedbackFormSubmissionSummary } from '../interfaces/feedbackFormSubmission';
import { FeedbackForm } from '../interfaces/feedbackForm';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { dateTimeFormatter } from '../utils/dateFormatter';
import { feedbackFormsService } from '../services/feedbackFormsService';
import { useQuery } from 'react-query';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { Rating } from '@mui/material';
import { truncateText } from '../utils/utilText';

const FeedbackFormSubmissions = () => {
	const { formId, courseId } = useParams<{ formId: string; courseId?: string }>();
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [form, setForm] = useState<FeedbackForm | null>(null);
	const [submissions, setSubmissions] = useState<FeedbackFormSubmissionSummary[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successSnackbarOpen, setSuccessSnackbarOpen] = useState<boolean>(false);
	const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);
	const [isDownloading, setIsDownloading] = useState<boolean>(false);

	// Modal states
	const [selectedSubmission, setSelectedSubmission] = useState<FeedbackFormSubmissionSummary | null>(null);
	const [submissionToDelete, setSubmissionToDelete] = useState<FeedbackFormSubmissionSummary | null>(null);

	const {
		data: selectedSubmissionDetail,
		isLoading: isSubmissionDetailLoading,
		isError: isSubmissionDetailError,
	} = useQuery<FeedbackFormSubmission>(
		['feedbackFormSubmission', selectedSubmission?._id],
		() => feedbackFormsService.getSubmissionById(selectedSubmission!._id),
		{
			enabled: !!selectedSubmission?._id,
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		}
	);

	// Helper functions for submitter info
	const getSubmitterName = (submission: FeedbackFormSubmissionSummary | FeedbackFormSubmission): string => {
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

	const getSubmitterEmail = (submission: FeedbackFormSubmissionSummary | FeedbackFormSubmission): string => {
		if (submission.isAnonymous) {
			return submission.userEmail || 'N/A';
		}
		if (typeof submission.userId === 'object' && submission.userId) {
			return (submission.userId as any).email || 'N/A';
		}
		return submission.userEmail || 'N/A';
	};

	const getSubmitterInfo = (submission: FeedbackFormSubmissionSummary | FeedbackFormSubmission): string => {
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
	const sortedFormFields = useMemo(() => [...(form?.fields || [])].sort((a, b) => a.order - b.order), [form?.fields]);
	const selectedResponsesByFieldId = useMemo(
		() => new Map((selectedSubmissionDetail?.responses || []).map((response) => [response.fieldId, response])),
		[selectedSubmissionDetail?.responses]
	);

	// Form metadata and lightweight submission summaries are independent.
	useEffect(() => {
		let cancelled = false;

		const fetchPageData = async () => {
			if (!formId) {
				setError('Form ID is required');
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const [formData, submissionSummaries] = await Promise.all([
					feedbackFormsService.getFeedbackFormById(formId),
					feedbackFormsService.getFormSubmissionSummaries(formId),
				]);
				if (cancelled) return;
				setForm(formData);
				setSubmissions(submissionSummaries);
				setError(null);
			} catch (err: any) {
				if (cancelled) return;
				setError(err?.response?.data?.message || 'Failed to fetch form details');
				setSubmissions([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchPageData();
		return () => {
			cancelled = true;
		};
	}, [formId]);

	const openSubmissionViewModal = (submission: FeedbackFormSubmissionSummary) => {
		setSelectedSubmission(submission);
	};

	const closeSubmissionViewModal = () => {
		setSelectedSubmission(null);
	};

	const openDeleteSubmissionModal = (submission: FeedbackFormSubmissionSummary) => {
		setSubmissionToDelete(submission);
	};

	const closeDeleteSubmissionModal = () => {
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

			closeDeleteSubmissionModal();
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
				{ key: 'submitter', label: 'Submitter', width: '42%', align: 'center' as const },
				{ key: 'submittedAt', label: 'Submitted', width: '38%', align: 'center' as const },
				{ key: 'actions', label: 'Actions', width: '20%', align: 'center' as const },
			]
			: [
				{ key: 'submitter', label: 'Submitter', width: '50%', align: 'center' as const },
				{ key: 'submittedAt', label: 'Submitted At', width: '32%', align: 'center' as const },
				{ key: 'actions', label: 'Actions', width: '18%', align: 'center' as const },
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
			if (!form || submissions.length === 0) {
				setErrorMessage('No submissions to download');
				setErrorSnackbarOpen(true);
				return;
			}

			setIsDownloading(true);
			const blob = await feedbackFormsService.exportSubmissions(formId!);
			const downloadUrl = window.URL.createObjectURL(blob);
			const formTitleForFilename = form.title.replace(/[^a-zA-Z0-9]/g, '_');
			const filename = `${formTitleForFilename}_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`;

			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(downloadUrl);

			setSuccessMessage('Submissions downloaded successfully');
			setSuccessSnackbarOpen(true);
		} catch (error: any) {
			console.error('Download error:', error);
			setErrorMessage(error?.message || 'Failed to download submissions');
			setErrorSnackbarOpen(true);
		} finally {
			setIsDownloading(false);
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
								disabled={submissions.length === 0 || isDownloading}
								startIcon={<DownloadIcon />}
								sx={{
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									height: isMobileSize ? '1.8rem' : '2rem',
									minWidth: isMobileSize ? 'auto' : '120px',
									padding: isMobileSize ? '0.25rem 0.5rem' : '0.5rem 1rem',
									mb: '0.5rem',
								}}>
								{isDownloading ? 'Downloading...' : isMobileSize ? 'Download' : 'Download All Feedback'}
							</CustomSubmitButton>
						</Box>
					</Box>

					{loading ? (
						<AdminTableSkeleton rows={8} columns={3} />
					) : (
						<>
							<Box sx={{ overflowX: 'auto' }}>
								<Table
									size='small'
									sx={{
										tableLayout: 'fixed',
										width: '100%',
										'& .MuiTableCell-root': {
											padding: isMobileSize ? '0.5rem 0.75rem' : '0.75rem 1rem',
											verticalAlign: 'middle',
											textAlign: 'center',
										},
										'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
											width: isMobileSize ? '42%' : '50%',
										},
										'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
											width: isMobileSize ? '38%' : '32%',
										},
										'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
											width: isMobileSize ? '20%' : '18%',
										},
									}}>
									<CustomTableHead<FeedbackFormSubmissionSummary>
										columns={getColumns(isMobileSize)}
										orderBy={orderBy as keyof FeedbackFormSubmissionSummary}
										order={order}
										handleSort={handleSort}
									/>
									<TableBody>
										{paginatedSubmissions.map((submission: FeedbackFormSubmissionSummary) => {
											return (
												<TableRow key={submission._id} hover>
													<CustomTableCell align='center'>
														<Typography
															variant='body2'
															sx={{
																fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
																width: '100%',
																textAlign: 'center',
															}}>
															{truncateText(getSubmitterInfo(submission), isMobileSize ? 20 : 40)}
														</Typography>
													</CustomTableCell>
													<CustomTableCell
														align='center'
														value={submission.submittedAt ? dateTimeFormatter(submission.submittedAt) : 'N/A'}
													/>
													<TableCell align='center' sx={{ textAlign: 'center' }}>
														<CustomActionBtn
															title='View Details'
															onClick={() => openSubmissionViewModal(submission)}
															icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
														<CustomActionBtn
															title='Delete'
															onClick={() => openDeleteSubmissionModal(submission)}
															icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</Box>

							<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
								{paginatedSubmissions.length === 0 && (
									<CustomInfoMessageAlignedLeft
										message='No submissions found for this form.'
										sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
									/>
								)}
							</Box>

							{totalPages > 1 && <CustomTablePagination count={totalPages} page={currentPage} onChange={(page) => setCurrentPage(page)} />}
						</>
					)}

					{/* Submission Details Modal */}
					{selectedSubmission && form && (
						<CustomDialog
							openModal={true}
							closeModal={closeSubmissionViewModal}
							title='Feedback Details'
							maxWidth='sm'>
							<DialogContent>
								{isSubmissionDetailLoading ? (
									<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
										<CircularProgress size={28} />
									</Box>
								) : isSubmissionDetailError || !selectedSubmissionDetail ? (
									<Alert severity='error'>Failed to load submission details.</Alert>
								) : (
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
														{getSubmitterName(selectedSubmissionDetail)}
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
														{getSubmitterEmail(selectedSubmissionDetail)}
													</Typography>
												</Box>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<AccessTime fontSize='small' sx={{ color: 'text.secondary' }} />
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
													Submitted At:
												</Typography>
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 500 }}>
													{selectedSubmissionDetail.submittedAt ? dateTimeFormatter(selectedSubmissionDetail.submittedAt) : 'N/A'}
												</Typography>
											</Box>
										</Box>
									</Paper>

									{/* Responses */}
									<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', mb: 2, fontWeight: 600 }}>
										Responses
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										{sortedFormFields.map((field) => {
												const response = selectedResponsesByFieldId.get(field.fieldId);
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
								)}
							</DialogContent>
							<DialogActions sx={{ margin: '0.5rem 0.5rem 0.5rem 0' }}>
								<CustomCancelButton onClick={closeSubmissionViewModal}>Close</CustomCancelButton>
							</DialogActions>
						</CustomDialog>
					)}

					{/* Delete Confirmation Modal */}
					{submissionToDelete && (
						<CustomDialog openModal={true} closeModal={closeDeleteSubmissionModal} title='Delete Submission' maxWidth='xs'>
							<DialogContent>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
									Are you sure you want to delete this submission?
								</Typography>
								<Box sx={{ mt: 2, p: 2, backgroundColor: theme.bgColor?.secondary, borderRadius: 1 }}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>
										Submitter: {getSubmitterInfo(submissionToDelete)}
									</Typography>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary', mt: 1 }}>
										Submitted: {submissionToDelete.submittedAt ? dateTimeFormatter(submissionToDelete.submittedAt) : 'N/A'}
									</Typography>
								</Box>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: '1.5rem' }}>
									This action cannot be undone.
								</Typography>
							</DialogContent>
							<CustomDialogActions
								onCancel={closeDeleteSubmissionModal}
								deleteBtn={true}
								onDelete={handleDeleteSubmission}
								actionSx={{ mb: '0.5rem' }}
							/>
						</CustomDialog>
					)}

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
