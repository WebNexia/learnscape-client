import { Box, Typography } from '@mui/material';
import { DocumentDetailBlock } from '../../interfaces/document';
import { sanitizeLandingPageHtml } from '../../utils/sanitizeHtml';
import {
	LEARNER_EMPHASIS_FONT_FAMILY,
	LEARNER_RICH_TEXT_CLASS,
	prepareLearnerRichTextHtml,
} from '../../utils/learnerTypography';

type Props = {
	blocks: DocumentDetailBlock[];
};

/**
 * Renders ordered document detail blocks (section / image / bullets / cta)
 * for the public book intro page.
 */
const LandingPageDocumentDetailBlocks = ({ blocks }: Props) => {
	if (!blocks?.length) return null;

	return (
		<Box sx={{ mt: { xs: 4, md: 5 }, display: 'flex', flexDirection: 'column', gap: { xs: 3.5, md: 4.5 } }}>
			{blocks.map((block, index) => {
				const key = `${block.type}-${index}`;

				if (block.type === 'section') {
					return (
						<Box key={key}>
							{block.title && (
								<Typography
									component='h2'
									sx={{
										fontFamily: 'Varela Round',
										fontWeight: 600,
										fontSize: { xs: '1.1rem', md: '1.25rem' },
										color: '#0f172a',
										mb: 1.5,
									}}>
									{block.title}
								</Typography>
							)}
							{block.body && (
								<Box
									className={`doc-detail-section-prose ${LEARNER_RICH_TEXT_CLASS}`}
									sx={{
										fontFamily: "'Varela Round', 'Segoe UI', sans-serif",
										color: '#334155',
										fontSize: { xs: '0.95rem', md: '1.05rem' },
										lineHeight: 1.75,
										'& p': { mb: 1.25, mt: 0 },
										'& ul, & ol': { pl: 2.5, mb: 1.5 },
										'& li': { mb: 0.5 },
										'& a': { color: '#0052a3' },
										'& img': { maxWidth: '100%', height: 'auto', borderRadius: '0.5rem', my: 1.5 },
										'& h1, & h2, & h3, & h4': {
											fontFamily: 'Varela Round',
											color: '#0f172a',
											mt: 2,
											mb: 1,
										},
										'& blockquote': {
											borderLeft: '3px solid #0052a3',
											pl: 2,
											ml: 0,
											color: '#475569',
											fontStyle: 'italic',
										},
										// Varela Round has no bold/italic cuts — match TinyMCE/learner emphasis face
										'& strong, & b, & strong *, & b *': {
											fontFamily: `${LEARNER_EMPHASIS_FONT_FAMILY} !important`,
											fontWeight: '700 !important',
											color: '#0f172a',
										},
										'& em, & i, & em *, & i *': {
											fontFamily: `${LEARNER_EMPHASIS_FONT_FAMILY} !important`,
											fontStyle: 'italic !important',
										},
									}}
									dangerouslySetInnerHTML={{
										__html: sanitizeLandingPageHtml(prepareLearnerRichTextHtml(block.body)),
									}}
								/>
							)}
						</Box>
					);
				}

				if (block.type === 'image' && block.imageUrl) {
					return (
						<Box key={key} sx={{ width: '100%' }}>
							<Box
								sx={{
									borderRadius: '0.75rem',
									overflow: 'hidden',
									backgroundColor: '#f1f5f9',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								<Box
									component='img'
									src={block.imageUrl}
									alt={block.caption || `Görsel ${index + 1}`}
									sx={{
										maxWidth: '100%',
										maxHeight: { xs: '55vh', md: '60vh' },
										objectFit: 'contain',
										display: 'block',
									}}
								/>
							</Box>
							{block.caption ? (
								<Typography
									sx={{
										mt: 1,
										textAlign: 'center',
										fontFamily: 'Varela Round',
										fontSize: '0.85rem',
										color: '#64748b',
									}}>
									{block.caption}
								</Typography>
							) : null}
						</Box>
					);
				}

				if (block.type === 'bullets') {
					return (
						<Box key={key}>
							{block.title && (
								<Typography
									component='h2'
									sx={{
										fontFamily: 'Varela Round',
										fontWeight: 600,
										fontSize: { xs: '1.1rem', md: '1.25rem' },
										color: '#0f172a',
										mb: 1.5,
									}}>
									{block.title}
								</Typography>
							)}
							<Box component='ul' sx={{ m: 0, pl: 2.75 }}>
								{(block.items || []).map((item, i) => (
									<Typography
										component='li'
										key={`${key}-i-${i}`}
										sx={{
											fontFamily: 'Varela Round',
											color: '#334155',
											fontSize: { xs: '0.95rem', md: '1.05rem' },
											lineHeight: 1.6,
											mb: 0.75,
										}}>
										{item}
									</Typography>
								))}
							</Box>
						</Box>
					);
				}

				if (block.type === 'cta' && block.body) {
					return (
						<Box
							key={key}
							sx={{
								textAlign: 'center',
								py: 2,
								px: 2,
								borderRadius: '0.75rem',
								background: 'linear-gradient(135deg, rgba(0, 82, 163, 0.06) 0%, rgba(0, 102, 204, 0.04) 100%)',
								border: '1px solid rgba(0, 82, 163, 0.12)',
							}}>
							<Typography
								sx={{
									fontFamily: 'Varela Round',
									fontWeight: 600,
									fontSize: { xs: '1.05rem', md: '1.2rem' },
									color: '#0052a3',
									lineHeight: 1.5,
									whiteSpace: 'pre-wrap',
								}}>
								{block.body}
							</Typography>
						</Box>
					);
				}

				return null;
			})}
		</Box>
	);
};

export default LandingPageDocumentDetailBlocks;

/** Prefer detailBlocks; fall back to legacy intro text + image gallery. */
export function resolvePublicDetailBlocks(doc: {
	detailBlocks?: DocumentDetailBlock[];
	detailIntroText?: string;
	detailImageUrls?: string[];
}): DocumentDetailBlock[] {
	if (Array.isArray(doc.detailBlocks) && doc.detailBlocks.length > 0) {
		return doc.detailBlocks;
	}
	const blocks: DocumentDetailBlock[] = [];
	const intro = (doc.detailIntroText || '').trim();
	if (intro) {
		blocks.push({
			type: 'section',
			title: 'Hakkında',
			body: `<p>${intro.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>`,
		});
	}
	for (const url of doc.detailImageUrls || []) {
		if (url?.trim()) {
			blocks.push({ type: 'image', imageUrl: url.trim(), caption: '' });
		}
	}
	return blocks;
}
