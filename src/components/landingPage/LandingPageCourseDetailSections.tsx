import { Box, Typography } from '@mui/material';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { CourseLandingPageSection } from '../../interfaces/course';
import { sanitizeLandingPageHtml } from '../../utils/sanitizeHtml';

/** LP / Academy brand blues (chevron alternate) */
const ACADEMY_BLUE_GRADIENT = 'linear-gradient(145deg, #0052a3 0%, #0066cc 55%, #0ea5e9 100%)';
/** Aden brand teal (theme primary family) */
const ADEN_BLUE_GRADIENT = 'linear-gradient(145deg, #01435a 0%, #02647d 50%, #0a7a9a 100%)';
/** Body text on light bg — pairs with chevrons */
const ADEN_LIST_TEXT = '#0c4556';
const ACADEMY_LIST_TEXT = '#0b4f73';
const ADEN_LIST_STRONG = '#023544';
const ACADEMY_LIST_STRONG = '#063a5c';

/** Scope for plain `<style>` rules (Emotion warns on `:nth-child`; `:nth-of-type(... of …)` is invalid in some browsers). */
const LP_SECTION_PROSE_CLASS = 'lp-landing-section-prose';

/** Inline-style hints for a vertical bar on the left (Word / TinyMCE / logical borders). */
const VERTICAL_BAR_STYLE_MARKERS = [
	'border-left',
	'border-inline-start',
	'Border-Left',
	'border-Left',
] as const;

const LP_VERTICAL_BAR_TAGS = ['p', 'div', 'blockquote'] as const;

/** Sibling list for `:nth-child(An+B of …)` so p / div / blockquote rows alternate together. */
const verticalBarOfSelectorList = LP_VERTICAL_BAR_TAGS.flatMap((tag) =>
	VERTICAL_BAR_STYLE_MARKERS.map((m) => `${tag}[style*="${m}"]`),
).join(', ');

function buildVerticalBarAlternateCss(): string {
	const base = `.${LP_SECTION_PROSE_CLASS}`;
	const blocks: string[] = [];
	for (const tag of LP_VERTICAL_BAR_TAGS) {
		const odd = `${base} ${tag}:nth-child(2n+1 of ${verticalBarOfSelectorList})`;
		const even = `${base} ${tag}:nth-child(2n of ${verticalBarOfSelectorList})`;
		blocks.push(
			`${odd} {
	color: ${ADEN_LIST_TEXT} !important;
	border-left-color: #01435a !important;
}
${odd} strong, ${odd} b {
	color: ${ADEN_LIST_STRONG} !important;
}
${odd} em, ${odd} i:not(.icon) {
	color: ${ADEN_LIST_TEXT} !important;
	opacity: 0.92;
}
${odd} a {
	color: #01435a !important;
	border-bottom-color: rgba(1, 67, 90, 0.35) !important;
}
${odd} a:hover {
	color: #012a38 !important;
	border-bottom-color: #01435a !important;
}
${even} {
	color: ${ACADEMY_LIST_TEXT} !important;
	border-left-color: #0052a3 !important;
}
${even} strong, ${even} b {
	color: ${ACADEMY_LIST_STRONG} !important;
}
${even} em, ${even} i:not(.icon) {
	color: ${ACADEMY_LIST_TEXT} !important;
	opacity: 0.92;
}
${even} a {
	color: #0052a3 !important;
	border-bottom-color: rgba(0, 82, 163, 0.35) !important;
}
${even} a:hover {
	color: #003d7a !important;
	border-bottom-color: #0052a3 !important;
}`,
		);
	}
	return blocks.join('\n');
}

/** Any block with inline left bar — plain `<style>` so `:nth-child(… of …)` works and Emotion stays quiet. */
const fakeListAlternateCss = buildVerticalBarAlternateCss().trim();

/** :not() fragments for intro paragraph (no vertical bar in inline style). */
const notVerticalBarInline =
	':not([style*="border-left"]):not([style*="border-inline-start"]):not([style*="Border-Left"]):not([style*="border-Left"])';

