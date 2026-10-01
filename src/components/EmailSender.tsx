import { useState, useEffect, useRef, useContext } from 'react';
import TinyMceEditor from './richTextEditor/TinyMceEditor';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import { emailEditorScope } from '../utils/editorImageScopes';
import { deleteAllEditorImagesInScope } from '../utils/editorImageStorage';
import { Select, MenuItem, Box, Alert, CircularProgress, FormControl, Snackbar, Chip, IconButton, Typography, ToggleButton, ToggleButtonGroup, DialogContent } from '@mui/material';
import { AttachFile, Close } from '@mui/icons-material';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';
import CustomCancelButton from './forms/customButtons/CustomCancelButton';
import CustomTextField from './forms/customFields/CustomTextField';
import CustomErrorMessage from './forms/customFields/CustomErrorMessage';
import CustomDialog from './layouts/dialog/CustomDialog';
import CustomDialogActions from './layouts/dialog/CustomDialogActions';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

interface EmailSenderProps {
	setEmailDialogOpen: (open: boolean) => void;
	dialogOpen: boolean;
}

const recipientOptions = [
	{ value: 'allUsers', label: 'All Platform Users' },
	{ value: 'formSubmitters', label: 'All Contact Form Submitters' },
	{ value: 'documentBuyers', label: 'All Document Buyers' },
	{ value: 'eventAttendees', label: 'All Event Participants' },
	{ value: 'marketingConsent', label: 'People who opted in to marketing' },
	{ value: 'everybody', label: 'All Contacts' },
	{ value: 'manual', label: 'Specific email addresses' },
];

interface Attachment {
	filename: string;
	content: string; // base64
	contentType: string;
	size: number;
}

type ComposeMode = 'announcement' | 'custom';
type AnnouncementKind = 'course' | 'book' | 'club' | 'consultation';

interface CatalogItem {
	id: string;
	label: string;
}

const kindOptions: { value: AnnouncementKind; label: string }[] = [
	{ value: 'course', label: 'Course' },
	{ value: 'book', label: 'Book' },
	{ value: 'club', label: 'Club' },
	{ value: 'consultation', label: 'Consultation' },
];

