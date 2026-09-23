import {
	Add,
	ContentCopy,
	Download,
	Visibility,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Chip,
	DialogActions,
	DialogContent,
	FormControlLabel,
	Snackbar,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import { dateTimeFormatter } from '@utils/dateFormatter';
import theme from '../themes';

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

const siteBase = () =>
	(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

const AdminLevelTestCampaigns = () => {
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

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

	const selectedCampaign = useMemo(
		() => campaigns.find((c) => c._id === selectedCampaignId) || null,
		[campaigns, selectedCampaignId],
	);

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

	if (loading) {
		return (
			<DashboardPagesLayout pageName='Level Test Campaigns' customSettings={{ justifyContent: 'flex-start' }} showCopyRight>
				<AdminTableSkeleton />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Level Test Campaigns'>
			<DashboardPagesLayout pageName='Level Test Campaigns' customSettings={{ justifyContent: 'flex-start' }} showCopyRight>
				<Box sx={{ width: '100%', px: isMobileSize ? 1 : 2, pb: 4 }}>
					{error ? (
						<Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
							{error}
						</Alert>
					) : null}

					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: 1,
							flexWrap: 'wrap',
							mb: 2,
						}}>
						<Typography sx={{ color: theme.textColor?.secondary, maxWidth: 640 }}>
							Öğrenci grupları için kampanya oluşturun, özel bağlantıyı paylaşın. Öğrenciler
							isim/e-posta/telefon girip teste başlar; sonuçlar burada listelenir ve PDF rapor
							otomatik e-posta gider.
						</Typography>
						<CustomSubmitButton startIcon={<Add />} onClick={() => setCreateOpen(true)}>
							New campaign
						</CustomSubmitButton>
					</Box>

					<Box sx={{ overflowX: 'auto', mb: 4 }}>
						<Table size='small' sx={{ minWidth: 720 }}>
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									{!isMobileSize ? <TableCell>Link</TableCell> : null}
									<TableCell>Results</TableCell>
									<TableCell>Active</TableCell>
									<TableCell align='right'>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{campaigns.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5}>
											<Typography sx={{ py: 2, color: theme.textColor?.secondary }}>
												Henüz kampanya yok. Yeni bir kampanya oluşturup bağlantıyı paylaşın.
											</Typography>
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
											<TableCell>
												<Typography sx={{ fontWeight: 700 }}>{campaign.name}</Typography>
												{campaign.description ? (
													<Typography variant='body2' sx={{ color: theme.textColor?.secondary }}>
														{campaign.description}
													</Typography>
												) : null}
											</TableCell>
											{!isMobileSize ? (
												<TableCell>
													<Typography
														variant='body2'
														sx={{
															fontFamily: 'monospace',
															fontSize: '0.8rem',
															wordBreak: 'break-all',
														}}>
														/level-test/c/{campaign.slug}
													</Typography>
												</TableCell>
											) : null}
											<TableCell>{campaign.resultCount}</TableCell>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<FormControlLabel
													control={
														<Switch
															checked={campaign.isActive}
															onChange={() => void toggleActive(campaign)}
															size='small'
														/>
													}
													label={campaign.isActive ? 'On' : 'Off'}
												/>
											</TableCell>
											<TableCell align='right' onClick={(e) => e.stopPropagation()}>
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
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Box>

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
							<Typography variant='h6' sx={{ fontWeight: 700 }}>
								Results
							</Typography>
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
							<Table size='small' sx={{ minWidth: 800 }}>
								<TableHead>
									<TableRow>
										{!isMobileSize && selectedCampaignId === 'all' ? (
											<TableCell>Campaign</TableCell>
										) : null}
										<TableCell>Name</TableCell>
										<TableCell>Email</TableCell>
										{!isMobileSize ? <TableCell>Phone</TableCell> : null}
										<TableCell>Level</TableCell>
										{!isMobileSize ? <TableCell>Score</TableCell> : null}
										<TableCell>Email</TableCell>
										<TableCell>Date</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{results.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8}>
												<Typography sx={{ py: 2, color: theme.textColor?.secondary }}>
													Bu filtre için henüz sonuç yok.
												</Typography>
											</TableCell>
										</TableRow>
									) : (
										results.map((row) => (
											<TableRow key={row._id}>
												{!isMobileSize && selectedCampaignId === 'all' ? (
													<TableCell>{row.campaignName}</TableCell>
												) : null}
												<TableCell>{row.name}</TableCell>
												<TableCell>{row.email}</TableCell>
												{!isMobileSize ? <TableCell>{row.phone}</TableCell> : null}
												<TableCell>
													{row.finalLevel || '—'}
													{row.approachingLevel ? ` → ${row.approachingLevel}` : ''}
												</TableCell>
												{!isMobileSize ? (
													<TableCell>
														{typeof row.headlineScore === 'number' ? `%${row.headlineScore}` : '—'}
													</TableCell>
												) : null}
												<TableCell>
													<Chip
														size='small'
														label={row.reportEmailStatus}
														color={
															row.reportEmailStatus === 'sent'
																? 'success'
																: row.reportEmailStatus === 'failed'
																	? 'error'
																	: 'default'
														}
													/>
												</TableCell>
												<TableCell>{dateTimeFormatter(row.createdAt)}</TableCell>
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
					<DialogActions>
						<CustomCancelButton onClick={() => setCreateOpen(false)} disabled={creating}>
							Cancel
						</CustomCancelButton>
						<CustomSubmitButton
							onClick={() => void handleCreate()}
							disabled={creating || newName.trim().length < 2}>
							{creating ? 'Creating…' : 'Create'}
						</CustomSubmitButton>
					</DialogActions>
				</CustomDialog>

				<Snackbar
					open={Boolean(snackbar)}
					autoHideDuration={4000}
					onClose={() => setSnackbar('')}
					message={snackbar}
				/>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminLevelTestCampaigns;
