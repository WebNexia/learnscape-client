import { Editor } from '@tinymce/tinymce-react';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';
import { BlankValuePair } from '../../interfaces/question';
import { useContext, useEffect, useRef, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface TinyMceEditorProps {
	handleEditorChange: (content: string) => void;
	initialValue?: string;
	// value?: string;
	height?: string | number | undefined;
	blankValuePairs?: BlankValuePair[];
	setBlankValuePairs?: React.Dispatch<React.SetStateAction<BlankValuePair[]>>;
	editorId?: string;
	editorRef?: React.MutableRefObject<any>;
	isFITB?: boolean;
}

const TinyMceEditor = ({
	handleEditorChange,
	initialValue,
	// value,
	height = 300,
	blankValuePairs,
	setBlankValuePairs,
	editorId,
	editorRef,
	isFITB = false,
}: TinyMceEditorProps) => {
	const apiKey = import.meta.env.VITE_TINY_MCE_API_KEY;
	const [internalBlankValuePairs, setInternalBlankValuePairs] = useState<BlankValuePair[]>(blankValuePairs || []);
	const blankCounterRef = useRef<number>(internalBlankValuePairs.length);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);

	// If external blankValuePairs are provided, use them, otherwise use internal state
	const effectiveBlankValuePairs = blankValuePairs || internalBlankValuePairs;
	const effectiveSetBlankValuePairs = setBlankValuePairs || setInternalBlankValuePairs;

	useEffect(() => {
		// Update the blank counter when blankValuePairs change
		blankCounterRef.current = effectiveBlankValuePairs.length;
	}, [effectiveBlankValuePairs]);

	useEffect(() => {
		if (editorRef?.current) {
			const editor = editorRef.current;

			if (isFITB) {
				handleWordClick(editor); // Attach event if isFITB is true
			} else {
				editor.off('click'); // Detach event if isFITB is false
			}
		}
	}, [isFITB]);

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
		const cleanedContent = content.replace(/&nbsp;/g, ' ');

		handleEditorChange(cleanedContent);

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
			// {...(value !== undefined ? { value } : {})}
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
					'lists bullist numlist link image media charmap print preview media searchreplace visualblocks code fullscreen insertdatetime table paste code help wordcount fontfamily',
				toolbar:
					'undo redo | fontfamily fontsize | formatselect | bold italic underline strikethrough subscript superscript | forecolor backcolor | image | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | code',
				font_family_formats:
					'Arial=arial,helvetica,sans-serif; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier,monospace; Georgia=georgia,palatino,serif; Lucida=Lucida Sans Unicode, Lucida Grande,sans-serif; Roboto=Roboto,sans-serif; Times New Roman=times new roman,times,serif; Verdana=verdana,geneva,sans-serif;',
				content_style: `
					body {
						font-size: ${isSmallScreen || isRotatedMedium ? '14px' : '16px'};
					}
				`,
				image_title: true,
				automatic_uploads: false,
				file_picker_types: 'image',
				file_picker_callback: function (callback) {
					const url = prompt('Enter Image URL:');
					if (url) {
						callback(url, { alt: '' });
					}
				},
				branding: false,
				paste_preprocess: function (_, args) {
					// Replace &nbsp; with a regular space in the pasted content
					args.content = args.content.replace(/&nbsp;/g, ' ');
				},
				setup: (editor) => {
					if (editorRef && typeof editorRef === 'object') {
						editorRef.current = editor;
					}
					if (isFITB) {
						handleWordClick(editor);
					}
				},
			}}
			onEditorChange={(content) => {
				if (isFITB) {
					handleEditorChangeInternal(content);
				} else {
					handleEditorChange(content);
				}
			}}
		/>
	);
};

export default TinyMceEditor;
