import React, { useState, useRef, useEffect, useContext } from 'react';
import { Box, IconButton, Slider, Typography, Tooltip } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff, Download } from '@mui/icons-material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface CustomAudioPlayerProps {
	audioUrl: string;
	title?: string;
	duration?: number;
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onDownload?: () => void;
	className?: string;
	sx?: any;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
	audioUrl,
	title = 'Audio Message',
	duration: propDuration,
	onPlay,
	onPause,
	onEnded,
	onDownload,
	className,
	sx = {},
}) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(propDuration && Number.isFinite(propDuration) ? propDuration : 0);
	const [volume, setVolume] = useState(70);
	const [isMuted, setIsMuted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [hasError, setHasError] = useState(false);

	const audioRef = useRef<HTMLAudioElement>(null);
	const resolvingDurationRef = useRef(false);

	const knownDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;

	// Format time helper. MediaRecorder WebM often reports duration as Infinity.
	const formatTime = (seconds: number): string => {
		if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const commitDuration = (value: number) => {
		if (Number.isFinite(value) && value > 0) {
			setDuration(value);
		}
	};

	// Handle play/pause
	const togglePlayPause = async () => {
		if (!audioRef.current) return;

		try {
			if (isPlaying) {
				audioRef.current.pause();
				setIsPlaying(false);
				onPause?.();
			} else {
				setIsLoading(true);
				await audioRef.current.play();
				setIsPlaying(true);
				onPlay?.();
			}
		} catch (error) {
			console.error('Error playing audio:', error);
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle time change
	const handleTimeChange = (_event: Event, newValue: number | number[]) => {
		const newTime = Array.isArray(newValue) ? newValue[0] : newValue;
		if (!audioRef.current || !knownDuration) return;
		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	// Handle volume change
	const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
		const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
		setVolume(newVolume);
		if (audioRef.current) {
			audioRef.current.volume = newVolume / 100;
		}
	};

	// Handle mute toggle
	const toggleMute = () => {
		if (audioRef.current) {
			if (isMuted) {
				audioRef.current.volume = volume / 100;
				setIsMuted(false);
			} else {
				audioRef.current.volume = 0;
				setIsMuted(true);
			}
		}
	};

	// Handle download
	const handleDownload = () => {
		if (onDownload) {
			onDownload();
		} else {
			// Default download behavior
			const link = document.createElement('a');
			link.href = audioUrl;
			link.download = `${title || 'audio'}.mp3`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	// Audio event handlers
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		let cancelled = false;
		let seekTimer: ReturnType<typeof setTimeout> | null = null;
		let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
		let detachProbe: (() => void) | null = null;
		resolvingDurationRef.current = false;
		setCurrentTime(0);
		setIsPlaying(false);
		setHasError(false);
		setDuration(propDuration && Number.isFinite(propDuration) && propDuration > 0 ? propDuration : 0);

		const clearResolveTimeout = () => {
			if (seekTimer) {
				clearTimeout(seekTimer);
				seekTimer = null;
			}
			if (fallbackTimer) {
				clearTimeout(fallbackTimer);
				fallbackTimer = null;
			}
		};

		// Chrome reports Infinity for MediaRecorder WebM until the playhead is forced to the end.
		const resolveUnknownDuration = () => {
			if (cancelled || resolvingDurationRef.current) return;
			if (Number.isFinite(audio.duration) && audio.duration > 0) {
				commitDuration(audio.duration);
				return;
			}
			if (audio.duration !== Infinity) return;

			resolvingDurationRef.current = true;
			const resumeAt = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
			const shouldResume = !audio.paused && !audio.ended;
			if (shouldResume) audio.pause();

			const finish = () => {
				const resolved = audio.duration;
				if (!Number.isFinite(resolved) || resolved <= 0) return;

				detach();
				clearResolveTimeout();

				const target = Math.min(resumeAt, Math.max(resolved - 0.05, 0));
				if (!cancelled) {
					setDuration(resolved);
					setCurrentTime(target);
				}
				resolvingDurationRef.current = false;
				try {
					audio.currentTime = target;
				} catch {
					/* element may already be gone */
				}
				if (shouldResume && !cancelled) {
					audio.play().catch(() => setIsPlaying(false));
				}
			};

			const detach = () => {
				audio.removeEventListener('timeupdate', finish);
				audio.removeEventListener('durationchange', finish);
				if (detachProbe === detach) detachProbe = null;
			};
			detachProbe = detach;

			audio.addEventListener('timeupdate', finish);
			audio.addEventListener('durationchange', finish);
			fallbackTimer = setTimeout(() => {
				if (!resolvingDurationRef.current) return;
				resolvingDurationRef.current = false;
				detach();
				if (Number.isFinite(audio.duration) && audio.duration > 0 && !cancelled) {
					setDuration(audio.duration);
				}
				try {
					audio.currentTime = resumeAt;
				} catch {
					/* ignore */
				}
				if (shouldResume && !cancelled) {
					audio.play().catch(() => setIsPlaying(false));
				}
			}, 2000);

			// Defer so Chrome accepts the seek after loadedmetadata.
			seekTimer = setTimeout(() => {
				if (cancelled || !resolvingDurationRef.current) return;
				try {
					audio.currentTime = 1e101;
				} catch {
					resolvingDurationRef.current = false;
					detach();
					clearResolveTimeout();
				}
			}, 0);
		};

		const handleLoadedMetadata = () => {
			setIsLoading(false);
			setHasError(false);
			if (Number.isFinite(audio.duration) && audio.duration > 0) {
				commitDuration(audio.duration);
			} else {
				resolveUnknownDuration();
			}
		};

		const handleDurationChange = () => {
			if (resolvingDurationRef.current) return;
			commitDuration(audio.duration);
		};

		const handleTimeUpdate = () => {
			if (resolvingDurationRef.current) return;
			setCurrentTime(audio.currentTime);
			commitDuration(audio.duration);
		};

		const handleEnded = () => {
			if (resolvingDurationRef.current) return;
			setIsPlaying(false);
			setCurrentTime(0);
			onEnded?.();
		};

		const handleError = () => {
			setHasError(true);
			setIsLoading(false);
			setIsPlaying(false);
		};

		const handleCanPlay = () => {
			setIsLoading(false);
			setHasError(false);
			if (!Number.isFinite(audio.duration) || audio.duration === Infinity) {
				resolveUnknownDuration();
			}
		};

		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('durationchange', handleDurationChange);
		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('ended', handleEnded);
		audio.addEventListener('error', handleError);
		audio.addEventListener('canplay', handleCanPlay);

		if (audio.readyState >= 1) {
			handleLoadedMetadata();
		}

		return () => {
			cancelled = true;
			resolvingDurationRef.current = false;
			clearResolveTimeout();
			detachProbe?.();
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('durationchange', handleDurationChange);
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('ended', handleEnded);
			audio.removeEventListener('error', handleError);
			audio.removeEventListener('canplay', handleCanPlay);
		};
	}, [audioUrl, onEnded, propDuration]);

	// Set initial volume
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume / 100;
		}
	}, [volume]);

	return (
		<Box
			className={className}
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'borderRadius': '12px',
				'padding': isMobileSize ? '0.35rem' : '0.5rem',
				'boxShadow': '0 8px 20px rgba(0,0,0,0.1)',
				'backdropFilter': 'blur(10px)',
				'border': '1px solid rgba(255,255,255,0.1)',
				'position': 'relative',
				'overflow': 'hidden',
				'transition': 'all 0.3s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: '0 12px 25px rgba(0,0,0,0.15)',
				},
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(255,255,255,0.05)',
					borderRadius: '12px',
					zIndex: 0,
				},
				...sx,
			}}>
			{/* Error State */}
			{hasError && (
				<Box sx={{ textAlign: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
					<Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
						⚠️ Unable to load audio
					</Typography>
				</Box>
			)}

			{/* Progress Bar with Play Button, Time Display and Download */}
			<Box sx={{ mb: isMobileSize ? '-0.25rem' : 1, position: 'relative', zIndex: 1, mt: '-0.25rem' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: isMobileSize ? 1 : 1.5 }}>
					{/* Play/Pause Button */}
					<IconButton
						onClick={togglePlayPause}
						disabled={hasError || isLoading}
						sx={{
							'background': 'rgba(255,255,255,0.2)',
							'color': 'white',
							'width': isMobileSize ? 20 : 25,
							'height': isMobileSize ? 20 : 25,
							'&:hover': {
								background: 'rgba(255,255,255,0.3)',
								transform: 'scale(1.05)',
							},
							'&:disabled': {
								background: 'rgba(255,255,255,0.1)',
								color: 'rgba(255,255,255,0.3)',
							},
							'transition': 'all 0.2s ease',
							'boxShadow': '0 4px 8px rgba(0,0,0,0.2)',
							'marginRight': 1,
						}}>
						{isLoading ? (
							<Box
								sx={{
									'width': isMobileSize ? 9 : 12,
									'height': isMobileSize ? 9 : 12,
									'border': '2px solid rgba(255,255,255,0.3)',
									'borderTop': '2px solid white',
									'borderRadius': '50%',
									'animation': 'spin 1s linear infinite',
									'@keyframes spin': {
										'0%': { transform: 'rotate(0deg)' },
										'100%': { transform: 'rotate(360deg)' },
									},
								}}
							/>
						) : isPlaying ? (
							<Pause sx={{ fontSize: isMobileSize ? 16 : 18 }} />
						) : (
							<PlayArrow sx={{ fontSize: isMobileSize ? 16 : 18 }} />
						)}
					</IconButton>

					{/* Progress Bar */}
					<Box sx={{ flex: 1 }}>
						<Slider
							value={knownDuration ? Math.min(currentTime, knownDuration) : 0}
							max={knownDuration || 1}
							onChange={handleTimeChange}
							disabled={hasError || isLoading || !knownDuration}
							sx={{
								'color': 'white',
								'height': 5,
								'& .MuiSlider-thumb': {
									'width': 12,
									'height': 12,
									'background': 'white',
									'boxShadow': '0 3px 6px rgba(0,0,0,0.3)',
									'transition': 'all 0.2s ease',
									'&:hover': {
										boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
										transform: 'scale(1.1)',
									},
									'&.Mui-disabled': {
										color: 'rgba(255,255,255,0.3)',
									},
								},
								'& .MuiSlider-track': {
									background: 'rgba(255,255,255,0.3)',
									border: 'none',
								},
								'& .MuiSlider-rail': {
									background: 'rgba(255,255,255,0.1)',
								},
							}}
						/>
					</Box>
				</Box>
			</Box>

			{/* Bottom Controls - Volume */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					position: 'relative',
					zIndex: 1,
					height: '1rem',
				}}>
				{/* Volume Control */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<Tooltip title={isMuted ? 'Unmute' : 'Mute'} placement='top' arrow>
						<IconButton onClick={toggleMute} sx={{ color: 'rgba(255,255,255,0.6)', padding: isMobileSize ? '1px' : '2px' }}>
							{isMuted ? <VolumeOff sx={{ fontSize: 14 }} /> : <VolumeUp sx={{ fontSize: 14 }} />}
						</IconButton>
					</Tooltip>
					<Slider
						value={isMuted ? 0 : volume}
						max={100}
						onChange={handleVolumeChange}
						sx={{
							'width': 80,
							'color': 'white',
							'ml': isMobileSize ? 0.75 : 1.25,
							'& .MuiSlider-thumb': {
								'width': 6,
								'height': 6,
								'background': 'white',
								'transition': 'all 0.2s ease',
								'&:hover': {
									transform: 'scale(1.1)',
								},
							},
							'& .MuiSlider-track': {
								background: 'rgba(255, 255, 255, 0.2)',
								height: 3,
							},
							'& .MuiSlider-rail': {
								background: 'rgba(255,255,255,0.05)',
								height: 3,
							},
						}}
					/>
				</Box>
				<Box>
					{/* Time Display */}
					<Typography
						variant='caption'
						sx={{
							color: 'rgba(255,255,255,0.9)',
							fontSize: '0.75rem',
							minWidth: '50px',
							textAlign: 'right',
							fontWeight: 500,
						}}>
						{formatTime(currentTime)} / {knownDuration ? formatTime(knownDuration) : '--:--'}
					</Typography>
				</Box>
				{/* Download Button */}
				<Tooltip title='Download audio' placement='top' arrow>
					<IconButton
						onClick={handleDownload}
						sx={{
							'color': 'rgba(255,255,255,0.7)',
							'padding': '2px',
							'&:hover': {
								color: 'rgba(255,255,255,0.9)',
								transform: 'scale(1.05)',
							},
							'transition': 'all 0.2s ease',
						}}>
						<Download sx={{ fontSize: 16 }} />
					</IconButton>
				</Tooltip>
			</Box>

			{/* Hidden Audio Element */}
			<audio ref={audioRef} src={audioUrl} preload='metadata' onLoadStart={() => setIsLoading(true)} />
		</Box>
	);
};

export default CustomAudioPlayer;
