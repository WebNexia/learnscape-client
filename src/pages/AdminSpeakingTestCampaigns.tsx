import { Add, ContentCopy, Delete, Edit, Visibility } from '@mui/icons-material';
import {
	Alert,
	Box,
	Chip,
	CircularProgress,
	DialogContent,
	Snackbar,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
} from '@mui/material';
import axios from '@utils/axiosInstance';
import { useCallback, useContext, useEffect, useState } from 'react';
import CustomAudioPlayer from '../components/audio/CustomAudioPlayer';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import SpeakingTestQuestionDialog from '../components/speakingTest/SpeakingTestQuestionDialog';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import theme from '../themes';
import { dateTimeFormatter } from '@utils/dateFormatter';
import type { SpeakingQuestion, SpeakingQuestionInput } from '../utils/speakingTest/types';

type CampaignRow = {
	_id: string;
	name: string;
	title: string;
	slug: string;
	description?: string;
	isActive: boolean;
	questionCount: number;
	submissionCount: number;
	createdAt: string;
};

type CampaignDetail = CampaignRow & { questions: SpeakingQuestion[] };

type SubmissionRow = {
	_id: string;
	campaignId: string;
	name: string;
	email: string;
	phone: string;
	createdAt: string;
};

type SubmissionAnswer = {
	questionId: string;
	prompt: string;
	audioUrl: string;
	videoUrl: string;
};

type SubmissionDetail = SubmissionRow & { answers: SubmissionAnswer[] };

const siteBase = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

const apiMessage = (error: unknown, fallback: string) => {
	const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
	return typeof message === 'string' && message ? message : fallback;
};

