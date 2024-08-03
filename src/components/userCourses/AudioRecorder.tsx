import { Box, DialogActions, Typography } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import theme from '../../themes';
import { Mic } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import LoadingButton from '@mui/lab/LoadingButton';

const mimeType = 'audio/webm; codecs=opus';
const MAX_RECORDING_TIME = 180000; // 3 minutes
const QUALITY = 64000; // Medium quality (64 kbps)

interface AudioRecorderProps {
	uploadAudio: (blob: Blob) => Promise<void>;
	isAudioUploading: boolean;
}

const AudioRecorder = ({ uploadAudio, isAudioUploading }: AudioRecorderProps) => {
	const [permission, setPermission] = useState<boolean>(false);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [hasRecorded, setHasRecorded] = useState<boolean>(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [audio, setAudio] = useState<string | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
	const [remainingTime, setRemainingTime] = useState<number>(MAX_RECORDING_TIME / 1000); // in seconds
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

		setIsRecording(true);
		setRemainingTime(MAX_RECORDING_TIME / 1000);
		const media = new MediaRecorder(stream, {
			mimeType,
			audioBitsPerSecond: QUALITY,
		});

		mediaRecorder.current = media;

		mediaRecorder.current.start();

		let localAudioChunks: Blob[] = [];

		mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
			if (event.data.size > 0) {
				localAudioChunks.push(event.data);
			}
		};

		setAudioChunks(localAudioChunks);

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
		mediaRecorder.current.onstop = async () => {
			const audioBlob = new Blob(audioChunks, { type: mimeType });
			const audioUrl = URL.createObjectURL(audioBlob);
			setAudio(audioUrl);
			setAudioBlob(audioBlob);
			setAudioChunks([]);
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
			<Typography variant='h6'>Audio Recorder</Typography>

			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{!permission ? (
					<CustomSubmitButton onClick={getMicrophonePermission} type='button' sx={{ margin: '1rem 0' }} endIcon={<Mic />} size='small'>
						Allow Microphone
					</CustomSubmitButton>
				) : null}
				{permission && !isRecording ? (
					<CustomSubmitButton onClick={startRecording} type='button' sx={{ margin: '1rem 0' }} size='small'>
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
			</Box>
			{audio && !isRecording ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<audio
						src={audio}
						controls
						style={{ marginTop: '2rem', boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)', borderRadius: '0.35rem' }}></audio>
				</Box>
			) : null}

			{audio && !isRecording && (
				<CustomSubmitButton sx={{ marginTop: '2rem' }} type='button' size='small' onClick={() => setIsUploadModalOpen(true)}>
					Upload Audio
				</CustomSubmitButton>
			)}

			<CustomDialog
				openModal={isUploadModalOpen}
				closeModal={() => setIsUploadModalOpen(false)}
				content={`Are you sure you want to upload the audio recording?
				You will not have another chance.`}>
				{isAudioUploading ? (
					<DialogActions sx={{ marginBottom: '1.5rem' }}>
						<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2.5rem', margin: '0 0.5rem 0.5rem 0' }} />
					</DialogActions>
				) : (
					<CustomDialogActions
						onCancel={() => setIsUploadModalOpen(false)}
						onSubmit={() => audioBlob && uploadAudio(audioBlob)}
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
