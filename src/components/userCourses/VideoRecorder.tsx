import { Box, Typography } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import { Videocam } from '@mui/icons-material';
import theme from '../../themes';

const mimeType = 'video/webm; codecs="opus,vp8"';
const MAX_RECORDING_TIME = 60000; // 1 minute
const QUALITY = 500000; // Medium quality (500 kbps)

interface VideoRecorderProps {
	uploadVideo: (blob: Blob) => Promise<void>;
}

const VideoRecorder = ({ uploadVideo }: VideoRecorderProps) => {
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
	const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
	const countdownInterval = useRef<NodeJS.Timeout | null>(null);

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
		};
	};

	useEffect(() => {
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
			if (countdownInterval.current) {
				clearInterval(countdownInterval.current);
			}
		};
	}, [stream]);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<Box>
				<Typography variant='h6' sx={{ mb: isRecording ? '1rem' : '0rem' }}>
					Video Recorder
				</Typography>

				<Box>
					{!permission && (
						<CustomSubmitButton onClick={getCameraPermission} type='button' sx={{ margin: '1rem 0' }} endIcon={<Videocam />} size='small'>
							Allow Camera
						</CustomSubmitButton>
					)}
					{permission && !isRecording && (
						<CustomSubmitButton onClick={startRecording} type='button' sx={{ margin: '1rem 0' }} size='small'>
							{hasRecorded ? 'Record Another' : 'Start Recording'}
						</CustomSubmitButton>
					)}
				</Box>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{!recordedVideo && (
					<video
						ref={liveVideoFeed}
						autoPlay
						height={275}
						style={{ boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)', borderRadius: '0.25rem' }}></video>
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
							<Typography variant='body2' sx={{ margin: '1rem' }}>
								Remaining Time: {remainingTime}s
							</Typography>
							<Box sx={bouncingDotsContainerStyle}>
								<Box sx={{ ...bouncingDotStyle, animationDelay: '0s' }} />
								<Box sx={{ ...bouncingDotStyle, animationDelay: '0.2s' }} />
								<Box sx={{ ...bouncingDotStyle, animationDelay: '0.4s' }} />
							</Box>
						</Box>

						<CustomDeleteButton onClick={stopRecording} type='button' sx={{ margin: '1rem 0' }} size='small'>
							Stop Recording
						</CustomDeleteButton>
					</>
				)}

				{recordedVideo && (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
						<video
							src={recordedVideo}
							controls
							height={350}
							style={{ boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.25rem' }}></video>
					</Box>
				)}
			</Box>

			{recordedVideo && (
				<CustomSubmitButton sx={{ marginTop: '2rem' }} type='button' size='small' onClick={() => videoBlob && uploadVideo(videoBlob)}>
					Upload Video
				</CustomSubmitButton>
			)}
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
