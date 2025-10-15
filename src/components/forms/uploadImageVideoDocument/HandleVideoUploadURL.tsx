import { CloudUpload } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, FormControl, IconButton, Input, Tooltip, Typography } from '@mui/material';
import React, { ChangeEvent, useContext } from 'react';
import CustomErrorMessage from '../customFields/CustomErrorMessage';
import CustomTextField from '../customFields/CustomTextField';
import useVideoUpload from '../../../hooks/useVideoUpload';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface HandleVideoUploadURLProps {
	onVideoUploadLogic: (url: string) => void;
	onChangeVideoUrl?: (e: ChangeEvent<HTMLInputElement>) => void;
	setEnterVideoUrl: React.Dispatch<React.SetStateAction<boolean>>;
	videoUrlValue?: string;
	videoFolderName: string;
	enterVideoUrl: boolean;
	label?: string;
}

const HandleVideoUploadURL = ({
	onVideoUploadLogic,
	onChangeVideoUrl,
	setEnterVideoUrl,
	videoUrlValue,
	videoFolderName,
	enterVideoUrl,
	label = 'Video',
}: HandleVideoUploadURLProps) => {
	const { videoUpload, isVideoSizeLarge, handleVideoChange, resetVideoUpload, handleVideoUpload, isVideoLoading } = useVideoUpload();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const handleVideoUploadReusable = () => {
		handleVideoUpload(videoFolderName, (url: string) => {
			onVideoUploadLogic(url);
		});
	};
	return (
		<FormControl sx={{ display: 'flex' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
				<Typography variant={isMobileSize ? 'body2' : 'h6'} sx={{ fontSize: !isMobileSize ? '1rem' : '0.8rem' }}>
					{label}
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: !enterVideoUrl ? 'underline' : 'none', cursor: 'pointer', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							onClick={() => setEnterVideoUrl(false)}>
							Choose
						</Typography>
					</Box>
					<Typography sx={{ margin: '0 0.5rem' }}> | </Typography>
					<Box>
						<Typography
							variant='body2'
							sx={{ textDecoration: enterVideoUrl ? 'underline' : 'none', cursor: 'pointer', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
							onClick={() => {
								setEnterVideoUrl(true);
								resetVideoUpload();
							}}>
							Enter URL
						</Typography>
					</Box>
				</Box>
			</Box>

			{!enterVideoUrl && (
				<>
					<Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
						<Input
							type='file'
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								handleVideoChange(e);
							}}
							inputProps={{ accept: 'video/*' }} // Specify accepted file types
							sx={{
								width: '82.5%',
								backgroundColor: theme.bgColor?.common,
								margin: '0.5rem 0 0.85rem 0',
								padding: '0.25rem',
							}}
						/>
						{!isVideoLoading ? (
							<Tooltip title='Upload' placement='top' arrow>
								<IconButton
									onClick={handleVideoUploadReusable}
									sx={{ height: '2rem', width: '12.5%', border: '0.02rem solid gray', borderRadius: '0.35rem' }}
									disabled={!videoUpload || isVideoSizeLarge}>
									<CloudUpload />
								</IconButton>
							</Tooltip>
						) : (
							<LoadingButton loading variant='outlined' sx={{ textTransform: 'capitalize', height: '2rem' }}>
								Upload
							</LoadingButton>
						)}
					</Box>
					{isVideoSizeLarge && <CustomErrorMessage> Please upload a video smaller than 50MB.</CustomErrorMessage>}
				</>
			)}

			{enterVideoUrl && (
				<CustomTextField placeholder='Video URL' required={false} sx={{ marginTop: '0.5rem' }} value={videoUrlValue} onChange={onChangeVideoUrl} />
			)}
		</FormControl>
	);
};

export default HandleVideoUploadURL;
