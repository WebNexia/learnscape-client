import { useCallback, useContext, useEffect, useState } from 'react';
import {
	Box,
	CircularProgress,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { Delete, Download, Refresh } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import theme from '../../themes';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export type CourseWaitingListEntry = {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	country: string;
	countryCode: string;
	joinedAt?: string;
	createdAt?: string;
};

type Props = {
	courseId?: string;
};

const CourseWaitingListAdminPanel = ({ courseId }: Props) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [entries, setEntries] = useState<CourseWaitingListEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [exporting, setExporting] = useState(false);

	const load = useCallback(async () => {
		if (!courseId) return;
		setLoading(true);
		setError('');
		try {
			const res = await axios.get(`${base_url}/courseWaitingList/course/${courseId}`);
			setEntries(Array.isArray(res.data?.entries) ? res.data.entries : []);
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Failed to load waiting list.');
			setEntries([]);
		} finally {
			setLoading(false);
		}
	}, [courseId]);

	useEffect(() => {
		load();
	}, [load]);

	const handleExport = async () => {
		if (!courseId) return;
		setExporting(true);
		try {
			const res = await axios.get(`${base_url}/courseWaitingList/course/${courseId}/excel`, {
				responseType: 'blob',
			});
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `waiting_list_${courseId}.xlsx`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch {
			setError('Excel export failed.');
		} finally {
			setExporting(false);
		}
	};

	const handleDelete = async (entryId: string) => {
		if (!window.confirm('Remove this person from the waiting list?')) return;
		try {
			await axios.delete(`${base_url}/courseWaitingList/${entryId}`);
			setEntries((prev) => prev.filter((e) => e._id !== entryId));
		} catch (err: any) {
			setError(err?.response?.data?.message || 'Delete failed.');
		}
	};

	const formatDate = (value?: string) => {
		if (!value) return '—';
		try {
			return new Date(value).toLocaleString();
		} catch {
			return value;
		}
	};

	return (
		<Box
			sx={{
				mt: '2rem',
				width: '100%',
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: '0.5rem',
				p: isMobileSize ? '1rem' : '1.25rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileSize ? 'column' : 'row',
					justifyContent: 'space-between',
					alignItems: isMobileSize ? 'flex-start' : 'center',
					gap: 1,
					mb: '1rem',
				}}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
					Waiting List ({entries.length})
				</Typography>
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					<CustomSubmitButton
						onClick={load}
						disabled={loading || !courseId}
						startIcon={<Refresh sx={{ fontSize: '1rem' }} />}
						sx={{ textTransform: 'capitalize', fontSize: isMobileSize ? '0.75rem' : '0.85rem', py: '0.25rem' }}>
						Refresh
					</CustomSubmitButton>
					<CustomSubmitButton
						onClick={handleExport}
						disabled={exporting || loading || !courseId || entries.length === 0}
						startIcon={<Download sx={{ fontSize: '1rem' }} />}
						sx={{ textTransform: 'capitalize', fontSize: isMobileSize ? '0.75rem' : '0.85rem', py: '0.25rem' }}>
						Excel
					</CustomSubmitButton>
				</Box>
			</Box>

			{error ? <CustomErrorMessage sx={{ mb: 1 }}>{error}</CustomErrorMessage> : null}

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
					<CircularProgress size={28} />
				</Box>
			) : entries.length === 0 ? (
				<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>
					No waiting list entries yet.
				</Typography>
			) : (
				<Box sx={{ width: '100%', overflowX: 'auto' }}>
					<Table size='small'>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>Name</TableCell>
								<TableCell sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>Email</TableCell>
								<TableCell sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>Phone</TableCell>
								<TableCell sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>Country</TableCell>
								<TableCell sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>Joined</TableCell>
								<TableCell sx={{ fontWeight: 700, fontSize: isMobileSize ? '0.7rem' : '0.8rem' }} align='right'>
									
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{entries.map((entry) => (
								<TableRow key={entry._id} hover>
									<TableCell sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
										{entry.firstName} {entry.lastName}
									</TableCell>
									<TableCell sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>{entry.email}</TableCell>
									<TableCell sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>{entry.phone}</TableCell>
									<TableCell sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
										{entry.country} ({entry.countryCode})
									</TableCell>
									<TableCell sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
										{formatDate(entry.joinedAt || entry.createdAt)}
									</TableCell>
									<TableCell align='right'>
										<IconButton size='small' aria-label='Remove' onClick={() => handleDelete(entry._id)} sx={{ color: 'error.main' }}>
											<Delete fontSize='small' />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Box>
			)}
		</Box>
	);
};

export default CourseWaitingListAdminPanel;
