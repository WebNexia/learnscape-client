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
import CustomAudioPlayer from '../audio/CustomAudioPlayer';

interface AudioRecorderProps {
	uploadAudio: (blob: Blob) => Promise<void>;
	isAudioUploading: boolean;
	recorderTitle?: string;
	recorderTitleDescription?: string;
	teacherFeedback?: boolean;
	maxRecordTime?: number;
	fromCreateCommunityTopic?: boolean;
	isUploadLimitReached?: boolean;
	audioUploadAttempts?: number;
	maxSessionAttempts?: number;
	onAudioUploadAttempt?: () => void;
}

const AudioRecorder = ({
	uploadAudio,
	isAudioUploading,
	recorderTitle = 'Audio Recorder',
	recorderTitleDescription,
	teacherFeedback,
	maxRecordTime = 120000, // 2 minutes default
	fromCreateCommunityTopic,
	isUploadLimitReached,
	audioUploadAttempts = 0,
	maxSessionAttempts = 5,
	onAudioUploadAttempt,
}: AudioRecorderProps) => {
	const mimeType = 'audio/webm; codecs=opus';
	const QUALITY = 64000; // Medium quality (64 kbps)
	const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit (~5.5 minutes at 64kbps)

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
	const [isAudioTooLarge, setIsAudioTooLarge] = useState<boolean>(false);

	const [remainingTime, setRemainingTime] = useState<number>(maxRecordTime / 1000); // in seconds
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

		// Check session attempt limit before starting recording
		if (audioUploadAttempts >= maxSessionAttempts) {
			return; // Don't start recording if session limit reached
		}

		setIsRecording(true);
		setRemainingTime(maxRecordTime / 1000);

		const media = new MediaRecorder(stream, {
			mimeType,
			audioBitsPerSecond: QUALITY,
		});

		mediaRecorder.current = media;
		mediaRecorder.current.start();

		const chunks: Blob[] = [];

		mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) {
				chunks.push(event.data);
			}
		};

		mediaRecorder.current.onstop = () => {
			const audioBlob = new Blob(chunks, { type: mimeType });
			const audioUrl = URL.createObjectURL(audioBlob);
			console.log('Audio blob created:', audioBlob.size, 'bytes');

			// Check file size limit
			if (audioBlob.size > MAX_FILE_SIZE) {
				setIsAudioTooLarge(true);
				setAudio(null);
				setAudioBlob(null);
				alert(`Audio file is too large (${Math.round(audioBlob.size / 1024 / 1024)}MB). Maximum allowed is 2MB.`);
			} else {
				setIsAudioTooLarge(false);
				setAudio(audioUrl);
				setAudioBlob(audioBlob);
			}
		};

		recordingTimeout.current = setTimeout(() => {
			stopRecording();
		}, maxRecordTime);

		countdownInterval.current = setInterval(() => {
			setRemainingTime((prevTime) => {
				if (prevTime <= 1) {
					clearInterval(countdownInterval.current!);
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);
	};

	const stopRecording = () => {
		if (!mediaRecorder.current) return;
		setIsRecording(false);
		mediaRecorder.current.stop();
		setHasRecorded(true);
		if (recordingTimeout.current) {
			clearTimeout(recordingTimeout.current);
		}
		if (countdownInterval.current) {
			clearInterval(countdownInterval.current);
		}
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
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: isMobileSize ? '1.5rem' : '2rem', width: '100%' }}>
			<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem' }}>
				{recorderTitle}{' '}
			</Typography>
			{recorderTitleDescription && (
				<Typography sx={{ color: 'gray', fontSize: '0.75rem', marginLeft: '0.25rem', mb: '0.5rem' }}>{recorderTitleDescription}</Typography>
			)}
			{!isUploadLimitReached && audioUploadAttempts < maxSessionAttempts && (
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
			)}

			{/* Show message when session attempts reached */}
			{audioUploadAttempts >= maxSessionAttempts && !isUploadLimitReached && (
				<Typography variant='body2' color='error' sx={{ mt: 1, textAlign: 'center' }}>
					Maximum upload attempts reached for this session. Please refresh the page to try again.
				</Typography>
			)}

			{audio && !isRecording && !isAudioTooLarge && !isUploadLimitReached && audioUploadAttempts < maxSessionAttempts ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
					<CustomAudioPlayer
						audioUrl={audio}
						sx={{
							width: isMobileSizeSmall ? '100%' : '80%',
							marginTop: '1rem',
							marginBottom: '1rem',
						}}
					/>
				</Box>
			) : null}

			{isAudioTooLarge && (
				<Typography variant='body2' color='error' sx={{ mt: 1, textAlign: 'center' }}>
					Audio file is too large. Please record a shorter audio.
				</Typography>
			)}

			{audio && !isRecording && !isAudioTooLarge && (
				<CustomSubmitButton
					sx={{ marginTop: '2rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
					type='button'
					size='small'
					onClick={() => {
						// Increment attempt counter when user clicks upload

						setIsUploadModalOpen(true);
					}}>
					Upload Audio
				</CustomSubmitButton>
			)}

			<CustomDialog
				maxWidth='xs'
				openModal={isUploadModalOpen}
				closeModal={() => {
					setIsUploadModalOpen(false);
				}}
				title='Upload Audio'
				content={`Are you sure you want to upload the audio recording?
				${!teacherFeedback && !fromCreateCommunityTopic ? `You will not have another chance.` : ''}`}>
				{isAudioUploading ? (
					<DialogActions sx={{ marginBottom: '1.5rem' }}>
						<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
					</DialogActions>
				) : (
					<CustomDialogActions
						onCancel={() => {
							setIsUploadModalOpen(false);
						}}
						onSubmit={() => {
							audioBlob && uploadAudio(audioBlob);
							if (onAudioUploadAttempt) {
								onAudioUploadAttempt();
							}
						}}
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

export default AudioRecorder;
