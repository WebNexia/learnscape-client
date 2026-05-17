import { useContext, useState, useRef } from 'react';
import { Box, Typography, IconButton, Button, CircularProgress, Dialog, DialogContent } from '@mui/material';
import { CloudUpload, Delete, ArrowUpward, ArrowDownward, ZoomIn, Close } from '@mui/icons-material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import uploadImage from '../../../utils/imageUpload';
import CustomErrorMessage from '../customFields/CustomErrorMessage';

const DEFAULT_MAX_COUNT = 5;
const DEFAULT_MAX_SIZE_MB = 3;
const ACCEPT_IMAGES = 'image/jpeg,image/jpg,image/png';

interface SamplePageImagesUploadProps {
	urls: string[];
	onUrlsChange: (urls: string[]) => void;
	imageFolderName: string;
	/** Document Mongo id — uploads to {imageFolderName}/{scopedEntityId}/ */
	scopedEntityId?: string;
	label?: string;
	maxCount?: number;
	maxSizeMB?: number;
	disabled?: boolean;
	/** Called when user removes an image; use to delete from Firebase Storage. */
	onRemoveUrl?: (url: string) => void | Promise<void>;
}

export default function SamplePageImagesUpload({
	urls = [],
	onUrlsChange,
	imageFolderName,
	scopedEntityId,
	label = 'Sample Page Images',
	maxCount = DEFAULT_MAX_COUNT,
	maxSizeMB = DEFAULT_MAX_SIZE_MB,
	disabled = false,
	onRemoveUrl,
}: SamplePageImagesUploadProps) {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const { organisation } = useContext(OrganisationContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isUploading, setIsUploading] = useState(false);
	const [isSizeError, setIsSizeError] = useState(false);
	const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const remaining = maxCount - urls.length;
		if (remaining <= 0) {
			e.target.value = '';
			return;
		}

		const fileList = Array.from(files).slice(0, remaining);
		const maxBytes = maxSizeMB * 1024 * 1024;
		const validFiles = fileList.filter((f) => f.size <= maxBytes);
		setIsSizeError(validFiles.length < fileList.length);
		if (validFiles.length === 0) {
			e.target.value = '';
			return;
		}

		setIsUploading(true);
		try {
			const orgName = organisation?.orgName || 'defaultOrg';
			const newUrls = await Promise.all(
				validFiles.map((file) => uploadImage(file, imageFolderName, orgName, scopedEntityId))
			);
			onUrlsChange([...urls, ...newUrls]);
		} catch (err) {
			console.error('Sample page image upload error:', err);
		} finally {
			setIsUploading(false);
			e.target.value = '';
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const removeAt = async (index: number) => {
		const urlToRemove = urls[index];
		if (onRemoveUrl && urlToRemove) {
			try {
				await Promise.resolve(onRemoveUrl(urlToRemove));
			} catch (err) {
				console.error('Error deleting sample page image from storage:', err);
			}
		}
		onUrlsChange(urls.filter((_, i) => i !== index));
	};

	const moveUp = (index: number) => {
		if (index <= 0) return;
		const next = [...urls];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		onUrlsChange(next);
	};

	const moveDown = (index: number) => {
		if (index >= urls.length - 1) return;
		const next = [...urls];
		[next[index], next[index + 1]] = [next[index + 1], next[index]];
		onUrlsChange(next);
	};

	const atLimit = urls.length >= maxCount;

	return (
		<Box sx={{ width: '100%' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
				<Typography variant={isMobileSize ? 'body2' : 'h6'} sx={{ fontSize: !isMobileSize ? '1rem' : '0.75rem' }}>
					{label}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{urls.length} / {maxCount}
				</Typography>
			</Box>

			{!disabled && !atLimit && (
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
					<input
						ref={fileInputRef}
						type="file"
						accept={ACCEPT_IMAGES}
						multiple
						style={{ display: 'none' }}
						onChange={handleFileChange}
					/>
					<Button
						variant="outlined"
						size="small"
						startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUpload />}
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading || disabled}
						sx={{ textTransform: 'capitalize' }}
					>
						{isUploading ? 'Uploading...' : 'Select images'}
					</Button>
				</Box>
			)}

			{isSizeError && (
				<CustomErrorMessage sx={{ mb: 1 }}>
					Some files exceed the limit of {maxSizeMB} MB and were skipped.
				</CustomErrorMessage>
			)}

			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
				{urls.map((url, index) => (
					<Box
						key={`${url}-${index}`}
						sx={{
							position: 'relative',
							width: isMobileSize ? 72 : 88,
							height: isMobileSize ? 72 : 88,
							flexShrink: 0,
							borderRadius: 1,
							overflow: 'hidden',
							border: '1px solid',
							borderColor: 'divider',
							'&:hover .sample-page-actions': { opacity: 1 },
						}}
					>
						<img
							src={url}
							alt={`Sample ${index + 1}`}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								display: 'block',
								cursor: 'pointer',
							}}
							onClick={() => setEnlargedUrl(url)}
						/>
						{/* Always-visible remove button (top-right) */}
						<IconButton
							size="small"
							onClick={(e) => { e.stopPropagation(); removeAt(index); }}
							title="Remove"
							sx={{
								position: 'absolute',
								top: 2,
								right: 2,
								zIndex: 2,
								color: 'white',
								backgroundColor: 'rgba(0,0,0,0.6)',
								'&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
								padding: 0.25,
							}}
						>
							<Delete sx={{ fontSize: 16 }} />
						</IconButton>
						<Box
							className="sample-page-actions"
							onClick={() => setEnlargedUrl(url)}
							sx={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								opacity: 0,
								transition: 'opacity 0.2s',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 0.5,
								backgroundColor: 'rgba(0,0,0,0.5)',
								cursor: 'pointer',
							}}
						>
							<Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
								<IconButton size="small" onClick={() => setEnlargedUrl(url)} sx={{ color: 'white' }} title="Enlarge">
									<ZoomIn fontSize="small" />
								</IconButton>
								<IconButton size="small" onClick={(e) => { e.stopPropagation(); moveUp(index); }} disabled={index === 0} sx={{ color: 'white' }} title="Move up">
									<ArrowUpward fontSize="small" />
								</IconButton>
								<IconButton size="small" onClick={(e) => { e.stopPropagation(); moveDown(index); }} disabled={index === urls.length - 1} sx={{ color: 'white' }} title="Move down">
									<ArrowDownward fontSize="small" />
								</IconButton>
							</Box>
						</Box>
						<Typography
							variant="caption"
							sx={{
								position: 'absolute',
								bottom: 2,
								left: 2,
								color: 'white',
								textShadow: '0 0 2px #000',
								fontSize: '0.65rem',
							}}
						>
							{index + 1}
						</Typography>
					</Box>
				))}
			</Box>

			<Dialog
				open={!!enlargedUrl}
				onClose={() => setEnlargedUrl(null)}
				maxWidth={false}
				PaperProps={{
					sx: {
						borderRadius: 2,
						overflow: 'hidden',
						maxWidth: '95vw',
						maxHeight: '95vh',
						backgroundColor: 'transparent',
						boxShadow: 'none',
					},
				}}
				sx={{ '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.85)' } }}
			>
				<DialogContent sx={{ p: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<IconButton
						onClick={() => setEnlargedUrl(null)}
						sx={{
							position: 'absolute',
							top: 8,
							right: 8,
							zIndex: 1,
							color: 'white',
							backgroundColor: 'rgba(0,0,0,0.5)',
							'&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
						}}
						size="small"
					>
						<Close />
					</IconButton>
					{enlargedUrl && (
						<img
							src={enlargedUrl}
							alt="Sample page (enlarged)"
							style={{
								maxWidth: '90vw',
								maxHeight: '90vh',
								objectFit: 'contain',
								display: 'block',
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
		</Box>
	);
}
