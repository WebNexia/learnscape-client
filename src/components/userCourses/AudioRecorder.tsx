import { Box, DialogActions, Typography } from '@mui/material';
import { useState, useRef, useEffect, useContext } from 'react';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import theme from '../../themes';
import { Mic } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../contexts/UserAuthContextProvider';
import { Roles } from '../../interfaces/enums';

interface AudioRecorderProps {
	uploadAudio: (blob: Blob) => Promise<void>;
	isAudioUploading: boolean;
	recorderTitle?: string;
	teacherFeedback?: boolean;
	maxRecordTime?: number;
	fromCreateCommunityTopic?: boolean;
}

const AudioRecorder = ({
	uploadAudio,
	isAudioUploading,
	recorderTitle = 'Audio Recorder',
	teacherFeedback,
	maxRecordTime,
	fromCreateCommunityTopic,
}: AudioRecorderProps) => {
	const { user } = useContext(UserAuthContext);
	const mimeType = 'audio/webm; codecs=opus';
	const QUALITY = 64000; // Medium quality (64 kbps)
	const MAX_AUDIO_SIZE = 60 * 1024 * 1024; // 60MB limit

	// Role-based time limits
	const getDefaultMaxRecordTime = () => {
		if (maxRecordTime) return maxRecordTime; // Use prop if provided
		if (user?.role === Roles.ADMIN) {
			return 60000; // 60 seconds for teachers/admins (120s would exceed 60MB limit)
		}
		return 60000; // 60 seconds for learners
	};

	const defaultMaxRecordTime = getDefaultMaxRecordTime();

	// Get display time limit for error messages
	const getDisplayTimeLimit = () => {
		const timeInSeconds = defaultMaxRecordTime / 1000;
		return `${timeInSeconds} seconds`;
	};

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [permission, setPermission] = useState<boolean>(false);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [hasRecorded, setHasRecorded] = useState<boolean>(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [audio, setAudio] = useState<string | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
	const [remainingTime, setRemainingTime] = useState<number>(defaultMaxRecordTime / 1000); // in seconds
	const [isAudioTooLarge, setIsAudioTooLarge] = useState<boolean>(false);
	const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
	const countdownInterval = useRef<NodeJS.Timeout | null>(null);

	const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

	const getMicrophonePermission = async () => {
		if ('MediaRecorder' in window) {
			try {
				const mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: false,
				});
				setPermission(true);
				setStream(mediaStream);
			} catch (err) {
				alert((err as Error).message);
			}
		} else {
			alert('The MediaRecorder is not supported in your browser.');
		}
	};

	const startRecording = async () => {
		if (!stream) return;

		const mediaRecorderInstance = new MediaRecorder(stream, {
			mimeType: mimeType,
		});

		mediaRecorderInstance.ondataavailable = handleDataAvailable;
		mediaRecorderInstance.onstop = handleRecordingStop;

		mediaRecorder.current = mediaRecorderInstance;
		mediaRecorder.current.start();
		setIsRecording(true);
		setHasRecorded(false);
		setIsAudioTooLarge(false);

		// Set up timeout to stop recording
		recordingTimeout.current = setTimeout(() => {
			stopRecording();
		}, defaultMaxRecordTime);

		// Set up countdown
		setRemainingTime(defaultMaxRecordTime / 1000);
		countdownInterval.current = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					clearInterval(countdownInterval.current!);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const stopRecording = () => {
		if (mediaRecorder.current && isRecording) {
			mediaRecorder.current.stop();
			setIsRecording(false);
			setHasRecorded(true);

			// Clear the timeout and interval
			if (recordingTimeout.current) {
				clearTimeout(recordingTimeout.current);
			}
			if (countdownInterval.current) {
				clearInterval(countdownInterval.current);
			}

			// Stop all tracks in the stream
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		}
	};

	const handleDataAvailable = (event: BlobEvent) => {
		if (event.data.size > 0) {
			setAudioChunks((prevChunks) => [...prevChunks, event.data]);
		}
	};

	const handleRecordingStop = () => {
		const audioBlobData = new Blob(audioChunks, { type: mimeType });
		setAudioBlob(audioBlobData);
		setAudio(URL.createObjectURL(audioBlobData));
		setAudioChunks([]);

		// Check file size
		if (audioBlobData.size > MAX_AUDIO_SIZE) {
			setIsAudioTooLarge(true);
		} else {
			setIsAudioTooLarge(false);
		}
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
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: isMobileSize ? '1.5rem' : '2rem' }}>
			<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
				{recorderTitle}
			</Typography>

			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{!permission ? (
					<CustomSubmitButton
						onClick={getMicrophonePermission}
						type='button'
						sx={{ margin: '1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
						endIcon={<Mic />}
						size='small'>
						Allow Microphone
					</CustomSubmitButton>
				) : null}
				{permission && !isRecording ? (
					<CustomSubmitButton
						onClick={startRecording}
						type='button'
						sx={{ margin: '1rem 0', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
						size='small'>
						{hasRecorded ? 'Record Another' : 'Start Recording'}
					</CustomSubmitButton>
				) : null}

				{isRecording && (
					<>
						<Box
							sx={{
								textAlign: 'center',
								boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
								padding: '0rem 4rem',
								borderRadius: '0.35rem',
								margin: '1rem 0',
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
						<CustomDeleteButton onClick={stopRecording} type='button' sx={{ margin: '1rem 0' }} size='small'>
							Stop Recording
						</CustomDeleteButton>
					</>
				)}
			</Box>
			{audio && !isRecording && !isAudioTooLarge ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
					<audio
						src={audio}
						controls
						style={{
							height: '2rem',
							width: isMobileSizeSmall ? '95%' : isRotatedMedium ? '75%' : '50%',
							marginTop: '2rem',
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							borderRadius: '0.35rem',
						}}></audio>
				</Box>
			) : null}

			{isAudioTooLarge && (
				<Typography variant='body2' color='error' sx={{ mt: 1, textAlign: 'center' }}>
					Audio file size exceeds the limit of 60 MB (max {getDisplayTimeLimit()})
				</Typography>
			)}

			{isAudioTooLarge && (
				<CustomSubmitButton
					sx={{ marginTop: '1rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
					type='button'
					size='small'
					onClick={() => {
						setAudio(null);
						setAudioBlob(null);
						setIsAudioTooLarge(false);
						setHasRecorded(false);
					}}>
					Record Again
				</CustomSubmitButton>
			)}

			{audio && !isRecording && !isAudioTooLarge && (
				<CustomSubmitButton
					sx={{ marginTop: '2rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
					type='button'
					size='small'
					onClick={() => setIsUploadModalOpen(true)}>
					Upload Audio
				</CustomSubmitButton>
			)}

			<CustomDialog
				maxWidth={teacherFeedback || fromCreateCommunityTopic ? 'sm' : 'md'}
				openModal={isUploadModalOpen}
				closeModal={() => setIsUploadModalOpen(false)}
				content={`Are you sure you want to upload the audio recording?
				${!teacherFeedback && !fromCreateCommunityTopic ? `You will not have another chance.` : ''}`}>
				{isAudioUploading ? (
					<DialogActions sx={{ marginBottom: '1.5rem' }}>
						<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
					</DialogActions>
				) : (
					<CustomDialogActions
						onCancel={() => setIsUploadModalOpen(false)}
						onSubmit={() => {
							audioBlob && uploadAudio(audioBlob);
						}}
						submitBtnText='Upload'
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

export default AudioRecorder;
