import {
	Box,
	Tab,
	Tabs,
	Typography,
	Snackbar,
	Alert,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Tooltip,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	List,
	ListItem,
	ListItemText,
	Divider,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { useState, useEffect, useContext } from 'react';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import theme from '../themes';
import axios from '@utils/axiosInstance';
import { useAuth } from '../hooks/useAuth';

interface IntegrationSettings {
	zoom: {
		accountId: string;
		clientId: string;
		clientSecret: string;
		meetingSdkKey: string;
		meetingSdkSecret: string;
	};
	smtp: {
		host: string;
		port: string;
		secure: string;
		user: string;
		pass: string;
		from: string;
		fromAddresses?: {
			info: string;
			marketing: string;
			noreply: string;
		};
	};
	youtube?: {
		clientId: string;
		clientSecret: string;
	};
}

const AdminSetup = () => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { canAccessPayments } = useAuth(); // Only owner/super-admin can access

	const [activeTab, setActiveTab] = useState<string>('zoom');
	const [loading, setLoading] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | undefined>();
	const [success, setSuccess] = useState<boolean>(false);

	const [settings, setSettings] = useState<IntegrationSettings>({
		zoom: {
			accountId: '',
			clientId: '',
			clientSecret: '',
			meetingSdkKey: '',
			meetingSdkSecret: '',
		},
		smtp: {
			host: '',
			port: '',
			secure: 'false',
			user: '',
			pass: '',
			from: '',
			fromAddresses: {
				info: '',
				marketing: '',
				noreply: '',
			},
		},
	});

	const [stripeConnectStatus, setStripeConnectStatus] = useState<{
		connected: boolean;
		status: string;
		accountId?: string;
	} | null>(null);
	const [stripeConnectLoading, setStripeConnectLoading] = useState<boolean>(false);

	const [youtubeStatus, setYoutubeStatus] = useState<{
		connected: boolean;
		channelId?: string;
		channelTitle?: string;
		message?: string;
	} | null>(null);
	const [youtubeLoading, setYoutubeLoading] = useState<boolean>(false);
	const [youtubeCredentials, setYoutubeCredentials] = useState<{
		clientId: string;
		clientSecret: string;
	}>({
		clientId: '',
		clientSecret: '',
	});

	const [zoomHelpDialogOpen, setZoomHelpDialogOpen] = useState<boolean>(false);

	// Fetch settings on mount
	useEffect(() => {
		if (canAccessPayments) {
			fetchSettings();
			fetchStripeConnectStatus();
			fetchYouTubeStatus();
		}
	}, [canAccessPayments]);

	// Handle YouTube OAuth callback from URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const youtubeConnect = urlParams.get('youtube_connect');
		const stripeConnect = urlParams.get('stripe_connect');

		if (youtubeConnect === 'success') {
			setSuccess(true);
			fetchYouTubeStatus();
			// Clean URL
			window.history.replaceState({}, '', window.location.pathname);
		} else if (youtubeConnect === 'error') {
			const errorMsg = urlParams.get('error') || 'Failed to connect YouTube account';
			setError(errorMsg);
			// Clean URL
			window.history.replaceState({}, '', window.location.pathname);
		}

		// Handle Stripe Connect callback from URL
		if (stripeConnect === 'success') {
			setSuccess(true);
			fetchStripeConnectStatus();
			// Clean URL
			window.history.replaceState({}, '', window.location.pathname);
		} else if (stripeConnect === 'error') {
			const errorMsg = urlParams.get('error') || 'Failed to complete Stripe Connect onboarding';
			setError(errorMsg);
			// Clean URL
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, []);

	const fetchStripeConnectStatus = async () => {
		setStripeConnectLoading(true);
		try {
			const { data } = await axios.get('/integration-settings/stripe-connect/status');
			setStripeConnectStatus(data);
		} catch (err: any) {
			console.error('Error fetching Stripe Connect status:', err);
			setStripeConnectStatus({ connected: false, status: 'not_connected' });
		} finally {
			setStripeConnectLoading(false);
		}
	};

	const handleStripeConnectOnboarding = async () => {
		setStripeConnectLoading(true);
		try {
			const { data } = await axios.post('/integration-settings/stripe-connect/onboarding');
			if (data.onboardingUrl) {
				window.location.href = data.onboardingUrl;
			}
		} catch (err: any) {
			console.error('Error initiating Stripe Connect onboarding:', err);
			setError(err?.response?.data?.message || 'Failed to initiate Stripe Connect onboarding');
		} finally {
			setStripeConnectLoading(false);
		}
	};

	const handleOpenStripeDashboard = async () => {
		try {
			const { data } = await axios.get('/integration-settings/stripe-connect/login-link');
			if (data.url) {
				window.open(data.url, '_blank');
			}
		} catch (err: any) {
			console.error('Error opening Stripe dashboard:', err);
			setError(err?.response?.data?.message || 'Failed to open Stripe dashboard');
		}
	};

	const fetchYouTubeStatus = async () => {
		setYoutubeLoading(true);
		try {
			const { data } = await axios.get('/integration-settings/youtube/status');
			setYoutubeStatus(data);
		} catch (err: any) {
			console.error('Error fetching YouTube status:', err);
			setYoutubeStatus({ connected: false, message: 'Not connected' });
		} finally {
			setYoutubeLoading(false);
		}
	};

	const handleYouTubeConnect = async () => {
		if (!youtubeCredentials.clientId || !youtubeCredentials.clientSecret) {
			setError('Please enter YouTube Client ID and Client Secret');
			return;
		}

		setYoutubeLoading(true);
		setError(undefined);
		try {
			const { data } = await axios.post('/integration-settings/youtube/connect', {
				clientId: youtubeCredentials.clientId,
				clientSecret: youtubeCredentials.clientSecret,
			});
			if (data.authUrl) {
				// Redirect to Google OAuth
				window.location.href = data.authUrl;
			}
		} catch (err: any) {
			console.error('Error initiating YouTube connection:', err);
			setError(err?.response?.data?.message || 'Failed to initiate YouTube connection');
			setYoutubeLoading(false);
		}
	};

	const handleYouTubeDisconnect = async () => {
		setYoutubeLoading(true);
		setError(undefined);
		try {
			await axios.post('/integration-settings/youtube/disconnect');
			setYoutubeStatus({ connected: false, message: 'Disconnected' });
			setSuccess(true);
			// Refresh settings to get updated state
			await fetchSettings();
		} catch (err: any) {
			console.error('Error disconnecting YouTube:', err);
			setError(err?.response?.data?.message || 'Failed to disconnect YouTube account');
		} finally {
			setYoutubeLoading(false);
		}
	};

	const fetchSettings = async () => {
		setLoading(true);
		setError(undefined);
		try {
			const { data } = await axios.get('/integration-settings');
			if (data.settings) {
				setSettings(data.settings);
				// Load YouTube credentials if available
				if (data.settings.youtube) {
					setYoutubeCredentials({
						clientId: data.settings.youtube.clientId || '',
						clientSecret: data.settings.youtube.clientSecret || '',
					});
				}
			}
		} catch (err: any) {
			console.error('Error fetching settings:', err);
			setError(err?.response?.data?.message || 'Failed to load integration settings');
		} finally {
			setLoading(false);
		}
	};

	const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
		setActiveTab(newValue);
		setError(undefined);
	};

	const handleInputChange = (section: keyof IntegrationSettings, field: string, value: string) => {
		setSettings((prev) => ({
			...prev,
			[section]: {
				...prev[section],
				[field]: value,
			},
		}));
		setError(undefined);
	};

	const handleFromAddressChange = (purpose: string, value: string) => {
		setSettings((prev) => ({
			...prev,
			smtp: {
				...prev.smtp,
				fromAddresses: {
					info: prev.smtp.fromAddresses?.info || '',
					marketing: prev.smtp.fromAddresses?.marketing || '',
					noreply: prev.smtp.fromAddresses?.noreply || '',
					[purpose]: value,
				},
			},
		}));
		setError(undefined);
	};

	const isMasked = (value: string): boolean => {
		return value.includes('***');
	};

	const handleSubmit = async () => {
		setSaving(true);
		setError(undefined);
		setSuccess(false);

		try {
			// Validate SMTP if any SMTP field is filled
			if (settings.smtp.host || settings.smtp.port || settings.smtp.user || settings.smtp.pass) {
				if (!settings.smtp.host || !settings.smtp.port || !settings.smtp.user || !settings.smtp.pass) {
					setError('SMTP configuration incomplete. Please provide host, port, user, and pass together.');
					setSaving(false);
					return;
				}
			}

			// Prepare payload - only send non-masked values
			const payload: Partial<IntegrationSettings> = {};

			// Zoom
			if (activeTab === 'zoom' || Object.values(settings.zoom).some((v) => v && !isMasked(v))) {
				payload.zoom = {
					accountId: settings.zoom.accountId && !isMasked(settings.zoom.accountId) ? settings.zoom.accountId : '',
					clientId: settings.zoom.clientId && !isMasked(settings.zoom.clientId) ? settings.zoom.clientId : '',
					clientSecret: settings.zoom.clientSecret && !isMasked(settings.zoom.clientSecret) ? settings.zoom.clientSecret : settings.zoom.clientSecret,
					meetingSdkKey: settings.zoom.meetingSdkKey && !isMasked(settings.zoom.meetingSdkKey) ? settings.zoom.meetingSdkKey : '',
					meetingSdkSecret:
						settings.zoom.meetingSdkSecret && !isMasked(settings.zoom.meetingSdkSecret)
							? settings.zoom.meetingSdkSecret
							: settings.zoom.meetingSdkSecret,
				};
			}

			// SMTP
			// Check if any SMTP string field has a value (exclude fromAddresses object)
			const smtpStringFields = ['host', 'port', 'secure', 'user', 'pass', 'from'];
			const hasSmtpChanges =
				activeTab === 'smtp' ||
				smtpStringFields.some((field) => {
					const value = settings.smtp[field as keyof typeof settings.smtp];
					return value && typeof value === 'string' && !isMasked(value);
				}) ||
				(settings.smtp.fromAddresses && Object.values(settings.smtp.fromAddresses).some((v) => v && typeof v === 'string' && !isMasked(v)));

			if (hasSmtpChanges) {
				payload.smtp = {
					host: settings.smtp.host && !isMasked(settings.smtp.host) ? settings.smtp.host : '',
					port: settings.smtp.port && !isMasked(settings.smtp.port) ? settings.smtp.port : '',
					secure: settings.smtp.secure || 'false',
					user: settings.smtp.user && !isMasked(settings.smtp.user) ? settings.smtp.user : '',
					pass: settings.smtp.pass && !isMasked(settings.smtp.pass) ? settings.smtp.pass : settings.smtp.pass,
					from: settings.smtp.from && !isMasked(settings.smtp.from) ? settings.smtp.from : '',
					fromAddresses: {
						info: settings.smtp.fromAddresses?.info && !isMasked(settings.smtp.fromAddresses.info) ? settings.smtp.fromAddresses.info : '',
						marketing:
							settings.smtp.fromAddresses?.marketing && !isMasked(settings.smtp.fromAddresses.marketing) ? settings.smtp.fromAddresses.marketing : '',
						noreply:
							settings.smtp.fromAddresses?.noreply && !isMasked(settings.smtp.fromAddresses.noreply) ? settings.smtp.fromAddresses.noreply : '',
					},
				};
			}

			// YouTube credentials are saved automatically when clicking "Connect YouTube Account"
			// No need to include them in the general Save button

			await axios.put('/integration-settings', payload);

			// Refresh settings to get updated masked values
			await fetchSettings();
			setSuccess(true);
		} catch (err: any) {
			console.error('Error saving settings:', err);
			setError(err?.response?.data?.message || 'Failed to save integration settings');
		} finally {
			setSaving(false);
		}
	};

	if (!canAccessPayments) {
		return (
			<DashboardPagesLayout pageName='Account Setup' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ padding: '2rem', textAlign: 'center' }}>
					<Typography variant='h6' color='error'>
						Access Denied
					</Typography>
					<Typography variant='body2' sx={{ mt: 1 }}>
						Only super-admins can access account setup.
					</Typography>
				</Box>
			</DashboardPagesLayout>
		);
	}

	return (
		<DashboardPagesLayout pageName='Account Setup' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			{/* Sticky Tabs */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					position: 'fixed',
					top: isMobileSize ? '3.5rem' : '4rem',
					left: isMobileSize ? 0 : '10rem',
					right: 0,
					zIndex: 100,
					backgroundColor: theme.bgColor?.secondary,
					backdropFilter: 'blur(10px)',
					width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
				}}>
				<Tabs
					value={activeTab}
					onChange={handleTabChange}
					textColor='primary'
					indicatorColor='secondary'
					sx={{
						'paddingTop': isMobileSize ? '0.5rem' : '0.25rem',
						'paddingLeft': isMobileSize ? '1rem' : '2rem',
						'paddingRight': isMobileSize ? '1rem' : '2rem',
						'& .MuiTabs-indicator': {
							backgroundColor: theme.bgColor?.adminHeader,
						},
					}}>
					<Tab
						value='zoom'
						label='Zoom'
						sx={{
							'&.Mui-selected': { color: theme.bgColor?.adminHeader },
							'textTransform': 'capitalize',
							'fontFamily': 'Poppins',
							'fontSize': isMobileSize ? '0.75rem' : undefined,
						}}
					/>
					<Tab
						value='smtp'
						label='SMTP'
						sx={{
							'&.Mui-selected': { color: theme.bgColor?.adminHeader },
							'textTransform': 'capitalize',
							'fontFamily': 'Poppins',
							'fontSize': isMobileSize ? '0.75rem' : undefined,
						}}
					/>
					<Tab
						value='stripe'
						label='Stripe'
						sx={{
							'&.Mui-selected': { color: theme.bgColor?.adminHeader },
							'textTransform': 'capitalize',
							'fontFamily': 'Poppins',
							'fontSize': isMobileSize ? '0.75rem' : undefined,
						}}
					/>
					<Tab
						value='youtube'
						label='YouTube'
						sx={{
							'&.Mui-selected': { color: theme.bgColor?.adminHeader },
							'textTransform': 'capitalize',
							'fontFamily': 'Poppins',
							'fontSize': isMobileSize ? '0.75rem' : undefined,
						}}
					/>
				</Tabs>
			</Box>

			{/* Spacer */}
			<Box
				sx={{
					height: '3rem',
					width: '100%',
				}}
			/>

			{/* Content */}
			<Box
				sx={{
					padding: isVerySmallScreen ? '1rem 1.5rem' : isRotatedMedium ? '1rem' : '2rem',
					width: '100%',
					maxWidth: '800px',
					margin: '0 auto',
				}}>
				{loading ? (
					<Box sx={{ textAlign: 'center', padding: '2rem' }}>
						<Typography>Loading settings...</Typography>
					</Box>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}>
						{/* Zoom Tab */}
						{activeTab === 'zoom' && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Box>
										<Typography variant='h6'>Zoom Integration Settings</Typography>
									</Box>
									<Box>
										<Tooltip title='How to find Zoom credentials' arrow placement='top'>
											<IconButton
												size='small'
												onClick={() => setZoomHelpDialogOpen(true)}
												sx={{
													'color': theme.textColor?.primary.main,
													'&:hover': {
														backgroundColor: 'rgba(0, 0, 0, 0.04)',
													},
												}}>
												<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
								<CustomTextField
									label='Account ID'
									value={settings.zoom.accountId}
									onChange={(e) => handleInputChange('zoom', 'accountId', e.target.value)}
									fullWidth
								/>
								<CustomTextField
									label='Client ID'
									value={settings.zoom.clientId}
									onChange={(e) => handleInputChange('zoom', 'clientId', e.target.value)}
									fullWidth
								/>
								<CustomTextField
									label='Client Secret'
									type='password'
									value={settings.zoom.clientSecret}
									onChange={(e) => handleInputChange('zoom', 'clientSecret', e.target.value)}
									fullWidth
								/>
								<CustomTextField
									label='Meeting SDK Key'
									value={settings.zoom.meetingSdkKey}
									onChange={(e) => handleInputChange('zoom', 'meetingSdkKey', e.target.value)}
									fullWidth
								/>
								<CustomTextField
									label='Meeting SDK Secret'
									type='password'
									value={settings.zoom.meetingSdkSecret}
									onChange={(e) => handleInputChange('zoom', 'meetingSdkSecret', e.target.value)}
									fullWidth
								/>
							</Box>
						)}

						{/* SMTP Tab */}
						{activeTab === 'smtp' && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Typography variant='h6' sx={{ mb: 1 }}>
									SMTP Email Settings
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
										<CustomTextField
											label='SMTP Host'
											value={settings.smtp.host}
											onChange={(e) => handleInputChange('smtp', 'host', e.target.value)}
											fullWidth
										/>
										<Tooltip title='e.g., smtp.gmail.com, smtp.sendgrid.net' arrow placement='top'>
											<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
												<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
											</IconButton>
										</Tooltip>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
										<CustomTextField
											label='SMTP Port'
											value={settings.smtp.port}
											onChange={(e) => handleInputChange('smtp', 'port', e.target.value)}
											fullWidth
										/>
										<Tooltip title='e.g., 587 (TLS) or 465 (SSL)' arrow placement='top'>
											<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
												<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
									<FormControl fullWidth>
										<InputLabel id='smtp-secure-label'>Secure *</InputLabel>
										<Select
											labelId='smtp-secure-label'
											value={settings.smtp.secure}
											label='Secure *'
											onChange={(e) => handleInputChange('smtp', 'secure', e.target.value)}
											sx={{
												'fontSize': '0.8rem',
												'size': 'small',
												'& .MuiOutlinedInput-notchedOutline': {
													borderColor: theme.bgColor?.adminHeader || '#1976d2',
												},
												'&:hover .MuiOutlinedInput-notchedOutline': {
													borderColor: theme.bgColor?.adminHeader || '#1976d2',
												},
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
													borderColor: theme.bgColor?.adminHeader || '#1976d2',
												},
											}}>
											<MenuItem value='true' sx={{ fontSize: '0.8rem' }}>
												True (SSL - port 465)
											</MenuItem>
											<MenuItem value='false' sx={{ fontSize: '0.8rem' }}>
												False (TLS - port 587)
											</MenuItem>
										</Select>
									</FormControl>
									<Tooltip title='Use "true" for SSL (port 465), "false" for TLS (port 587)' arrow placement='top'>
										<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.5rem' }}>
											<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
										</IconButton>
									</Tooltip>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: '1rem', width: 'calc(100% - 2rem)' }}>
									<CustomTextField
										label='SMTP User'
										value={settings.smtp.user}
										onChange={(e) => handleInputChange('smtp', 'user', e.target.value)}
										fullWidth
									/>
									<CustomTextField
										label='SMTP Password'
										type='password'
										value={settings.smtp.pass}
										onChange={(e) => handleInputChange('smtp', 'pass', e.target.value)}
										fullWidth
									/>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
									<CustomTextField
										label='Default From Email/Name'
										value={settings.smtp.from}
										onChange={(e) => handleInputChange('smtp', 'from', e.target.value)}
										fullWidth
									/>
									<Tooltip
										title='Default sender (fallback if purpose-specific not set). e.g., "Name <email@example.com>" or just "email@example.com"'
										arrow
										placement='top'>
										<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
											<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
										</IconButton>
									</Tooltip>
								</Box>
								<Typography variant='h6' sx={{ mt: 3, mb: 1, fontSize: '1rem' }}>
									Purpose-Specific Email Addresses (Optional)
								</Typography>
								<Typography variant='body2' sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
									Set different "from" addresses for different email types. Leave empty to use the default above.
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
									<CustomTextField
										label='Info From Email'
										value={settings.smtp.fromAddresses?.info || ''}
										onChange={(e) => handleFromAddressChange('info', e.target.value)}
										fullWidth
									/>
									<Tooltip title='e.g., info@mycompany.com (for contact form inquiries - replies expected)' arrow placement='top'>
										<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
											<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
										</IconButton>
									</Tooltip>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
									<CustomTextField
										label='Marketing From Email'
										value={settings.smtp.fromAddresses?.marketing || ''}
										onChange={(e) => handleFromAddressChange('marketing', e.target.value)}
										fullWidth
									/>
									<Tooltip title='e.g., marketing@mycompany.com (for bulk/admin emails)' arrow placement='top'>
										<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
											<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
										</IconButton>
									</Tooltip>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
									<CustomTextField
										label='No-Reply From Email'
										value={settings.smtp.fromAddresses?.noreply || ''}
										onChange={(e) => handleFromAddressChange('noreply', e.target.value)}
										fullWidth
									/>
									<Tooltip
										title='e.g., noreply@mycompany.com (for automated emails: payments, notifications, bug report confirmations)'
										arrow
										placement='top'>
										<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
											<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
										</IconButton>
									</Tooltip>
								</Box>
							</Box>
						)}

						{/* Stripe Tab */}
						{activeTab === 'stripe' && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Typography variant='h6' sx={{ mb: 1 }}>
									Stripe Connect (Payment Splitting)
								</Typography>
								<Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
									Connect your Stripe account to receive automatic payment splits from course and subscription sales.
								</Typography>

								{stripeConnectLoading ? (
									<Typography>Loading...</Typography>
								) : stripeConnectStatus?.connected ? (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box
												sx={{
													px: 1.5,
													py: 0.5,
													bgcolor: 'success.main',
													color: 'white',
													borderRadius: 1,
													fontSize: '0.875rem',
													fontWeight: 'bold',
												}}>
												Connected
											</Box>
										</Box>
										<CustomSubmitButton onClick={handleOpenStripeDashboard} variant='outlined'>
											Open Stripe Dashboard
										</CustomSubmitButton>
									</Box>
								) : (
									<CustomSubmitButton onClick={handleStripeConnectOnboarding} disabled={stripeConnectLoading}>
										{stripeConnectLoading ? 'Connecting...' : 'Connect Stripe Account'}
									</CustomSubmitButton>
								)}
							</Box>
						)}

						{/* YouTube Tab */}
						{activeTab === 'youtube' && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Typography variant='h6' sx={{ mb: 1 }}>
									YouTube Integration (Recording Uploads)
								</Typography>
								<Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
									Connect your YouTube account to automatically upload Zoom meeting recordings. Recordings will be uploaded as unlisted videos and
									displayed in your app.
								</Typography>

								{youtubeLoading && !youtubeStatus ? (
									<Typography>Loading...</Typography>
								) : (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										{/* Connection Status */}
										{youtubeStatus?.connected && (
											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Box
														sx={{
															px: 1.5,
															py: 0.5,
															bgcolor: 'success.main',
															color: 'white',
															borderRadius: 1,
															fontSize: '0.875rem',
															fontWeight: 'bold',
														}}>
														Connected
													</Box>
												</Box>
												{youtubeStatus.channelTitle && (
													<Typography variant='body2' sx={{ color: 'text.secondary' }}>
														Channel: {youtubeStatus.channelTitle}
													</Typography>
												)}
												<CustomSubmitButton
													onClick={handleYouTubeDisconnect}
													disabled={youtubeLoading}
													variant='outlined'
													sx={{
														'mt': 1,
														'maxWidth': '200px',
														'borderColor': 'error.main',
														'color': 'error.main',
														'&:hover': {
															borderColor: 'error.dark',
															backgroundColor: 'error.light',
															color: 'error.dark',
														},
													}}>
													{youtubeLoading ? 'Disconnecting...' : 'Disconnect'}
												</CustomSubmitButton>
											</Box>
										)}

										{/* Credentials Input Fields (always visible) */}
										<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
											<CustomTextField
												label='YouTube Client ID'
												value={youtubeCredentials.clientId}
												onChange={(e) => setYoutubeCredentials((prev) => ({ ...prev, clientId: e.target.value }))}
												fullWidth
											/>
											<Tooltip title='Get this from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID' arrow placement='top'>
												<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
													<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
												</IconButton>
											</Tooltip>
										</Box>
										<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
											<CustomTextField
												label='YouTube Client Secret'
												type='password'
												value={youtubeCredentials.clientSecret}
												onChange={(e) => setYoutubeCredentials((prev) => ({ ...prev, clientSecret: e.target.value }))}
												fullWidth
											/>
											<Tooltip title='Get this from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID' arrow placement='top'>
												<IconButton size='small' sx={{ color: 'text.secondary', mt: '0.25rem' }}>
													<InfoOutlined fontSize='small' sx={{ fontSize: '1rem' }} />
												</IconButton>
											</Tooltip>
										</Box>

										{/* Connect Button */}
										<CustomSubmitButton onClick={handleYouTubeConnect} disabled={youtubeLoading}>
											{youtubeLoading ? 'Connecting...' : 'Connect YouTube Account'}
										</CustomSubmitButton>
									</Box>
								)}
							</Box>
						)}

						{error && <CustomErrorMessage sx={{ mt: 2, mb: 1 }}>{error}</CustomErrorMessage>}

						<Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
							<CustomSubmitButton type='submit' disabled={saving}>
								{saving ? 'Saving...' : 'Save'}
							</CustomSubmitButton>
						</Box>
					</form>
				)}
			</Box>

			{/* Zoom Help Dialog */}
			<Dialog open={zoomHelpDialogOpen} onClose={() => setZoomHelpDialogOpen(false)} maxWidth='md' fullWidth>
				<DialogTitle>How to Find Zoom Credentials</DialogTitle>
				<DialogContent>
					<Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
						Follow these steps to find your Zoom credentials in the Zoom Marketplace:
					</Typography>
					<List>
						<ListItem>
							<ListItemText
								primary='Account ID'
								secondary={
									<>
										1. Go to{' '}
										<a href='https://marketplace.zoom.us/' target='_blank' rel='noopener noreferrer'>
											Zoom Marketplace
										</a>
										<br />
										2. Sign in with your Zoom account
										<br />
										3. Navigate to <strong>Develop → Build App</strong>
										<br />
										4. Select your app or create a new Server-to-Server OAuth app
										<br />
										5. The <strong>Account ID</strong> is displayed in the app credentials section
									</>
								}
							/>
						</ListItem>
						<Divider />
						<ListItem>
							<ListItemText
								primary='Client ID'
								secondary={
									<>
										1. In your Server-to-Server OAuth app settings
										<br />
										2. Go to the <strong>App Credentials</strong> tab
										<br />
										3. The <strong>Client ID</strong> is shown in the credentials section
									</>
								}
							/>
						</ListItem>
						<Divider />
						<ListItem>
							<ListItemText
								primary='Client Secret'
								secondary={
									<>
										1. In the same <strong>App Credentials</strong> tab
										<br />
										2. Click <strong>Show</strong> next to Client Secret to reveal it
										<br />
										3. Copy the <strong>Client Secret</strong> (you may need to verify your identity)
									</>
								}
							/>
						</ListItem>
						<Divider />
						<ListItem>
							<ListItemText
								primary='Meeting SDK Key'
								secondary={
									<>
										1. In Zoom Marketplace, go to <strong>Develop → Build App</strong>
										<br />
										2. Create or select a <strong>General App</strong> (different from Server-to-Server OAuth)
										<br />
										3. Go to the <strong>App Credentials</strong> tab
										<br />
										4. The <strong>Client ID</strong> in this General App is your <strong>Meeting SDK Key</strong>
									</>
								}
							/>
						</ListItem>
						<Divider />
						<ListItem>
							<ListItemText
								primary='Meeting SDK Secret'
								secondary={
									<>
										1. In the same General App <strong>App Credentials</strong> tab
										<br />
										2. Click <strong>Show</strong> next to Client Secret to reveal it
										<br />
										3. The <strong>Client Secret</strong> in this General App is your <strong>Meeting SDK Secret</strong>
										<br />
										4. Copy the secret (you may need to verify your identity)
									</>
								}
							/>
						</ListItem>
					</List>
					<Typography variant='body2' sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
						Note: You need to create two separate apps in Zoom Marketplace:
						<br />• One <strong>Server-to-Server OAuth</strong> app (for Account ID, Client ID, Client Secret)
						<br />• One <strong>General App</strong> (for Meeting SDK Key and Secret - these are the Client ID and Client Secret of the General App)
					</Typography>

					<Divider sx={{ my: 3 }} />

					<Typography variant='h6' sx={{ mb: 2 }}>
						Required OAuth Scopes
					</Typography>
					<Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
						When setting up your <strong>Server-to-Server OAuth</strong> app, make sure to enable the following scopes in the <strong>Scopes</strong>{' '}
						tab:
					</Typography>
					<List dense>
						<ListItem>
							<ListItemText primary='meeting:write' secondary='Required to create and manage Zoom meetings for events' />
						</ListItem>
						<ListItem>
							<ListItemText primary='meeting:read' secondary='Required to read meeting details and information' />
						</ListItem>
						<ListItem>
							<ListItemText primary='recording:read' secondary='Required to access and retrieve meeting recordings' />
						</ListItem>
						<ListItem>
							<ListItemText primary='user:read' secondary='Required to read user information for meeting hosts' />
						</ListItem>
					</List>
					<Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
						<strong>How to set scopes:</strong>
						<br />
						1. In your Server-to-Server OAuth app, go to the <strong>Scopes</strong> tab
						<br />
						2. Under <strong>Account-level scopes</strong>, enable the scopes listed above
						<br />
						3. Click <strong>Save</strong> to apply the changes
						<br />
						4. You may need to activate your app after setting scopes
					</Typography>
				</DialogContent>
				<DialogActions sx={{ margin: '0 0.5rem 0.5rem 0' }}>
					<CustomCancelButton onClick={() => setZoomHelpDialogOpen(false)}>Close</CustomCancelButton>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={success}
				autoHideDuration={3000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setSuccess(false)}
				sx={{ mt: '2.5rem' }}>
				<Alert severity='success' variant='filled' sx={{ width: '100%', color: '#fff' }}>
					Integration settings saved successfully!
				</Alert>
			</Snackbar>
		</DashboardPagesLayout>
	);
};

export default AdminSetup;