const introFirstParagraphSelector =
	'& > p:first-of-type' +
	notVerticalBarInline +
	', & > div:first-of-type > p:first-of-type' +
	notVerticalBarInline;

const verticalBarFirstRowFallbackSelector =
	[
		'& > p:first-of-type[style*="border-left"]',
		'& > p:first-of-type[style*="border-inline-start"]',
		'& > p:first-of-type[style*="Border-Left"]',
		'& > p:first-of-type[style*="border-Left"]',
		'& > div:first-of-type > p:first-of-type[style*="border-left"]',
		'& > div:first-of-type > p:first-of-type[style*="border-inline-start"]',
		'& > div:first-of-type > p:first-of-type[style*="Border-Left"]',
		'& > div:first-of-type > p:first-of-type[style*="border-Left"]',
		'& > div:first-of-type[style*="border-left"]',
		'& > div:first-of-type[style*="border-inline-start"]',
		'& > div:first-of-type[style*="Border-Left"]',
		'& > div:first-of-type[style*="border-Left"]',
		'& > blockquote:first-of-type[style*="border-left"]',
		'& > blockquote:first-of-type[style*="border-inline-start"]',
		'& > blockquote:first-of-type[style*="Border-Left"]',
		'& > blockquote:first-of-type[style*="border-Left"]',
	].join(', ');

