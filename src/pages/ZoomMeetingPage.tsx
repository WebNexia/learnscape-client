import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button, TextField, IconButton } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import axiosOriginal from 'axios';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';
// Required Meeting SDK styles. Without these, the embedded UI/toolbar can appear invisible until a hard refresh.
import '@zoom/meetingsdk/dist/css/bootstrap.css';
import '@zoom/meetingsdk/dist/css/react-select.css';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import logo from '../assets/logo.png';

type ZoomEmbeddedClient = ReturnType<typeof ZoomMtgEmbedded.createClient>;

const ZoomMeetingPage = () => {
	const { eventId } = useParams<{ eventId: string }>();
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isPublicEvent, setIsPublicEvent] = useState<boolean | null>(null);
	const [showEmailInput, setShowEmailInput] = useState(false);
	const [email, setEmail] = useState<string>('');
	const [emailError, setEmailError] = useState<string | null>(null);
	const [eventDetails, setEventDetails] = useState<{
		title?: string;
		description?: string;
		start?: string;
		end?: string;
		location?: string;
		isPublic?: boolean;
	} | null>(null);
	const [zoomCredentials, setZoomCredentials] = useState<{
		meetingId?: string;
		meetingPassword?: string;
		meetingNumber?: string;
		joinUrl?: string;
	} | null>(null);
	const [zoomRuntimeStatus, setZoomRuntimeStatus] = useState<{ status?: string | null } | null>(null);
	const [sdkLoaded, setSdkLoaded] = useState(false);
	const [isJoined, setIsJoined] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [signatureDebug, setSignatureDebug] = useState<{
		role?: number;
		mn?: string | number;
		sdkKeyLast4?: string;
		appKeyLast4?: string;
		iat?: number;
		exp?: number;
		tokenExp?: number;
	} | null>(null);
	const joinTimeoutRef = useRef<number | null>(null);
	const joinStartedAtRef = useRef<number | null>(null);
	const [joinPhase, setJoinPhase] = useState<string | null>(null);
	const zoomContainerRef = useRef<HTMLDivElement>(null);
	const meetingSdkRootRef = useRef<HTMLDivElement>(null);
	const embeddedClientRef = useRef<ZoomEmbeddedClient | null>(null);
	const [isEmbeddedInited, setIsEmbeddedInited] = useState(false);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const decodeJwtPayload = (token: string) => {
		try {
			const parts = token.split('.');
			if (parts.length < 2) return null;
			const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
			const json = decodeURIComponent(
				atob(base64)
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
			return JSON.parse(json);
		} catch {
			return null;
		}
	};

	const fetchZoomCredentials = async (userEmail?: string) => {
		if (!eventId) {
			setError('Event ID is missing');
			setLoading(false);
			return;
		}

		try {
			// For public events, email is required (from user input or logged-in user)
			// For non-public events, authentication is required
			const emailToUse = userEmail || (user && user.email ? user.email : null);
			const url = emailToUse
				? `${base_url}/events/${eventId}/zoom-credentials?email=${encodeURIComponent(emailToUse)}`
				: `${base_url}/events/${eventId}/zoom-credentials`;

			const response = await axios.get(url);
			const credentials = response.data.data;

			if (!credentials.meetingId && !credentials.meetingNumber) {
				setError('Zoom meeting not found for this event');
				setLoading(false);
				return;
			}

			// Fetch event details
			try {
				const eventResponse = await axios.get(`${base_url}/events/${eventId}`);
				const event = eventResponse.data.data;
				setIsPublicEvent(event?.isPublic || false);
				setEventDetails({
					title: event?.title,
					description: event?.description,
					start: event?.start,
					end: event?.end,
					location: event?.location,
					isPublic: event?.isPublic,
				});
			} catch (eventErr) {
				// If we can't fetch event details, assume it's non-public (more secure)
				setIsPublicEvent(false);
			}

			setZoomCredentials(credentials);
			setLoading(false);
			console.log('Zoom credentials fetched:', {
				hasMeetingNumber: !!credentials.meetingNumber,
				hasMeetingId: !!credentials.meetingId,
				hasPassword: !!credentials.meetingPassword,
				credentials,
			});
		} catch (err: any) {
			console.error('Error fetching Zoom credentials:', err);
			if (axiosOriginal.isAxiosError(err) && err.response?.status === 404) {
				setError('Zoom meeting not found for this event');
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 403) {
				const errorMessage = err.response?.data?.message || 'You do not have access to this Zoom meeting';
				setError(errorMessage);
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 400) {
				// Email required for public events
				const errorMessage = err.response?.data?.message || 'Email is required';
				setError(errorMessage);
				// Check if it's a public event
				try {
					const eventResponse = await axios.get(`${base_url}/events/${eventId}`);
					const event = eventResponse.data.data;
					if (event?.isPublic) {
						setIsPublicEvent(true);
						setShowEmailInput(true);
						setError(null); // Clear error, show email input instead
					}
				} catch (eventErr) {
					// Ignore
				}
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 401) {
				// Non-public event requires authentication
				const errorMessage = err.response?.data?.message || 'Authentication required';
				setError(errorMessage);
				setIsPublicEvent(false);
			} else {
				setError('Failed to load Zoom meeting. Please try again.');
			}
			setLoading(false);
		}
	};

	const fetchZoomStatus = async (userEmail?: string) => {
		if (!eventId) return;
		try {
			const emailToUse = userEmail || (user && user.email ? user.email : null);
			const url = emailToUse
				? `${base_url}/events/${eventId}/zoom-status?email=${encodeURIComponent(emailToUse)}`
				: `${base_url}/events/${eventId}/zoom-status`;
			const resp = await axios.get(url);
			setZoomRuntimeStatus(resp.data.data || null);
		} catch (err) {
			// Status is best-effort; do not block join page
			setZoomRuntimeStatus(null);
		}
	};

	useEffect(() => {
		embeddedClientRef.current = ZoomMtgEmbedded.createClient();
		setSdkLoaded(true);
		fetchZoomCredentials();
		fetchZoomStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventId, base_url, user]);

	// Poll Zoom meeting runtime status while user is on the page (helps avoid "Live now" when host hasn't started).
	useEffect(() => {
		if (!eventId) return;
		if (isJoined) return;
		const emailToUse = email || (user && user.email ? user.email : undefined);
		const interval = window.setInterval(() => {
			fetchZoomStatus(emailToUse);
		}, 20000);
		return () => window.clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventId, user, email, isJoined]);

	const cleanupZoomOverlay = async () => {
		try {
			// Component View cleanup
			const client = embeddedClientRef.current;
			if (client) {
				// `leaveMeeting` exists on component view clients; ignore if missing
				const clientAny = client as any;
				await clientAny.leaveMeeting?.();
			}
		} catch {
			// ignore
		}
		try {
			if (meetingSdkRootRef.current) {
				meetingSdkRootRef.current.innerHTML = '';
			}
		} catch {
			// ignore
		}
		setIsEmbeddedInited(false);
	};

	// Watchdog: if joining gets stuck, force-show an error and clean up the Zoom overlay.
	useEffect(() => {
		if (!isJoining) return;
		joinStartedAtRef.current = Date.now();
		if (!joinPhase) setJoinPhase('Starting…');
		const interval = window.setInterval(() => {
			const startedAt = joinStartedAtRef.current;
			if (!startedAt) return;
			if (Date.now() - startedAt > 15000) {
				setError(
					'Still joining… This usually means the Zoom meeting requires authentication (or the browser session is blocked). Try: Incognito / a different browser.'
				);
				setIsJoining(false);
				setJoinPhase(null);
				cleanupZoomOverlay();
				window.clearInterval(interval);
			}
		}, 500);
		return () => window.clearInterval(interval);
	}, [isJoining, joinPhase]);

	const meetingStatus = (() => {
		const now = Date.now();
		const startMs = eventDetails?.start ? new Date(eventDetails.start).getTime() : null;
		const endMs = eventDetails?.end ? new Date(eventDetails.end).getTime() : null;
		const runtime = (zoomRuntimeStatus?.status || '').toLowerCase();

		if (runtime === 'started') return 'Live now';
		if (runtime === 'waiting') {
			if (startMs && now >= startMs) return 'Waiting for host';
			return 'Starts soon';
		}
		if (runtime === 'ended') return 'Ended';

		if (startMs && endMs) {
			if (now >= startMs && now <= endMs) return 'Live now';
			if (now < startMs) return 'Starts soon';
			if (now > endMs) return 'Ended';
		}
		if (startMs) {
			if (now >= startMs) return 'Live now';
			return 'Starts soon';
		}
		return 'Ready to join';
	})();

	const canJoinNow = (() => {
		// If Zoom says started, allow join.
		const runtime = (zoomRuntimeStatus?.status || '').toLowerCase();
		if (runtime === 'started') return true;
		// If we don't know status, keep existing behavior (allow join).
		if (!runtime) return true;
		// waiting/ended -> do not join
		return false;
	})();

	const handleJoinMeeting = async () => {
		if (!sdkLoaded || !zoomCredentials || !embeddedClientRef.current) {
			setError('Zoom SDK is not ready. Please wait a moment and try again.');
			return;
		}
		if (!canJoinNow) {
			setError(meetingStatus === 'Ended' ? 'This meeting has ended.' : 'Waiting for host to start the meeting.');
			return;
		}

		const meetingNumber = zoomCredentials.meetingNumber || zoomCredentials.meetingId || '';
		const password = zoomCredentials.meetingPassword || '';

		if (!meetingNumber) {
			setError('Meeting number is missing');
			return;
		}

		// Component View needs an in-page root element
		if (!meetingSdkRootRef.current) {
			setError('Zoom container not found. Please refresh the page.');
			return;
		}

		setIsJoining(true);
		setError(null);
		setJoinPhase('Requesting signature…');

		try {
			// If Zoom gets stuck on "Joining Meeting..." (common when meeting requires auth or session conflict),
			// surface a clear error AND hide the Zoom overlay so the user can see it.
			if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
			joinTimeoutRef.current = window.setTimeout(() => {
				setError(
					'Still joining… Try Incognito (or a different browser/account). Also check Zoom meeting settings: “Only authenticated users can join” / “Waiting room”.'
				);
				setIsJoining(false);
				cleanupZoomOverlay();
			}, 15000);

			// Get signature from backend
			const emailToUse = email || (user && user.email ? user.email : null);
			const signatureResponse = await axios.post(`${base_url}/events/${eventId}/zoom-signature`, {
				meetingNumber,
				role: 0, // 0 = participant, 1 = host
				...(emailToUse && { email: emailToUse }),
			});

			const { signature, sdkKey, role: serverRole } = signatureResponse.data.data;
			const decoded = signature ? decodeJwtPayload(signature) : null;
			setSignatureDebug({
				role: typeof serverRole === 'number' ? serverRole : decoded?.role,
				mn: decoded?.mn,
				sdkKeyLast4: typeof sdkKey === 'string' ? sdkKey.slice(-4) : undefined,
				appKeyLast4: typeof decoded?.appKey === 'string' ? decoded.appKey.slice(-4) : undefined,
				iat: decoded?.iat,
				exp: decoded?.exp,
				tokenExp: decoded?.tokenExp,
			});

			if (!signature || !sdkKey) {
				setError('Failed to generate Zoom signature');
				setIsJoining(false);
				setJoinPhase(null);
				return;
			}

			const client = embeddedClientRef.current;
			if (!client) throw new Error('Zoom embedded client missing');

			if (!isEmbeddedInited) {
				setJoinPhase('Initializing Zoom…');
				await client.init({
					zoomAppRoot: meetingSdkRootRef.current,
					language: 'en-US',
				});
				setIsEmbeddedInited(true);
			}

			setJoinPhase('Joining meeting…');
			await client.join({
				sdkKey,
				signature,
				meetingNumber,
				password,
				userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'LearnScape User' : 'Guest User',
				// Do not pass userEmail unless you implement Zoom's registration-required flow
			});

			if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
			setIsJoined(true);
			setIsJoining(false);
			setJoinPhase(null);
		} catch (err: any) {
			if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
			if (axiosOriginal.isAxiosError(err) && err.response?.status === 500) {
				setError('Zoom SDK credentials not configured on server');
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 400) {
				setError(err.response?.data?.message || 'Email is required');
				if (isPublicEvent) {
					setShowEmailInput(true);
				}
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 403) {
				setError(err.response?.data?.message || 'You must register for this event to join the Zoom meeting');
			} else {
				setError('Failed to join Zoom meeting. Please try again.');
			}
			setIsJoining(false);
			setJoinPhase(null);
			await cleanupZoomOverlay();
		}
	};

	const handleEmailSubmit = async () => {
		if (!email) {
			setEmailError('Email is required');
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setEmailError('Invalid email format');
			return;
		}

		setEmailError(null);
		setLoading(true);
		setError(null);
		await fetchZoomCredentials(email);
	};

	const toggleFullscreen = () => {
		if (!zoomContainerRef.current) return;

		if (!isFullscreen) {
			if (zoomContainerRef.current.requestFullscreen) {
				zoomContainerRef.current.requestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	// For non-public events, rely on backend 401/403 instead of client-side redirects.
	// (On refresh, `user` can be briefly undefined and cause incorrect navigation.)

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					gap: 2,
				}}>
				<CircularProgress />
				<Typography variant='body1'>Loading Zoom meeting...</Typography>
			</Box>
		);
	}

	// Show email input for public events if email is required
	if (showEmailInput && isPublicEvent) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					gap: 2,
					p: 3,
				}}>
				<Typography variant='h6' sx={{ mb: 2 }}>
					Enter Your Email to Join
				</Typography>
				<Typography variant='body2' sx={{ mb: 2, color: 'text.secondary', maxWidth: 400, textAlign: 'center' }}>
					Please enter the email address you used to register for this event.
				</Typography>
				<TextField
					label='Email Address'
					type='email'
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						setEmailError(null);
					}}
					error={!!emailError}
					helperText={emailError}
					sx={{ mb: 2, minWidth: 300 }}
					fullWidth={false}
				/>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<Button variant='outlined' onClick={() => navigate(-1)}>
						Go Back
					</Button>
					<Button variant='contained' onClick={handleEmailSubmit} disabled={loading}>
						{loading ? 'Loading...' : 'Join Meeting'}
					</Button>
				</Box>
				{error && (
					<Alert severity='error' sx={{ mt: 2, maxWidth: 500 }}>
						{error}
					</Alert>
				)}
			</Box>
		);
	}

	if (error && !zoomCredentials) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					gap: 2,
					p: 3,
				}}>
				<Alert severity='error' sx={{ mb: 2, maxWidth: 500 }}>
					{error}
				</Alert>
				<Button variant='contained' onClick={() => navigate(-1)}>
					Go Back
				</Button>
			</Box>
		);
	}

	return (
		<Box
			id='zoom-meeting-page'
			sx={{
				width: '100%',
				height: '100dvh',
				display: 'flex',
				flexDirection: 'column',
				bgcolor: '#f7f9fb',
				backgroundImage:
					'radial-gradient(circle at 10% 10%, rgba(45,140,255,0.12) 0%, transparent 55%), radial-gradient(circle at 90% 0%, rgba(99,102,241,0.10) 0%, transparent 50%)',
				overflow: 'hidden',
				position: 'relative',
			}}>
			{/* Header - always visible */}
			<Box
				sx={{
					width: '100%',
					bgcolor: 'white',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					height: { xs: 52, sm: 60 },
					px: { xs: 2, sm: 4 },
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
					<Box
						component='img'
						src={logo}
						alt='LearnScape Logo'
						sx={{
							height: { xs: 26, sm: '3rem' },
							borderRadius: 1,
						}}
					/>
				</Box>
				<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
					<Typography
						variant='caption'
						sx={{
							color: 'text.secondary',
							lineHeight: 1.1,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}>
						{eventDetails?.title}
					</Typography>
				</Box>
			</Box>

			{/* Global error banner (always visible even if Zoom overlay is stuck) */}
			{error && (
				<Box
					sx={{
						position: 'fixed',
						top: { xs: 56, sm: 64 },
						left: 12,
						right: 12,
						zIndex: 2000,
					}}>
					<Alert severity='error' onClose={() => setError(null)}>
						{error}
					</Alert>
				</Box>
			)}

			{/* Main Content - centered */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'flex-start',
					py: { xs: 1.5, sm: 2 },
					px: { xs: 2, sm: 3 },
					overflow: 'hidden',
					minHeight: 0,
				}}>
				<Box
					sx={{
						maxWidth: 900,
						width: '100%',
						display: 'flex',
						flexDirection: 'column',
						gap: { xs: 1.5, sm: 2 },
						height: '100%',
						minHeight: 0,
					}}>
					{/* Zoom Meeting Container - always visible, small and centered */}
					<Box
						id='zoom-meeting-container'
						ref={zoomContainerRef}
						sx={{
							width: '100%',

							height: isJoined ? '80vh' : '60dvh',
							maxHeight: isJoined ? '80vh' : '60dvh',
							bgcolor: !isJoined ? '#111' : 'transparent',
							borderRadius: '0.5rem',
							overflow: 'visible',
							boxShadow: !isJoined ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
							position: 'relative',
							minHeight: { xs: 260, sm: 340, md: 420 },
							mt: isJoined ? '4rem' : 0,
						}}>
						{/* Component View root: Zoom renders inside this element */}
						<Box
							ref={meetingSdkRootRef}
							sx={{
								position: 'relative',
								width: '100%',
								height: '100%',
							}}
						/>

						{/* Placeholder when not joined */}
						{!isJoined && (
							<Box
								sx={{
									width: '100%',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: 'transparent',
									position: 'absolute',
									top: 0,
									left: 0,
									zIndex: 2,
								}}>
								<Typography variant='body1' sx={{ color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: { xs: '	1rem', sm: '1.25rem' } }}>
									{meetingStatus === 'Starts soon' ? 'Ready to join (scheduled)' : meetingStatus}
								</Typography>
							</Box>
						)}
					</Box>

					{/* Event Details and Join Button - below Zoom UI */}
					{!isJoined && (
						<Box
							sx={{
								bgcolor: 'white',
								borderRadius: 2,
								p: { xs: 2.25, sm: 3 },
								boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 3,
								overflow: 'hidden',
								flex: 1,
								minHeight: 0,
								border: '1px solid rgba(15, 23, 42, 0.06)',
							}}>
							{/* Event Info */}
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
								{eventDetails?.start && (
									<Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
										<strong>Starts:</strong>{' '}
										{new Date(eventDetails.start).toLocaleString(undefined, {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
											timeZoneName: 'short',
										})}
									</Typography>
								)}
								{eventDetails?.end && (
									<Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
										<strong>Ends:</strong>{' '}
										{new Date(eventDetails.end).toLocaleString(undefined, {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
											timeZoneName: 'short',
										})}
									</Typography>
								)}
							</Box>

							{/* Join Button - only show when not joined */}

							<Box sx={{ mt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
								{isJoining && joinPhase && (
									<Typography variant='caption' color='text.secondary'>
										{joinPhase}
									</Typography>
								)}
								<Button
									variant='contained'
									size='medium'
									onClick={() => {
										console.log('Join Meeting button clicked!', { sdkLoaded, hasCredentials: !!zoomCredentials, isJoining });
										handleJoinMeeting();
									}}
									disabled={!sdkLoaded || isJoining || !zoomCredentials || !canJoinNow}
									sx={{
										'background': sdkLoaded && zoomCredentials ? 'linear-gradient(135deg, #2D8CFF 0%, #0066CC 100%)' : '#666',
										'color': 'white',
										'py': { xs: 0.5, sm: 0.5 },
										'fontSize': { xs: '0.8rem', sm: '0.9rem' },
										'fontWeight': 600,
										'textTransform': 'capitalize',
										'&:hover': {
											background: sdkLoaded && zoomCredentials ? 'linear-gradient(135deg, #0066CC 0%, #2D8CFF 100%)' : '#666',
										},
										'&:disabled': {
											background: '#ccc',
											color: '#999',
											cursor: 'not-allowed',
										},
									}}>
									{isJoining ? 'Joining...' : meetingStatus === 'Live now' ? 'Join Now' : 'Join Meeting'}
								</Button>
								{!canJoinNow && (
									<Typography variant='caption' color='text.secondary'>
										{meetingStatus === 'Ended' ? 'Meeting ended' : 'Waiting for host to start…'}
									</Typography>
								)}
								{error && <Alert severity='error'>{error}</Alert>}
							</Box>
						</Box>
					)}
				</Box>
			</Box>

			{/* Bottom copyright (always visible) */}
			<Box
				sx={{
					width: '100%',
					height: { xs: 40, sm: 44 },
					px: { xs: 2, sm: 4 },
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'text.secondary',
				}}>
				<Typography variant='caption' sx={{ opacity: 0.85 }}>
					&copy; {new Date().getFullYear()} Webnexia Software Solutions Ltd. All rights reserved.
				</Typography>
			</Box>
		</Box>
	);
};

export default ZoomMeetingPage;
