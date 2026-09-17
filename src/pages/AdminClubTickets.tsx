import { Alert, Box, Button, Snackbar, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { Delete, KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { clubsService } from '../services/clubsService';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import GenerateClubTicketDialog, {
	ClubOption,
	GenerateClubTicketFormState,
} from '../components/clubs/GenerateClubTicketDialog';
import theme from '../themes';

type ClubTicketRow = {
	_id: string;
	code: string;
	guestName?: string;
	guestEmail?: string;
	clubId?: { title?: string } | string;
	sessionsRemaining?: number;
	sessionsTotal?: number;
	status?: string;
};

const emptyGenerateForm = (): GenerateClubTicketFormState => ({
	clubId: '',
	guestName: '',
	guestEmail: '',
	guestPhone: '',
	sessionsTotal: 1,
	sendEmail: true,
});

const formatStatus = (status?: string) => {
	if (!status) return '—';
	return status.charAt(0).toUpperCase() + status.slice(1);
};

const AdminClubTickets = () => {
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const navigate = useNavigate();

	const [tickets, setTickets] = useState<ClubTicketRow[]>([]);
	const [clubs, setClubs] = useState<ClubOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [code, setCode] = useState('');
	const [email, setEmail] = useState('');
	const [snackOpen, setSnackOpen] = useState(false);
	const [snackMessage, setSnackMessage] = useState('');
	const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('error');

	const [generateOpen, setGenerateOpen] = useState(false);
	const [generateForm, setGenerateForm] = useState<GenerateClubTicketFormState>(emptyGenerateForm());
	const [isGenerating, setIsGenerating] = useState(false);

	const [ticketToDelete, setTicketToDelete] = useState<ClubTicketRow | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const showSnack = (msg: string, severity: 'success' | 'error' = 'error') => {
		setSnackMessage(msg);
		setSnackSeverity(severity);
		setSnackOpen(true);
	};

	const load = async (overrides?: { code?: string; email?: string }) => {
		if (!orgId) return;
		setLoading(true);
		try {
			const params: Record<string, string> = {};
			const codeVal = overrides?.code ?? code;
			const emailVal = overrides?.email ?? email;
			if (codeVal.trim()) params.code = codeVal.trim();
			if (emailVal.trim()) params.email = emailVal.trim();
			const data = await clubsService.getTickets(orgId, params);
			setTickets(data || []);
		} catch {
			showSnack('Failed to load tickets');
		} finally {
			setLoading(false);
		}
	};

	const loadClubs = async () => {
		if (!orgId) return;
		try {
			const res = await clubsService.getAdminClubs(orgId, { limit: 100 });
			const list = (res?.data || []).map((c: { _id: string; title: string }) => ({
				_id: c._id,
				title: c.title,
			}));
			setClubs(list);
		} catch {
			/* club list is only needed for generate dialog */
		}
	};

	useEffect(() => {
		load();
		loadClubs();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- initial load by org
	}, [orgId]);

	const handleSearch = (e?: React.FormEvent) => {
		e?.preventDefault();
		load();
	};

	const handleReset = () => {
		setCode('');
		setEmail('');
		load({ code: '', email: '' });
	};

	const openGenerate = () => {
		setGenerateForm({
			...emptyGenerateForm(),
			clubId: clubs[0]?._id || '',
		});
		setGenerateOpen(true);
	};

	const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!orgId || !generateForm.clubId) return;
		setIsGenerating(true);
		try {
			await clubsService.createTicket(orgId, {
				clubId: generateForm.clubId,
				guestName: generateForm.guestName.trim(),
				guestEmail: generateForm.guestEmail.trim(),
				guestPhone: generateForm.guestPhone.trim() || undefined,
				sessionsTotal: generateForm.sessionsTotal,
				sendEmail: generateForm.sendEmail,
			});
			setGenerateOpen(false);
			setGenerateForm(emptyGenerateForm());
			showSnack('Ticket generated', 'success');
			await load();
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
				'Failed to generate ticket';
			showSnack(msg);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDeleteTicket = async () => {
		if (!ticketToDelete) return;
		setIsDeleting(true);
		try {
			await clubsService.deleteTicket(ticketToDelete._id);
			setTicketToDelete(null);
			showSnack('Ticket deleted', 'success');
			await load();
		} catch {
			showSnack('Failed to delete ticket');
		} finally {
			setIsDeleting(false);
		}
	};

	if (loading && tickets.length === 0) {
		return (
			<AdminPageErrorBoundary pageName='Club Tickets'>
				<DashboardPagesLayout pageName='Club Tickets' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<AdminTableSkeleton />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Club Tickets'>
			<DashboardPagesLayout pageName='Club Tickets' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box
					sx={{
						width: '100%',
						height: '100%',
						pt: isMobileSize ? '1rem' : '1.25rem',
						px: isMobileSize ? '0.75rem' : '1.5rem',
						pb: '2rem',
						boxSizing: 'border-box',
					}}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 1,
							flexWrap: 'wrap',
							mb: '1.25rem',
						}}>
						<Button
							variant='text'
							type='button'
							startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
							onClick={() => navigate('/admin/clubs')}
							sx={{
								'color': theme.textColor?.primary.main,
								'textTransform': 'none',
								'fontFamily': theme.fontFamily?.main,
								'px': 0,
								'minWidth': 0,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}>
							Back to Clubs
						</Button>
						<CustomSubmitButton type='button' onClick={openGenerate} sx={{ mt: 0 }}>
							Generate Ticket
						</CustomSubmitButton>
					</Box>

					<Box
						component='form'
						onSubmit={handleSearch}
						sx={{
							display: 'flex',
							flexWrap: 'wrap',
							alignItems: 'center',
							columnGap: '0.75rem',
							rowGap: '0.75rem',
							mb: '1.5rem',
						}}>
						<CustomTextField
							label='Code'
							required={false}
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							sx={{ width: isMobileSize ? '100%' : '11rem', backgroundColor: '#fff', mb: 0 }}
							InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
						/>
						<CustomTextField
							label='Email'
							type='email'
							required={false}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							sx={{ width: isMobileSize ? '100%' : '16rem', backgroundColor: '#fff', mb: 0 }}
							InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
						/>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<CustomSubmitButton type='submit' disabled={loading}>
								Search
							</CustomSubmitButton>
							{(code || email) && (
								<CustomCancelButton type='button' onClick={handleReset} disabled={loading}>
									Reset
								</CustomCancelButton>
							)}
						</Box>
					</Box>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
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
							aria-label='club tickets table'>
							<CustomTableHead<ClubTicketRow>
								orderBy='code'
								order='asc'
								handleSort={() => { }}
								columns={[
									{ label: 'Code', key: 'code' },
									{ label: 'Guest', key: 'guest' },
									{ label: 'Club', key: 'club' },
									{ label: 'Remaining', key: 'remaining' },
									{ label: 'Status', key: 'status' },
									{ label: 'Actions', key: 'actions' },
								]}
							/>
							<TableBody>
								{tickets.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} align='center' sx={{ py: 3 }}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>
												No tickets found.
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									tickets.map((t) => (
										<TableRow key={t._id} hover>
											<CustomTableCell value={t.code} />
											<CustomTableCell>
												<Box sx={{ width: '100%', textAlign: 'center', minWidth: 0 }}>
													<Typography
														sx={{
															fontSize: isMobileSize ? '0.7rem' : '0.85rem',
															fontWeight: 600,
															lineHeight: 1.3,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
														}}>
														{t.guestName || '—'}
													</Typography>
													<Typography
														sx={{
															fontSize: isMobileSize ? '0.65rem' : '0.75rem',
															color: 'text.secondary',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
														}}>
														{t.guestEmail || ''}
													</Typography>
												</Box>
											</CustomTableCell>
											<CustomTableCell
												value={typeof t.clubId === 'object' ? t.clubId?.title || '—' : t.clubId || '—'}
											/>
											<CustomTableCell value={`${t.sessionsRemaining ?? 0} / ${t.sessionsTotal ?? 0}`} />
											<CustomTableCell value={formatStatus(t.status)} />
											<TableCell align='center'>
												<CustomActionBtn
													title='Delete Ticket'
													onClick={() => setTicketToDelete(t)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Box>
				</Box>

				{generateOpen && (
					<GenerateClubTicketDialog
						isOpen={generateOpen}
						onClose={() => setGenerateOpen(false)}
						onSubmit={handleGenerate}
						form={generateForm}
						setForm={setGenerateForm}
						clubs={clubs}
						isCreating={isGenerating}
					/>
				)}

				{ticketToDelete && (
					<CustomDialog
						openModal={!!ticketToDelete}
						closeModal={() => setTicketToDelete(null)}
						title='Delete Ticket'
						maxWidth='xs'>
						<Box sx={{ px: 3 }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								Delete ticket <strong>{ticketToDelete.code}</strong> for{' '}
								<strong>{ticketToDelete.guestName || ticketToDelete.guestEmail}</strong>?
							</Typography>
							<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary', margin: '1rem 0 0.5rem 0' }}>Active session registrations for this ticket will also be cancelled.</Typography>
						</Box>
						<CustomDialogActions
							deleteBtn
							onCancel={() => setTicketToDelete(null)}
							onDelete={handleDeleteTicket}
							isDeleting={isDeleting}
							deleteBtnText='Delete'
							actionSx={{ marginBottom: '0.5rem' }}
						/>
					</CustomDialog>
				)}

				<Snackbar
					open={snackOpen}
					autoHideDuration={4000}
					onClose={() => setSnackOpen(false)}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
					<Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} variant='filled' sx={{ width: '100%' }}>
						{snackMessage}
					</Alert>
				</Snackbar>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminClubTickets;
