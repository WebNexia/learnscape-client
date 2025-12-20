import { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import axios from '@utils/axiosInstance';
import axiosOriginal from 'axios';
import { ZoomMtg } from '@zoom/meetingsdk';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// Required Meeting SDK styles. Without these, the embedded UI/toolbar can appear invisible until a hard refresh.
import '@zoom/meetingsdk/dist/css/bootstrap.css';
import '@zoom/meetingsdk/dist/css/react-select.css';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

const ZoomMeetingPage = () => {
	const { eventId } = useParams<{ eventId: string }>();
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isPublicEvent, setIsPublicEvent] = useState<boolean | null>(null);
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
	const joinTimeoutRef = useRef<number | null>(null);
	const joinStartedAtRef = useRef<number | null>(null);
	const [joinPhase, setJoinPhase] = useState<string | null>(null);
	const zoomPreparedRef = useRef(false);
	const authRetryCountRef = useRef(0);
	const authWaitInFlightRef = useRef(false);
	const autoJoinFiredRef = useRef(false);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const autoJoinRequested = (() => {
		try {
			return new URLSearchParams(window.location.search).get('autojoin') === '1';
		} catch {
			return false;
		}
	})();

	const isHostStart = (() => {
		try {
			return new URLSearchParams(window.location.search).get('host') === '1';
		} catch {
			return false;
		}
	})();

	const ensureZoomRoot = (show: boolean) => {
		let root = document.getElementById('zmmtg-root') as HTMLDivElement | null;
		if (!root) {
			root = document.createElement('div');
			root.id = 'zmmtg-root';
			document.body.appendChild(root);
		}
		root.style.position = 'fixed';
		root.style.top = '0';
		root.style.left = '0';
		root.style.right = '0';
		root.style.bottom = '0';
		root.style.width = '100%';
		root.style.height = '100%';
		root.style.zIndex = '9999';
		root.style.display = show ? 'block' : 'none';
		root.style.pointerEvents = show ? 'auto' : 'none';
		return root;
	};

	const waitForFirebaseUser = (timeoutMs: number) => {
		const auth = getAuth();
		if (auth.currentUser) return Promise.resolve(auth.currentUser);
		return new Promise((resolve, reject) => {
			const t = window.setTimeout(() => {
				unsub();
				reject(new Error('timeout'));
			}, timeoutMs);
			const unsub = onAuthStateChanged(auth, (u) => {
				if (u) {
					window.clearTimeout(t);
					unsub();
					resolve(u);
				}
			});
		});
	};

	// decodeJwtPayload removed (was used only for signature debugging).

	const fetchZoomCredentials = async () => {
		if (!eventId) {
			setError('Event ID is missing');
			setLoading(false);
			return;
		}

		try {
			const response = await axios.get(`${base_url}/events/${eventId}/zoom-credentials`);
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
		} catch (err: any) {
			console.error('Error fetching Zoom credentials:', err);
			if (axiosOriginal.isAxiosError(err) && err.response?.status === 404) {
				setError('Zoom meeting not found for this event');
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 403) {
				const errorMessage = err.response?.data?.message || 'You do not have access to this Zoom meeting';
				setError(errorMessage);
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 401) {
				const auth = getAuth();
				const hasFirebaseUser = !!auth.currentUser;

				if (hasFirebaseUser && authRetryCountRef.current < 2) {
					try {
						authRetryCountRef.current += 1;
						setError('Refreshing session…');
						await auth.currentUser?.getIdToken(true);
						setError(null);
						setLoading(true);
						return await fetchZoomCredentials();
					} catch {
						// fall through
					}
				}

				if (!hasFirebaseUser && !authWaitInFlightRef.current) {
					authWaitInFlightRef.current = true;
					authRetryCountRef.current += 1;
					setError('Restoring session…');
					try {
						await waitForFirebaseUser(12000);
						setError(null);
						authWaitInFlightRef.current = false;
						return await fetchZoomCredentials();
					} catch {
						// fall through to show auth error
						authWaitInFlightRef.current = false;
					}
				}

				// Non-public event requires authentication (real 401)
				const errorMessage = err.response?.data?.message || 'Authentication required';
				setError(errorMessage);
				setIsPublicEvent(false);
			} else {
				setError('Failed to load Zoom meeting. Please try again.');
			}
			setLoading(false);
		}
	};

	const fetchZoomStatus = async () => {
		if (!eventId) return;
		try {
			const resp = await axios.get(`${base_url}/events/${eventId}/zoom-status`);
			setZoomRuntimeStatus(resp.data.data || null);
		} catch (err) {
			// Status is best-effort; do not block join page
			setZoomRuntimeStatus(null);
		}
	};

	useEffect(() => {
		if (!zoomPreparedRef.current) {
			try {
				// Use the actual SDK version (important: mismatched version can cause ChunkLoadError / missing files).
				const v = (ZoomMtg as any).getJSSDKVersion?.();
				const version = typeof v === 'string' && v.trim() ? v : '3.13.2';
				ZoomMtg.setZoomJSLib(`https://source.zoom.us/${version}/lib`, '/av');
				ZoomMtg.preLoadWasm();
				ZoomMtg.prepareWebSDK();
				ZoomMtg.i18n?.load?.('en-US');
				ZoomMtg.i18n?.reload?.('en-US');
				zoomPreparedRef.current = true;
			} catch (e) {
				console.error('Failed to prepare Zoom SDK:', e);
			}
		}
		setSdkLoaded(true);
		// Reset auth retry counter on navigation/new event
		authRetryCountRef.current = 0;
		authWaitInFlightRef.current = false;
		// Ensure Zoom root exists but stays hidden until user clicks Join.
		try {
			ensureZoomRoot(false);
		} catch {
			// ignore
		}
		fetchZoomCredentials();
		fetchZoomStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventId, base_url, user]);

	// Poll Zoom meeting runtime status while user is on the page (helps avoid "Live now" when host hasn't started).
	useEffect(() => {
		if (!eventId) return;
		if (isJoined) return;
		const interval = window.setInterval(() => {
			fetchZoomStatus();
		}, 20000);
		return () => window.clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventId, user, isJoined]);

	const cleanupZoomOverlay = async () => {
		try {
			const anyZoom = ZoomMtg as any;
			anyZoom.leaveMeeting?.({});
		} catch {
			// ignore
		}
		try {
			const root = ensureZoomRoot(false);
			root.innerHTML = '';
		} catch {
			// ignore
		}
	};

	// Surface runtime errors that would otherwise leave a black screen (common: ChunkLoadError from source.zoom.us).
	useEffect(() => {
		const onErr = (e: ErrorEvent) => {
			const msg = String(e?.message || '');
			if (!msg) return;
			if (/ChunkLoadError|Loading chunk|source\.zoom\.us/i.test(msg)) {
				setError(`Zoom UI failed to load: ${msg}`);
				setIsJoining(false);
				setJoinPhase(null);
				cleanupZoomOverlay();
			}
		};
		const onRej = (e: PromiseRejectionEvent) => {
			const msg = String((e as any)?.reason?.message || (e as any)?.reason || '');
			if (!msg) return;
			if (/ChunkLoadError|Loading chunk|source\.zoom\.us/i.test(msg)) {
				setError(`Zoom UI failed to load: ${msg}`);
				setIsJoining(false);
				setJoinPhase(null);
				cleanupZoomOverlay();
			}
		};
		window.addEventListener('error', onErr);
		window.addEventListener('unhandledrejection', onRej);
		return () => {
			window.removeEventListener('error', onErr);
			window.removeEventListener('unhandledrejection', onRej);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Watchdog: joining can legitimately wait on the user clicking Zoom's own "Join" button.
	// Do NOT hide/cleanup the Zoom UI; just show a gentle hint if it's taking long.
	useEffect(() => {
		if (!isJoining) return;
		joinStartedAtRef.current = Date.now();
		if (!joinPhase) setJoinPhase('Starting…');
		const interval = window.setInterval(() => {
			const startedAt = joinStartedAtRef.current;
			if (!startedAt) return;
			if (Date.now() - startedAt > 60000) {
				setError('If you see the Zoom pre-join screen, please click "Join" to enter the meeting.');
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
		// Host start should be allowed even when meeting status is "waiting" (waiting room).
		if (isHostStart) {
			const runtime = (zoomRuntimeStatus?.status || '').toLowerCase();
			return runtime !== 'ended';
		}
		// If Zoom says started, allow join.
		const runtime = (zoomRuntimeStatus?.status || '').toLowerCase();
		if (runtime === 'started') return true;
		// If we don't know status, keep existing behavior (allow join).
		if (!runtime) return true;
		// waiting/ended -> do not join
		return false;
	})();

	// Option B: when opened from Event Details in a new tab, go straight to Zoom pre-join screen.
	useEffect(() => {
		if (!autoJoinRequested) return;
		if (autoJoinFiredRef.current) return;
		if (!sdkLoaded || !zoomCredentials) return;
		if (isJoining || isJoined) return;
		if (!canJoinNow) return;
		autoJoinFiredRef.current = true;
		handleJoinMeeting();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoJoinRequested, sdkLoaded, zoomCredentials, isJoining, isJoined, canJoinNow, isPublicEvent, isHostStart]);

	const handleJoinMeeting = async () => {
		if (!sdkLoaded || !zoomCredentials) {
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

		// Ensure `#zmmtg-root` exists and becomes visible only once user actually joins.
		const rootEl = ensureZoomRoot(true);
		rootEl.innerHTML = '';

		setIsJoining(true);
		setError(null);
		setJoinPhase('Requesting signature…');

		try {
			if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
			joinTimeoutRef.current = window.setTimeout(() => {
				setError('If you see the Zoom pre-join screen, please click "Join" to enter the meeting.');
			}, 60000);

			// Get signature from backend
			const signatureResponse = await axios.post(`${base_url}/events/${eventId}/${isHostStart ? 'zoom-host-signature' : 'zoom-signature'}`, {
				meetingNumber,
				role: isHostStart ? 1 : 0,
			});

			const { signature, sdkKey, zak } = signatureResponse.data.data;

			if (!signature || !sdkKey) {
				setError('Failed to generate Zoom signature');
				setIsJoining(false);
				setJoinPhase(null);
				return;
			}

			setJoinPhase('Initializing Zoom…');
			await new Promise<void>((resolve, reject) => {
				ZoomMtg.init({
					leaveUrl: `${window.location.origin}/calendar`,
					patchJsMedia: true,
					success: () => resolve(),
					error: (e: any) => reject(e),
				});
			});

			setJoinPhase('Joining meeting…');
			await new Promise<void>((resolve, reject) => {
				ZoomMtg.join({
					sdkKey,
					signature,
					meetingNumber,
					passWord: password,
					userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'LearnScape User' : 'Guest User',
					...(isHostStart ? { zak } : {}),
					success: () => resolve(),
					error: (e: any) => reject(e),
				});
			});

			if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
			setIsJoined(true);
			setIsJoining(false);
			setJoinPhase(null);

			// Watchdog: if join "succeeds" but UI never renders, show a clear error (avoids silent black screen).
			window.setTimeout(() => {
				const root = document.getElementById('zmmtg-root');
				const hasUi = !!root && root.childElementCount > 0;
				if (!hasUi) {
					setError('Zoom joined but UI did not render. This is usually a blocked/missing Zoom UI asset (network/adblock) or version mismatch.');
				}
			}, 2000);
		} catch (err: any) {
			if (joinTimeoutRef.current) window.clearTimeout(joinTimeoutRef.current);
			const errMsg = typeof err?.message === 'string' ? err.message : typeof err === 'string' ? err : err ? JSON.stringify(err) : '';
			if (axiosOriginal.isAxiosError(err) && err.response?.status === 500) {
				setError(err.response?.data?.message || 'Server error while preparing Zoom start/join.');
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 400) {
				setError(err.response?.data?.message || 'Bad request');
			} else if (axiosOriginal.isAxiosError(err) && err.response?.status === 403) {
				setError(err.response?.data?.message || 'You must register for this event to join the Zoom meeting');
			} else {
				setError(errMsg ? `Failed to join Zoom meeting: ${errMsg}` : 'Failed to join Zoom meeting. Please try again.');
			}
			setIsJoining(false);
			setJoinPhase(null);
			await cleanupZoomOverlay();
		}
	};

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
				bgcolor: !isJoined && !isJoining ? '#f7f9fb' : 'transparent',
				backgroundImage:
					isJoined || isJoining
						? 'none'
						: 'radial-gradient(circle at 10% 10%, rgba(45,140,255,0.12) 0%, transparent 55%), radial-gradient(circle at 90% 0%, rgba(99,102,241,0.10) 0%, transparent 50%)',
				overflow: 'hidden',
				position: 'relative',
			}}>
			{error && !isJoined && (
				<Box sx={{ position: 'fixed', top: 16, left: 16, right: 16, zIndex: 2000, display: 'flex', justifyContent: 'center' }}>
					<Alert severity='error' sx={{ maxWidth: 900, width: '100%' }}>
						{error}
					</Alert>
				</Box>
			)}
			{autoJoinRequested && !isJoined && !isJoining && (
				<Box
					sx={{
						position: 'fixed',
						inset: 0,
						zIndex: 1500,
						bgcolor: '#0b0f19',
						color: 'white',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 2,
						p: 3,
					}}>
					<CircularProgress sx={{ color: 'white' }} />
					<Typography variant='body1' sx={{ opacity: 0.9 }}>
						Opening Zoom…
					</Typography>
					{joinPhase && (
						<Typography variant='caption' sx={{ opacity: 0.75 }}>
							{joinPhase}
						</Typography>
					)}
				</Box>
			)}
		</Box>
	);
};

export default ZoomMeetingPage;
