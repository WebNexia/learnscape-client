import React, { useContext, useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	IconButton,
	Dialog,
	DialogContent,
	DialogActions,
	CircularProgress,
	Alert,
	Chip,
	Stack,
	Tooltip,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import { Download, Visibility, Close, PictureAsPdf, Description, Image, VideoFile, AudioFile, GetApp, OpenInNew } from '@mui/icons-material';
import { Document } from '../../interfaces/document';
import InlinePDFViewer from './InlinePDFViewer';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { decodeHtmlEntities } from '../../utils/utilText';

interface DocumentViewerProps {
	documents: Document[];
	title?: string;
	showTitle?: boolean;
	layout?: 'grid' | 'list';
	maxItems?: number;
	inlinePDFs?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
	documents,
	title = 'Materials',
	showTitle = true,
	layout = 'grid',
	maxItems,
	inlinePDFs = false,
}) => {
	const theme = useTheme();
	const { isMobileLandscape, isMobilePortrait } = useContext(MediaQueryContext);
	const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
	const [isViewerOpen, setIsViewerOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Filter and limit documents
	const displayDocuments = documents?.filter((doc) => doc !== null && doc.documentUrl)?.slice(0, maxItems || documents.length) || [];

	// Separate PDFs and non-PDFs
	const pdfDocuments = displayDocuments.filter((doc) => doc.documentUrl.toLowerCase().includes('.pdf'));
	const nonPdfDocuments = displayDocuments.filter((doc) => !doc.documentUrl.toLowerCase().includes('.pdf'));

	const getDocumentIcon = (url: string) => {
		const extension = url.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return <PictureAsPdf sx={{ color: '#d32f2f' }} />;
			case 'doc':
			case 'docx':
				return <Description sx={{ color: '#1976d2' }} />;
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
				return <Image sx={{ color: '#388e3c' }} />;
			case 'mp4':
			case 'avi':
			case 'mov':
				return <VideoFile sx={{ color: '#f57c00' }} />;
			case 'mp3':
			case 'wav':
			case 'm4a':
				return <AudioFile sx={{ color: '#7b1fa2' }} />;
			default:
				return <Description sx={{ color: '#666' }} />;
		}
	};

	const getDocumentType = (url: string) => {
		const extension = url.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'PDF Document';
			case 'doc':
			case 'docx':
				return 'Word Document';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
				return 'Image';
			case 'mp4':
			case 'avi':
			case 'mov':
				return 'Video';
			case 'mp3':
			case 'wav':
			case 'm4a':
				return 'Audio';
			default:
				return 'Document';
		}
	};

	const handleViewDocument = async (document: Document) => {
		setSelectedDocument(document);
		setIsViewerOpen(true);
		setLoading(true);
		setError(null);

		try {
			// Check if document URL is accessible
			const response = await fetch(document.documentUrl, { method: 'HEAD' });
			if (!response.ok) {
				throw new Error('Document not accessible');
			}
		} catch (err) {
			setError('Document not accessible. Please try downloading it instead.');
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadDocument = (document: Document) => {
		const link = window.document.createElement('a');
		link.href = document.documentUrl;
		link.download = decodeHtmlEntities(document.name || '');
		link.target = '_blank';
		window.document.body.appendChild(link);
		link.click();
		window.document.body.removeChild(link);
	};

	const handleOpenInNewTab = (document: Document) => {
		window.open(document.documentUrl, '_blank', 'noopener,noreferrer');
	};

	const renderDocumentCard = (document: Document) => (
		<Card
			key={document._id}
			sx={{
				'height': '100%',
				'display': 'flex',
				'flexDirection': 'column',
				'transition': 'all 0.3s ease',
				'&:hover': {
					transform: 'translateY(-4px)',
					boxShadow: theme.shadows[8],
				},
			}}>
			<CardContent sx={{ flexGrow: 1, p: 2 }}>
				<Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1 }}>
					{getDocumentIcon(document.documentUrl)}
					<Chip label={getDocumentType(document.documentUrl)} size='small' variant='outlined' sx={{ fontSize: '0.7rem', height: '1.5rem' }} />
				</Stack>
				<Typography
					variant='h6'
					component='h3'
					sx={{
						fontSize: isMobilePortrait ? '0.9rem' : '1rem',
						fontWeight: 600,
						mb: 1,
						lineHeight: 1.3,
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}>
					{decodeHtmlEntities(document.name || '')}
				</Typography>
			</CardContent>
			<Box sx={{ p: 2, pt: 0 }}>
				<Stack direction='row' spacing={1} justifyContent='center'>
					<Tooltip title='View Document'>
						<Button
							variant='contained'
							size='small'
							startIcon={<Visibility />}
							onClick={() => handleViewDocument(document)}
							sx={{ flex: 1, fontSize: '0.75rem' }}>
							View
						</Button>
					</Tooltip>
					<Tooltip title='Download'>
						<IconButton size='small' onClick={() => handleDownloadDocument(document)} sx={{ color: theme.palette.primary.main }}>
							<Download />
						</IconButton>
					</Tooltip>
					<Tooltip title='Open in New Tab'>
						<IconButton size='small' onClick={() => handleOpenInNewTab(document)} sx={{ color: theme.palette.secondary.main }}>
							<OpenInNew />
						</IconButton>
					</Tooltip>
				</Stack>
			</Box>
		</Card>
	);

	const renderDocumentList = (document: Document) => (
		<Box
			key={document._id}
			sx={{
				'display': 'flex',
				'alignItems': 'center',
				'p': 2,
				'mb': 1,
				'border': `1px solid ${theme.palette.divider}`,
				'borderRadius': 1,
				'transition': 'all 0.2s ease',
				'&:hover': {
					backgroundColor: theme.palette.action.hover,
					borderColor: theme.palette.primary.main,
				},
			}}>
			<Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>{getDocumentIcon(document.documentUrl)}</Box>
			<Box sx={{ flexGrow: 1 }}>
				<Typography variant='body1' sx={{ fontWeight: 500, mb: 0.5 }}>
					{decodeHtmlEntities(document.name || '')}
				</Typography>
				<Chip label={getDocumentType(document.documentUrl)} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
			</Box>
			<Stack direction='row' spacing={1}>
				<Button variant='outlined' size='small' startIcon={<Visibility />} onClick={() => handleViewDocument(document)}>
					View
				</Button>
				<IconButton size='small' onClick={() => handleDownloadDocument(document)} sx={{ color: theme.palette.primary.main }}>
					<Download />
				</IconButton>
			</Stack>
		</Box>
	);

	return (
		<Box sx={{ width: '100%' }}>
			{showTitle && displayDocuments.length !== 0 && (
				<Typography
					variant='h5'
					sx={{
						mb: 2,
						fontSize: isMobilePortrait || isMobileLandscape ? '0.9rem' : '1.15rem',
					}}>
					{title}
				</Typography>
			)}

			{/* Inline PDFs */}
			{inlinePDFs && pdfDocuments.length > 0 && (
				<Box sx={{ mb: 3 }}>
					{pdfDocuments.map((pdfDoc) => (
						<InlinePDFViewer
							key={pdfDoc._id}
							documentUrl={pdfDoc.documentUrl}
							documentName={pdfDoc.name}
							height={isMobilePortrait ? '400px' : '600px'}
						/>
					))}
				</Box>
			)}

			{/* Non-PDF Documents */}
			{nonPdfDocuments.length > 0 && (
				<>
					{inlinePDFs && pdfDocuments.length > 0 && (
						<Typography variant='h6' sx={{ mb: 2, fontSize: isMobilePortrait ? '1rem' : '1.1rem' }}>
							Other Materials
						</Typography>
					)}
					{layout === 'grid' ? (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: isMobilePortrait ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))',
								gap: 2,
							}}>
							{nonPdfDocuments.map(renderDocumentCard)}
						</Box>
					) : (
						<Box>{nonPdfDocuments.map(renderDocumentList)}</Box>
					)}
				</>
			)}

			{/* All Documents (when inlinePDFs is false) */}
			{!inlinePDFs && (
				<>
					{layout === 'grid' ? (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: isMobilePortrait ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))',
								gap: 2,
							}}>
							{displayDocuments.map(renderDocumentCard)}
						</Box>
					) : (
						<Box>{displayDocuments.map(renderDocumentList)}</Box>
					)}
				</>
			)}

			{/* Document Viewer Modal */}
			<Dialog open={isViewerOpen} onClose={() => setIsViewerOpen(false)} maxWidth='lg' fullWidth fullScreen={isMobilePortrait}>
				<DialogContent sx={{ p: 0, position: 'relative' }}>
					<IconButton
						onClick={() => setIsViewerOpen(false)}
						sx={{
							position: 'absolute',
							top: 8,
							right: 8,
							zIndex: 1,
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
						}}>
						<Close />
					</IconButton>

					{loading && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: '400px',
							}}>
							<CircularProgress />
						</Box>
					)}

					{error && (
						<Box sx={{ p: 3 }}>
							<Alert severity='error' sx={{ mb: 2 }}>
								{error}
							</Alert>
							<Button variant='contained' startIcon={<GetApp />} onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}>
								Download Document
							</Button>
						</Box>
					)}

					{selectedDocument && !loading && !error && (
						<Box sx={{ height: '80vh' }}>
							<iframe src={selectedDocument.documentUrl} width='100%' height='100%' style={{ border: 'none' }} title={selectedDocument.name} />
						</Box>
					)}
				</DialogContent>

				{selectedDocument && (
					<DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
						<Typography variant='body2' color='text.secondary'>
							{selectedDocument.name}
						</Typography>
						<Stack direction='row' spacing={1}>
							<Button variant='outlined' startIcon={<GetApp />} onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}>
								Download
							</Button>
							<Button variant='outlined' startIcon={<OpenInNew />} onClick={() => selectedDocument && handleOpenInNewTab(selectedDocument)}>
								Open in New Tab
							</Button>
						</Stack>
					</DialogActions>
				)}
			</Dialog>
		</Box>
	);
};

export default DocumentViewer;
