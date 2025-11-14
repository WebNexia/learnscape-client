import { Box, Typography } from '@mui/material';
import UniversalVideoPlayer from '../../video/UniversalVideoPlayer';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface VideoThumbnailProps {
	videoPlayCondition: boolean | string;
	videoUrl: string;
	videoPlaceholderUrl: string;
	boxStyle?: object;
	playerStyle?: React.CSSProperties;
	playerWidth?: string;
	imgStyle?: React.CSSProperties;
	controls?: boolean;
	removeVideo?: () => void;
}

const VideoThumbnail = ({
	videoPlayCondition,
	videoUrl,
	videoPlaceholderUrl,
	boxStyle,
	playerStyle,
	playerWidth = '60%',
	imgStyle,
	controls = true,
	removeVideo,
}: VideoThumbnailProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: isMobileSize ? '6rem' : '8rem',
				width: '100%',
				marginTop: '1rem',
				...boxStyle,
			}}>
			{videoPlayCondition ? (
				<UniversalVideoPlayer
					url={videoUrl}
					width={playerWidth}
					height='100%'
					controls={controls}
					style={{
						borderRadius: '0.2rem',
						boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						maxHeight: '145rem',
						...playerStyle,
					}}
					onError={(error) => {
						console.error('Video player error:', error);
					}}
				/>
			) : (
				<img
					src={videoPlaceholderUrl}
					alt='video_thumbnail'
					width='fit-content'
					height='100%'
					style={{
						borderRadius: '0.2rem',
						boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						objectFit: 'contain',
						...imgStyle,
					}}
				/>
			)}
			<Box>
				{videoPlayCondition && (
					<Typography
						variant='body2'
						sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.5rem' }}
						onClick={removeVideo}>
						Remove
					</Typography>
				)}
			</Box>
		</Box>
	);
};

export default VideoThumbnail;
