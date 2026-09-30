import { Alert, Box, Button, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import CustomAudioPlayer from '../audio/CustomAudioPlayer';
import AudioRecorder from '../userCourses/AudioRecorder';
import VideoRecorder from '../userCourses/VideoRecorder';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';
import { levelTestCardSx, levelTestHeadingSx, primaryButtonSx } from '../levelTest/styles';
import { discardSpeakingRecording, submitSpeakingTest, uploadSpeakingRecording } from '../../utils/speakingTest/publicApi';
import type { SpeakingQuestion } from '../../utils/speakingTest/types';
import type { SpeakingTestParticipant } from './SpeakingTestParticipantGate';

type Props = {
	slug: string;
	campaignName: string;
	participant: SpeakingTestParticipant;
	questions: SpeakingQuestion[];
};

type LocalAnswer = {
	questionId: string;
	audioBlob: Blob | null;
	videoBlob: Blob | null;
	audioPreview: string;
	videoPreview: string;
};

const emptyAnswers = (questions: SpeakingQuestion[]): LocalAnswer[] =>
	questions.map((question) => ({
		questionId: question._id,
		audioBlob: null,
		videoBlob: null,
		audioPreview: '',
		videoPreview: '',
	}));

const answerReady = (question: SpeakingQuestion, answer?: LocalAnswer) => {
	if (!answer) return false;
	if (question.askAudio && !answer.audioBlob) return false;
	if (question.askVideo && !answer.videoBlob) return false;
	return true;
};

const noopUpload = async () => undefined;

const SpeakingTestExperience = ({ slug, campaignName, participant, questions }: Props) => {
	const [answers, setAnswers] = useState<LocalAnswer[]>(() => emptyAnswers(questions));
	const [index, setIndex] = useState(0);
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const answersRef = useRef(answers);
	answersRef.current = answers;

	const question = questions[index];
	const answer = answers.find((item) => item.questionId === question?._id);

	useEffect(() => {
		return () => {
			for (const item of answersRef.current) {
				if (item.audioPreview) URL.revokeObjectURL(item.audioPreview);
				if (item.videoPreview) URL.revokeObjectURL(item.videoPreview);
			}
		};
	}, []);

	const keepRecording = (questionId: string, kind: 'audio' | 'video', blob: Blob) => {
		setError('');
		setAnswers((current) =>
			current.map((item) => {
				if (item.questionId !== questionId) return item;
				const blobKey = kind === 'audio' ? 'audioBlob' : 'videoBlob';
				const previewKey = kind === 'audio' ? 'audioPreview' : 'videoPreview';
				if (item[blobKey] === blob) return item;
				if (item[previewKey]) URL.revokeObjectURL(item[previewKey]);
				return { ...item, [blobKey]: blob, [previewKey]: URL.createObjectURL(blob) };
			}),
		);
	};

	const replace = (kind: 'audio' | 'video') => {
		if (!question) return;
		setError('');
		setAnswers((current) =>
			current.map((item) => {
				if (item.questionId !== question._id) return item;
				if (kind === 'audio') {
					if (item.audioPreview) URL.revokeObjectURL(item.audioPreview);
					return { ...item, audioBlob: null, audioPreview: '' };
				}
				if (item.videoPreview) URL.revokeObjectURL(item.videoPreview);
				return { ...item, videoBlob: null, videoPreview: '' };
			}),
		);
	};

	const submit = async () => {
		setError('');
		setSubmitting(true);
		const uploaded: string[] = [];
		try {
			const payload = [];
			for (const item of questions) {
				const draft = answersRef.current.find((entry) => entry.questionId === item._id);
				let audioUrl = '';
				let videoUrl = '';
				if (item.askAudio) {
					if (!draft?.audioBlob) throw new Error('Ses kaydı eksik.');
					audioUrl = await uploadSpeakingRecording(slug, item._id, 'audio', draft.audioBlob);
					uploaded.push(audioUrl);
				}
				if (item.askVideo) {
					if (!draft?.videoBlob) throw new Error('Video kaydı eksik.');
					videoUrl = await uploadSpeakingRecording(slug, item._id, 'video', draft.videoBlob);
					uploaded.push(videoUrl);
				}
				payload.push({ questionId: item._id, audioUrl, videoUrl });
			}
			await submitSpeakingTest(slug, participant, payload);
			setDone(true);
		} catch (submitError) {
			await Promise.all(uploaded.map((url) => discardSpeakingRecording(slug, url).catch(() => undefined)));
			setError(submitError instanceof Error ? submitError.message : 'Cevaplar kaydedilemedi.');
		} finally {
			setSubmitting(false);
		}
	};

	if (!questions.length) {
		return <Alert severity='info'>Bu konuşma testinde henüz soru yok.</Alert>;
	}

	if (done) {
		return (
			<Box
				sx={{
					minHeight: { xs: 'calc(100vh - 11rem)', md: 'calc(100vh - 13rem)' },
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}>
				<Box sx={{ ...levelTestCardSx, p: { xs: 3, sm: 4 }, maxWidth: 640, width: '100%', textAlign: 'center' }}>
					<Typography component='h1' sx={{ ...levelTestHeadingSx, fontSize: { xs: '1.2rem', sm: '1.6rem' } }}>
						Kayıtların alındı
					</Typography>
					<Typography sx={{ color: '#526675', mt: 1.5, lineHeight: 1.7 }}>
						{participant.name}, cevapların {campaignName} için kaydedildi. Teşekkürler.
					</Typography>
				</Box>
			</Box>
		);
	}

	if (!question || !answer) return null;
	const ready = answerReady(question, answer);
	const allReady = questions.every((item) => answerReady(item, answers.find((entry) => entry.questionId === item._id)));
	const isLast = index === questions.length - 1;

	return (
		<Box sx={{ ...levelTestCardSx, p: { xs: 2.5, sm: 4 }, maxWidth: 860, mx: 'auto' }}>
			<Typography sx={{ color: '#0052a3', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
				SORU {index + 1} / {questions.length}
			</Typography>
			<Typography
				sx={{
					color: '#01435A',
					fontSize: { xs: '0.8rem', sm: '0.9rem' },
					fontWeight: 600,
					lineHeight: 1.65,
					mt: 1,
					whiteSpace: 'pre-wrap',
				}}>
				{question.prompt}
			</Typography>
			{(question.imageUrl || question.videoUrl) && (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', my: 2 }}>
					{question.imageUrl ? (
						<Box component='img' src={question.imageUrl} alt='' sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: 2 }} />
					) : null}
					{question.videoUrl ? (
						<Box sx={{ width: '100%', maxWidth: 520, aspectRatio: '16 / 9' }}>
							<UniversalVideoPlayer url={question.videoUrl} width='100%' height='100%' controls />
						</Box>
					) : null}
				</Box>
			)}
			<Typography sx={{ color: '#526675', mt: 1.5, fontSize: { xs: '0.8rem', sm: '0.9rem' }, textDecoration: 'underline' }}>
				{question.askAudio && question.askVideo
					? 'Cevabını hem ses hem video olarak kaydet. Ses en fazla 5 dakika, video en fazla 1 dakika olabilir. Gönder’e basınca kaydedilir.'
					: question.askAudio
						? 'Cevabını ses olarak kaydet. Kayıt en fazla 5 dakika olabilir. Gönder’e basınca kaydedilir.'
						: 'Cevabını video olarak kaydet. Kayıt en fazla 1 dakika olabilir. Gönder’e basınca kaydedilir.'}
			</Typography>

			{question.askAudio && !answer.audioBlob ? (
				<AudioRecorder
					uploadAudio={noopUpload}
					isAudioUploading={false}
					deferUpload
					onRecordingReady={(blob) => keepRecording(question._id, 'audio', blob)}
					recorderTitle='Ses kaydı'
					recorderTitleDescription='Kaydet ve dinle. Gönder’e basınca kaydınız gönderilir.'
					maxRecordTime={300000}
				/>
			) : null}
			{question.askAudio && answer.audioPreview ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
					<CustomAudioPlayer audioUrl={answer.audioPreview} title='Ses cevabın' sx={{ width: '100%', maxWidth: 480 }} />
					<Button disabled={submitting} onClick={() => replace('audio')} sx={{ mt: 1, textTransform: 'none' }}>
						Yeniden kaydet
					</Button>
				</Box>
			) : null}

			{question.askVideo && !answer.videoBlob ? (
				<VideoRecorder
					uploadVideo={noopUpload}
					isVideoUploading={false}
					deferUpload
					onRecordingReady={(blob) => keepRecording(question._id, 'video', blob)}
				/>
			) : null}
			{question.askVideo && answer.videoPreview ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, width: '100%' }}>
					<Box component='video' src={answer.videoPreview} controls sx={{ width: '100%', maxWidth: 520, borderRadius: 2 }} />
					<Button disabled={submitting} onClick={() => replace('video')} sx={{ mt: 1, textTransform: 'none' }}>
						Yeniden kaydet
					</Button>
				</Box>
			) : null}

			{error ? (
				<Alert severity='error' sx={{ mt: 2 }}>
					{error}
				</Alert>
			) : null}

			<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 3 }}>
				<Button disabled={index === 0 || submitting} onClick={() => setIndex((current) => current - 1)} sx={{ textTransform: 'none' }}>
					Geri
				</Button>
				{isLast ? (
					<Button variant='contained' disabled={!allReady || submitting} onClick={() => void submit()} sx={primaryButtonSx}>
						{submitting ? 'Gönderiliyor…' : 'Gönder'}
					</Button>
				) : (
					<Button variant='contained' disabled={!ready} onClick={() => setIndex((current) => current + 1)} sx={primaryButtonSx}>
						Sonraki soru
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default SpeakingTestExperience;