const proseSx = {
	color: '#1e293b',
	fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
	fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
	lineHeight: 1.78,
	letterSpacing: 'normal',
	WebkitFontSmoothing: 'antialiased',
	MozOsxFontSmoothing: 'grayscale',
	'& ::selection': {
		backgroundColor: 'rgba(0, 82, 163, 0.2)',
		color: '#0f172a',
	},
	'& p': { margin: '0 0 1.05em' },
	'& p:last-child': { marginBottom: 0 },
	// Intro paragraph — exclude any inline vertical-bar block (alternating colors from `fakeListAlternateCss`)
	[introFirstParagraphSelector]: {
		fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
		lineHeight: 1.82,
		fontWeight: 500,
		color: '#0f172a',
		letterSpacing: 'normal',
	},
	'& strong, & b': {
		color: '#0f172a',
		fontWeight: 700,
	},
	'& em, & i:not(.icon)': {
		color: '#334155',
	},
	'& ul': {
		listStyle: 'none',
		pl: 0,
		my: 1.35,
	},
	'& ul ul': {
		pl: 1.25,
		mt: 0.45,
		mb: 0,
	},
	'& ul > li': {
		display: 'flex',
		alignItems: 'baseline',
		gap: '0.4rem',
		listStyle: 'none',
		pl: 0,
		mb: 0.6,
		'&::before': {
			content: '"›"',
			flexShrink: 0,
			fontSize: '1.08em',
			fontWeight: 700,
			lineHeight: 1,
			display: 'inline-block',
			transform: 'translateY(0.06em)',
			WebkitBackgroundClip: 'text',
			WebkitTextFillColor: 'transparent',
			backgroundClip: 'text',
		},
	},
	'& ul > li:nth-of-type(odd)::before': {
		background: ADEN_BLUE_GRADIENT,
	},
	'& ul > li:nth-of-type(even)::before': {
		background: ACADEMY_BLUE_GRADIENT,
	},
	'& ul > li:nth-of-type(odd)': {
		color: ADEN_LIST_TEXT,
		'& p, & div': { color: ADEN_LIST_TEXT },
		'& p:first-of-type': { color: ADEN_LIST_TEXT },
		'& strong, & b': { color: ADEN_LIST_STRONG },
		'& em, & i:not(.icon)': { color: ADEN_LIST_TEXT, opacity: 0.92 },
		'& a': {
			color: '#01435a',
			borderBottomColor: 'rgba(1, 67, 90, 0.35)',
			'&:hover': { color: '#012a38', borderBottomColor: '#01435a' },
		},
	},
	'& ul > li:nth-of-type(even)': {
		color: ACADEMY_LIST_TEXT,
		'& p, & div': { color: ACADEMY_LIST_TEXT },
		'& p:first-of-type': { color: ACADEMY_LIST_TEXT },
		'& strong, & b': { color: ACADEMY_LIST_STRONG },
		'& em, & i:not(.icon)': { color: ACADEMY_LIST_TEXT, opacity: 0.92 },
		'& a': {
			color: '#0052a3',
			borderBottomColor: 'rgba(0, 82, 163, 0.35)',
			'&:hover': { color: '#003d7a', borderBottomColor: '#0052a3' },
		},
	},
	'& ul ul > li::before': {
		content: '"›"',
		fontSize: '1em',
		opacity: 0.92,
		transform: 'translateY(0.05em)',
	},
	'& ul ul > li:nth-of-type(odd)::before': {
		background: ADEN_BLUE_GRADIENT,
	},
	'& ul ul > li:nth-of-type(even)::before': {
		background: ACADEMY_BLUE_GRADIENT,
	},
	'& ul ul > li:nth-of-type(odd)': {
		color: ADEN_LIST_TEXT,
		'& p, & div': { color: ADEN_LIST_TEXT },
		'& p:first-of-type': { color: ADEN_LIST_TEXT },
		'& strong, & b': { color: ADEN_LIST_STRONG },
		'& a': {
			color: '#01435a',
			borderBottomColor: 'rgba(1, 67, 90, 0.35)',
			'&:hover': { color: '#012a38', borderBottomColor: '#01435a' },
		},
	},
	'& ul ul > li:nth-of-type(even)': {
		color: ACADEMY_LIST_TEXT,
		'& p, & div': { color: ACADEMY_LIST_TEXT },
		'& p:first-of-type': { color: ACADEMY_LIST_TEXT },
		'& strong, & b': { color: ACADEMY_LIST_STRONG },
		'& a': {
			color: '#0052a3',
			borderBottomColor: 'rgba(0, 82, 163, 0.35)',
			'&:hover': { color: '#003d7a', borderBottomColor: '#0052a3' },
		},
	},
	'& ol': {
		listStyle: 'none',
		pl: 0,
		my: 1.35,
		counterReset: 'lpSectionOl',
	},
	'& ol > li': {
		position: 'relative',
		pl: 2.75,
		mb: 0.6,
		counterIncrement: 'lpSectionOl',
		listStyle: 'none',
		'&::before': {
			content: 'counter(lpSectionOl)',
			position: 'absolute',
			left: 0,
			top: '0.22em',
			minWidth: '1.65rem',
			height: '1.5rem',
			paddingLeft: '0.25rem',
			paddingRight: '0.25rem',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '0.68rem',
			fontWeight: 800,
			fontFamily: "'Varela Round', system-ui, sans-serif",
			letterSpacing: '-0.03em',
			color: '#fff',
			background: 'linear-gradient(145deg, #0052a3 0%, #0066cc 100%)',
			borderRadius: '0.4rem',
			boxShadow: '0 2px 8px rgba(0, 82, 163, 0.32)',
			lineHeight: 1,
		},
	},
	'& ol > li:nth-of-type(odd)::before': {
		background: ADEN_BLUE_GRADIENT,
		boxShadow: '0 2px 8px rgba(1, 67, 90, 0.35)',
	},
	'& ol > li:nth-of-type(even)::before': {
		background: 'linear-gradient(145deg, #0052a3 0%, #0066cc 100%)',
		boxShadow: '0 2px 8px rgba(0, 82, 163, 0.32)',
	},
	'& ol > li:nth-of-type(odd)': {
		color: ADEN_LIST_TEXT,
		'& p, & div': { color: ADEN_LIST_TEXT },
		'& p:first-of-type': { color: ADEN_LIST_TEXT },
		'& strong, & b': { color: ADEN_LIST_STRONG },
		'& a': {
			color: '#01435a',
			borderBottomColor: 'rgba(1, 67, 90, 0.35)',
			'&:hover': { color: '#012a38', borderBottomColor: '#01435a' },
		},
	},
	'& ol > li:nth-of-type(even)': {
		color: ACADEMY_LIST_TEXT,
		'& p, & div': { color: ACADEMY_LIST_TEXT },
		'& p:first-of-type': { color: ACADEMY_LIST_TEXT },
		'& strong, & b': { color: ACADEMY_LIST_STRONG },
		'& a': {
			color: '#0052a3',
			borderBottomColor: 'rgba(0, 82, 163, 0.35)',
			'&:hover': { color: '#003d7a', borderBottomColor: '#0052a3' },
		},
	},
	'& ol ol': {
		counterReset: 'lpSectionOl',
		mt: 0.65,
		mb: 0.35,
	},
	// First vertical-bar row fallback (Aden) when `nth-child(... of …)` misses a browser edge case
	[verticalBarFirstRowFallbackSelector]: {
		color: `${ADEN_LIST_TEXT} !important`,
		borderLeftColor: '#01435a !important',
		'& strong, & b': { color: `${ADEN_LIST_STRONG} !important` },
		'& em, & i:not(.icon)': { color: `${ADEN_LIST_TEXT} !important`, opacity: 0.92 },
		'& a': {
			color: '#01435a !important',
			borderBottomColor: 'rgba(1, 67, 90, 0.35) !important',
			'&:hover': { color: '#012a38 !important', borderBottomColor: '#01435a !important' },
		},
	},
	'& a': {
		color: '#0052a3',
		wordBreak: 'break-word',
		fontWeight: 600,
		textDecoration: 'none',
		borderBottom: '2px solid rgba(0, 82, 163, 0.28)',
		transition: 'border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
		'&:hover': {
			borderBottomColor: '#0052a3',
			color: '#003d7a',
			boxShadow: '0 2px 0 rgba(0, 82, 163, 0.15)',
		},
	},
	'& img': {
		maxWidth: '100%',
		height: 'auto',
		borderRadius: '0.85rem',
		boxShadow: '0 12px 40px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.04)',
		my: 1.75,
	},
	'& blockquote': {
		borderLeft: '4px solid #0052a3',
		pl: 2,
		ml: 0,
		my: 1.75,
		fontStyle: 'italic',
		color: '#475569',
		fontSize: '1.02em',
		background: 'linear-gradient(90deg, rgba(0, 82, 163, 0.07) 0%, rgba(248, 250, 252, 0.6) 55%)',
		py: 1.75,
		px: 2,
		borderRadius: '0 0.65rem 0.65rem 0',
		boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
	},
	'& pre': {
		borderRadius: '0.65rem',
		padding: '1rem 1.15rem',
		background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
		color: '#e2e8f0',
		overflowX: 'auto',
		boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
		my: 1.5,
	},
	'& pre, & code': {
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		fontSize: '0.88em',
	},
	'& p code, & li code': {
		background: 'rgba(0, 82, 163, 0.08)',
		color: '#0f172a',
		px: 0.6,
		py: 0.15,
		borderRadius: '0.35rem',
		fontSize: '0.9em',
		fontWeight: 500,
	},
	'& h1, & h2, & h3, & h4, & h5, & h6': {
		fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
		fontWeight: 700,
		color: '#0f172a',
		mt: 2.25,
		mb: 1,
		letterSpacing: '-0.03em',
		lineHeight: 1.35,
	},
};

