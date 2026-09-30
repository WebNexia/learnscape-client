import {
	Add,
	AssessmentOutlined,
	CampaignOutlined,
	ContentCopy,
	Delete,
	Download,
	Visibility,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Chip,
	CircularProgress,
	DialogActions,
	DialogContent,
	Snackbar,
	Switch,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Tabs,
	Typography,
} from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import { dateTimeFormatter } from '@utils/dateFormatter';
import theme from '../themes';
import AdminSpeakingTestCampaigns from './AdminSpeakingTestCampaigns';

type CampaignRow = {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	isActive: boolean;
	createdAt: string;
	resultCount: number;
};

type ResultRow = {
	_id: string;
	campaignId: string;
	campaignName: string;
	campaignSlug: string;
	name: string;
	email: string;
	phone: string;
	finalLevel?: string;
	approachingLevel?: string;
	headlineScore?: number;
	durationMinutes?: number;
	reportEmailStatus: string;
	createdAt: string;
};

type ResultSkill = {
	id: string;
	label: string;
	correct: number;
	total: number;
	statusLabel?: string;
};

type ResultPassage = {
	level: string;
	kind: string;
	title: string;
	correct: number;
	total: number;
	score?: number;
};

type ResultDetail = ResultRow & {
	resultType?: string;
	contentVersion?: string;
	reportEmailError?: string;
	report?: {
		resultLabel?: string;
		resultBandLabel?: string;
		lead?: string;
		approachingNote?: string;
		headlineScore?: number;
		totals?: { correct: number; total: number };
		skills?: ResultSkill[];
		passages?: ResultPassage[];
	} | null;
};

const resultTypeLabel = (value?: string) => {
	if (value === 'below_a1') return 'Below A1';
	if (value === 'cefr') return 'CEFR';
	return value || '—';
};