const EmailSender = ({ setEmailDialogOpen, dialogOpen }: EmailSenderProps) => {
	const [mode, setMode] = useState<ComposeMode>('announcement');
	const [kind, setKind] = useState<AnnouncementKind>('course');
	const [itemId, setItemId] = useState('');
	const [note, setNote] = useState('');
	const [catalog, setCatalog] = useState<Record<AnnouncementKind, CatalogItem[]>>({ course: [], book: [], club: [], consultation: [] });
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [category, setCategory] = useState<string>('');
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [manualEmails, setManualEmails] = useState('');
	const [subject, setSubject] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewHtml, setPreviewHtml] = useState('');
	const [previewLoading, setPreviewLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const subjectTouchedRef = useRef(false);

	const [showEmailSuccessMsg, setShowEmailSuccessMsg] = useState<boolean>(false);

	const editorRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const emailSessionScopeRef = useRef(emailEditorScope(generateUniqueId('email-')));
	const [emailSessionScope, setEmailSessionScope] = useState(emailSessionScopeRef.current);

	const { orgId } = useContext(OrganisationContext);

	// Open: fresh session + form. Close: one Storage cleanup (no extra work on send).
	useEffect(() => {
		if (dialogOpen) {
			const nextScope = emailEditorScope(generateUniqueId('email-'));
			emailSessionScopeRef.current = nextScope;
			setEmailSessionScope(nextScope);
			subjectTouchedRef.current = false;
			setMode('announcement');
			setKind('course');
			setItemId('');
			setNote('');
			setSubject('');
			setCategory('');
			setConfirmOpen(false);
			setManualEmails('');
			setAttachments([]);
			setPreviewOpen(false);
			setPreviewHtml('');
			setError(null);
			setShowEmailSuccessMsg(false);
			editorRef.current?.setContent('');
			return;
		}
		void deleteAllEditorImagesInScope(emailSessionScopeRef.current);
	}, [dialogOpen]);

	useEffect(() => {
		if (!dialogOpen || !orgId) return;
		let cancelled = false;
		const loadCatalog = async () => {
			setCatalogLoading(true);
			try {
				const [coursesRes, booksRes, clubsRes, consultationsRes] = await Promise.all([
					axios.get(`/courses/organisation/${orgId}`, { params: { page: 1, limit: 200 } }),
					axios.get(`/documents/organisation/${orgId}`, { params: { page: 1, limit: 200 } }),
					axios.get(`/clubs/organisation/${orgId}`, { params: { page: 1, limit: 100 } }),
					axios.get(`/consultations/organisation/${orgId}`, { params: { page: 1, limit: 200 } }),
				]);
				const toItems = (rows: { _id?: string; title?: string; name?: string }[] | undefined, labelKey: 'title' | 'name') =>
					(rows || [])
						.filter((row) => row._id && row[labelKey])
						.map((row) => ({ id: String(row._id), label: String(row[labelKey]) }))
						.sort((a, b) => a.label.localeCompare(b.label));
				if (cancelled) return;
				setCatalog({
					course: toItems(coursesRes.data?.data, 'title'),
					book: toItems(booksRes.data?.data, 'name'),
					club: toItems(clubsRes.data?.data, 'title'),
					consultation: toItems(consultationsRes.data?.data, 'title'),
				});
			} catch {
				if (!cancelled) setError('Could not load courses, books, clubs, and consultations.');
			} finally {
				if (!cancelled) setCatalogLoading(false);
			}
		};
		void loadCatalog();
		return () => {
			cancelled = true;
		};
	}, [dialogOpen, orgId]);

	useEffect(() => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/css2?family=Roboto&family=Georgia&display=swap';
		document.head.appendChild(link);
	}, []);

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const maxSize = 10 * 1024 * 1024; // 10MB per file
		const maxFiles = 5; // Maximum 5 attachments

		if (attachments.length + files.length > maxFiles) {
			setError(`Maximum ${maxFiles} attachments allowed.`);
			return;
		}

		const newAttachments: Attachment[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (file.size > maxSize) {
				setError(`File "${file.name}" exceeds 10MB size limit.`);
				continue;
			}

			try {
				const base64 = await fileToBase64(file);
				newAttachments.push({
					filename: file.name,
					content: base64,
					contentType: file.type || 'application/octet-stream',
					size: file.size,
				});
			} catch (err) {
				setError(`Failed to process file "${file.name}".`);
				console.error('File processing error:', err);
			}
		}

		setAttachments((prev) => [...prev, ...newAttachments]);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const result = reader.result as string;
				// Remove data URL prefix (e.g., "data:image/png;base64,")
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = (error) => reject(error);
		});
	};

	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	};

	const validateBeforeSend = () => {
		const content = editorRef.current ? editorRef.current.getContent() : '';
		if (!subject) {
			setError('Please enter a subject.');
			return false;
		}
		if (mode === 'custom' && (!content || content.trim() === '' || content === '<p><br></p>')) {
			setError('Please enter email content.');
			return false;
		}
		if (mode === 'announcement' && !itemId) {
			setError('Please choose a course, book, club, or consultation.');
			return false;
		}
		if (!category) {
			setError('Please select a recipient.');
			return false;
		}
		if (category === 'manual' && !manualEmails.trim()) {
			setError('Enter at least one email address.');
			return false;
		}
		return true;
	};

	const requestSend = () => {
		setError(null);
		if (!validateBeforeSend()) return;
		setConfirmOpen(true);
	};

	const handleSend = async () => {
		setLoading(true);
		setError(null);
		const content = editorRef.current ? editorRef.current.getContent() : '';
		try {
			await axios.post('/admin/send-bulk-email', {
				category,
				subject,
				manualEmails: manualEmails.trim() || undefined,
				...(mode === 'announcement'
					? { announcement: { kind, itemId, note: note.trim() } }
					: { body: content }),
				orgId,
				attachments:
					attachments.length > 0
						? attachments.map((att) => ({
							filename: att.filename,
							content: att.content,
							contentType: att.contentType,
						}))
						: undefined,
			});
			setConfirmOpen(false);
			setShowEmailSuccessMsg(true);
		} catch (err: any) {
			setConfirmOpen(false);
			setError('Error sending email: ' + (err.response?.data?.message || err.message));
		} finally {
			setLoading(false);
		}
	};

	const recipientLabel = recipientOptions.find((option) => option.value === category)?.label || 'the selected recipients';

	const items = catalog[kind];

	const handlePreview = async () => {
		setError(null);
		if (!subject.trim()) {
			setError('Please enter a subject.');
			return;
		}
		if (!itemId) {
			setError('Please choose a course, book, club, or consultation.');
			return;
		}
		setPreviewLoading(true);
		try {
			const response = await axios.post('/admin/preview-bulk-email', {
				orgId,
				subject,
				announcement: { kind, itemId, note: note.trim() },
			});
			setPreviewHtml(response.data?.html || '');
			setPreviewOpen(true);
		} catch (err: any) {
			setError('Could not build the preview: ' + (err.response?.data?.message || err.message));
		} finally {
			setPreviewLoading(false);
		}
	};

	return (
		<Box sx={{ mx: 'auto', padding: '0.5rem' }}>
			<ToggleButtonGroup
				exclusive
				size='small'
				value={mode}
				onChange={(_event, next: ComposeMode | null) => {
					if (!next) return;
					setMode(next);
					setError(null);
				}}
				sx={{ mb: 1.5 }}>
				<ToggleButton value='announcement' sx={{ fontSize: '0.8rem', textTransform: 'none', px: 1.5 }}>
					Course, book, or club
				</ToggleButton>
				<ToggleButton value='custom' sx={{ fontSize: '0.8rem', textTransform: 'none', px: 1.5 }}>
					Custom message
				</ToggleButton>
			</ToggleButtonGroup>
			<Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 2 }}>
				{mode === 'announcement'
					? 'Pick an item, then Preview. The note appears under the logo. The subject is only the inbox subject line.'
					: 'Write the message yourself. This path sends the editor content as-is.'}
			</Typography>
			<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
				<FormControl sx={{ width: '50%' }}>
					<Select
						displayEmpty
						required
						value={category}
						onChange={(e) => {
							setCategory(e.target.value as string);
							setError(null);
						}}
						size='small'
						sx={{ fontSize: '0.8rem', backgroundColor: '#fff' }}>
						<MenuItem disabled value='' sx={{ fontSize: '0.8rem' }}>
							Select Recipient
						</MenuItem>
						{recipientOptions?.map((opt) => (
							<MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>
								{opt.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<CustomTextField
					label='Subject'
					value={subject}
					onChange={(e) => {
						subjectTouchedRef.current = true;
						setSubject(e.target.value);
						setError(null);
					}}
					size='small'
					fullWidth
					InputProps={{
						inputProps: {
							maxLength: 100,
						},
					}}
				/>
			</Box>
			<CustomTextField
				label={category === 'manual' ? 'Email addresses' : 'Additional email addresses (optional)'}
				placeholder='name@example.com, another@example.com'
				value={manualEmails}
				required={category === 'manual'}
				multiline
				rows={3}
				onChange={(e) => {
					setManualEmails(e.target.value);
					setError(null);
				}}
				fullWidth
				sx={{ mb: 1 }}
			/>
			<Typography variant='body2' sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 2 }}>
				{category === 'manual'
					? 'Separate addresses with commas, spaces, or new lines. Up to 200.'
					: 'These addresses are added to the selected list. Separate them with commas, spaces, or new lines.'}
			</Typography>
			{((category && category !== 'marketingConsent') || manualEmails.trim()) && (
				<Typography variant='body2' sx={{ fontSize: '0.75rem', color: 'warning.main', mb: 2, mt: -1 }}>
					This send can include people who did not opt in to marketing emails.
				</Typography>
			)}
			{mode === 'announcement' ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
					<Box sx={{ display: 'flex', gap: 2 }}>
						<FormControl sx={{ width: '32%' }}>
							<Select
								value={kind}
								size='small'
								onChange={(e) => {
									setKind(e.target.value as AnnouncementKind);
									setItemId('');
									if (!subjectTouchedRef.current) setSubject('');
									setError(null);
								}}
								sx={{ fontSize: '0.8rem', backgroundColor: '#fff' }}>
								{kindOptions.map((option) => (
									<MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
										{option.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<FormControl sx={{ flex: 1 }}>
							<Select
								displayEmpty
								value={itemId}
								size='small'
								disabled={catalogLoading}
								onChange={(e) => {
									const nextId = e.target.value as string;
									setItemId(nextId);
									const next = items.find((item) => item.id === nextId);
									if (!subjectTouchedRef.current) setSubject(next?.label || '');
									setError(null);
								}}
								sx={{ fontSize: '0.8rem', backgroundColor: '#fff' }}>
								<MenuItem disabled value='' sx={{ fontSize: '0.8rem' }}>
									{catalogLoading ? 'Loading…' : items.length ? `Select ${kind}` : `No ${kind}s yet`}
								</MenuItem>
								{items.map((item) => (
									<MenuItem key={item.id} value={item.id} sx={{ fontSize: '0.8rem' }}>
										{item.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box>
						<Typography variant='body2' sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.75 }}>
							Note
						</Typography>
						<TinyMceEditor
							key={`${emailSessionScope}-note`}
							initialValue=''
							height={220}
							simple
							maxLength={2000}
							enableImage={false}
							handleEditorChange={(content) => {
								setNote(content);
								setError(null);
							}}
						/>
						<Typography variant='body2' sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 1 }}>
							This text appears under the logo. Bold, italic, underline, lists, and links are kept. The {kind} image, description, and button follow it.
						</Typography>
					</Box>
				</Box>
			) : (
				<Box sx={{ mb: 3 }}>
					<TinyMceEditor
						key={emailSessionScope}
						initialValue=''
						height={400}
						editorRef={editorRef}
						imageScopedEntityId={emailSessionScope}
						handleEditorChange={() => {
							setError(null);
						}}
					/>
				</Box>
			)}

			{/* File Attachment Section */}
			<Box sx={{ mb: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
					<input ref={fileInputRef} type='file' multiple style={{ display: 'none' }} onChange={handleFileSelect} accept='*/*' />
					<IconButton
						onClick={() => fileInputRef.current?.click()}
						size='small'
						sx={{ color: 'primary.main' }}
						disabled={loading || attachments.length >= 5}>
						<AttachFile />
					</IconButton>
					<Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
						Add attachments (max 5 files, 10MB each)
					</Typography>
				</Box>
				{attachments.length > 0 && (
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{attachments.map((att, index) => (
							<Chip
								key={index}
								label={`${att.filename} (${formatFileSize(att.size)})`}
								onDelete={() => removeAttachment(index)}
								deleteIcon={<Close />}
								size='small'
								sx={{ fontSize: '0.75rem' }}
							/>
						))}
					</Box>
				)}
			</Box>

			{error && <CustomErrorMessage sx={{ mb: 2 }}>{error}</CustomErrorMessage>}

			<Snackbar
				open={showEmailSuccessMsg}
				autoHideDuration={2500}
				onClose={() => {
					setError(null);
					setShowEmailSuccessMsg(false);
					setEmailDialogOpen(false);
				}}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontSize: { xs: '0.8rem', sm: '0.9rem' },
						letterSpacing: 0,
						color: '#fff',
					}}>
					Email sent successfully!
				</Alert>
			</Snackbar>

			<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
				<CustomCancelButton onClick={() => setEmailDialogOpen(false)} disabled={loading || previewLoading}>
					Cancel
				</CustomCancelButton>
				{mode === 'announcement' && (
					<CustomCancelButton type='button' onClick={handlePreview} disabled={loading || previewLoading}>
						{previewLoading ? 'Preview…' : 'Preview'}
					</CustomCancelButton>
				)}
				<CustomSubmitButton onClick={requestSend} disabled={loading || previewLoading} startIcon={loading ? <CircularProgress size={20} /> : null}>
					Send
				</CustomSubmitButton>
			</Box>
			<CustomDialog openModal={confirmOpen} closeModal={() => !loading && setConfirmOpen(false)} maxWidth='xs' title='Send this email?' disableDismiss={loading}>
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
						Are you sure you want to send “{subject}” to {recipientLabel}?
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setConfirmOpen(false)}
					onSubmit={handleSend}
					cancelBtnText='Cancel'
					submitBtnText='Send'
					disableCancelBtn={loading}
					disableBtn={loading}
					isSubmitting={loading}
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</CustomDialog>
			<CustomDialog openModal={previewOpen} closeModal={() => setPreviewOpen(false)} maxWidth='md'>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2, pb: 0 }}>
					<Typography sx={{ fontSize: { xs: '0.85rem', sm: '1.25rem' }, fontWeight: 500 }}>Email preview</Typography>
					<CustomCancelButton type='button' onClick={() => setPreviewOpen(false)}>
						Close
					</CustomCancelButton>
				</Box>
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: '0.8rem', mb: 1.5 }}>
						Subject: {subject}
					</Typography>
					<Box sx={{ height: '70vh', bgcolor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
						<iframe title='Email preview' sandbox='' srcDoc={previewHtml} style={{ width: '100%', height: '100%', border: 0, background: '#f1f5f9' }} />
					</Box>
				</DialogContent>
			</CustomDialog>
		</Box>
	);
};

export default EmailSender;
