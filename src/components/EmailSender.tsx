import { useState, useEffect, useRef, useContext } from 'react';
import TinyMceEditor from './richTextEditor/TinyMceEditor';
import { Select, MenuItem, Box, Alert, CircularProgress, FormControl, Snackbar, Chip, IconButton, Typography } from '@mui/material';
import { AttachFile, Close } from '@mui/icons-material';
import CustomSubmitButton from './forms/customButtons/CustomSubmitButton';
import CustomCancelButton from './forms/customButtons/CustomCancelButton';
import CustomTextField from './forms/customFields/CustomTextField';
import CustomErrorMessage from './forms/customFields/CustomErrorMessage';
import axios from '@utils/axiosInstance';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

interface EmailSenderProps {
	setEmailDialogOpen: (open: boolean) => void;
}

const recipientOptions = [
	{ value: 'allUsers', label: 'All Platform Users' },
	{ value: 'formSubmitters', label: 'All Contact Form Submitters' },
	{ value: 'documentBuyers', label: 'All Document Buyers' },
	{ value: 'eventAttendees', label: 'All Event Participants' },
	{ value: 'everybody', label: 'All Contacts' },
];

interface Attachment {
	filename: string;
	content: string; // base64
	contentType: string;
	size: number;
}

const EmailSender = ({ setEmailDialogOpen }: EmailSenderProps) => {
	const [category, setCategory] = useState<string>('');
	const [subject, setSubject] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [attachments, setAttachments] = useState<Attachment[]>([]);

	const [showEmailSuccessMsg, setShowEmailSuccessMsg] = useState<boolean>(false);

	const editorRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { orgId } = useContext(OrganisationContext);

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

	const handleSend = async () => {
		setLoading(true);
		setError(null);
		const content = editorRef.current ? editorRef.current.getContent() : '';
		if (!subject) {
			setError('Please enter a subject.');
			setLoading(false);
			return;
		}
		if (!content || content.trim() === '' || content === '<p><br></p>') {
			setError('Please enter email content.');
			setLoading(false);
			return;
		}
		if (!category) {
			setError('Please select a recipient.');
			setLoading(false);
			return;
		}
		try {
			await axios.post('/admin/send-bulk-email', {
				category,
				subject,
				body: content,
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
			setShowEmailSuccessMsg(true);
			setSubject('');
			setCategory('');
			setAttachments([]);
			if (editorRef.current) {
				editorRef.current.setContent('');
			}
		} catch (err: any) {
			setError('Error sending email: ' + (err.response?.data?.message || err.message));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ mx: 'auto', padding: '0.5rem' }}>
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
			<Box sx={{ mb: 3 }}>
				<TinyMceEditor
					initialValue=''
					height={400}
					editorRef={editorRef}
					handleEditorChange={() => {
						setError(null);
					}}
				/>
			</Box>

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
				<CustomCancelButton onClick={() => setEmailDialogOpen(false)} disabled={loading}>
					Cancel
				</CustomCancelButton>
				<CustomSubmitButton onClick={handleSend} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null}>
					Compose
				</CustomSubmitButton>
			</Box>
		</Box>
	);
};

export default EmailSender;
