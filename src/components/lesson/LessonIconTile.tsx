import type { ComponentType } from 'react';
import { Box } from '@mui/material';
import {
	Chat,
	Draw,
	EditNote,
	Forum,
	MenuBook,
	Mic,
	MusicNote,
	Psychology,
	Rule,
	School,
	Translate,
	VideoLibrary,
} from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { isLessonIconKey, type LessonIconKey } from '../../constants/lessonIconOptions';

type MuiLessonIcon = ComponentType<SvgIconProps>;

const NEUTRAL_BG = '#9e9e9e';

const ICON_STYLE: Record<LessonIconKey, { Icon: MuiLessonIcon; bg: string }> = {
	none: { Icon: School, bg: NEUTRAL_BG },
	vocabulary: { Icon: MenuBook, bg: '#7b1fa2' },
	conversation: { Icon: Chat, bg: '#66bb6a' },
	true_false: { Icon: Rule, bg: '#ffa726' },
	fill_blanks: { Icon: EditNote, bg: '#42a5f5' },
	chunk_practice: { Icon: Psychology, bg: '#ec407a' },
	translate: { Icon: Translate, bg: '#26a69a' },
	slang_idioms: { Icon: Forum, bg: '#ff9800' },
	speaking: { Icon: Mic, bg: '#5e35b1' },
	writing: { Icon: Draw, bg: '#1565c0' },
	song: { Icon: MusicNote, bg: '#e91e63' },
	video_suggestion: { Icon: VideoLibrary, bg: '#3949ab' },
};

export function resolveLessonIconStyle(lessonIconKey?: string | null): { Icon: MuiLessonIcon; bg: string } {
	if (!lessonIconKey || !isLessonIconKey(lessonIconKey)) {
		return ICON_STYLE.none;
	}
	return ICON_STYLE[lessonIconKey];
}

interface LessonIconTileProps {
	lessonIconKey?: string | null;
	size?: 'small' | 'medium';
}

const SIZE_DIMS = {
	small: { box: 28, icon: 16 },
	medium: { box: 36, icon: 22 },
};

const LessonIconTile = ({ lessonIconKey, size = 'medium' }: LessonIconTileProps) => {
	const { Icon, bg } = resolveLessonIconStyle(lessonIconKey);
	const dim = SIZE_DIMS[size];

	return (
		<Box
			sx={{
				width: dim.box,
				height: dim.box,
				minWidth: dim.box,
				borderRadius: '0.35rem',
				bgcolor: bg,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
			}}>
			<Icon sx={{ color: '#fff', fontSize: dim.icon }} />
		</Box>
	);
};

export default LessonIconTile;