const AdminSpeakingTestCampaigns = () => {
	const { orgId } = useContext(OrganisationContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [snackbar, setSnackbar] = useState('');

	const [createOpen, setCreateOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [newTitle, setNewTitle] = useState('');
	const [newDescription, setNewDescription] = useState('');
	const [creating, setCreating] = useState(false);
	const [campaignToEdit, setCampaignToEdit] = useState<CampaignRow | null>(null);
	const [editName, setEditName] = useState('');
	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [savingEdit, setSavingEdit] = useState(false);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detail, setDetail] = useState<CampaignDetail | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);

	const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
	const [submissionsTotal, setSubmissionsTotal] = useState(0);
	const [submissionsPage, setSubmissionsPage] = useState(1);
	const [submissionsLoading, setSubmissionsLoading] = useState(false);
	const submissionsLimit = 25;

	const [questionMode, setQuestionMode] = useState<'new' | SpeakingQuestion | null>(null);
	const [savingQuestion, setSavingQuestion] = useState(false);
	const [questionToDelete, setQuestionToDelete] = useState<SpeakingQuestion | null>(null);
	const [campaignToDelete, setCampaignToDelete] = useState<CampaignRow | null>(null);
	const [submissionToDelete, setSubmissionToDelete] = useState<SubmissionRow | null>(null);
	const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);
	const [submissionLoading, setSubmissionLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const publicLink = useCallback((slug: string) => `${siteBase()}/speaking-test/c/${slug}`, []);

	const fetchCampaigns = useCallback(async () => {
		if (!orgId) return;
		setLoading(true);
		setError('');
		try {
			const { data } = await axios.get<{ data: CampaignRow[] }>('speaking-test/campaigns', { params: { orgId } });
			setCampaigns(data.data || []);
		} catch (requestError) {
			setError(apiMessage(requestError, 'Kampanyalar yüklenemedi.'));
			setCampaigns([]);
		} finally {
			setLoading(false);
		}
	}, [orgId]);

	const fetchDetail = useCallback(async (campaignId: string) => {
		setDetailLoading(true);
		try {
			const { data } = await axios.get<{ data: CampaignDetail }>(`speaking-test/campaigns/${campaignId}`);
			setDetail(data.data);
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kampanya yüklenemedi.'));
			setDetail(null);
		} finally {
			setDetailLoading(false);
		}
	}, []);

	const fetchSubmissions = useCallback(async (campaignId: string, page: number) => {
		if (!orgId) return;
		setSubmissionsLoading(true);
		try {
			const { data } = await axios.get<{ data: SubmissionRow[]; total: number }>('speaking-test/submissions', {
				params: { orgId, campaignId, page, limit: submissionsLimit },
			});
			setSubmissions(data.data || []);
			setSubmissionsTotal(data.total || 0);
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kayıtlar yüklenemedi.'));
			setSubmissions([]);
			setSubmissionsTotal(0);
		} finally {
			setSubmissionsLoading(false);
		}
	}, [orgId]);

	useEffect(() => {
		void fetchCampaigns();
	}, [fetchCampaigns]);

	useEffect(() => {
		if (!selectedId) {
			setDetail(null);
			setSubmissions([]);
			setSubmissionsTotal(0);
			return;
		}
		void fetchDetail(selectedId);
		void fetchSubmissions(selectedId, submissionsPage);
	}, [selectedId, submissionsPage, fetchDetail, fetchSubmissions]);

	const copyLink = async (slug: string) => {
		try {
			await navigator.clipboard.writeText(publicLink(slug));
			setSnackbar('Link copied.');
		} catch {
			setSnackbar('Link could not be copied.');
		}
	};

	const handleCreate = async () => {
		if (!orgId) return;
		setCreating(true);
		try {
			const { data } = await axios.post<{ data: CampaignRow }>('speaking-test/campaigns', {
				orgId,
				name: newName.trim(),
				title: newTitle.trim(),
				description: newDescription.trim(),
			});
			setCampaigns((current) => [data.data, ...current]);
			setSelectedId(data.data._id);
			setCreateOpen(false);
			setNewName('');
			setNewTitle('');
			setNewDescription('');
			setSnackbar('Campaign created.');
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kampanya oluşturulamadı.'));
		} finally {
			setCreating(false);
		}
	};

	const openEdit = (campaign: CampaignRow) => {
		setEditName(campaign.name);
		setEditTitle(campaign.title || campaign.name);
		setEditDescription(campaign.description || '');
		setCampaignToEdit(campaign);
	};

	const saveEdit = async () => {
		if (!campaignToEdit) return;
		setSavingEdit(true);
		try {
			const { data } = await axios.patch<{ data: CampaignRow }>(`speaking-test/campaigns/${campaignToEdit._id}`, {
				name: editName.trim(),
				title: editTitle.trim(),
				description: editDescription.trim(),
			});
			setCampaigns((current) => current.map((item) => (item._id === campaignToEdit._id ? { ...item, ...data.data } : item)));
			setDetail((current) => (current && current._id === campaignToEdit._id ? { ...current, ...data.data } : current));
			setCampaignToEdit(null);
			setSnackbar('Page title and description saved.');
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kampanya güncellenemedi.'));
		} finally {
			setSavingEdit(false);
		}
	};

	const toggleActive = async (campaign: CampaignRow, isActive: boolean) => {
		try {
			const { data } = await axios.patch<{ data: CampaignRow }>(`speaking-test/campaigns/${campaign._id}`, { isActive });
			setCampaigns((current) => current.map((item) => (item._id === campaign._id ? { ...item, ...data.data } : item)));
			setDetail((current) => (current && current._id === campaign._id ? { ...current, isActive: data.data.isActive } : current));
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kampanya güncellenemedi.'));
		}
	};

	const saveQuestion = async (input: SpeakingQuestionInput) => {
		if (!selectedId) return;
		setSavingQuestion(true);
		try {
			if (questionMode && questionMode !== 'new') {
				await axios.patch(`speaking-test/campaigns/${selectedId}/questions/${questionMode._id}`, input);
			} else {
				await axios.post(`speaking-test/campaigns/${selectedId}/questions`, input);
			}
			setQuestionMode(null);
			await fetchDetail(selectedId);
			setCampaigns((current) =>
				current.map((item) =>
					item._id === selectedId
						? {
							...item,
							questionCount:
								questionMode && questionMode !== 'new' ? item.questionCount : item.questionCount + 1,
						}
						: item,
				),
			);
			setSnackbar('Question saved.');
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Soru kaydedilemedi.'));
		} finally {
			setSavingQuestion(false);
		}
	};

	const deleteQuestion = async () => {
		if (!selectedId || !questionToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`speaking-test/campaigns/${selectedId}/questions/${questionToDelete._id}`);
			setQuestionToDelete(null);
			await fetchDetail(selectedId);
			setCampaigns((current) =>
				current.map((item) =>
					item._id === selectedId ? { ...item, questionCount: Math.max(0, item.questionCount - 1) } : item,
				),
			);
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Soru silinemedi.'));
		} finally {
			setIsDeleting(false);
		}
	};

	const deleteCampaign = async () => {
		if (!campaignToDelete) return;
		setIsDeleting(true);
		try {
			await axios.delete(`speaking-test/campaigns/${campaignToDelete._id}`);
			setCampaigns((current) => current.filter((item) => item._id !== campaignToDelete._id));
			if (selectedId === campaignToDelete._id) setSelectedId(null);
			setCampaignToDelete(null);
			setSnackbar('Campaign and recordings deleted.');
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kampanya silinemedi.'));
		} finally {
			setIsDeleting(false);
		}
	};

	const openSubmission = async (row: SubmissionRow) => {
		setSubmissionLoading(true);
		setSubmissionDetail(null);
		try {
			const { data } = await axios.get<{ data: SubmissionDetail }>(`speaking-test/submissions/${row._id}`);
			setSubmissionDetail(data.data);
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kayıt yüklenemedi.'));
		} finally {
			setSubmissionLoading(false);
		}
	};

	const deleteSubmission = async () => {
		if (!submissionToDelete || !selectedId) return;
		setIsDeleting(true);
		try {
			await axios.delete(`speaking-test/submissions/${submissionToDelete._id}`);
			setSubmissionToDelete(null);
			setCampaigns((current) =>
				current.map((item) =>
					item._id === selectedId ? { ...item, submissionCount: Math.max(0, item.submissionCount - 1) } : item,
				),
			);
			await fetchSubmissions(selectedId, submissionsPage);
		} catch (requestError) {
			setSnackbar(apiMessage(requestError, 'Kayıt silinemedi.'));
		} finally {
			setIsDeleting(false);
		}
	};

	const questionInitial =
		questionMode && questionMode !== 'new'
			? {
				prompt: questionMode.prompt,
				imageUrl: questionMode.imageUrl,
				videoUrl: questionMode.videoUrl,
				askAudio: questionMode.askAudio,
				askVideo: questionMode.askVideo,
			}
			: null;

	return (
		<Box sx={{ width: '100%', px: isMobileSize ? 1 : 2, pb: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
				<Box>
					<Typography sx={{ fontWeight: 700, fontSize: isMobileSize ? '1rem' : '1.15rem' }}>
						Share a speaking test link
					</Typography>
					<Typography sx={{ color: theme.textColor?.secondary.main, maxWidth: 680, mt: 0.5, fontSize: '0.9rem' }}>
						Create a campaign, add questions, and choose audio or video answers the same way as admin questions.
						Students record their replies. Deleting a campaign removes those recordings from storage.
					</Typography>
				</Box>
				<CustomSubmitButton startIcon={<Add />} onClick={() => setCreateOpen(true)}>
					New campaign
				</CustomSubmitButton>
			</Box>

			{error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}
			{loading ? (
				<AdminTableSkeleton />
			) : (
				<Table size='small'>
					<CustomTableHead
						order='desc'
						orderBy='createdAt'
						handleSort={() => undefined}
						columns={[
							{ key: 'name', label: 'Campaign' },
							{ key: 'link', label: 'Link' },
							{ key: 'questions', label: 'Questions' },
							{ key: 'submissions', label: 'Recordings' },
							{ key: 'active', label: 'Active' },
							{ key: 'actions', label: '' },
						]}
					/>
					<TableBody>
						{campaigns.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
									No campaigns yet.
								</TableCell>
							</TableRow>
						) : (
							campaigns.map((campaign) => (
								<TableRow
									key={campaign._id}
									hover
									selected={selectedId === campaign._id}
									sx={{ cursor: 'pointer' }}
									onClick={() => {
										setSubmissionsPage(1);
										setSelectedId(campaign._id);
									}}>
									<TableCell>
										<Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{campaign.name}</Typography>
										<Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
											{campaign.title || 'No student title yet'}
										</Typography>
									</TableCell>
									<CustomTableCell>
										<Chip
											label={`/speaking-test/c/${campaign.slug}`}
											size='small'
											onClick={(event) => {
												event.stopPropagation();
												void copyLink(campaign.slug);
											}}
										/>
									</CustomTableCell>
									<CustomTableCell value={campaign.questionCount} />
									<CustomTableCell value={campaign.submissionCount} />
									<TableCell onClick={(event) => event.stopPropagation()} align='center'>
										<Switch
											checked={campaign.isActive}
											onChange={(event) => void toggleActive(campaign, event.target.checked)}
										/>
									</TableCell>
									<TableCell onClick={(event) => event.stopPropagation()} align='center'>
										<Box sx={{ display: 'flex', justifyContent: 'center' }}>
											<CustomActionBtn title='Edit title and description' icon={<Edit fontSize='small' />} onClick={() => openEdit(campaign)} />
											<CustomActionBtn title='Copy link' icon={<ContentCopy fontSize='small' />} onClick={() => void copyLink(campaign.slug)} />
											<CustomActionBtn title='Delete campaign' icon={<Delete fontSize='small' />} onClick={() => setCampaignToDelete(campaign)} />
										</Box>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			)}

			{selectedId ? (
				<Box sx={{ mt: 4 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
						<Typography sx={{ fontWeight: 700 }}>{detail?.name || 'Questions'}</Typography>
						<CustomSubmitButton startIcon={<Add />} onClick={() => setQuestionMode('new')} disabled={detailLoading}>
							Add question
						</CustomSubmitButton>
					</Box>
					{detailLoading ? (
						<CircularProgress size={28} />
					) : (
						<Table size='small'>
							<TableBody>
								{(detail?.questions || []).length === 0 ? (
									<TableRow>
										<TableCell>No questions yet. Add one before sharing the link.</TableCell>
									</TableRow>
								) : (
									detail?.questions.map((question, questionIndex) => (
										<TableRow key={question._id}>
											<TableCell sx={{ width: 48 }}>{questionIndex + 1}</TableCell>
											<TableCell>
												<Typography sx={{ whiteSpace: 'pre-wrap' }}>{question.prompt}</Typography>
												<Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
													{question.askAudio ? <Chip size='small' label='Audio' /> : null}
													{question.askVideo ? <Chip size='small' label='Video' /> : null}
												</Box>
											</TableCell>
											<TableCell align='right'>
												<CustomActionBtn title='Edit question' icon={<Edit fontSize='small' />} onClick={() => setQuestionMode(question)} />
												<CustomActionBtn title='Delete question' icon={<Delete fontSize='small' />} onClick={() => setQuestionToDelete(question)} />
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}

					<Typography sx={{ fontWeight: 700, mt: 3, mb: 1 }}>Student recordings</Typography>
					{submissionsLoading ? (
						<CircularProgress size={28} />
					) : (
						<Table size='small'>
							<CustomTableHead
								order='desc'
								orderBy='createdAt'
								handleSort={() => undefined}
								columns={[
									{ key: 'name', label: 'Name' },
									{ key: 'email', label: 'Email' },
									{ key: 'phone', label: 'Phone' },
									{ key: 'createdAt', label: 'Submitted' },
									{ key: 'actions', label: '' },
								]}
							/>
							<TableBody>
								{submissions.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5}>No recordings yet.</TableCell>
									</TableRow>
								) : (
									submissions.map((submission) => (
										<TableRow key={submission._id}>
											<CustomTableCell value={submission.name} align='left' />
											<CustomTableCell value={submission.email} align='left' />
											<CustomTableCell value={submission.phone} />
											<CustomTableCell value={dateTimeFormatter(submission.createdAt)} />
											<TableCell align='center'>
												<CustomActionBtn title='Play recordings' icon={<Visibility fontSize='small' />} onClick={() => void openSubmission(submission)} />
												<CustomActionBtn title='Delete recording' icon={<Delete fontSize='small' />} onClick={() => setSubmissionToDelete(submission)} />
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
					{submissionsTotal > submissionsLimit ? (
						<Box sx={{ mt: 2 }}>
							<CustomTablePagination
								count={Math.ceil(submissionsTotal / submissionsLimit)}
								page={submissionsPage}
								onChange={setSubmissionsPage}
							/>
						</Box>
					) : null}
				</Box>
			) : null}

			<CustomDialog openModal={createOpen} closeModal={() => !creating && setCreateOpen(false)} maxWidth='sm' title='New speaking-test campaign'>
				<DialogContent>
					<CustomTextField
						label='Campaign name'
						value={newName}
						onChange={(event) => setNewName(event.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 80 } }}
						sx={{ mt: 0.75 }}
					/>
					<CustomTextField
						label='Student page title'
						value={newTitle}
						onChange={(event) => setNewTitle(event.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 120 } }}
					/>
					<CustomTextField
						label='Student page description (optional)'
						value={newDescription}
						onChange={(event) => setNewDescription(event.target.value)}
						required={false}
						multiline
						rows={3}
						InputProps={{ inputProps: { maxLength: 500 } }}
					/>
					<Typography variant='body2' sx={{ mt: 1 }}>
						The title is shown to the student before the test starts. Description is optional. The link is <code>/speaking-test/c/…</code>
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setCreateOpen(false)}
					onSubmit={() => void handleCreate()}
					submitBtnText='Create'
					disableBtn={creating || newName.trim().length < 2 || newTitle.trim().length < 2}
					disableCancelBtn={creating}
					isSubmitting={creating}
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</CustomDialog>

			<CustomDialog
				openModal={!!campaignToEdit}
				closeModal={() => !savingEdit && setCampaignToEdit(null)}
				maxWidth='sm'
				title='Student page text'>
				<DialogContent>
					<CustomTextField
						label='Campaign name'
						value={editName}
						onChange={(event) => setEditName(event.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 80 } }}
						sx={{ mt: 0.75 }}
					/>
					<CustomTextField
						label='Student page title'
						value={editTitle}
						onChange={(event) => setEditTitle(event.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 120 } }}
					/>
					<CustomTextField
						label='Student page description (optional)'
						value={editDescription}
						onChange={(event) => setEditDescription(event.target.value)}
						required={false}
						multiline
						rows={3}
						InputProps={{ inputProps: { maxLength: 500 } }}
					/>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setCampaignToEdit(null)}
					onSubmit={() => void saveEdit()}
					submitBtnText='Save'
					disableBtn={savingEdit || editName.trim().length < 2 || editTitle.trim().length < 2}
					disableCancelBtn={savingEdit}
					isSubmitting={savingEdit}
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</CustomDialog>

			{questionMode && selectedId ? (
				<SpeakingTestQuestionDialog
					key={questionMode === 'new' ? 'new' : questionMode._id}
					open
					campaignId={selectedId}
					initial={questionInitial}
					saving={savingQuestion}
					onClose={() => !savingQuestion && setQuestionMode(null)}
					onSave={(input) => void saveQuestion(input)}
				/>
			) : null}

			<CustomDialog
				openModal={!!campaignToDelete}
				closeModal={() => !isDeleting && setCampaignToDelete(null)}
				title='Delete campaign'
				maxWidth='xs'>
				<Box sx={{ px: 3 }}>
					<Typography>
						Delete <strong>{campaignToDelete?.name}</strong>? Questions, submissions, and every recorded audio or video file for this campaign will be removed.
					</Typography>
				</Box>
				<CustomDialogActions
					onCancel={() => setCampaignToDelete(null)}
					onSubmit={() => void deleteCampaign()}
					submitBtnText='Delete'
					disableBtn={isDeleting}
					isSubmitting={isDeleting}
				/>
			</CustomDialog>

			<CustomDialog
				openModal={!!questionToDelete}
				closeModal={() => !isDeleting && setQuestionToDelete(null)}
				title='Delete question'
				maxWidth='xs'>
				<Box sx={{ px: 3 }}>
					<Typography>Delete this question? Uploaded question media for it will be removed. Student recordings already submitted stay until the campaign is deleted.</Typography>
				</Box>
				<CustomDialogActions
					onCancel={() => setQuestionToDelete(null)}
					onSubmit={() => void deleteQuestion()}
					submitBtnText='Delete'
					disableBtn={isDeleting}
					isSubmitting={isDeleting}
				/>
			</CustomDialog>

			<CustomDialog
				openModal={!!submissionToDelete}
				closeModal={() => !isDeleting && setSubmissionToDelete(null)}
				title='Delete submission'
				maxWidth='xs'>
				<Box sx={{ px: 3 }}>
					<Typography>Delete {submissionToDelete?.name}&apos;s recordings? The audio and video files will be removed from storage.</Typography>
				</Box>
				<CustomDialogActions
					onCancel={() => setSubmissionToDelete(null)}
					onSubmit={() => void deleteSubmission()}
					submitBtnText='Delete'
					disableBtn={isDeleting}
					isSubmitting={isDeleting}
				/>
			</CustomDialog>

			<CustomDialog
				openModal={submissionLoading || !!submissionDetail}
				closeModal={() => {
					setSubmissionDetail(null);
					setSubmissionLoading(false);
				}}
				title={submissionDetail ? submissionDetail.name : 'Recording'}
				maxWidth='sm'>
				<DialogContent>
					{submissionLoading ? (
						<CircularProgress size={28} />
					) : (
						submissionDetail?.answers.map((answer, answerIndex) => (
							<Box key={answer.questionId} sx={{ mb: 3 }}>
								{submissionDetail.answers.length > 1 ? (
									<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
										Question {answerIndex + 1}
									</Typography>
								) : null}
								<Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, mb: 1.5 }}>{answer.prompt}</Typography>
								{answer.audioUrl ? <CustomAudioPlayer audioUrl={answer.audioUrl} title='Audio answer' /> : null}
								{answer.videoUrl ? (
									<Box component='video' src={answer.videoUrl} controls sx={{ width: '100%', mt: 1, borderRadius: 1 }} />
								) : null}
							</Box>
						))
					)}
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						setSubmissionDetail(null);
						setSubmissionLoading(false);
					}}
					hideSubmit
					cancelBtnText='Close'
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</CustomDialog>

			<Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar('')} message={snackbar} />
		</Box>
	);
};

export default AdminSpeakingTestCampaigns;
