import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button, TextField, IconButton } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import axiosOriginal from 'axios';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import logo from '../assets/logo.png';

// Zoom Web SDK types
declare global {
	interface Window {
		ZoomMtg: {
			init: (config: any) => void;
			join: (config: {
				sdkKey: string;
				signature: string;
				meetingNumber: string;
				// Zoom Meeting SDK uses `passWord` (capital W)
				passWord: string;
				userName: string;
				userEmail?: string;
				tk?: string;
				zak?: string;
				success: (success: any) => void;
				error: (error: any) => void;
			}) => void;
			preLoadWasm: () => void;
			prepareWebSDK: () => void;
			setZoomJSLib: (path: string, dir: string) => void;
		};
	}
}

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
	const [sdkLoaded, setSdkLoaded] = useState(false);
	const [isJoined, setIsJoined] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const joinTimeoutRef = useRef<number | null>(null);
	const joinStartedAtRef = useRef<number | null>(null);
	const [joinPhase, setJoinPhase] = useState<string | null>(null);
	const zoomContainerRef = useRef<HTMLDivElement>(null);
	const scriptsLoadedRef = useRef(false);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

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

	useEffect(() => {
		const loadZoomSDK = () => {
			if (scriptsLoadedRef.current) {
				return;
			}

			scriptsLoadedRef.current = true;

			// Required CSS for Meeting SDK UI (prevents blank/unstyled render)
			const ensureCss = (href: string, id: string) => {
				if (document.getElementById(id)) return;
				const link = document.createElement('link');
				link.id = id;
				link.rel = 'stylesheet';
				link.type = 'text/css';
				link.href = href;
				document.head.appendChild(link);
			};
			ensureCss('https://source.zoom.us/3.0.0/css/bootstrap.css', 'zoom-sdk-bootstrap-css');
			ensureCss('https://source.zoom.us/3.0.0/css/react-select.css', 'zoom-sdk-react-select-css');

			// Load Zoom Web SDK dependencies
			const dependencies = [
				'https://source.zoom.us/3.0.0/lib/vendor/react.min.js',
				'https://source.zoom.us/3.0.0/lib/vendor/react-dom.min.js',
				'https://source.zoom.us/3.0.0/lib/vendor/redux.min.js',
				'https://source.zoom.us/3.0.0/lib/vendor/redux-thunk.min.js',
				'https://source.zoom.us/3.0.0/lib/vendor/lodash.min.js',
			];

			let loadedCount = 0;
			const totalDeps = dependencies.length;

			dependencies.forEach((src) => {
				const script = document.createElement('script');
				script.src = src;
				script.async = true;
				script.onload = () => {
					loadedCount++;
					if (loadedCount === totalDeps) {
						// All dependencies loaded, now load main Zoom SDK
						const zoomScript = document.createElement('script');
						zoomScript.src = 'https://source.zoom.us/zoom-meeting-3.0.0.min.js';
						zoomScript.async = true;
						zoomScript.onload = () => {
							if (window.ZoomMtg) {
								window.ZoomMtg.setZoomJSLib('https://source.zoom.us/3.0.0/lib', '/av');
								window.ZoomMtg.preLoadWasm();
								window.ZoomMtg.prepareWebSDK();
								// Wait a bit for WASM to fully load before marking SDK as ready
								setTimeout(() => {
									console.log('Zoom SDK fully loaded and ready');
									setSdkLoaded(true);
								}, 1000);
							}
						};
						zoomScript.onerror = () => {
							setError('Failed to load Zoom SDK');
							setLoading(false);
						};
						document.body.appendChild(zoomScript);
					}
				};
				script.onerror = () => {
					setError('Failed to load Zoom SDK dependencies');
					setLoading(false);
				};
				document.body.appendChild(script);
			});
		};

		loadZoomSDK();
		// Initial fetch - will use logged-in user's email if available
		fetchZoomCredentials();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventId, base_url, user]);

	// Zoom Web SDK expects `#zmmtg-root` to be a direct child of <body>.
	// We keep it hidden until the user clicks "Join Meeting".
	useEffect(() => {
		if (document.getElementById('zmmtg-root')) return;
		const root = document.createElement('div');
		root.id = 'zmmtg-root';
		// Hidden by default; when enabled we position it over our in-page container.
		// Keep z-index low so it doesn't permanently cover the page if Zoom gets stuck.
		root.style.cssText = 'position:absolute; top:0; left:0; width:0; height:0; z-index:20; display:none; pointer-events:none;';
		document.body.appendChild(root);
		return () => {
			const existing = document.getElementById('zmmtg-root');
			if (existing) existing.remove();
		};
	}, []);

	// Zoom Web SDK injects global CSS that can lock scrolling (e.g. html/body overflow hidden).
	// Force-override while this page is mounted (removed on unmount).
	useEffect(() => {
		if (document.getElementById('zoom-scroll-fix')) return;
		const style = document.createElement('style');
		style.id = 'zoom-scroll-fix';
		style.innerHTML = `
      html, body {
        overflow: auto !important;
        height: auto !important;
      }

      body.ReactModal__Body--open {
        overflow: auto !important;
        position: static !important;
      }
    `;
		document.head.appendChild(style);
		return () => {
			style.remove();
		};
	}, []);

	const syncZmmtgRootToContainer = () => {
		const zoomRoot = document.getElementById('zmmtg-root');
		const container = document.getElementById('zoom-meeting-container');
		if (!zoomRoot || !container) return;
		const rect = container.getBoundingClientRect();
		// Absolute positioned in document coordinates; will scroll with the page.
		zoomRoot.style.position = 'absolute';
		zoomRoot.style.left = `${rect.left + window.scrollX}px`;
		zoomRoot.style.top = `${rect.top + window.scrollY}px`;
		zoomRoot.style.width = `${rect.width}px`;
		zoomRoot.style.height = `${rect.height}px`;
		zoomRoot.style.zIndex = '20';
	};

	const cleanupZoomOverlay = () => {
		const root = document.getElementById('zmmtg-root');
		if (root) {
			// Clear any stuck inner UI
			root.innerHTML = '';
			root.style.display = 'none';
			root.style.pointerEvents = 'none';
		}
		window.removeEventListener('resize', syncZmmtgRootToContainer);
		window.removeEventListener('scroll', syncZmmtgRootToContainer);
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
					'Still joining… This usually means the Zoom meeting requires authentication (or the browser session is blocked). Try: Open in Zoom App / try a different browser.'
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

	const handleJoinMeeting = async () => {
		if (!sdkLoaded || !zoomCredentials || !window.ZoomMtg) {
			setError('Zoom SDK is not ready. Please wait a moment and try again.');
			return;
		}

		const meetingNumber = zoomCredentials.meetingNumber || zoomCredentials.meetingId || '';
		const password = zoomCredentials.meetingPassword || '';

		if (!meetingNumber) {
			setError('Meeting number is missing');
			return;
		}

		// Check if zmmtg-root exists
		const zoomRoot = document.getElementById('zmmtg-root');
		if (!zoomRoot) {
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

			const { signature, sdkKey } = signatureResponse.data.data;

			if (!signature || !sdkKey) {
				setError('Failed to generate Zoom signature');
				setIsJoining(false);
				setJoinPhase(null);
				return;
			}

			// Initialize Zoom SDK
			// Make Zoom root visible and align it to our in-page container
			syncZmmtgRootToContainer();
			window.addEventListener('resize', syncZmmtgRootToContainer);
			window.addEventListener('scroll', syncZmmtgRootToContainer, { passive: true });
			zoomRoot.style.display = 'block';
			zoomRoot.style.pointerEvents = 'auto';

			// Meeting SDK expects init to complete before join; otherwise it can render black.
			setJoinPhase('Initializing Zoom…');
			window.ZoomMtg.init({
				leaveUrl: window.location.href,
				patchJsMedia: true,
				success: () => {
					setJoinPhase('Joining meeting…');
					window.ZoomMtg.join({
						sdkKey: sdkKey,
						signature: signature,
						meetingNumber: meetingNumber,
						// Zoom Meeting SDK expects `passWord` (capital W), not `password`.
						passWord: password,
						userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Guest User' : email || 'Guest User',
						...(emailToUse && { userEmail: emailToUse }),
						success: (_success: any) => {
							if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
							setTimeout(() => {
								setIsJoined(true);
								setIsJoining(false);
								setJoinPhase(null);
							}, 500);
						},
						error: (joinErr: any) => {
							if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
							setError(`Failed to join meeting: ${joinErr?.reason || joinErr?.message || 'Unknown error'}`);
							setIsJoining(false);
							setJoinPhase(null);
							cleanupZoomOverlay();
						},
					});
				},
				error: (initErr: any) => {
					if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
					setError(`Failed to initialize Zoom: ${initErr?.reason || initErr?.message || 'Unknown error'}`);
					setIsJoining(false);
					setJoinPhase(null);
					cleanupZoomOverlay();
				},
			});
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
			cleanupZoomOverlay();
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
						Zoom Meeting
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
							aspectRatio: '16/9',
							// Ensure the whole page fits within 100dvh (no page scroll)
							maxHeight: { xs: '42dvh', sm: '48dvh' },
							bgcolor: '#111',
							borderRadius: 2,
							overflow: 'hidden',
							boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
							position: 'relative',
							minHeight: { xs: 180, sm: 240 },
						}}>
						{/* Fullscreen Toggle Button - only when joined */}
						{isJoined && (
							<IconButton
								onClick={toggleFullscreen}
								sx={{
									'position': 'absolute',
									'top': 8,
									'right': 8,
									'zIndex': 1000,
									'bgcolor': 'rgba(0, 0, 0, 0.5)',
									'color': 'white',
									'&:hover': {
										bgcolor: 'rgba(0, 0, 0, 0.7)',
									},
								}}>
								{isFullscreen ? <FullscreenExit /> : <Fullscreen />}
							</IconButton>
						)}

						{/* Placeholder when not joined - Zoom SDK renders in body, not here */}
						{!isJoined && !isJoining && (
							<Box
								sx={{
									width: '100%',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: '#2a2a2a',
									position: 'absolute',
									top: 0,
									left: 0,
									zIndex: 2,
								}}>
								<Typography variant='subtitle1' sx={{ color: '#fff', textAlign: 'center', fontWeight: 600 }}>
									{meetingStatus === 'Starts soon' ? 'Ready to join (scheduled)' : meetingStatus}
								</Typography>
							</Box>
						)}
					</Box>

					{/* Event Details and Join Button - below Zoom UI */}
					<Box
						sx={{
							bgcolor: 'white',
							borderRadius: 2,
							p: { xs: 1.5, sm: 2 },
							boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
							overflow: 'hidden',
							flex: 1,
							minHeight: 0,
							border: '1px solid rgba(15, 23, 42, 0.06)',
						}}>
						{/* Event Title */}
						<Typography
							variant='subtitle1'
							sx={{
								fontWeight: 800,
								lineHeight: 1.2,
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}>
							{eventDetails?.title || 'Meeting Details'}
						</Typography>

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
							{eventDetails?.location && (
								<Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
									<strong>Location:</strong> {eventDetails.location}
								</Typography>
							)}
						</Box>

						{/* Join Button - only show when not joined */}
						{!isJoined && (
							<Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
									disabled={!sdkLoaded || isJoining || !zoomCredentials}
									sx={{
										'background': sdkLoaded && zoomCredentials ? 'linear-gradient(135deg, #2D8CFF 0%, #0066CC 100%)' : '#666',
										'color': 'white',
										'py': 1.1,
										'fontSize': '0.95rem',
										'fontWeight': 600,
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
								{error && <Alert severity='error'>{error}</Alert>}
							</Box>
						)}

						{/* Open in Zoom App button */}
						{zoomCredentials?.joinUrl && (
							<Button variant='outlined' onClick={() => window.open(zoomCredentials.joinUrl, '_blank')} sx={{ alignSelf: 'flex-start' }}>
								Open in Zoom App
							</Button>
						)}
					</Box>
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
