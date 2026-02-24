import React from 'react';
import { Box, CircularProgress, Paper, Popper, Typography } from '@mui/material';
import theme from '../../themes';
import { WordAssistData } from '../../hooks/useWordAssist';

interface WordAssistPopperProps {
	open: boolean;
	anchorEl: HTMLElement | null;
	activeWord: string;
	wordInfo: WordAssistData | null;
	isLoadingWordInfo: boolean;
}

const WordAssistPopper: React.FC<WordAssistPopperProps> = ({ open, anchorEl, activeWord, wordInfo, isLoadingWordInfo }) => {
	const meaningsToRender =
		wordInfo?.meanings && wordInfo.meanings.length > 0
			? wordInfo.meanings
			: [
					{
						partOfSpeech: '',
						meaningEn: wordInfo?.meaningEn || 'Meaning unavailable.',
						meaningTr: wordInfo?.meaningTr || 'Anlam bulunamadi.',
					},
				];

	return (
		<Popper open={open} anchorEl={anchorEl} placement='top-start' sx={{ zIndex: 1700 }}>
			<Paper
				elevation={5}
				sx={{
					p: 2,
					maxWidth: 300,
					borderRadius: '0.75rem',
					background: 'rgba(255,255,255,0.95)',
					border: `1px solid ${theme.palette.secondary.main}33`,
				}}>
				{isLoadingWordInfo ? (
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
						<CircularProgress size={20} />
					</Box>
				) : (
					<>
						<Typography sx={{ fontFamily: theme.fontFamily?.main, fontSize: '0.9rem', fontWeight: 700, textTransform: 'capitalize' }}>
							{activeWord}
						</Typography>
						<Typography sx={{ mt: 0.5, fontFamily: theme.fontFamily?.main, fontSize: '0.78rem', color: theme.textColor?.secondary }}>
							Pronunciation: {wordInfo?.pronunciation || 'N/A'}
						</Typography>
						{meaningsToRender.map((meaning, index) => (
							<Box
								key={`${meaning.meaningEn}-${index}`}
								sx={{
									mt: index === 0 ? 0.65 : 0.8,
									pt: index === 0 ? 0.4 : 0.7,
									borderTop: index === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)',
								}}>
								<Typography sx={{ fontFamily: theme.fontFamily?.main, fontSize: '0.76rem', fontWeight: 600 }}>
									Meaning {index + 1}
									{meaning.partOfSpeech ? ` (${meaning.partOfSpeech})` : ''}
								</Typography>
								<Typography sx={{ mt: 0.25, fontFamily: theme.fontFamily?.main, fontSize: '0.78rem' }}>
									<span style={{ textDecoration: 'underline' }}>EN:</span> {meaning.meaningEn}
								</Typography>
								<Typography sx={{ mt: 0.35, fontFamily: theme.fontFamily?.main, fontSize: '0.78rem' }}>
									<span style={{ textDecoration: 'underline' }}>TR:</span> {meaning.meaningTr}
								</Typography>
							</Box>
						))}
					</>
				)}
			</Paper>
		</Popper>
	);
};

export default WordAssistPopper;
