import {
	Alert,
	Box,
	Checkbox,
	Collapse,
	FormControlLabel,
	IconButton,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { clubsService } from '../services/clubsService';
import { Club, ClubPack, ClubPrice, ClubSession } from '../interfaces/club';
import { DocumentDetailBlock } from '../interfaces/document';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CreateClubPackDialog from '../components/clubs/CreateClubPackDialog';
import ClubPaper from '../components/clubs/ClubPaper';
import DocumentDetailBlocksEditor from '../components/documents/DocumentDetailBlocksEditor';
import HandleImageUploadURL from '../components/forms/uploadImageVideoDocument/HandleImageUploadURL';
import ImageThumbnail from '../components/forms/uploadImageVideoDocument/ImageThumbnail';
import { clubEditorScope } from '../utils/editorImageScopes';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import { Delete, ExpandMore, OpenInNew } from '@mui/icons-material';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import { useStickyPaper } from '../hooks/useStickyPaper';
import theme from '../themes';

const emptyPrices = () => ({
	GBP: { currency: 'gbp', amount: '' } as ClubPrice,
	USD: { currency: 'usd', amount: '' } as ClubPrice,
	EUR: { currency: 'eur', amount: '' } as ClubPrice,
	TRY: { currency: 'try', amount: '' } as ClubPrice,
});

const formatPackPrices = (prices: ClubPrice[] = []) =>
	prices
		.filter((p) => p.amount !== '' && p.amount != null)
		.map((p) => `${setCurrencySymbol(p.currency)}${p.amount}`)
		.join(' · ') || '—';

const serializeDetailBlocksForApi = (blocks: DocumentDetailBlock[] | undefined) =>
	(blocks || []).map(({ rowKey: _rowKey, ...rest }) => rest);

const ensureBlockKeys = (blocks: DocumentDetailBlock[] | undefined): DocumentDetailBlock[] =>
	(blocks || []).map((b) => (b.rowKey ? b : { ...b, rowKey: generateUniqueId('clubblk_') }));

const AdminClubDetail = () => {
	const { id } = useParams();
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { isSticky } = useStickyPaper(isMobileSize);

	const [club, setClub] = useState<Club | null>(null);
	const [sessions, setSessions] = useState<ClubSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [capacityEdits, setCapacityEdits] = useState<Record<string, number>>({});

	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editCoverUrl, setEditCoverUrl] = useState('');
	const [editIsActive, setEditIsActive] = useState(true);
	const [editDetailBlocks, setEditDetailBlocks] = useState<DocumentDetailBlock[]>([]);
	const [enterCoverUrl, setEnterCoverUrl] = useState(true);
	const [isSavingLanding, setIsSavingLanding] = useState(false);

	const [bulkWeeks, setBulkWeeks] = useState(4);
	const [isBulkCreating, setIsBulkCreating] = useState(false);

	const [packDialogOpen, setPackDialogOpen] = useState(false);
	const [isCreatingPack, setIsCreatingPack] = useState(false);
	const [sessionCount, setSessionCount] = useState(1);
	const [packLabel, setPackLabel] = useState('');
	const [GBP, setGBP] = useState<ClubPrice>(emptyPrices().GBP);
	const [USD, setUSD] = useState<ClubPrice>(emptyPrices().USD);
	const [EUR, setEUR] = useState<ClubPrice>(emptyPrices().EUR);
	const [TRY, setTRY] = useState<ClubPrice>(emptyPrices().TRY);

	const [packToDelete, setPackToDelete] = useState<ClubPack | null>(null);
	const [isDeletingPack, setIsDeletingPack] = useState(false);

	const [sessionToDelete, setSessionToDelete] = useState<ClubSession | null>(null);
	const [isDeletingSession, setIsDeletingSession] = useState(false);

	const [regsOpen, setRegsOpen] = useState(false);
	const [regs, setRegs] = useState<any[]>([]);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const [landingExpanded, setLandingExpanded] = useState(true);
	const [packsExpanded, setPacksExpanded] = useState(true);
	const [sessionsExpanded, setSessionsExpanded] = useState(true);

	const showSnack = (msg: string, severity: 'success' | 'error' = 'success') => {
		setSnackbarMessage(msg);
		setSnackbarSeverity(severity);
		setSnackbarOpen(true);
	};

	const hydrateEditForm = (found: Club) => {
		setEditTitle(found.title || '');
		setEditDescription(found.description || '');
		setEditCoverUrl(found.coverImageUrl || '');
		setEditIsActive(found.isActive !== false);
		setEditDetailBlocks(ensureBlockKeys(found.detailBlocks));
	};

	const load = async () => {
		if (!id || !orgId) return;
		setLoading(true);
		try {
			const found = await clubsService.getClubAdmin(id);
			setClub(found);
			hydrateEditForm(found);
			const sess = await clubsService.getSessions(id);
			setSessions(sess || []);
			setCapacityEdits({});
		} catch {
			showSnack('Failed to load club', 'error');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [id, orgId]);

	const handleSaveLanding = async () => {
		if (!id) return;
		if (!editTitle.trim()) {
			showSnack('Title is required', 'error');
			return;
		}
		setIsSavingLanding(true);
		try {
			const updated = await clubsService.updateClub(id, {
				title: editTitle.trim(),
				description: editDescription.trim(),
				coverImageUrl: editCoverUrl.trim() || '',
				isActive: editIsActive,
				detailBlocks: serializeDetailBlocksForApi(editDetailBlocks),
			});
			setClub((prev) => (prev ? { ...prev, ...updated, packs: prev.packs } : updated));
			hydrateEditForm({ ...(club as Club), ...updated, packs: club?.packs });
			showSnack('Landing page content saved');
		} catch (err: any) {
			showSnack(err?.response?.data?.error || 'Failed to save club', 'error');
		} finally {
			setIsSavingLanding(false);
		}
	};

	const resetPackForm = () => {
		setSessionCount(1);
		setPackLabel('');
		const p = emptyPrices();
		setGBP(p.GBP);
		setUSD(p.USD);
		setEUR(p.EUR);
		setTRY(p.TRY);
		setIsCreatingPack(false);
	};

	const openPackDialog = () => {
		resetPackForm();
		setPackDialogOpen(true);
	};

	const handleCreatePack = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!id) return;
		const prices = [
			{ currency: 'gbp', amount: GBP.amount },
			{ currency: 'usd', amount: USD.amount },
			{ currency: 'eur', amount: EUR.amount },
			{ currency: 'try', amount: TRY.amount },
		].filter((p) => p.amount !== '' && p.amount != null);

		if (prices.length < 4) {
			showSnack('All currencies are required', 'error');
			return;
		}

		setIsCreatingPack(true);
		try {
			await clubsService.createPack(id, {
				sessionCount,
				label: packLabel.trim() || `${sessionCount} Session`,
				prices,
			});
			showSnack('Pack created successfully');
			setPackDialogOpen(false);
			resetPackForm();
			await load();
		} catch (err: any) {
			showSnack(err?.response?.data?.error || 'Failed to create pack', 'error');
		} finally {
			setIsCreatingPack(false);
		}
	};

	const handleDeletePack = async () => {
		if (!id || !packToDelete) return;
		setIsDeletingPack(true);
		try {
			await clubsService.deletePack(id, packToDelete._id);
			showSnack('Pack deleted successfully');
			setPackToDelete(null);
			await load();
		} catch (err: any) {
			showSnack(err?.response?.data?.error || 'Failed to delete pack', 'error');
		} finally {
			setIsDeletingPack(false);
		}
	};

	const handleDeleteSession = async () => {
		if (!id || !sessionToDelete) return;
		setIsDeletingSession(true);
		try {
			const res = await clubsService.deleteSession(id, sessionToDelete._id);
			const restored = res?.restoredTickets ?? 0;
			showSnack(
				restored > 0
					? `Session deleted. ${restored} ticket entitlement(s) restored.`
					: 'Session deleted',
			);
			setSessionToDelete(null);
			if (selectedSessionId === sessionToDelete._id) {
				setRegsOpen(false);
				setSelectedSessionId(null);
				setRegs([]);
			}
			await load();
		} catch (err: any) {
			showSnack(err?.response?.data?.error || 'Failed to delete session', 'error');
		} finally {
			setIsDeletingSession(false);
		}
	};

	const handleBulk = async () => {
		if (!id) return;
		setIsBulkCreating(true);
		try {
			const res = await clubsService.bulkCreateSessions(id, { weeks: bulkWeeks });
			showSnack(`${res.count || 0} session(s) created`);
			await load();
		} catch (err: any) {
			showSnack(err?.response?.data?.error || 'Bulk create failed', 'error');
		} finally {
			setIsBulkCreating(false);
		}
	};

	const openRegs = async (sessionId: string) => {
		setSelectedSessionId(sessionId);
		try {
			const data = await clubsService.getRegistrations(sessionId);
			setRegs(data || []);
			setRegsOpen(true);
		} catch {
			showSnack('Failed to load registrations', 'error');
		}
	};

	const cancelReg = async (registrationId: string) => {
		try {
			await clubsService.cancelRegistration(registrationId);
			showSnack('Registration cancelled; credit restored');
			if (selectedSessionId) await openRegs(selectedSessionId);
			await load();
		} catch {
			showSnack('Cancel failed', 'error');
		}
	};

	const updateCapacity = async (sessionId: string, capacity: number) => {
		if (!id) return;
		try {
			await clubsService.updateSession(id, sessionId, { capacity });
			await load();
		} catch {
			showSnack('Failed to update capacity', 'error');
		}
	};

	if (loading && !club) {
		return (
			<AdminPageErrorBoundary pageName='Club'>
				<DashboardPagesLayout pageName='Club' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<AdminTableSkeleton />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	if (!club) {
		return (
			<AdminPageErrorBoundary pageName='Club'>
				<DashboardPagesLayout pageName='Club' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<Typography sx={{ p: 2 }}>Club not found</Typography>
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	const sectionSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		padding: isMobileSize ? '1rem' : '1.25rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	return (
		<AdminPageErrorBoundary pageName={club.title}>
			<DashboardPagesLayout pageName='Edit Club' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
					<ClubPaper
						title={editTitle || club.title}
						isActive={editIsActive}
						isSaving={isSavingLanding}
						onSave={handleSaveLanding}
					/>
				</Box>

				<Box
					sx={{
						display: 'flex',
						width: '95%',
						justifyContent: 'center',
						marginTop: isSticky && isMobileSize ? '3.5rem' : '9rem',
						pb: 4,
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							width: '95%',
						}}>
					<Box sx={{ ...sectionSx, mb: '2rem' }}>
						<Box
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 1,
								mb: landingExpanded ? '0.75rem' : 0,
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
								<Tooltip title={landingExpanded ? 'Collapse' : 'Expand'} placement='top' arrow>
									<IconButton
										size='small'
										onClick={() => setLandingExpanded((prev) => !prev)}
										aria-expanded={landingExpanded}
										aria-label={`${landingExpanded ? 'Collapse' : 'Expand'} landing page`}
										sx={{
											transform: landingExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
											transition: 'transform 0.3s ease',
										}}>
										<ExpandMore fontSize='small' />
									</IconButton>
								</Tooltip>
								<Typography
									variant='h6'
									onClick={() => setLandingExpanded((prev) => !prev)}
									sx={{
										fontSize: isMobileSize ? '0.9rem' : '1rem',
										cursor: 'pointer',
										userSelect: 'none',
										m: 0,
									}}>
									Landing Page
								</Typography>
							</Box>
						</Box>
						<Collapse in={landingExpanded} timeout='auto' unmountOnExit>
							<CustomTextField
								fullWidth
								label='Title'
								value={editTitle}
								onChange={(e) => setEditTitle(e.target.value)}
								sx={{ mb: 2, backgroundColor: '#fff' }}
							/>
							<CustomTextField
								fullWidth
								label='Short description'
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								multiline
								rows={3}
								sx={{ mb: 2, backgroundColor: '#fff' }}
							/>
							<FormControlLabel
								control={<Checkbox checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} size='small' />}
								label='Active on landing page'
								sx={{ mb: 2 }}
							/>
							<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row', gap: 2, mb: 2, alignItems: 'flex-start' }}>
								<Box sx={{ flex: 1, width: '100%' }}>
									<HandleImageUploadURL
										label='Cover image'
										onImageUploadLogic={(url) => setEditCoverUrl(url)}
										onChangeImgUrl={(e) => setEditCoverUrl(e.target.value)}
										imageUrlValue={editCoverUrl}
										imageFolderName='ClubImages'
										scopedEntityId={club._id}
										enterImageUrl={enterCoverUrl}
										setEnterImageUrl={setEnterCoverUrl}
									/>
								</Box>
								<ImageThumbnail
									imgSource={editCoverUrl || 'https://placehold.co/300x400/e2e8f0/64748b?text=Cover'}
									removeImage={() => setEditCoverUrl('')}
									boxStyle={{ width: '8rem', height: '10rem' }}
									imgStyle={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
								/>
							</Box>
							<DocumentDetailBlocksEditor
								entityId={club._id}
								blocks={editDetailBlocks}
								onChange={setEditDetailBlocks}
								imageFolderName='ClubDetailImages'
								imageScopedEntityId={clubEditorScope(club._id)}
								heading='Club detail page content'
								helpText='Build the public club detail page in order. Place images between text sections. Section body uses rich text.'
								inlineImagesHint=''
							/>
						</Collapse>
					</Box>

					{/* Packs */}
					<Box sx={{ ...sectionSx, mb: '2rem' }}>
						<Box
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 1,
								mb: packsExpanded ? '0.75rem' : 0,
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
								<Tooltip title={packsExpanded ? 'Collapse' : 'Expand'} placement='top' arrow>
									<IconButton
										size='small'
										onClick={() => setPacksExpanded((prev) => !prev)}
										aria-expanded={packsExpanded}
										aria-label={`${packsExpanded ? 'Collapse' : 'Expand'} session packs`}
										sx={{
											transform: packsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
											transition: 'transform 0.3s ease',
										}}>
										<ExpandMore fontSize='small' />
									</IconButton>
								</Tooltip>
								<Typography
									variant='h6'
									onClick={() => setPacksExpanded((prev) => !prev)}
									sx={{
										fontSize: isMobileSize ? '0.9rem' : '1rem',
										cursor: 'pointer',
										userSelect: 'none',
										m: 0,
									}}>
									Session Packs
									{(club.packs || []).length > 0 ? (
										<Typography
											component='span'
											variant='body2'
											color='text.secondary'
											sx={{ ml: 1, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											({(club.packs || []).length})
										</Typography>
									) : null}
								</Typography>
							</Box>
							<CustomSubmitButton
								onClick={() => {
									setPacksExpanded(true);
									openPackDialog();
								}}
								sx={{ mt: 0 }}>
								New Pack
							</CustomSubmitButton>
						</Box>

						<Collapse in={packsExpanded} timeout='auto' unmountOnExit>
							<Table size='small' sx={{ tableLayout: 'fixed', width: '100%' }}>
								<CustomTableHead<ClubPack>
									orderBy='sessionCount'
									order='asc'
									handleSort={() => {}}
									columns={[
										{ label: 'Label', key: 'label' },
										{ label: 'Sessions', key: 'sessionCount' },
										{ label: 'Prices', key: 'prices' },
										{ label: 'Status', key: 'isActive' },
										{ label: 'Actions', key: 'actions' },
									]}
								/>
								<TableBody>
									{(club.packs || []).length === 0 ? (
										<TableRow>
											<TableCell colSpan={5} align='center'>
												<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', py: 2 }}>
													No packs yet. Create one to start selling sessions.
												</Typography>
											</TableCell>
										</TableRow>
									) : (
										(club.packs || []).map((p) => (
											<TableRow key={p._id} hover>
												<CustomTableCell value={p.label || `${p.sessionCount} Session`} />
												<CustomTableCell value={p.sessionCount} />
												<CustomTableCell value={formatPackPrices(p.prices)} />
												<CustomTableCell value={p.isActive ? 'Active' : 'Inactive'} />
												<TableCell sx={{ textAlign: 'center' }}>
													<CustomActionBtn
														title='Delete Pack'
														onClick={() => setPackToDelete(p)}
														icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Collapse>
					</Box>

					{/* Sessions */}
					<Box sx={{ ...sectionSx, mb: '2rem' }}>
						<Box
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 1,
								mb: sessionsExpanded ? '0.75rem' : 0,
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flexWrap: 'wrap' }}>
								<Tooltip title={sessionsExpanded ? 'Collapse' : 'Expand'} placement='top' arrow>
									<IconButton
										size='small'
										onClick={() => setSessionsExpanded((prev) => !prev)}
										aria-expanded={sessionsExpanded}
										aria-label={`${sessionsExpanded ? 'Collapse' : 'Expand'} sessions`}
										sx={{
											transform: sessionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
											transition: 'transform 0.3s ease',
										}}>
										<ExpandMore fontSize='small' />
									</IconButton>
								</Tooltip>
								<Typography
									variant='h6'
									onClick={() => setSessionsExpanded((prev) => !prev)}
									sx={{
										fontSize: isMobileSize ? '0.9rem' : '1rem',
										cursor: 'pointer',
										userSelect: 'none',
										m: 0,
										mr: 1,
									}}>
									Sessions
									{sessions.length > 0 ? (
										<Typography
											component='span'
											variant='body2'
											color='text.secondary'
											sx={{ ml: 1, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											({sessions.length})
										</Typography>
									) : null}
								</Typography>
								<CustomTextField
									label='Weeks'
									type='number'
									value={bulkWeeks}
									onChange={(e) => setBulkWeeks(Number(e.target.value) || 1)}
									sx={{ width: 100, backgroundColor: '#fff', mb: 0 }}
									InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
									InputProps={{ inputProps: { min: 1, max: 12 } }}
								/>
								<CustomSubmitButton
									onClick={() => {
										setSessionsExpanded(true);
										handleBulk();
									}}
									disabled={isBulkCreating}
									sx={{ mt: 0 }}>
									{isBulkCreating ? 'Creating…' : 'Generate Zoom Sessions'}
								</CustomSubmitButton>
							</Box>
						</Box>

						<Collapse in={sessionsExpanded} timeout='auto' unmountOnExit>
							<Table size='small' sx={{ tableLayout: 'fixed', width: '100%' }}>
								<CustomTableHead<ClubSession>
									orderBy='startsAt'
									order='asc'
									handleSort={() => {}}
									columns={[
										{ label: 'Starts', key: 'startsAt' },
										{ label: 'Seats', key: 'seats' },
										{ label: 'Capacity', key: 'capacity' },
										{ label: 'Status', key: 'status' },
										{ label: 'Actions', key: 'actions' },
									]}
								/>
								<TableBody>
									{sessions.length === 0 ? (
										<TableRow>
											<TableCell colSpan={5} align='center'>
												<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', py: 2 }}>
													No sessions yet.
												</Typography>
											</TableCell>
										</TableRow>
									) : (
										sessions.map((s) => (
											<TableRow key={s._id} hover>
												<CustomTableCell value={new Date(s.startsAt).toLocaleString('en-GB')} />
												<CustomTableCell value={`${s.seatsTaken ?? 0} / ${s.capacity}`} />
												<TableCell align='center'>
													<CustomTextField
														type='number'
														required={false}
														value={capacityEdits[s._id] ?? s.capacity}
														onChange={(e) => {
															const next = Number(e.target.value);
															setCapacityEdits((prev) => ({
																...prev,
																[s._id]: Number.isFinite(next) ? next : s.capacity,
															}));
														}}
														onBlur={(e) => {
															const v = Number(e.target.value);
															if (v !== s.capacity && v > 0) updateCapacity(s._id, v);
														}}
														sx={{ width: 90, backgroundColor: '#fff', mb: 0 }}
														InputProps={{ inputProps: { min: 1 } }}
													/>
												</TableCell>
												<CustomTableCell value={s.status} />
												<TableCell sx={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 1 }}>
													<CustomSubmitButton onClick={() => openRegs(s._id)}>Registrations</CustomSubmitButton>
													{s.zoomStartUrl && (
														<CustomActionBtn
															title='Host Zoom'
															onClick={() => window.open(s.zoomStartUrl, '_blank')}
															icon={<OpenInNew fontSize='small' />}
														/>
													)}
													<CustomActionBtn
														title='Delete Session'
														onClick={() => setSessionToDelete(s)}
														icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Collapse>
					</Box>
					</Box>
				</Box>

				{packDialogOpen && (
					<CreateClubPackDialog
						isOpen={packDialogOpen}
						onClose={() => {
							setPackDialogOpen(false);
							resetPackForm();
						}}
						onSubmit={handleCreatePack}
						sessionCount={sessionCount}
						setSessionCount={setSessionCount}
						label={packLabel}
						setLabel={setPackLabel}
						GBP={GBP}
						setGBP={setGBP}
						USD={USD}
						setUSD={setUSD}
						EUR={EUR}
						setEUR={setEUR}
						TRY={TRY}
						setTRY={setTRY}
						isCreating={isCreatingPack}
					/>
				)}

				{packToDelete && (
					<CustomDialog
						openModal={!!packToDelete}
						closeModal={() => setPackToDelete(null)}
						title='Delete Pack'
						maxWidth='xs'>
						<Box sx={{ px: 2 }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								Delete pack <strong>{packToDelete.label || `${packToDelete.sessionCount} Session`}</strong>?
							</Typography>
						</Box>
						<CustomDialogActions
							deleteBtn
							onCancel={() => setPackToDelete(null)}
							onDelete={handleDeletePack}
							isDeleting={isDeletingPack}
							deleteBtnText='Delete'
							actionSx={{ marginBottom: '0.5rem' }}
						/>
					</CustomDialog>
				)}

				{sessionToDelete && (
					<CustomDialog
						openModal={!!sessionToDelete}
						closeModal={() => setSessionToDelete(null)}
						title='Delete Session'
						maxWidth='xs'>
						<Box sx={{ px: 2 }}>
							<Typography sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: 1 }}>
								Delete session on{' '}
								<strong>{new Date(sessionToDelete.startsAt).toLocaleString('en-GB')}</strong>?
							</Typography>
							<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem', color: 'text.secondary', my: '1rem' }}>
								This removes the Zoom meeting and all registrations. Active registrants get their ticket
								session entitlement restored.
							</Typography>
						</Box>
						<CustomDialogActions
							deleteBtn
							onCancel={() => setSessionToDelete(null)}
							onDelete={handleDeleteSession}
							isDeleting={isDeletingSession}
							deleteBtnText='Delete'
							actionSx={{ marginBottom: '0.5rem' }}

						/>
					</CustomDialog>
				)}

				{regsOpen && (
					<CustomDialog openModal={regsOpen} closeModal={() => setRegsOpen(false)} title='Session Registrations' maxWidth='sm'>
						<Box sx={{ px: 2, pb: 1 }}>
							{regs.length === 0 ? (
								<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>No registrations</Typography>
							) : (
								regs.map((r) => (
									<Box
										key={r._id}
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											py: 1,
											borderBottom: '1px solid #e2e8f0',
										}}>
										<Typography sx={{ fontSize: '0.85rem' }}>
											{r.guestName} — {r.guestEmail}
										</Typography>
										<CustomCancelButton onClick={() => cancelReg(r._id)}>Cancel / Restore</CustomCancelButton>
									</Box>
								))
							)}
						</Box>
						<CustomDialogActions
							onCancel={() => setRegsOpen(false)}
							cancelBtnText='Close'
							hideSubmit
							actionSx={{ marginBottom: '0.5rem' }}
						/>
					</CustomDialog>
				)}

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

export default AdminClubDetail;
