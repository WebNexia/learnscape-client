import { Box, Typography } from '@mui/material';
import { Lesson } from '../../interfaces/lessons';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { useContext, useState } from 'react';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface LessonImageCourseDisplayProps {
	singleLesson: Lesson;
}

const LessonImageCourseDisplay = ({ singleLesson }: LessonImageCourseDisplayProps) => {
	const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: isMobileSize ? 'center' : 'space-between',
				alignItems: 'center',
				width: isMobileSize ? '95%' : '90%',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
				<Box sx={{ height: isMobileSize ? '6rem' : '8rem', width: isMobileSize ? '9rem' : '12rem', cursor: 'pointer' }}>
					{singleLesson?.videoUrl ? (
						<Box
							sx={{
								height: '100%',
								width: '100%',
								position: 'relative',
							}}
							onClick={() => {
								if (singleLesson?.videoUrl) {
									setIsVideoPlayerOpen(true);
								}
							}}>
							<UniversalVideoPlayer
								url={singleLesson?.videoUrl}
								height='100%'
								width='100%'
								style={{
									borderRadius: '0.2rem',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								}}
								light={true}
								controls={false}
							/>
							<Box
								sx={{
									position: 'absolute',
									top: 0,
									left: 0,
									height: '100%',
									width: '100%',
									zIndex: 1000,
									backgroundColor: 'transparent',
									cursor: 'pointer',
								}}
								onClick={() => {
									if (singleLesson?.videoUrl) {
										setIsVideoPlayerOpen(true);
									}
								}}></Box>
						</Box>
					) : (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: '100%',
							}}>
							<img
								src={'https://placehold.co/600x400/e2e8f0/64748b?text=No+Video'}
								alt='video_thumbnail'
								height='100%'
								width='100%'
								style={{
									borderRadius: '0.2rem',
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								}}
							/>
						</Box>
					)}
					<Typography variant='body2' sx={{ mt: '0.35rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						Video Thumbnail
					</Typography>
				</Box>
				<CustomDialog
					openModal={isVideoPlayerOpen}
					closeModal={() => {
						setIsVideoPlayerOpen(false);
					}}
					dialogPaperSx={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
					<UniversalVideoPlayer url={singleLesson?.videoUrl} height='30rem' width='55rem' style={{ margin: '0.5rem' }} controls={true} />
				</CustomDialog>
			</Box>
		</Box>
	);
};

export default LessonImageCourseDisplay;
