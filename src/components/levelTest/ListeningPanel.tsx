import { HeadphonesRounded, PlayArrowRounded, ReplayRounded, StopRounded } from '@mui/icons-material';
import { Alert, Box, Button, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { levelTestCardSx, levelTestHeadingSx } from './styles';

type Props = {
	script: string[];
};

const pickEnglishVoice = () => {
	const voices = window.speechSynthesis.getVoices();
	return (
		voices.find((voice) => voice.lang.toLowerCase().startsWith('en-gb')) ??
		voices.find((voice) => voice.lang.toLowerCase().startsWith('en-us')) ??
		voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
		null
	);
};

const ListeningPanel = ({ script }: Props) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
	const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

	const stop = () => {
		if (supported) window.speechSynthesis.cancel();
		utteranceRef.current = null;
		setIsPlaying(false);
	};

	const play = () => {
		if (!supported || !script.length) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(script.join(' '));
		utterance.lang = 'en-GB';
		utterance.rate = 0.92;
		const voice = pickEnglishVoice();
		if (voice) utterance.voice = voice;
		utterance.onend = stop;
		utterance.onerror = stop;
		utteranceRef.current = utterance;
		setIsPlaying(true);
		window.speechSynthesis.speak(utterance);
	};

	useEffect(() => {
		return () => {
			if (supported) window.speechSynthesis.cancel();
			utteranceRef.current = null;
		};
	}, [script, supported]);

	return (
		<Box
			component='section'
			sx={{
				...levelTestCardSx,
				p: { xs: 2.5, sm: 3 },
				position: { md: 'sticky' },
				top: 100,
				background: 'linear-gradient(145deg, #f4faff, #fff)',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#FF6B3D', mb: 1 }}>
				<HeadphonesRounded />
				<Typography component='h3' sx={{ ...levelTestHeadingSx, fontSize: '1.15rem' }}>Kısa dinleme</Typography>
			</Box>
			<Typography sx={{ color: '#526675', lineHeight: 1.65, mb: 2 }}>
				Metin ekranda gösterilmez. İngilizce kaydı dinle; istersen tekrar oynatabilirsin.
			</Typography>
			{supported ? (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
					<Button
						variant='contained'
						onClick={isPlaying ? stop : play}
						startIcon={isPlaying ? <StopRounded /> : <PlayArrowRounded />}
						sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, bgcolor: '#0052a3' }}>
						{isPlaying ? 'Durdur' : 'Dinle'}
					</Button>
					<Button variant='outlined' onClick={play} startIcon={<ReplayRounded />} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
						Tekrar dinle
					</Button>
				</Box>
			) : (
				<Alert severity='warning'>Tarayıcın sesli okuma özelliğini desteklemiyor. Dinleme bölümünü başka bir güncel tarayıcıda aç.</Alert>
			)}
		</Box>
	);
};

export default ListeningPanel;
