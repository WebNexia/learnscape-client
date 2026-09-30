import { Alert, Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import CustomAudioPlayer from '../audio/CustomAudioPlayer';
import AudioRecorder from '../userCourses/AudioRecorder';
import VideoRecorder from '../userCourses/VideoRecorder';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';
import { levelTestCardSx, levelTestHeadingSx, primaryButtonSx } from '../levelTest/styles';
import { discardSpeakingRecording, submitSpeakingTest, uploadSpeakingRecording } from '../../utils/speakingTest/publicApi';
import type { SpeakingAnswerDraft, SpeakingQuestion } from '../../utils/speakingTest/types';
import type { SpeakingTestParticipant } from './SpeakingTestParticipantGate';

type Props = {
	slug: string;
	campaignName: string;
	participant: SpeakingTestParticipant;
	questions: SpeakingQuestion[];
};

const emptyAnswers = (questions: SpeakingQuestion[]): SpeakingAnswerDraft[] =>
	questions.map((question) => ({ questionId: question._id, audioUrl: '', videoUrl: '' }));

const answerReady = (question: SpeakingQuestion, answer?: SpeakingAnswerDraft) => {
	if (!answer) return false;
	if (question.askAudio && !answer.audioUrl) return false;
	if (question.askVideo && !answer.videoUrl) return false;
	return true;
};

const SpeakingTestExperience = ({ slug, campaignName, participant, questions }: Props) => {
	const [answers, setAnswers] = useState<SpeakingAnswerDraft[]>(() => emptyAnswers(questions));
	const [index, setIndex] = useState(0);
	const [audioUploading, setAudioUploading] = useState(false);
	const [videoUploading, setVideoUploading] = useState(false);
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);

	const question = questions[index];
	const answer = answers.find((item) => item.questionId === question?._id);

	const patchAnswer = (questionId: string, patch: Partial<SpeakingAnswerDraft>) => {
		setAnswers((current) => current.map((item) => (item.questionId === questionId ? { ...item, ...patch } : item)));
	};

	const upload = async (kind: 'audio' | 'video', blob: Blob) => {
		if (!question) return;
		setError('');
		if (kind === 'audio') setAudioUploading(true);
		else setVideoUploading(true);
		try {
			const url = await uploadSpeakingRecording(slug, question._id, kind, blob);
			patchAnswer(question._id, kind === 'audio' ? { audioUrl: url } : { videoUrl: url });
		} catch (uploadError) {
			setError(uploadError instanceof Error ? uploadError.message : 'Kayıt yüklenemedi.');
		} finally {
			setAudioUploading(false);
			setVideoUploading(false);
		}
	};

	const replace = async (kind: 'audio' | 'video') => {
		if (!question || !answer) return;
		const currentUrl = kind === 'audio' ? answer.audioUrl : answer.videoUrl;
		setError('');
		try {
			if (currentUrl) await discardSpeakingRecording(slug, currentUrl);
			patchAnswer(question._id, kind === 'audio' ? { audioUrl: '' } : { videoUrl: '' });
		} catch (discardError) {
			setError(discardError instanceof Error ? discardError.message : 'Önceki kayıt silinemedi.');
		}
	};

	const submit = async () => {
		setError('');
		setSubmitting(true);
		try {
			await submitSpeakingTest(slug, participant, answers);
			setDone(true);
		} catch (submitError) {
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
					fontSize: { xs: '0.85rem', sm: '1rem' },
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
			<Typography sx={{ color: '#526675', mt: 1.5, fontSize: { xs: '0.85rem', sm: '0.9rem', textDecoration: 'underline' } }}>
				{question.askAudio && question.askVideo
					? 'Cevabını hem ses hem video olarak kaydet. Ses en fazla 5 dakika, video en fazla 1 dakika olabilir.'
					: question.askAudio
						? 'Cevabını ses olarak kaydet. Kayıt en fazla 5 dakika olabilir.'
						: 'Cevabını video olarak kaydet. Kayıt en fazla 1 dakika olabilir.'}
			</Typography>

			{question.askAudio && !answer.audioUrl ? (
				<AudioRecorder
					uploadAudio={(blob) => upload('audio', blob)}
					isAudioUploading={audioUploading}
					allowReplace
					recorderTitle='Ses kaydı'
					recorderTitleDescription='Kaydet, dinle, sonra yükle.'
					maxRecordTime={300000}
				/>
			) : null}
			{question.askAudio && answer.audioUrl ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
					<CustomAudioPlayer audioUrl={answer.audioUrl} title='Ses cevabın' sx={{ width: '100%', maxWidth: 480 }} />
					<Button onClick={() => void replace('audio')} sx={{ mt: 1, textTransform: 'none' }}>
						Yeniden kaydet
					</Button>
				</Box>
			) : null}

			{question.askVideo && !answer.videoUrl ? (
				<VideoRecorder uploadVideo={(blob) => upload('video', blob)} isVideoUploading={videoUploading} allowReplace />
			) : null}
			{question.askVideo && answer.videoUrl ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, width: '100%' }}>
					<Box component='video' src={answer.videoUrl} controls sx={{ width: '100%', maxWidth: 520, borderRadius: 2 }} />
					<Button onClick={() => void replace('video')} sx={{ mt: 1, textTransform: 'none' }}>
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
