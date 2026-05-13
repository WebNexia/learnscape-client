import { useCallback, useContext, useEffect, useState } from 'react';
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axios from '@utils/axiosInstance';
import { dateTimeFormatter } from '@utils/dateFormatter';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';
import CustomTablePagination from '../layouts/table/CustomTablePagination';

export type ResourceDownloadLeadRow = {
	_id: string;
	email: string;
	documentName: string;
	documentId: string;
	marketingOptIn: boolean;
	createdAt: string;
};

type Props = {
	open: boolean;
	onClose: () => void;
	orgId: string | null;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const ResourceDownloadLeadsDialog = ({ open, onClose, orgId }: Props) => {
	const { user } = useContext(UserAuthContext);
	const canHardDelete = user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN;

	const [rows, setRows] = useState<ResourceDownloadLeadRow[]>([]);
	const [total, setTotal] = useState(0);
	const [totalUniqueEmails, setTotalUniqueEmails] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState<number>(25);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);
	const [confirmLeadId, setConfirmLeadId] = useState<string | null>(null);
	const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deletingAll, setDeletingAll] = useState(false);

	const fetchPage = useCallback(async () => {
		if (!orgId || !open) return;
		setLoading(true);
		setError(null);
		const p = page;
		try {
			const { data } = await axios.get<{
				data: ResourceDownloadLeadRow[];
				total: number;
				totalUniqueEmails?: number;
				page: number;
				totalPages: number;
			}>('marketing-consent/resource-download-leads', { params: { orgId, page: p, limit } });
			const list = data.data || [];
			const tot = data.total ?? 0;
			setRows(list);
			setTotal(tot);
			setTotalUniqueEmails(typeof data.totalUniqueEmails === 'number' ? data.totalUniqueEmails : 0);
			if (list.length === 0 && tot > 0 && p > 1) {
				setPage(p - 1);
			}
		} catch {
			setError('Failed to load list.');
			setRows([]);
			setTotal(0);
			setTotalUniqueEmails(0);
		} finally {
			setLoading(false);
		}
	}, [orgId, open, page, limit]);

	useEffect(() => {
		if (open && orgId) {
			setPage(1);
		}
	}, [open, orgId, limit]);

	useEffect(() => {
		fetchPage();
	}, [fetchPage]);

	const handleExportCsv = async () => {
		if (!orgId) return;
		setExporting(true);
		setError(null);
		try {
			const res = await axios.get('marketing-consent/resource-download-leads/export', {
				params: { orgId },
				responseType: 'blob',
			});
			const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `lp-resource-download-leads-${orgId}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch {
			setError('Could not download CSV.');
		} finally {
			setExporting(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!orgId || !confirmLeadId) return;
		setDeletingId(confirmLeadId);
		setError(null);
		try {
			await axios.delete(`marketing-consent/resource-download-leads/${confirmLeadId}`, {
				params: { orgId },
			});
			setConfirmLeadId(null);
			await fetchPage();
		} catch {
			setError('Could not delete the record. Check your permissions or that the record still exists.');
		} finally {
			setDeletingId(null);
		}
	};

	const handleConfirmDeleteAll = async () => {
		if (!orgId) return;
		setDeletingAll(true);
		setError(null);
		try {
			await axios.delete('marketing-consent/resource-download-leads', {
				params: { orgId },
			});
			setConfirmDeleteAll(false);
			setRows([]);
			setTotal(0);
			setTotalUniqueEmails(0);
			setPage(1);
		} catch {
			setError('Bulk delete failed. Check your permissions.');
		} finally {
			setDeletingAll(false);
		}
	};

	const totalPages = Math.max(1, Math.ceil(total / limit));
	const emptyColSpan = canHardDelete ? 5 : 4;
	const busy = Boolean(deletingId) || deletingAll;

	return (
		<>
			<DialogContent sx={{ pt: 2, minHeight: 280 }}>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
					<Typography variant='body2' color='text.secondary' sx={{ flex: '1 1 200px' }}>
						Emails from free landing-page resource downloads (Download). Total records: <strong>{total}</strong>, unique emails:{' '}
						<strong>{totalUniqueEmails}</strong>
					</Typography>
					<FormControl size='small' sx={{ minWidth: 160 }} disabled={loading || busy}>
						<InputLabel id='resource-leads-page-size'>Rows per page</InputLabel>
						<Select
							labelId='resource-leads-page-size'
							label='Rows per page'
							value={limit}
							onChange={(e) => setLimit(Number(e.target.value))}>
							{PAGE_SIZE_OPTIONS.map((n) => (
								<MenuItem key={n} value={n}>
									{n} per page
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				{error && (
					<Typography color='error' sx={{ mb: 1 }}>
						{error}
					</Typography>
				)}
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={36} />
					</Box>
				) : (
					<Table size='small' stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>Email</TableCell>
								<TableCell>Resource</TableCell>
								<TableCell>Marketing opt-in</TableCell>
								<TableCell>Date</TableCell>
								{canHardDelete && <TableCell align='right'>Delete</TableCell>}
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={emptyColSpan}>
										<Typography variant='body2' color='text.secondary'>
											No records yet.
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								rows.map((r) => (
									<TableRow key={r._id}>
										<TableCell>{r.email}</TableCell>
										<TableCell>{r.documentName || '—'}</TableCell>
										<TableCell>
											{r.marketingOptIn ? (
												<Chip size='small' label='Yes' color='success' variant='outlined' />
											) : (
												<Chip size='small' label='No' variant='outlined' />
											)}
										</TableCell>
										<TableCell>{r.createdAt ? dateTimeFormatter(r.createdAt) : '—'}</TableCell>
										{canHardDelete && (
											<TableCell align='right' sx={{ width: 56, py: 0.5 }}>
												<Tooltip title='Delete permanently'>
													<span>
														<IconButton
															size='small'
															color='error'
															disabled={busy}
															onClick={() => setConfirmLeadId(r._id)}
															aria-label='Delete permanently'>
															<DeleteOutlineIcon fontSize='small' />
														</IconButton>
													</span>
												</Tooltip>
											</TableCell>
										)}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				)}
				{total > 0 && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
						<CustomTablePagination count={totalPages} page={page} onChange={(value) => setPage(value)} />
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
				<Button onClick={onClose} variant='outlined' disabled={busy}>
					Close
				</Button>
				{canHardDelete && (
					<Button
						variant='outlined'
						color='error'
						startIcon={deletingAll ? <CircularProgress size={18} color='inherit' /> : <DeleteSweepIcon />}
						disabled={!orgId || total === 0 || busy || exporting}
						onClick={() => setConfirmDeleteAll(true)}>
						Delete all
					</Button>
				)}
				<Button
					variant='contained'
					startIcon={exporting ? <CircularProgress size={18} color='inherit' /> : <DownloadIcon />}
					disabled={!orgId || exporting || busy || total === 0}
					onClick={handleExportCsv}>
					Download CSV
				</Button>
			</DialogActions>

			<Dialog open={Boolean(confirmLeadId)} onClose={() => !busy && setConfirmLeadId(null)} maxWidth='xs' fullWidth>
				<DialogTitle>Permanently delete record?</DialogTitle>
				<DialogContent>
					<Typography variant='body2'>
						This cannot be undone. The resource download lead will be permanently removed from the database.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setConfirmLeadId(null)} disabled={busy} variant='outlined'>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color='error'
						variant='contained'
						disabled={busy}
						startIcon={deletingId ? <CircularProgress size={18} color='inherit' /> : undefined}>
						Delete permanently
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={confirmDeleteAll} onClose={() => !deletingAll && setConfirmDeleteAll(false)} maxWidth='xs' fullWidth>
				<DialogTitle>Delete all records?</DialogTitle>
				<DialogContent>
					<Typography variant='body2'>
						<strong>{total}</strong> record(s) (<strong>{totalUniqueEmails}</strong> unique email(s)) will be permanently deleted. This
						cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setConfirmDeleteAll(false)} disabled={deletingAll} variant='outlined'>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDeleteAll}
						color='error'
						variant='contained'
						disabled={deletingAll}
						startIcon={deletingAll ? <CircularProgress size={18} color='inherit' /> : undefined}>
						Delete all
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ResourceDownloadLeadsDialog;
