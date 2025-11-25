import ReactPlayer from 'react-player';
import { isDailymotionUrl, formatVideoUrl, getVideoPlayerConfig } from '../../utils/videoUrlUtils';
import DailymotionPlayer from './DailymotionPlayer';

interface UniversalVideoPlayerProps {
	url: string;
	width?: string | number;
	height?: string | number;
	controls?: boolean;
	autoplay?: boolean;
	style?: React.CSSProperties;
	onError?: (error: any) => void;
	light?: boolean;
	config?: any;
}

const UniversalVideoPlayer = ({
	url,
	width = '100%',
	height = '100%',
	controls = true,
	autoplay = false,
	style,
	onError,
	light = false,
	config,
}: UniversalVideoPlayerProps) => {
	// Check if it's a Dailymotion URL
	const isDailymotion = isDailymotionUrl(url);

	if (isDailymotion) {
		return <DailymotionPlayer url={url} width={width} height={height} controls={controls} autoplay={autoplay} style={style} onError={onError} />;
	}

	// Format the URL and get config
	const formattedUrl = formatVideoUrl(url);
	const playerConfig = config || getVideoPlayerConfig(url, controls);

	// For all other platforms, use ReactPlayer
	return (
		<ReactPlayer
			url={formattedUrl}
			width={width}
			height={height}
			controls={controls}
			style={style}
			config={playerConfig}
			onError={onError}
			light={light}
			playing={autoplay}
		/>
	);
};

export default UniversalVideoPlayer;
