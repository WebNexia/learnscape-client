import { Box, Typography } from '@mui/material';
import ReactPlayer from 'react-player';

interface VideoThumbnailProps {
	videoPlayCondition: boolean | string;
	videoUrl: string;
	videoPlaceholderUrl: string;
	boxStyle?: object;
	playerStyle?: React.CSSProperties;
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
	imgStyle,
	controls = true,
	removeVideo,
}: VideoThumbnailProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: '9rem',
				width: '100%',
				marginTop: '1rem',
				...boxStyle,
			}}>
			{videoPlayCondition ? (
				<ReactPlayer
					url={videoUrl}
					height='100%'
					width='60%'
					style={{
						borderRadius: '0.2rem',
						boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						maxHeight: '145rem',
						...playerStyle,
					}}
					controls={controls}
				/>
			) : (
				<img
					src={videoPlaceholderUrl}
					alt='video_thumbnail'
					width='60%'
					height='100%'
					style={{
						borderRadius: '0.2rem',
						boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						...imgStyle,
					}}
				/>
			)}
			<Box>
				<Typography
					variant='body2'
					sx={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.5rem' }}
					onClick={removeVideo}>
					Remove
				</Typography>
			</Box>
		</Box>
	);
};

export default VideoThumbnail;
