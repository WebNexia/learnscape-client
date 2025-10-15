import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Typography,
	Button,
	Stack,
	Slider,
	TextField,
	CircularProgress,
	Alert,
	IconButton,
	Collapse,
	useTheme,
	useMediaQuery,
	Tooltip,
} from '@mui/material';
import { ZoomIn, ZoomOut, FirstPage, LastPage, NavigateBefore, NavigateNext, GetApp, OpenInNew, ExpandMore, ExpandLess } from '@mui/icons-material';

interface InlinePDFViewerProps {
	documentUrl: string;
	documentName: string;
	height?: string;
}

// Extend window interface for PDF.js
declare global {
	interface Window {
		pdfjsLib: any;
	}
}

const InlinePDFViewer: React.FC<InlinePDFViewerProps> = ({ documentUrl, documentName, height = '600px' }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [pdfDoc, setPdfDoc] = useState<any>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [scale, setScale] = useState(1.0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [useFallback, setUseFallback] = useState<boolean>(false);

	// Load PDF.js dynamically
	useEffect(() => {
		if (documentUrl) {
			loadPDF();
		}
	}, [documentUrl]);

	const loadPDF = async () => {
		setLoading(true);
		setError(null);

		try {
			// Check if PDF.js is already loaded
			if (window.pdfjsLib) {
				await loadPDFDocument();
				return;
			}

			// Load PDF.js from CDN
			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
			script.async = true;

			script.onload = async () => {
				try {
					await loadPDFDocument();
				} catch (err) {
					console.error('Error loading PDF:', err);
					setError('Failed to load PDF document. Please try downloading it instead.');
					setLoading(false);
				}
			};

			script.onerror = () => {
				console.error('Failed to load PDF.js script');
				setError('Failed to load PDF.js library. Please try downloading the document instead.');
				setLoading(false);
			};

			document.head.appendChild(script);
		} catch (err) {
			console.error('Error loading PDF:', err);
			setError('Failed to load PDF document. Please try downloading it instead.');
			setLoading(false);
		}
	};

	const loadPDFDocument = async () => {
		try {
			// @ts-ignore - PDF.js is loaded from CDN
			const pdfjsLib = window.pdfjsLib;

			if (!pdfjsLib) {
				throw new Error('PDF.js library not loaded');
			}

			// Set worker source
			pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

			// Load the PDF document with better error handling
			const loadingTask = pdfjsLib.getDocument({
				url: documentUrl,
				cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
				cMapPacked: true,
				disableAutoFetch: false,
				disableStream: false,
			});

			loadingTask.onProgress = (progress: any) => {};

			const pdf = await loadingTask.promise;

			setPdfDoc(pdf);
			setTotalPages(pdf.numPages);
			setCurrentPage(1);
		} catch (err: any) {
			console.error('Error loading PDF document:', err);
			if (err.name === 'InvalidPDFException') {
				setError('Invalid PDF file. Please check the document URL.');
			} else if (err.name === 'MissingPDFException') {
				setError('PDF file not found. Please check the document URL.');
			} else if (err.name === 'UnexpectedResponseException') {
				setError('Unable to access PDF file. It may be protected or the URL is incorrect.');
			} else {
				// Try fallback iframe method
				setUseFallback(true);
				setError(null);
			}
		} finally {
			setLoading(false);
		}
	};

	const renderPage = async (pageNum: number) => {
		if (!pdfDoc || !canvasRef.current) return;

		try {
			const page = await pdfDoc.getPage(pageNum);
			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');

			if (!context) {
				throw new Error('Could not get canvas context');
			}

			// Calculate viewport
			const viewport = page.getViewport({ scale });

			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// Render the page
			const renderContext = {
				canvasContext: context,
				viewport: viewport,
			};

			const renderTask = page.render(renderContext);
			await renderTask.promise;
		} catch (err: any) {
			console.error('Error rendering page:', err);
			setError(`Failed to render page ${pageNum}: ${err.message || 'Unknown error'}`);
		}
	};

	useEffect(() => {
		if (pdfDoc && currentPage) {
			renderPage(currentPage);
		}
	}, [pdfDoc, currentPage, scale]);

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	const handleZoomChange = (newScale: number) => {
		setScale(Math.max(0.5, Math.min(2, newScale)));
	};

	const handleDownload = () => {
		const link = window.document.createElement('a');
		link.href = documentUrl;
		link.download = documentName;
		link.target = '_blank';
		window.document.body.appendChild(link);
		link.click();
		window.document.body.removeChild(link);
	};

	const handleOpenInNewTab = () => {
		window.open(documentUrl, '_blank', 'noopener,noreferrer');
	};

	return (
		<Box sx={{ width: '100%', mt: 2 }}>
			{/* PDF Header */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					p: '0.5rem 1rem',
					backgroundColor: theme.palette.grey[50],
					borderRadius: '8px 8px 0 0',
					border: `1px solid ${theme.palette.divider}`,
					borderBottom: 'none',
				}}>
				<Typography variant='h6' sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
					{documentName}
				</Typography>

				<Stack direction='row' spacing={1} alignItems='center'>
					<Tooltip title='Open in New Tab' placement='top' arrow>
						<IconButton size='small' onClick={handleOpenInNewTab} sx={{ color: theme.palette.primary.main }}>
							<OpenInNew fontSize='small' />
						</IconButton>
					</Tooltip>
					<Tooltip title={isExpanded ? 'Collapse' : 'Expand'} placement='top' arrow>
						<IconButton size='small' onClick={() => setIsExpanded(!isExpanded)}>
							{isExpanded ? <ExpandLess /> : <ExpandMore />}
						</IconButton>
					</Tooltip>
				</Stack>
			</Box>

			{/* PDF Controls */}
			<Collapse in={isExpanded && !useFallback}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						p: 1,
						backgroundColor: theme.palette.grey[100],
						border: `1px solid ${theme.palette.divider}`,
						borderTop: 'none',
						borderBottom: 'none',
					}}>
					{/* Page Navigation */}
					<Stack direction='row' spacing={1} alignItems='center'>
						<IconButton size='small' onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
							<FirstPage />
						</IconButton>
						<IconButton size='small' onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
							<NavigateBefore />
						</IconButton>

						<TextField
							size='small'
							value={currentPage}
							onChange={(e) => {
								const page = parseInt(e.target.value);
								if (!isNaN(page)) handlePageChange(page);
							}}
							sx={{ width: 60 }}
							inputProps={{ style: { textAlign: 'center' } }}
						/>
						<Typography variant='body2' color='text.secondary'>
							/ {totalPages}
						</Typography>

						<IconButton size='small' onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
							<NavigateNext />
						</IconButton>
						<IconButton size='small' onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
							<LastPage />
						</IconButton>
					</Stack>

					{/* Zoom Controls */}
					<Stack direction='row' spacing={1} alignItems='center'>
						<IconButton size='small' onClick={() => handleZoomChange(scale - 0.2)} disabled={scale <= 0.5}>
							<ZoomOut />
						</IconButton>

						<Slider value={scale} onChange={(_, value) => handleZoomChange(value as number)} min={0.5} max={2} step={0.1} sx={{ width: 80 }} />

						<IconButton size='small' onClick={() => handleZoomChange(scale + 0.2)} disabled={scale >= 2}>
							<ZoomIn />
						</IconButton>

						<Typography variant='body2' color='text.secondary' sx={{ minWidth: 40 }}>
							{Math.round(scale * 100)}%
						</Typography>
					</Stack>
				</Box>
			</Collapse>

			{/* PDF Content */}
			<Collapse in={isExpanded}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'flex-start',
						p: 2,
						backgroundColor: theme.palette.background.paper,
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: '0 0 8px 8px',
						minHeight: isMobile ? '300px' : height,
						overflow: 'auto',
					}}>
					{loading && (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
							<CircularProgress sx={{ mb: 2 }} />
							<Typography variant='body2' color='text.secondary'>
								Loading PDF...
							</Typography>
						</Box>
					)}

					{error && (
						<Box sx={{ p: 3, width: '100%' }}>
							<Alert severity='error' sx={{ mb: 2 }}>
								{error}
							</Alert>
							<Button variant='contained' startIcon={<GetApp />} onClick={handleDownload}>
								Download PDF
							</Button>
						</Box>
					)}

					{!loading && !error && pdfDoc && (
						<canvas
							ref={canvasRef}
							style={{
								maxWidth: '100%',
								height: 'auto',
								boxShadow: theme.shadows[2],
								borderRadius: 4,
							}}
						/>
					)}

					{/* Fallback iframe for PDFs that can't be rendered with PDF.js */}
					{!loading && !error && useFallback && (
						<Box sx={{ width: '100%', height: '100%' }}>
							<iframe
								src={documentUrl}
								width='100%'
								height={isMobile ? '300px' : '550px'}
								style={{ border: 'none', borderRadius: '0.5rem' }}
								title={documentName}
								onLoad={() => {}}
								onError={() => {
									console.error('PDF iframe failed to load');
									setError('Unable to display PDF. Please try downloading it instead.');
								}}
							/>
						</Box>
					)}
				</Box>
			</Collapse>
		</Box>
	);
};

export default InlinePDFViewer;
