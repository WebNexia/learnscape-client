import { Editor } from '@tinymce/tinymce-react';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';
import { BlankValuePair } from '../../interfaces/question';
import { useEffect, useRef, useState } from 'react';

interface TinyMceEditorProps {
	handleEditorChange: (content: string) => void;
	initialValue: string;
	height?: string | number | undefined;
	blankValuePairs?: BlankValuePair[];
	setBlankValuePairs?: React.Dispatch<React.SetStateAction<BlankValuePair[]>>;
	editorId?: string;
	editorRef?: React.MutableRefObject<any>;
}

const TinyMceEditor = ({
	handleEditorChange,
	initialValue,
	height = 300,
	blankValuePairs,
	setBlankValuePairs,
	editorId,
	editorRef,
}: TinyMceEditorProps) => {
	const apiKey = import.meta.env.VITE_TINY_MCE_API_KEY;
	const [internalBlankValuePairs, setInternalBlankValuePairs] = useState<BlankValuePair[]>(blankValuePairs || []);
	const blankCounterRef = useRef<number>(internalBlankValuePairs.length);

	// If external blankValuePairs are provided, use them, otherwise use internal state
	const effectiveBlankValuePairs = blankValuePairs || internalBlankValuePairs;
	const effectiveSetBlankValuePairs = setBlankValuePairs || setInternalBlankValuePairs;

	useEffect(() => {
		// Update the blank counter when blankValuePairs change
		blankCounterRef.current = effectiveBlankValuePairs.length;
	}, [effectiveBlankValuePairs]);

	const handleWordClick = (editor: any) => {
		editor.on('click', (_: MouseEvent) => {
			const selectedText = editor.selection.getContent({ format: 'text' }).trim();
			if (selectedText) {
				const blankId = generateUniqueId('blank-value-');
				const newBlankNumber = blankCounterRef.current + 1;

				const newBlank = {
					id: blankId,
					blank: newBlankNumber,
					value: selectedText,
				};

				effectiveSetBlankValuePairs((prevData) => {
					const newData = [...prevData, newBlank];
					blankCounterRef.current = newData.length;
					return newData;
				});

				editor.selection.setContent(`(___${newBlankNumber}___)`);
			}
		});
	};

	const handleEditorChangeInternal = (content: string) => {
		handleEditorChange(content);

		effectiveSetBlankValuePairs((prevData) => {
			let updatedBlankValuePairs: BlankValuePair[] = [];

			let currentIndex = 1;
			const newContent = content.replace(/\(___(\d+)___\)/g, (_, oldBlankNumber) => {
				const pair = prevData.find((p) => p.blank === parseInt(oldBlankNumber, 10));
				if (pair) {
					const newPlaceholder = `(___${currentIndex}___)`;
					updatedBlankValuePairs.push({ ...pair, blank: currentIndex });
					currentIndex++;
					return newPlaceholder;
				}
				return _; // Return the matched string unchanged if no pair is found
			});

			if (editorRef?.current && newContent !== content) {
				const currentSelection = editorRef.current.selection.getBookmark(2);
				editorRef.current.setContent(newContent);
				editorRef.current.selection.moveToBookmark(currentSelection);
			}

			return updatedBlankValuePairs;
		});
	};

	return (
		<Editor
			id={editorId}
			apiKey={apiKey}
			initialValue={initialValue}
			init={{
				height: height,
				width: '100%',
				icons: 'thin',
				menubar: 'edit view insert format tools table',
				statusbar: false,
				menu: {
					edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace' },
					view: { title: 'View', items: 'preview fullscreen' },
					insert: { title: 'Insert', items: 'pageembed inserttable | charmap hr | insertdatetime' },
					format: {
						title: 'Format',
						items:
							'bold italic underline strikethrough superscript subscript codeformat | styles blocks fontsize align lineheight | forecolor backcolor | language | removeformat',
					},
					tools: { title: 'Tools', items: 'wordcount' },
					table: { title: 'Table', items: 'inserttable | cell row column | advtablesort | tableprops deletetable' },
				},
				plugins:
					'lists bullist numlist link image media charmap print preview media searchreplace visualblocks code fullscreen insertdatetime table paste code help wordcount',
				toolbar:
					'undo redo | formatselect | bold italic underline strikethrough subscript superscript | forecolor backcolor | \
                          alignleft aligncenter alignright alignjustify | \
                          bullist numlist outdent indent | removeformat',
				setup: (editor) => {
					if (editorRef && typeof editorRef === 'object') {
						editorRef.current = editor;
					}
					handleWordClick(editor);
				},
			}}
			onEditorChange={handleEditorChangeInternal}
		/>
	);
};

export default TinyMceEditor;
