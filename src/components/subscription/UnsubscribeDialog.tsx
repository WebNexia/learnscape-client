import React, { useState, useContext } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { Warning, AccessTime, Block } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';
import axiosInstance from '@utils/axiosInstance';

interface UnsubscribeDialogProps {
	open: boolean;
	onClose: () => void;
}

const UnsubscribeDialog: React.FC<UnsubscribeDialogProps> = ({ open, onClose }) => {
	const { user, setUser, fetchUserData, firebaseUserId } = useContext(UserAuthContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cancelReason, setCancelReason] = useState<string>('');

	const [showSuccess, setShowSuccess] = useState<boolean>(false);

	const isMobileSize = isSmallScreen || isRotatedMedium;
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	// Calculate access end date (end of current billing period)
	const getAccessEndDate = () => {
		if (user?.subscriptionValidUntil) {
			return new Date(user.subscriptionValidUntil);
		}
		// Fallback to 30 days from now if no expiry date
		return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	};

	const accessEndDate = getAccessEndDate();
	const daysRemaining = Math.ceil((accessEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

	const handleClose = () => {
		setCancelReason('');
		setError(null);
		onClose();
	};

	const handleUnsubscribe = async () => {
		if (!user) return;

		setIsProcessing(true);
		setError(null);

		try {
			// First, get the user's subscription ID
			const subscriptionResponse = await axiosInstance.get(`${base_url}/subscriptions/user/${user._id}`);

			if (subscriptionResponse.data.data) {
				const subscriptionId = subscriptionResponse.data.data._id;
				const subscription = subscriptionResponse.data.data;

				// Cancel the subscription
				await axiosInstance.delete(`${base_url}/subscriptions/${subscriptionId}`, {
					data: { cancelReason: cancelReason.trim() || 'User requested cancellation' },
				});

				// Preserve subscriptionValidUntil (user keeps access until period end)
				const subscriptionValidUntil = subscription.currentPeriodEnd
					? new Date(subscription.currentPeriodEnd)
					: user?.subscriptionValidUntil
						? new Date(user.subscriptionValidUntil)
						: null;

				const now = new Date();
				const hasAccessUntilPeriodEnd = subscriptionValidUntil && subscriptionValidUntil > now;

				// Update user context to reflect cancellation
				// User keeps subscription access until subscriptionValidUntil
				setUser((prevUser) => {
					if (prevUser) {
						return {
							...prevUser,
							isSubscribed: Boolean(hasAccessUntilPeriodEnd), // Keep as subscribed if period hasn't ended (ensure boolean)
							subscriptionStatus: (hasAccessUntilPeriodEnd ? 'canceled_at_period_end' : 'canceled') as 'canceled_at_period_end' | 'canceled', // Mark as scheduled for cancellation
							accessLevel: hasAccessUntilPeriodEnd ? 'subscription' : 'limited', // Keep access if period hasn't ended
							subscriptionType: hasAccessUntilPeriodEnd ? prevUser.subscriptionType : null, // Keep type until period ends
							subscriptionExpiry: hasAccessUntilPeriodEnd ? prevUser.subscriptionExpiry : null, // Keep expiry until period ends
							subscriptionValidUntil: subscriptionValidUntil ? subscriptionValidUntil.toISOString() : null, // Preserve until period end
						} as typeof prevUser;
					}
					return prevUser;
				});

				// Refetch user data from backend to ensure we have the latest state
				if (firebaseUserId) {
					try {
						await fetchUserData(firebaseUserId);
					} catch (error) {
						console.error('Failed to refetch user data after cancellation:', error);
					}
				}

				handleClose();
				setShowSuccess(true);
			} else {
				setError('No active subscription found');
			}
		} catch (err: any) {
			console.error('❌ Unsubscribe Error:', err);
			setError(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel subscription. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	const featuresYouWillLose = [
		{
			icon: <Block sx={{ color: theme.textColor?.error.main }} />,
			title: 'Community Access',
			description: 'You will lose access to community forums and discussions',
		},
		{
			icon: <Block sx={{ color: theme.textColor?.error.main }} />,
			title: 'Direct Messaging',
			description: 'You will no longer be able to send or receive messages',
		},
		{
			icon: <Block sx={{ color: theme.textColor?.error.main }} />,
			title: 'Free Course Access',
			description: 'Access to free courses will be restricted',
		},
		{
			icon: <Block sx={{ color: theme.textColor?.error.main }} />,
			title: 'Learning Analytics',
			description: 'Your learning progress tracking will be limited',
		},
		{
			icon: <Block sx={{ color: theme.textColor?.error.main }} />,
			title: 'Priority Support',
			description: 'You will lose priority customer support access',
		},
	];

	return (
		<>
			<CustomDialog
				openModal={open}
				closeModal={() => {
					if (!isProcessing) {
						handleClose();
					}
				}}
				maxWidth='sm'>
				<Box sx={{ padding: isMobileSize ? '1rem' : '1rem 2rem 0rem 2rem' }}>
					{/* Header */}
					<Box sx={{ textAlign: 'center', mb: '2rem' }}>
						<Warning sx={{ fontSize: '3rem', color: theme.textColor?.error.main, mb: '1rem' }} />
						<Typography variant='h5' sx={{ fontWeight: 'bold', mb: '0.5rem', fontSize: isMobileSize ? '1.2rem' : undefined }}>
							Cancel Subscription
						</Typography>
						<Typography variant='body2' sx={{ color: 'gray', fontSize: isMobileSize ? '0.9rem' : undefined }}>
							Are you sure you want to cancel your subscription?
						</Typography>
					</Box>

					{/* Access End Date Alert */}
					<Alert severity='info' icon={<AccessTime />} sx={{ mb: '2rem', fontSize: isMobileSize ? '0.8rem' : undefined }}>
						<Typography variant='body2' sx={{ fontWeight: 'bold' }}>
							You will retain access until {accessEndDate.toLocaleDateString()}
						</Typography>
						<Typography variant='body2'>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Access expires today'}</Typography>
					</Alert>

					{/* Features You Will Lose */}
					<Box sx={{ mb: '2rem' }}>
						<Typography variant='h6' sx={{ mb: '1rem', fontSize: isMobileSize ? '1rem' : undefined }}>
							What you will lose:
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							{featuresYouWillLose.map((feature, index) => (
								<Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
									<Box sx={{ mt: '0.25rem' }}>{feature.icon}</Box>
									<Box>
										<Typography variant='body2' sx={{ fontWeight: 'bold', mb: '0.25rem', fontSize: isMobileSize ? '0.8rem' : undefined }}>
											{feature.title}
										</Typography>
										<Typography variant='body2' sx={{ color: 'gray', fontSize: isMobileSize ? '0.75rem' : undefined }}>
											{feature.description}
										</Typography>
									</Box>
								</Box>
							))}
						</Box>
					</Box>

					{/* Cancellation Reason */}
					<Box sx={{ mb: '1rem' }}>
						<Typography variant='body2' sx={{ mb: '1rem', fontWeight: 'bold', fontSize: isMobileSize ? '0.9rem' : undefined }}>
							Help us improve (optional)
						</Typography>
						<CustomTextField
							multiline
							rows={4}
							value={cancelReason}
							onChange={(e) => setCancelReason(e.target.value)}
							placeholder="Please let us know why you're canceling your subscription. Your feedback helps us improve our service."
							sx={{
								'width': '100%',
								'& .MuiOutlinedInput-root': {
									fontSize: isMobileSize ? '0.8rem' : undefined,
								},
							}}
							InputProps={{
								inputProps: {
									maxLength: 500,
								},
							}}
						/>
						<Typography variant='caption' sx={{ color: 'gray', fontSize: isMobileSize ? '0.7rem' : undefined }}>
							{cancelReason.length}/500 characters
						</Typography>
					</Box>

					{/* Error Message */}
					{error && (
						<Alert severity='error' sx={{ mb: '2rem', fontSize: isMobileSize ? '0.8rem' : undefined }}>
							{error}
						</Alert>
					)}

					{/* Actions */}
					<CustomDialogActions
						onCancel={() => {
							if (!isProcessing) {
								handleClose();
							}
						}}
						cancelBtnText='Keep Subscription'
						submitBtnText={isProcessing ? 'Canceling...' : 'Yes, Cancel Subscription'}
						disableBtn={isProcessing}
						disableCancelBtn={isProcessing}
						onSubmit={handleUnsubscribe}
						actionSx={{ width: '100%', mx: 'auto', padding: '0' }}
					/>
				</Box>
			</CustomDialog>
			<Snackbar
				open={showSuccess}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => {
					if (!isProcessing) {
						handleClose();
						setShowSuccess(false);
					}
				}}
				sx={{ mt: { xs: '1.5rem', sm: '1.5rem', md: '2.5rem', lg: '2.5rem' } }}>
				<Alert
					severity='success'
					variant='filled'
					sx={{
						width: '100%',
						fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1rem' },
						letterSpacing: 0,
						color: theme.textColor?.common.main,
					}}>
					Subscription canceled successfully!
				</Alert>
			</Snackbar>
		</>
	);
};

export default UnsubscribeDialog;