type Props = {
	sections: CourseLandingPageSection[];
};

const LandingPageCourseDetailSections = ({ sections }: Props) => {
	if (!sections?.length) return null;

	return (
		<Box
			component='section'
			aria-label='Course details'
			sx={{
				width: '100%',
				maxWidth: { xs: '95vw', md: '90vw' },
				mx: 'auto',
				px: { xs: 2, sm: 3 },
				mt: { xs: 1, md: 2 },
				mb: { xs: 4, md: 6 },
			}}>
			<Box component='style' dangerouslySetInnerHTML={{ __html: fakeListAlternateCss }} suppressHydrationWarning />
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 2,
					mb: { xs: 3, md: 3.5 },
				}}>
				<Box
					sx={{
						height: '1px',
						flex: 1,
						maxWidth: 100,
						background: 'linear-gradient(90deg, transparent 0%, rgba(100, 116, 139, 0.2) 50%, transparent 100%)',
					}}
				/>
				<AutoStoriesOutlinedIcon
					sx={{
						color: 'primary.main',
						fontSize: { xs: 24, sm: 26 },
						opacity: 0.55,
					}}
				/>
				<Box
					sx={{
						height: '1px',
						flex: 1,
						maxWidth: 100,
						background: 'linear-gradient(90deg, transparent 0%, rgba(100, 116, 139, 0.2) 50%, transparent 100%)',
					}}
				/>
			</Box>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr',
						md: 'repeat(2, minmax(0, 1fr))',
						lg: 'repeat(3, minmax(0, 1fr))',
					},
					alignItems: 'stretch',
					gap: { xs: 2, md: 2.5 },
				}}>
				{sections.map((s, i) => {
					const n = String(i + 1).padStart(2, '0');
					return (
						<Box
							key={`${s.title}-${i}`}
							sx={{
								position: 'relative',
								height: '100%',
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden',
								borderRadius: '20px',
								bgcolor: '#ffffff',
								border: '1px solid rgba(15, 23, 42, 0.06)',
								boxShadow:
									'0 0 0 1px rgba(255,255,255,0.8) inset, 0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 40px -18px rgba(15, 23, 42, 0.12)',
								// Light hover only (no transform — avoids extra layout/paint)
								transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
								'&:hover': {
									borderColor: 'rgba(0, 82, 163, 0.12)',
									boxShadow:
										'0 0 0 1px rgba(255,255,255,0.9) inset, 0 2px 8px rgba(15, 23, 42, 0.05), 0 18px 36px -16px rgba(0, 82, 163, 0.14)',
								},
								'&::after': {
									content: '""',
									position: 'absolute',
									left: 0,
									top: 0,
									bottom: 0,
									width: 5,
									borderRadius: '12px 0 0 12px',
									background: 'linear-gradient(180deg, #0052a3 0%, #0066cc 50%, #38bdf8 100%)',
									opacity: 0.95,
								},
							}}>
							<Box
								sx={{
									position: 'relative',
									zIndex: 1,
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									pl: { xs: 2.5, sm: 3 },
									pr: { xs: 2.5, sm: 3.25 },
									py: { xs: 2.5, sm: 3 },
									pt: { xs: 2.75, sm: 3.25 },
								}}>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: { xs: 1.5, sm: 1.75 },
										pb: 2.25,
										mb: 2.25,
										borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
									}}>
									<Box
										aria-hidden
										sx={{
											flexShrink: 0,
											width: { xs: 40, sm: 44 },
											height: { xs: 40, sm: 44 },
											borderRadius: '12px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontFamily: "'Varela Round', 'Segoe UI', sans-serif",
											fontWeight: 700,
											fontSize: { xs: '0.8125rem', sm: '0.875rem' },
											letterSpacing: '0.06em',
											color: '#0c4a6e',
											bgcolor: 'rgba(240, 249, 255, 0.9)',
											border: '1px solid rgba(0, 82, 163, 0.12)',
											boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 14px -4px rgba(0, 82, 163, 0.2)',
										}}>
										{n}
									</Box>
									<Typography
										variant='h5'
										component='h2'
										sx={{
											flex: 1,
											fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif",
											fontWeight: 700,
											fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' },
											lineHeight: 1.3,
											letterSpacing: '-0.03em',
											color: '#0f172a',
											pt: { xs: 0.35, sm: 0.4 },
										}}>
										{s.title}
									</Typography>
								</Box>

								<Box
									sx={{
										flex: 1,
										borderRadius: '14px',
										bgcolor: 'rgba(248, 250, 252, 0.65)',
										border: '1px solid rgba(15, 23, 42, 0.045)',
										px: { xs: 2, sm: 2.25 },
										py: { xs: 2, sm: 2.25 },
										minHeight: 0,
									}}>
									<Box
										className={LP_SECTION_PROSE_CLASS}
										sx={proseSx}
										dangerouslySetInnerHTML={{ __html: sanitizeLandingPageHtml(s.body) }}
									/>
								</Box>
							</Box>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export default LandingPageCourseDetailSections;
