import { Box, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Club } from '../interfaces/club';
import { Delete, Edit, ConfirmationNumber } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CreateClubDialog, { CreateClubFormState } from '../components/clubs/CreateClubDialog';
import { clubsService } from '../services/clubsService';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyForm = (): CreateClubFormState => ({
	title: '',
	description: '',
	daysOfWeek: [1],
	startTime: '19:00',
	durationMinutes: 60,
	defaultCapacity: 12,
	timezone: 'Europe/Istanbul',
});

const AdminClubs = () => {
	const navigate = useNavigate();
	const { orgId } = useContext(OrganisationContext);
	const { isOwner, isSuperAdmin } = useAuth();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [clubs, setClubs] = useState<Club[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchValue, setSearchValue] = useState('');
	const [filterValue, setFilterValue] = useState('');
	const [searchedValue, setSearchedValue] = useState('');
	const [isSearchActive, setIsSearchActive] = useState(false);

	const [createOpen, setCreateOpen] = useState(false);
	const [form, setForm] = useState<CreateClubFormState>(emptyForm());
	const [isCreating, setIsCreating] = useState(false);
	const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const load = async () => {
		if (!orgId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await clubsService.getAdminClubs(orgId, { limit: 100 });
			setClubs(res.data || []);
		} catch {
			setError('Failed to load clubs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [orgId]);

	const displayClubs = useMemo(() => {
		let list = [...clubs];
		if (filterValue === 'active') list = list.filter((c) => c.isActive);
		if (filterValue === 'inactive') list = list.filter((c) => !c.isActive);
		if (isSearchActive && searchedValue.trim()) {
			const q = searchedValue.trim().toLowerCase();
			list = list.filter(
				(c) =>
					c.title?.toLowerCase().includes(q) ||
					c.description?.toLowerCase().includes(q),
			);
		}
		return list;
	}, [clubs, filterValue, isSearchActive, searchedValue]);

	const openCreate = () => {
		setForm(emptyForm());
		setCreateOpen(true);
	};

	const closeCreate = () => {
		setCreateOpen(false);
		setForm(emptyForm());
		setIsCreating(false);
	};

	const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!orgId || !form.title.trim() || form.daysOfWeek.length === 0) return;
		setIsCreating(true);
		try {
			await clubsService.createClub({
				orgId,
				title: form.title.trim(),
				description: form.description.trim(),
				schedule: {
					daysOfWeek: form.daysOfWeek,
					startTime: form.startTime,
					durationMinutes: form.durationMinutes,
					timezone: form.timezone || 'Europe/Istanbul',
				},
				defaultCapacity: form.defaultCapacity,
			});
			setSnackbarMessage('Club created successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			closeCreate();
			await load();
		} catch (err: any) {
			setSnackbarMessage(err?.response?.data?.error || 'Failed to create club');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsCreating(false);
		}
	};

	const handleDelete = async () => {
		if (!clubToDelete) return;
		setIsDeleting(true);
		try {
			await clubsService.deleteClub(clubToDelete._id);
			setSnackbarMessage('Club deleted successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setClubToDelete(null);
			await load();
		} catch {
			setSnackbarMessage('Failed to delete club');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSearch = () => {
		setSearchedValue(searchValue);
		setIsSearchActive(true);
	};

	const resetSearch = () => {
		setSearchValue('');
		setSearchedValue('');
		setIsSearchActive(false);
	};

	const resetFilter = () => setFilterValue('');

	const resetAll = () => {
		resetSearch();
		resetFilter();
	};

	if (loading && clubs.length === 0) {
		return (
			<AdminPageErrorBoundary pageName='Clubs'>
				<DashboardPagesLayout pageName='Clubs' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<AdminTableSkeleton />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	if (error && clubs.length === 0) {
		return (
			<AdminPageErrorBoundary pageName='Clubs'>
				<DashboardPagesLayout pageName='Clubs' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<CustomInfoMessageAlignedLeft message={error} sx={{ marginTop: '5rem' }} />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Clubs'>
			<DashboardPagesLayout pageName='Clubs' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={setFilterValue}
						filterOptions={[
							{ value: '', label: 'All Clubs' },
							{ value: 'active', label: 'Active Clubs' },
							{ value: 'inactive', label: 'Inactive Clubs' },
						]}
						filterPlaceholder='Filter Clubs'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in title, description'
						isSearchActive={isSearchActive}
						searchResultsTotalItems={displayClubs.length}
						totalItems={clubs.length}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: 'Tickets',
								onClick: () => navigate('/admin/clubs/tickets'),
								startIcon: <ConfirmationNumber fontSize='small' />,
							},
							{
								label: 'New Club',
								onClick: openCreate,
							},
						]}
						isSticky={true}
					/>

					{createOpen && (
						<CreateClubDialog
							isOpen={createOpen}
							onClose={closeCreate}
							onSubmit={handleCreate}
							form={form}
							setForm={setForm}
							isCreating={isCreating}
						/>
					)}

					{clubToDelete && (
						<CustomDialog
							openModal={!!clubToDelete}
							closeModal={() => setClubToDelete(null)}
							title='Delete Club'
							maxWidth='xs'>
							<Box sx={{ px: 3 }}>
								<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: 1 }}>
									Are you sure you want to delete <strong>{clubToDelete.title}</strong>?
								</Typography>
								<Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', color: 'text.secondary', margin: '1rem 0 0.5rem 0' }}>
									This will also remove its session packs.
								</Typography>
							</Box>
							<CustomDialogActions
								deleteBtn
								onCancel={() => setClubToDelete(null)}
								onDelete={handleDelete}
								isDeleting={isDeleting}
								deleteBtnText='Delete'
								actionSx={{ marginBottom: '0.5rem' }}
							/>
						</CustomDialog>
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
								'& .MuiTableHead-root': {
									backgroundColor: theme.bgColor?.secondary,
								},
							}}
							size='small'
							aria-label='clubs table'>
							<CustomTableHead<Club>
								orderBy='title'
								order='asc'
								handleSort={() => { }}
								columns={[
									{ label: 'Title', key: 'title' },
									{ label: 'Schedule', key: 'schedule' },
									{ label: 'Capacity', key: 'defaultCapacity' },
									{ label: 'Packs', key: 'packs' },
									{ label: 'Status', key: 'isActive' },
									{ label: 'Actions', key: 'actions' },
								]}
							/>
							<TableBody>
								{displayClubs.map((club) => (
									<TableRow key={club._id} hover>
										<CustomTableCell value={club.title} />
										<CustomTableCell
											value={`${(club.schedule?.daysOfWeek || [])
												.map((d) => DAY_LABELS[d] || d)
												.join(', ')} ${club.schedule?.startTime || ''}`}
										/>
										<CustomTableCell value={club.defaultCapacity} />
										<CustomTableCell value={club.packs?.length || 0} />
										<CustomTableCell value={club.isActive ? 'Active' : 'Inactive'} />
										<TableCell
											sx={{
												textAlign: 'center',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '0.5rem',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => navigate(`/admin/clubs/${club._id}`)}
												icon={
													<Edit
														fontSize='small'
														sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }}
													/>
												}
											/>
											{(isOwner || isSuperAdmin) && (
												<CustomActionBtn
													title='Delete'
													onClick={() => setClubToDelete(club)}
													icon={
														<Delete
															fontSize='small'
															sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }}
														/>
													}
												/>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						{displayClubs.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={
									isSearchActive || filterValue
										? 'No clubs found matching your criteria.'
										: 'No clubs found.'
								}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}
					</Box>
				</Box>

				<Snackbar
					open={snackbarOpen}
					autoHideDuration={3500}
					onClose={() => setSnackbarOpen(false)}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
					<Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant='filled' sx={{ width: '100%' }}>
						{snackbarMessage}
					</Alert>
				</Snackbar>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminClubs;