const DetailField = ({ label, value }: { label: string; value?: ReactNode }) => (
	<Box>
		<Typography
			sx={{
				fontSize: '0.7rem',
				fontWeight: 700,
				letterSpacing: '0.04em',
				textTransform: 'uppercase',
				color: theme.textColor?.secondary.main,
				mb: 0.4,
			}}>
			{label}
		</Typography>
		<Typography sx={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-word' }}>
			{value || '—'}
		</Typography>
	</Box>
);

const siteBase = () =>
	(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

const reportEmailLabel = (status: string) => {
	if (status === 'sent') return 'Sent';
	if (status === 'failed') return 'Failed';
	if (status === 'pending') return 'Pending';
	return status || '—';
};

type TestSection = 'level' | 'speaking';

const LevelTestAdminShell = ({
	section,
	onSection,
	children,
}: {
	section: TestSection;
	onSection: (section: TestSection) => void;
	children: ReactNode;
}) => (
	<AdminPageErrorBoundary pageName='Level Test Campaigns'>
		<DashboardPagesLayout pageName='Level Test Campaigns' customSettings={{ justifyContent: 'flex-start' }} showCopyRight>
			<Box sx={{ px: { xs: 1, sm: 2.5 }, pt: 1 }}>
				<Tabs
					value={section}
					onChange={(_, value: TestSection) => onSection(value)}
					sx={{
						mb: 1,
						'& .MuiTab-root': { textTransform: 'none', fontWeight: 700 },
					}}>
					<Tab value='level' label='Level Test' />
					<Tab value='speaking' label='Speaking Test' />
				</Tabs>
			</Box>
			{children}
		</DashboardPagesLayout>
	</AdminPageErrorBoundary>
);

const AdminLevelTestCampaigns = () => {
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [section, setSection] = useState<TestSection>('level');

	const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [snackbar, setSnackbar] = useState('');

	const [createOpen, setCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newDescription, setNewDescription] = useState('');
	const [creating, setCreating] = useState(false);

	const [selectedCampaignId, setSelectedCampaignId] = useState<string | 'all'>('all');
	const [results, setResults] = useState<ResultRow[]>([]);
	const [resultsTotal, setResultsTotal] = useState(0);
	const [resultsPage, setResultsPage] = useState(1);
	const [resultsLoading, setResultsLoading] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [campaignToDelete, setCampaignToDelete] = useState<CampaignRow | null>(null);
	const [resultToDelete, setResultToDelete] = useState<ResultRow | null>(null);
	const [resultToView, setResultToView] = useState<ResultRow | null>(null);
	const [resultDetail, setResultDetail] = useState<ResultDetail | null>(null);
	const [resultDetailLoading, setResultDetailLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const resultsLimit = 25;

	const publicLink = useCallback((slug: string) => `${siteBase()}/level-test/c/${slug}`, []);

	const fetchCampaigns = useCallback(async () => {
		if (!orgId) return;
		setLoading(true);
		setError('');
		try {
			const { data } = await axios.get<{ data: CampaignRow[] }>('level-test/campaigns', {
				params: { orgId },
			});
			setCampaigns(data.data || []);
		} catch {
			setError('Kampanyalar yüklenemedi.');
			setCampaigns([]);
		} finally {
			setLoading(false);
		}
	}, [orgId]);

	const fetchResults = useCallback(async () => {
		if (!orgId) return;
		setResultsLoading(true);
		try {
			const { data } = await axios.get<{ data: ResultRow[]; total: number }>(
				'level-test/results',
				{
					params: {
						orgId,
						page: resultsPage,
						limit: resultsLimit,
						...(selectedCampaignId !== 'all' ? { campaignId: selectedCampaignId } : {}),
					},
				},
			);
			setResults(data.data || []);
			setResultsTotal(data.total || 0);
		} catch {
			setResults([]);
			setResultsTotal(0);
		} finally {
			setResultsLoading(false);
		}
	}, [orgId, resultsPage, selectedCampaignId]);

	useEffect(() => {
		void fetchCampaigns();
	}, [fetchCampaigns]);

	useEffect(() => {
		void fetchResults();
	}, [fetchResults]);

	useEffect(() => {
		if (!resultToView) {
			setResultDetail(null);
			setResultDetailLoading(false);
			return;
		}

		let cancelled = false;
		setResultDetailLoading(true);
		void axios
			.get<{ data: ResultDetail }>(`level-test/results/${resultToView._id}`)
			.then(({ data }) => {
				if (!cancelled) setResultDetail(data.data || null);
			})
			.catch(() => {
				if (!cancelled) setResultDetail(null);
			})
			.finally(() => {
				if (!cancelled) setResultDetailLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [resultToView]);

	const selectedCampaign = useMemo(
		() => campaigns.find((c) => c._id === selectedCampaignId) || null,
		[campaigns, selectedCampaignId],
	);

	const viewedResult = resultDetail || resultToView;
	const viewedReport = resultDetail?.report;

	const handleCreate = async () => {
		if (!orgId || newName.trim().length < 2) return;
		setCreating(true);
		try {
			const { data } = await axios.post<{ data: CampaignRow }>('level-test/campaigns', {
				orgId,
				name: newName.trim(),
				description: newDescription.trim(),
			});
			setCampaigns((prev) => [data.data, ...prev]);
			setCreateOpen(false);
			setNewName('');
			setNewDescription('');
			setSnackbar('Kampanya oluşturuldu. Bağlantıyı kopyalayıp öğrencilere gönderebilirsiniz.');
			if (data.data?._id) {
				setSelectedCampaignId(data.data._id);
				setResultsPage(1);
			}
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Kampanya oluşturulamadı.');
		} finally {
			setCreating(false);
		}
	};

	const toggleActive = async (campaign: CampaignRow) => {
		try {
			const { data } = await axios.patch<{ data: CampaignRow }>(
				`level-test/campaigns/${campaign._id}`,
				{ isActive: !campaign.isActive },
			);
			setCampaigns((prev) =>
				prev.map((row) => (row._id === campaign._id ? { ...row, ...data.data } : row)),
			);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Kampanya güncellenemedi.');
		}
	};

	const copyLink = async (slug: string) => {
		try {
			await navigator.clipboard.writeText(publicLink(slug));
			setSnackbar('Bağlantı panoya kopyalandı.');
		} catch {
			setSnackbar(publicLink(slug));
		}
	};

	const handleDeleteCampaign = async () => {
		if (!campaignToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`level-test/campaigns/${campaignToDelete._id}`);
			setCampaigns((prev) => prev.filter((row) => row._id !== campaignToDelete._id));
			if (selectedCampaignId === campaignToDelete._id) {
				setSelectedCampaignId('all');
				setResultsPage(1);
			} else {
				void fetchResults();
			}
			setSnackbar(
				campaignToDelete.resultCount > 0
					? `Kampanya ve ${campaignToDelete.resultCount} sonuç silindi.`
					: 'Kampanya silindi.',
			);
			setCampaignToDelete(null);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Kampanya silinemedi.');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteResult = async () => {
		if (!resultToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`level-test/results/${resultToDelete._id}`);
			setCampaigns((prev) =>
				prev.map((row) =>
					row._id === resultToDelete.campaignId
						? { ...row, resultCount: Math.max(0, (row.resultCount || 0) - 1) }
						: row,
				),
			);
			if (results.length === 1 && resultsPage > 1) {
				setResultsPage((page) => page - 1);
			} else {
				void fetchResults();
			}
			setSnackbar('Sonuç silindi.');
			setResultToDelete(null);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Sonuç silinemedi.');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleExport = async () => {
		if (!orgId) return;
		setExporting(true);
		try {
			const res = await axios.get('level-test/results/export', {
				params: {
					orgId,
					...(selectedCampaignId !== 'all' ? { campaignId: selectedCampaignId } : {}),
				},
				responseType: 'blob',
			});
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const a = document.createElement('a');
			a.href = url;
			a.download = `level-test-results-${selectedCampaign?.slug || 'all'}.csv`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch {
			setError('Export alınamadı.');
		} finally {
			setExporting(false);
		}
	};

	const resultsPages = Math.max(1, Math.ceil(resultsTotal / resultsLimit));
	const activeCampaigns = campaigns.filter((c) => c.isActive).length;
	const campaignResultSum = campaigns.reduce((sum, c) => sum + (c.resultCount || 0), 0);

	const sectionSx = {
		backgroundColor: theme.bgColor?.common || '#fff',
		borderRadius: '0.75rem',
		padding: isMobileSize ? '1rem' : '1.35rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	const tableSx = {
		tableLayout: 'fixed' as const,
		width: '100%',
		'& .MuiTableHead-root': {
			backgroundColor: theme.bgColor?.secondary,
		},
		'& .MuiTableRow-root.Mui-selected': {
			backgroundColor: 'rgba(0, 82, 163, 0.06)',
		},
		'& .MuiTableRow-root.Mui-selected:hover': {
			backgroundColor: 'rgba(0, 82, 163, 0.09)',
		},
	};

	if (section === 'speaking') {
		return (
			<LevelTestAdminShell section={section} onSection={setSection}>
				<AdminSpeakingTestCampaigns />
			</LevelTestAdminShell>
		);
	}

	if (loading) {
		return (
			<LevelTestAdminShell section={section} onSection={setSection}>
				<AdminTableSkeleton />
			</LevelTestAdminShell>
		);
	}

	return (
		<LevelTestAdminShell section={section} onSection={setSection}>
				<Box sx={{ width: '100%', px: isMobileSize ? 1 : 2.5, pb: 4, pt: isMobileSize ? 1 : 1.5 }}>
					{error ? (
						<Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
							{error}
						</Alert>
					) : null}

					<Box
						sx={{
							...sectionSx,
							mb: 2.5,
							display: 'flex',
							flexDirection: { xs: 'column', md: 'row' },
							alignItems: { xs: 'stretch', md: 'center' },
							justifyContent: 'space-between',
							gap: 2,
						}}>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Typography sx={{ fontWeight: 700, fontSize: isMobileSize ? '1rem' : '1.15rem', mb: 0.75, color: '#0f172a' }}>
								Share a private test link
							</Typography>
							<Typography
								sx={{
									color: theme.textColor?.secondary.main,
									maxWidth: 680,
									lineHeight: 1.65,
									fontSize: isMobileSize ? '0.8rem' : '0.9rem',
								}}>
								Create a campaign, copy the link, and send it to a student group. They enter name, email
								and phone, take the test, then results and the PDF report land here automatically.
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
							<Chip label={`${campaigns.length} campaigns`} size='small' sx={{ fontWeight: 600 }} />
							<Chip
								label={`${activeCampaigns} active`}
								size='small'
								color={activeCampaigns > 0 ? 'success' : 'default'}
								variant={activeCampaigns > 0 ? 'filled' : 'outlined'}
							/>
							<Chip label={`${campaignResultSum} results`} size='small' variant='outlined' />
							<CustomSubmitButton startIcon={<Add />} onClick={() => setCreateOpen(true)}>
								New campaign
							</CustomSubmitButton>
						</Box>
					</Box>

					<Box sx={{ ...sectionSx, mb: 2.5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
							<CampaignOutlined sx={{ color: '#0052a3', fontSize: 22 }} />
							<Typography sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.95rem' : '1.05rem' }}>Campaigns</Typography>
						</Box>
						<Box sx={{ overflowX: 'auto' }}>
							<Table size='small' sx={{ ...tableSx, minWidth: 720 }}>
								<CustomTableHead<CampaignRow>
									orderBy='name'
									order='asc'
									handleSort={() => { }}
									columns={[
										{ label: 'Name', key: 'name', align: 'left' },
										...(!isMobileSize ? [{ label: 'Link', key: 'slug', align: 'left' as const }] : []),
										{ label: 'Results', key: 'resultCount' },
										{ label: 'Active', key: 'isActive' },
										{ label: 'Actions', key: 'actions' },
									]}
								/>
								<TableBody>
									{campaigns.length === 0 ? (
										<TableRow>
											<TableCell colSpan={5} sx={{ py: 4, textAlign: 'center', border: 0 }}>
												<Typography sx={{ color: theme.textColor?.secondary.main, mb: 1.5 }}>
													No campaigns yet. Create one and share the link with students.
												</Typography>
												<CustomSubmitButton startIcon={<Add />} onClick={() => setCreateOpen(true)}>
													New campaign
												</CustomSubmitButton>
											</TableCell>
										</TableRow>
									) : (
										campaigns.map((campaign) => (
											<TableRow
												key={campaign._id}
												selected={selectedCampaignId === campaign._id}
												hover
												sx={{ cursor: 'pointer' }}
												onClick={() => {
													setSelectedCampaignId(campaign._id);
													setResultsPage(1);
												}}>
												<TableCell sx={{ textAlign: 'left' }}>
													<Typography sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
														{campaign.name}
													</Typography>
													{campaign.description ? (
														<Typography
															variant='body2'
															sx={{
																color: theme.textColor?.secondary.main,
																fontSize: '0.75rem',
																mt: 0.25,
																display: '-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient: 'vertical',
																overflow: 'hidden',
															}}>
															{campaign.description}
														</Typography>
													) : null}
												</TableCell>
												{!isMobileSize ? (
													<TableCell sx={{ textAlign: 'left' }}>
														<Chip
															label={`/level-test/c/${campaign.slug}`}
															size='small'
															onClick={(e) => {
																e.stopPropagation();
																void copyLink(campaign.slug);
															}}
															sx={{
																maxWidth: '100%',
																fontFamily: 'monospace',
																fontSize: '0.72rem',
																height: 26,
																backgroundColor: 'rgba(0, 82, 163, 0.06)',
																color: '#0052a3',
																'& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
															}}
														/>
													</TableCell>
												) : null}
												<CustomTableCell>
													<Chip
														label={campaign.resultCount}
														size='small'
														sx={{
															minWidth: 36,
															fontWeight: 700,
															backgroundColor:
																selectedCampaignId === campaign._id
																	? 'rgba(0, 82, 163, 0.12)'
																	: 'rgba(15, 23, 42, 0.06)',
														}}
													/>
												</CustomTableCell>
												<TableCell onClick={(e) => e.stopPropagation()} align='center'>
													<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
														<Switch
															checked={campaign.isActive}
															onChange={() => void toggleActive(campaign)}
															size='small'
														/>
														<Typography
															sx={{
																fontSize: '0.75rem',
																fontWeight: 600,
																color: campaign.isActive ? '#15803d' : theme.textColor?.secondary.main,
																minWidth: 28,
															}}>
															{campaign.isActive ? 'On' : 'Off'}
														</Typography>
													</Box>
												</TableCell>
												<TableCell align='center' onClick={(e) => e.stopPropagation()}>
													<Box sx={{ display: 'flex', justifyContent: 'center' }}>
														<CustomActionBtn
															title='Copy link'
															onClick={() => void copyLink(campaign.slug)}
															icon={<ContentCopy fontSize='small' />}
														/>
														<CustomActionBtn
															title='View results'
															onClick={() => {
																setSelectedCampaignId(campaign._id);
																setResultsPage(1);
															}}
															icon={<Visibility fontSize='small' />}
														/>
														<CustomActionBtn
															title='Delete campaign'
															onClick={() => setCampaignToDelete(campaign)}
															icon={<Delete fontSize='small' />}
														/>
													</Box>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Box>
					</Box>

					<Box sx={sectionSx}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: 1,
								flexWrap: 'wrap',
								mb: 1.5,
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
								<AssessmentOutlined sx={{ color: '#0052a3', fontSize: 22 }} />
								<Typography sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.95rem' : '1.05rem' }}>Results</Typography>
								<Chip
									label={
										selectedCampaignId === 'all'
											? 'All campaigns'
											: selectedCampaign?.name || 'Campaign'
									}
									onDelete={
										selectedCampaignId === 'all'
											? undefined
											: () => {
												setSelectedCampaignId('all');
												setResultsPage(1);
											}
									}
									size='small'
									sx={{ fontWeight: 600 }}
								/>
								<Chip
									label={`${resultsTotal} total`}
									size='small'
									variant='outlined'
									onClick={() => {
										setSelectedCampaignId('all');
										setResultsPage(1);
									}}
								/>
							</Box>
							<CustomSubmitButton
								startIcon={<Download />}
								onClick={() => void handleExport()}
								disabled={exporting || resultsTotal === 0}>
								{exporting ? 'Exporting…' : 'Export CSV'}
							</CustomSubmitButton>
						</Box>

						<Box sx={{ overflowX: 'auto' }}>
							{resultsLoading ? (
								<AdminTableSkeleton />
							) : (
								<Table size='small' sx={{ ...tableSx, minWidth: 800 }}>
									<CustomTableHead<ResultRow>
										orderBy='createdAt'
										order='desc'
										handleSort={() => { }}
										columns={[
											...(!isMobileSize && selectedCampaignId === 'all'
												? [{ label: 'Campaign', key: 'campaignName', align: 'left' as const }]
												: []),
											{ label: 'Name', key: 'name', align: 'left' },
											{ label: 'Email', key: 'email', align: 'left' },
											...(!isMobileSize ? [{ label: 'Phone', key: 'phone' }] : []),
											{ label: 'Level', key: 'finalLevel' },
											...(!isMobileSize ? [{ label: 'Score', key: 'headlineScore' }] : []),
											{ label: 'Report', key: 'reportEmailStatus' },
											{ label: 'Date', key: 'createdAt' },
											{ label: 'Actions', key: 'actions' },
										]}
									/>
									<TableBody>
										{results.length === 0 ? (
											<TableRow>
												<TableCell colSpan={9} sx={{ py: 4, textAlign: 'center', border: 0 }}>
													<Typography sx={{ color: theme.textColor?.secondary.main }}>
														No results for this filter yet.
													</Typography>
												</TableCell>
											</TableRow>
										) : (
											results.map((row) => (
												<TableRow key={row._id} hover>
													{!isMobileSize && selectedCampaignId === 'all' ? (
														<CustomTableCell value={row.campaignName} align='left' />
													) : null}
													<CustomTableCell value={row.name} align='left' />
													<CustomTableCell value={row.email} align='left' />
													{!isMobileSize ? <CustomTableCell value={row.phone} /> : null}
													<CustomTableCell>
														<Chip
															size='small'
															label={
																row.finalLevel
																	? `${row.finalLevel}${row.approachingLevel ? ` → ${row.approachingLevel}` : ''}`
																	: '—'
															}
															sx={{
																fontWeight: 700,
																backgroundColor: row.finalLevel ? 'rgba(0, 82, 163, 0.08)' : 'rgba(15, 23, 42, 0.05)',
																color: row.finalLevel ? '#0052a3' : theme.textColor?.secondary.main,
															}}
														/>
													</CustomTableCell>
													{!isMobileSize ? (
														<CustomTableCell
															value={typeof row.headlineScore === 'number' ? `%${row.headlineScore}` : '—'}
														/>
													) : null}
													<CustomTableCell>
														<Chip
															size='small'
															label={reportEmailLabel(row.reportEmailStatus)}
															color={
																row.reportEmailStatus === 'sent'
																	? 'success'
																	: row.reportEmailStatus === 'failed'
																		? 'error'
																		: 'default'
															}
															sx={{ fontWeight: 600, textTransform: 'capitalize' }}
														/>
													</CustomTableCell>
													<CustomTableCell value={dateTimeFormatter(row.createdAt)} />
													<TableCell align='center'>
														<Box sx={{ display: 'flex', justifyContent: 'center' }}>
															<CustomActionBtn
																title='View details'
																onClick={() => setResultToView(row)}
																icon={<Visibility fontSize='small' />}
															/>
															<CustomActionBtn
																title='Delete result'
																onClick={() => setResultToDelete(row)}
																icon={<Delete fontSize='small' />}
															/>
														</Box>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							)}
						</Box>

						{resultsTotal > resultsLimit ? (
							<Box sx={{ mt: 2 }}>
								<CustomTablePagination
									count={resultsPages}
									page={resultsPage}
									onChange={setResultsPage}
								/>
							</Box>
						) : null}
					</Box>
				</Box>

				<CustomDialog
					openModal={createOpen}
					closeModal={() => !creating && setCreateOpen(false)}
					maxWidth='sm'
					title='New level-test campaign'>
					<DialogContent>
						<CustomTextField
							label='Campaign name'
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							sx={{ mt: '0.35rem' }}
							InputProps={{ inputProps: { maxLength: 80 } }}
							required
						/>
						<CustomTextField
							label='Description (optional)'
							value={newDescription}
							onChange={(e) => setNewDescription(e.target.value)}
							multiline
							rows={2}
							InputProps={{ inputProps: { maxLength: 250 } }}
						/>
						<Typography variant='body2' sx={{ color: theme.textColor?.secondary, mt: 1 }}>
							Slug kampanya adından otomatik üretilir. Bağlantı:
							<code> /level-test/c/…</code>
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => setCreateOpen(false)}
						onSubmit={() => void handleCreate()}
						submitBtnText='Create'
						disableBtn={creating || newName.trim().length < 2}
						disableCancelBtn={creating}
						isSubmitting={creating}
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>

				{campaignToDelete ? (
					<CustomDialog
						openModal={!!campaignToDelete}
						closeModal={() => !isDeleting && setCampaignToDelete(null)}
						title='Delete campaign'
						maxWidth='xs'>
						<Box sx={{ px: 3 }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: 1 }}>
								Are you sure you want to delete <strong>{campaignToDelete.name}</strong>?
							</Typography>
							<Typography
								sx={{
									fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									color: 'text.secondary',
									margin: '1rem 0 0.5rem 0',
								}}>
								{campaignToDelete.resultCount > 0
									? `This will also permanently delete ${campaignToDelete.resultCount} result${campaignToDelete.resultCount === 1 ? '' : 's'
									}.`
									: 'This campaign has no results yet.'}
							</Typography>
						</Box>
						<CustomDialogActions
							deleteBtn
							onCancel={() => setCampaignToDelete(null)}
							onDelete={() => void handleDeleteCampaign()}
							isDeleting={isDeleting}
							deleteBtnText='Delete'
							actionSx={{ marginBottom: '0.5rem' }}
						/>
					</CustomDialog>
				) : null}

				{resultToView ? (
					<CustomDialog
						openModal={!!resultToView}
						closeModal={() => setResultToView(null)}
						title='Result details'
						maxWidth='sm'>
						<DialogContent>
							{viewedResult ? (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
									<Box>
										<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.25 }}>
											Contact
										</Typography>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: isMobileSize ? '1fr' : '1fr 1fr',
												gap: 1.5,
											}}>
											<DetailField label='Name' value={viewedResult.name} />
											<DetailField label='Email' value={viewedResult.email} />
											<DetailField label='Phone' value={viewedResult.phone} />
											<DetailField
												label='Campaign'
												value={viewedResult.campaignName || viewedResult.campaignSlug}
											/>
										</Box>
									</Box>

									<Box>
										<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.25 }}>
											Result
										</Typography>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: isMobileSize ? '1fr' : '1fr 1fr',
												gap: 1.5,
											}}>
											<DetailField
												label='Level'
												value={
													viewedResult.finalLevel
														? `${viewedResult.finalLevel}${viewedResult.approachingLevel
															? ` → ${viewedResult.approachingLevel}`
															: ''
														}`
														: resultTypeLabel(resultDetail?.resultType)
												}
											/>
											<DetailField
												label='Score'
												value={
													typeof viewedResult.headlineScore === 'number'
														? `%${viewedResult.headlineScore}`
														: '—'
												}
											/>
											<DetailField
												label='Duration'
												value={
													typeof viewedResult.durationMinutes === 'number'
														? `${viewedResult.durationMinutes} min`
														: '—'
												}
											/>
											<DetailField
												label='Date'
												value={dateTimeFormatter(viewedResult.createdAt)}
											/>
											<DetailField
												label='Report email'
												value={reportEmailLabel(viewedResult.reportEmailStatus)}
											/>
											<DetailField
												label='Result type'
												value={resultTypeLabel(resultDetail?.resultType)}
											/>
										</Box>
										{resultDetail?.reportEmailError ? (
											<Typography
												sx={{
													mt: 1.25,
													fontSize: '0.8rem',
													color: '#b42318',
													wordBreak: 'break-word',
												}}>
												Email error: {resultDetail.reportEmailError}
											</Typography>
										) : null}
										{viewedReport?.lead ? (
											<Typography
												sx={{
													mt: 1.5,
													fontSize: '0.85rem',
													color: theme.textColor?.secondary.main,
													lineHeight: 1.5,
												}}>
												{viewedReport.lead}
											</Typography>
										) : null}
										{viewedReport?.approachingNote ? (
											<Typography
												sx={{
													mt: 0.75,
													fontSize: '0.85rem',
													color: theme.textColor?.secondary.main,
													lineHeight: 1.5,
												}}>
												{viewedReport.approachingNote}
											</Typography>
										) : null}
									</Box>

									{resultDetailLoading ? (
										<Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
											<CircularProgress size={22} />
										</Box>
									) : null}

									{viewedReport?.skills && viewedReport.skills.length > 0 ? (
										<Box>
											<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.25 }}>
												Skills
												{viewedReport.totals
													? ` · ${viewedReport.totals.correct}/${viewedReport.totals.total}`
													: ''}
											</Typography>
											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
												{viewedReport.skills.map((skill) => (
													<Box
														key={skill.id}
														sx={{
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'center',
															gap: 1,
														}}>
														<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
															{skill.label}
														</Typography>
														<Chip
															size='small'
															label={`${skill.correct}/${skill.total}${skill.statusLabel ? ` · ${skill.statusLabel}` : ''
																}`}
															sx={{ fontWeight: 600 }}
														/>
													</Box>
												))}
											</Box>
										</Box>
									) : null}

									{viewedReport?.passages && viewedReport.passages.length > 0 ? (
										<Box>
											<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.25 }}>
												Passages
											</Typography>
											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
												{viewedReport.passages.map((passage) => (
													<Box
														key={`${passage.level}-${passage.kind}`}
														sx={{
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'center',
															gap: 1,
														}}>
														<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
															{passage.title}
														</Typography>
														<Chip
															size='small'
															label={`${passage.correct}/${passage.total}${typeof passage.score === 'number'
																? ` · %${passage.score}`
																: ''
																}`}
															sx={{ fontWeight: 600 }}
														/>
													</Box>
												))}
											</Box>
										</Box>
									) : null}
								</Box>
							) : null}
						</DialogContent>
						<DialogActions>
							<CustomCancelButton
								onClick={() => setResultToView(null)}
								sx={{ margin: '0 1rem 1rem 0' }}>
								Close
							</CustomCancelButton>
						</DialogActions>
					</CustomDialog>
				) : null}

				{resultToDelete ? (
					<CustomDialog
						openModal={!!resultToDelete}
						closeModal={() => !isDeleting && setResultToDelete(null)}
						title='Delete result'
						maxWidth='xs'>
						<Box sx={{ px: 3 }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: 1 }}>
								Are you sure you want to delete the result for{' '}
								<strong>{resultToDelete.name || resultToDelete.email}</strong>?
							</Typography>
							<Typography
								sx={{
									fontSize: isMobileSize ? '0.7rem' : '0.8rem',
									color: 'text.secondary',
									margin: '1rem 0 0.5rem 0',
								}}>
								{resultToDelete.email}
								{resultToDelete.campaignName ? ` · ${resultToDelete.campaignName}` : ''}
							</Typography>
						</Box>
						<CustomDialogActions
							deleteBtn
							onCancel={() => setResultToDelete(null)}
							onDelete={() => void handleDeleteResult()}
							isDeleting={isDeleting}
							deleteBtnText='Delete'
							actionSx={{ marginBottom: '0.5rem' }}
						/>
					</CustomDialog>
				) : null}

				<Snackbar
					open={Boolean(snackbar)}
					autoHideDuration={4000}
					onClose={() => setSnackbar('')}
					message={snackbar}
				/>
			</LevelTestAdminShell>
	);
};

export default AdminLevelTestCampaigns;
