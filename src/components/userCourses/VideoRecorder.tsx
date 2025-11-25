import { Box, DialogActions, Typography } from '@mui/material';
import { useState, useRef, useEffect, useContext } from 'react';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import { Videocam } from '@mui/icons-material';
import theme from '../../themes';
import CustomDialog from '../layouts/dialog/CustomDialog';
import LoadingButton from '@mui/lab/LoadingButton';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

const mimeType = 'video/webm; codecs="opus,vp8"';
const MAX_RECORDING_TIME = 60000; // 1 minute
const QUALITY = 300000; // Medium quality (300 kbps)
const MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB limit

interface VideoRecorderProps {
	uploadVideo: (blob: Blob) => Promise<void>;
	isVideoUploading: boolean;
}

const VideoRecorder = ({ uploadVideo, isVideoUploading }: VideoRecorderProps) => {
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [permission, setPermission] = useState<boolean>(false);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const liveVideoFeed = useRef<HTMLVideoElement | null>(null);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [hasRecorded, setHasRecorded] = useState<boolean>(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
	const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
	const [videoChunks, setVideoChunks] = useState<Blob[]>([]);
	const [remainingTime, setRemainingTime] = useState<number>(MAX_RECORDING_TIME / 1000); // in seconds
	const [isVideoTooLarge, setIsVideoTooLarge] = useState<boolean>(false);
	const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
	const countdownInterval = useRef<NodeJS.Timeout | null>(null);

	const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

	const getCameraPermission = async () => {
		setRecordedVideo(null);
		if ('MediaRecorder' in window) {
			try {
				const videoConstraints = { audio: false, video: true };
				const audioConstraints = { audio: true };
				const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
				const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
				setPermission(true);
				const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
				setStream(combinedStream);
				if (liveVideoFeed.current) {
					liveVideoFeed.current.srcObject = videoStream;
				}
			} catch (err) {
				alert((err as Error).message);
			}
		} else {
			alert('The MediaRecorder API is not supported in your browser.');
		}
	};

	const startRecording = async () => {
		if (!stream) return;
		setIsRecording(true);
		setRemainingTime(MAX_RECORDING_TIME / 1000);
		const media = new MediaRecorder(stream, {
			mimeType,
			videoBitsPerSecond: QUALITY,
		});
		mediaRecorder.current = media;
		mediaRecorder.current.start();
		let localVideoChunks: Blob[] = [];
		mediaRecorder.current.ondataavailable = (event) => {
			if (typeof event.data === 'undefined') return;
			if (event.data.size === 0) return;
			localVideoChunks.push(event.data);
		};
		setVideoChunks(localVideoChunks);
		recordingTimeout.current = setTimeout(() => {
			stopRecording();
		}, MAX_RECORDING_TIME);

		countdownInterval.current = setInterval(() => {
			setRemainingTime((prevTime) => {
				if (prevTime <= 1) {
					clearInterval(countdownInterval.current!);
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		window.scrollTo({
			top: document.body.scrollHeight,
			behavior: 'smooth',
		});
	};

	const stopRecording = () => {
		if (!mediaRecorder.current) return;
		setPermission(false);
		setIsRecording(false);
		setHasRecorded(true);
		mediaRecorder.current.stop();
		if (recordingTimeout.current) {
			clearTimeout(recordingTimeout.current);
		}
		if (countdownInterval.current) {
			clearInterval(countdownInterval.current);
		}
		mediaRecorder.current.onstop = async () => {
			const videoBlob = new Blob(videoChunks, { type: mimeType });
			const videoUrl = URL.createObjectURL(videoBlob);
			setRecordedVideo(videoUrl);
			setVideoBlob(videoBlob);
			setVideoChunks([]);

			// Check file size
			if (videoBlob.size > MAX_VIDEO_SIZE) {
				setIsVideoTooLarge(true);
			} else {
				setIsVideoTooLarge(false);
			}
		};
	};

	useEffect(() => {
		return () => {
			if (stream) {
				stream.getTracks()?.forEach((track) => track.stop());
			}
			if (countdownInterval.current) {
				clearInterval(countdownInterval.current);
			}
		};
	}, [stream]);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: isMobileSize ? '1.5rem' : '2rem' }}>
			<Box>
				<Typography variant='h6' sx={{ mb: isRecording ? '1rem' : '0rem', fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
					Video Recorder
				</Typography>

				<Box>
					{!permission && (
						<CustomSubmitButton
							onClick={getCameraPermission}
							type='button'
							sx={{ margin: '1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							endIcon={<Videocam />}
							size='small'>
							{hasRecorded ? 'Record Another' : 'Allow Camera'}
						</CustomSubmitButton>
					)}
					{permission && !isRecording && (
						<CustomSubmitButton
							onClick={startRecording}
							type='button'
							sx={{ margin: '1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							size='small'>
							Start Recording
						</CustomSubmitButton>
					)}
				</Box>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{!recordedVideo && (
					<Box
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
							'width': '100%',
							'maxWidth': isMobileSize ? '100%' : '500px',
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
						}}>
						<video
							ref={liveVideoFeed}
							autoPlay
							height={isMobileSize ? 150 : 250}
							style={{
								borderRadius: '8px',
								width: '100%',
								objectFit: 'contain',
								position: 'relative',
								zIndex: 1,
							}}></video>
					</Box>
				)}

				{isRecording && (
					<>
						<Box
							sx={{
								textAlign: 'center',
								boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
								padding: '0rem 4rem',
								borderRadius: '0.35rem',
								margin: '1.5rem 0',
							}}>
							<Typography variant='body2' sx={{ margin: '1rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Remaining Time: {remainingTime}s
							</Typography>
							<Box sx={bouncingDotsContainerStyle}>
								<Box sx={{ ...bouncingDotStyle, animationDelay: '0s' }} />
								<Box sx={{ ...bouncingDotStyle, animationDelay: '0.2s' }} />
								<Box sx={{ ...bouncingDotStyle, animationDelay: '0.4s' }} />
							</Box>
						</Box>

						<CustomDeleteButton
							onClick={stopRecording}
							type='button'
							sx={{ margin: '1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							size='small'>
							Stop Recording
						</CustomDeleteButton>
					</>
				)}

				{recordedVideo && (
					<Box
						sx={{
							'display': 'flex',
							'flexDirection': 'column',
							'alignItems': 'center',
							'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							'borderRadius': '12px',
							'padding': isMobileSize ? '0.35rem' : '0.5rem',
							'boxShadow': '0 8px 20px rgba(0,0,0,0.1)',
							'backdropFilter': 'blur(10px)',
							'border': '1px solid rgba(255,255,255,0.1)',
							'position': 'relative',
							'overflow': 'hidden',
							'transition': 'all 0.3s ease',
							'width': '100%',
							'maxWidth': isMobileSize ? '100%' : '600px',
							'&:hover': {
								transform: 'translateY(-2px)',
								boxShadow: '0 12px 25px rgba(0,0,0,0.15)',
							},
							'mb': '1rem',
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
						}}>
						<video
							src={recordedVideo}
							controls
							height={isVerySmallScreen ? 225 : isMobileSize ? 250 : 350}
							style={{
								borderRadius: '8px',
								width: '100%',
								objectFit: 'contain',
								position: 'relative',
								zIndex: 1,
							}}></video>
					</Box>
				)}

				{isVideoTooLarge && (
					<Typography variant='body2' color='error' sx={{ mt: 1, textAlign: 'center' }}>
						Video file size exceeds the limit of 5 MB (max 60 seconds)
					</Typography>
				)}

				{isVideoTooLarge && (
					<CustomSubmitButton
						sx={{ marginTop: '1rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
						type='button'
						size='small'
						onClick={() => {
							setRecordedVideo(null);
							setVideoBlob(null);
							setIsVideoTooLarge(false);
							setHasRecorded(false);
						}}>
						Record Again
					</CustomSubmitButton>
				)}
			</Box>

			{recordedVideo && (
				<CustomSubmitButton
					sx={{ marginTop: '2rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
					type='button'
					size='small'
					disabled={isVideoTooLarge}
					onClick={() => setIsUploadModalOpen(true)}>
					Upload Video
				</CustomSubmitButton>
			)}

			<CustomDialog
				openModal={isUploadModalOpen}
				closeModal={() => setIsUploadModalOpen(false)}
				maxWidth='xs'
				title='Upload Video'
				content={`Are you sure you want to upload the video recording?
					You will not have another chance.`}>
				{isVideoUploading ? (
					<DialogActions sx={{ marginBottom: '1.5rem' }}>
						<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
					</DialogActions>
				) : (
					<CustomDialogActions
						onCancel={() => setIsUploadModalOpen(false)}
						onSubmit={() => videoBlob && uploadVideo(videoBlob)}
						submitBtnText='Upload'
						actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
					/>
				)}
			</CustomDialog>
		</Box>
	);
};

// Define the bouncing dots animation styles
const bouncingDotsContainerStyle = {
	display: 'flex',
	justifyContent: 'center',
	width: '100%',
	margin: '1rem 0',
};

const bouncingDotStyle = {
	width: '0.5rem',
	height: '0.5rem',
	borderRadius: '50%',
	margin: '0 0.25rem',
	backgroundColor: theme.bgColor?.lessonInProgress,
	animation: 'bounce 1.4s infinite ease-in-out',
};

// Include the keyframes for the bouncing animation
const styles = `
@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-0.85rem);
    }
    60% {
        transform: translateY(-0.4rem);
    }
}
`;

// Insert styles into the head of the document
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default VideoRecorder;
