import { useState, useEffect, useRef, useContext } from 'react';
import TinyMceEditor from './richTextEditor/TinyMceEditor';
import { Select, MenuItem, Box, Alert, CircularProgress, FormControl, Snackbar } from '@mui/material';
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

const EmailSender = ({ setEmailDialogOpen }: EmailSenderProps) => {
	const [category, setCategory] = useState<string>('');
	const [subject, setSubject] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const [showEmailSuccessMsg, setShowEmailSuccessMsg] = useState<boolean>(false);

	const editorRef = useRef<any>(null);

	const { orgId } = useContext(OrganisationContext);

	useEffect(() => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/css2?family=Roboto&family=Georgia&display=swap';
		document.head.appendChild(link);
	}, []);

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
			});
			setShowEmailSuccessMsg(true);
			setSubject('');
			setCategory('');
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
						{recipientOptions?.map?.((opt) => (
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
