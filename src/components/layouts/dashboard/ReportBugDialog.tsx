import React, { useState, useContext } from 'react';
import { DialogContent, Box, Typography, Alert, Snackbar } from '@mui/material';
import axios from '@utils/axiosInstance';
import { CreateBugReportRequest } from '../../../interfaces/bugReport';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import theme from '../../../themes';
import CustomDialog from '../../layouts/dialog/CustomDialog';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomErrorMessage from '../../forms/customFields/CustomErrorMessage';

interface ReportBugDialogProps {
	open: boolean;
	onClose: () => void;
}

const ReportBugDialog: React.FC<ReportBugDialogProps> = ({ open, onClose }) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);

	const [formData, setFormData] = useState<CreateBugReportRequest>({
		firstName: user?.firstName || '',
		lastName: user?.lastName || '',
		email: user?.email || '',
		description: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleInputChange = (field: keyof CreateBugReportRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await axios.post(`${base_url}/bugReports`, {
				...formData,
				userId: user?._id,
				orgId,
			});
			setSuccess(true);
			setFormData((prev) => ({
				...prev,
				description: '',
			}));
			setTimeout(() => {
				onClose();
				setSuccess(false);
			}, 2000);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to submit bug report');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading) {
			onClose();
			setError(null);
			setSuccess(false);
		}
	};

	return (
		<CustomDialog openModal={open} closeModal={handleClose} maxWidth='xs' title='Report a Bug'>
			<DialogContent>
				<Snackbar
					open={success}
					autoHideDuration={3500}
					onClose={() => {
						setError(null);
						setSuccess(false);
						onClose();
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
						Thank you for your bug report! We'll investigate and get back to you soon.
					</Alert>
				</Snackbar>

				<form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
					<Typography variant='body2' sx={{ mb: '2rem', color: theme.textColor?.secondary }}>
						Help us improve by reporting any issues you encounter while using the platform.
					</Typography>

					<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
						<CustomTextField
							fullWidth
							label='First Name'
							value={formData.firstName}
							onChange={handleInputChange('firstName')}
							required
							variant='outlined'
							size='small'
							InputProps={{ inputProps: { maxLength: 50 } }}
						/>
						<CustomTextField
							fullWidth
							label='Last Name'
							value={formData.lastName}
							onChange={handleInputChange('lastName')}
							required
							variant='outlined'
							size='small'
							InputProps={{ inputProps: { maxLength: 50 } }}
						/>
					</Box>

					<CustomTextField
						fullWidth
						label='Email'
						type='email'
						value={formData.email}
						onChange={handleInputChange('email')}
						required
						variant='outlined'
						size='small'
						InputProps={{ inputProps: { maxLength: 254 } }}
					/>

					<CustomTextField
						fullWidth
						label='Bug Description'
						multiline
						rows={4}
						value={formData.description}
						onChange={handleInputChange('description')}
						required
						variant='outlined'
						size='small'
						placeholder='Please describe the bug or issue you encountered...'
						resizable
						InputProps={{ inputProps: { maxLength: 500 } }}
					/>

					{error && <CustomErrorMessage sx={{ mb: 2 }}>{error}</CustomErrorMessage>}
					<CustomDialogActions
						submitBtnText={loading ? 'Submitting...' : 'Submit'}
						cancelBtnText='Cancel'
						onCancel={handleClose}
						disableBtn={loading}
						disableCancelBtn={loading}
						actionSx={{ margin: '0.5rem -1rem -0.5rem 0' }}
					/>
				</form>
			</DialogContent>
		</CustomDialog>
	);
};

export default ReportBugDialog;
