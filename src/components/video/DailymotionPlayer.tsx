import { Box } from '@mui/material';
import { extractVideoId } from '../../utils/videoUrlUtils';

interface DailymotionPlayerProps {
	url: string;
	width?: string | number;
	height?: string | number;
	controls?: boolean;
	autoplay?: boolean;
	style?: React.CSSProperties;
	onError?: (error: any) => void;
}

const DailymotionPlayer = ({ url, width = '100%', height = '100%', controls = true, autoplay = false, style, onError }: DailymotionPlayerProps) => {
	const videoId = extractVideoId(url);

	if (!videoId) {
		onError?.({ message: 'Invalid Dailymotion URL' });
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width,
					height,
					backgroundColor: '#f5f5f5',
					borderRadius: '0.2rem',
					...style,
				}}>
				<p>Invalid Dailymotion URL</p>
			</Box>
		);
	}

	const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}&ui=logo&mute=0`;

	return (
		<iframe
			src={embedUrl}
			width={width}
			height={height}
			style={{
				border: 'none',
				borderRadius: '0.2rem',
				boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
				...style,
			}}
			allowFullScreen
			allow='autoplay; fullscreen; picture-in-picture'
			title='Dailymotion video player'
		/>
	);
};

export default DailymotionPlayer;
