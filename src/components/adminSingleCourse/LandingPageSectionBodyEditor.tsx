import { useRef, useState } from 'react';
import TinyMceEditor from '../richTextEditor/TinyMceEditor';

type Props = {
	editorId: string;
	maxLength: number;
	/** HTML when this instance mounted (parent passes `section.body`; instance resets only when `key` / rowKey changes). */
	seedHtml: string;
	onHtmlChange: (html: string) => void;
};

/**
 * Isolated TinyMCE for LP detail sections: mirrors AdminLessonEditPage (local state + value prop).
 * Avoids tying `initialValue` to live parent `section.body` updates, which resets the caret.
 */
export default function LandingPageSectionBodyEditor({ editorId, maxLength, seedHtml, onHtmlChange }: Props) {
	const initialSnapshot = useRef(seedHtml ?? '');
	const [html, setHtml] = useState(() => seedHtml ?? '');

	return (
		<TinyMceEditor
			editorId={editorId}
			height={280}
			maxLength={maxLength}
			initialValue={initialSnapshot.current}
			value={html}
			handleEditorChange={(content) => {
				const trimmed = content.length > maxLength ? content.slice(0, maxLength) : content;
				setHtml(trimmed);
				onHtmlChange(trimmed);
			}}
		/>
	);
}
