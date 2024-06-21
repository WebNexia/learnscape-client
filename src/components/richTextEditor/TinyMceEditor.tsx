import { Editor } from '@tinymce/tinymce-react';

interface TinyMceEditorProps {
	handleEditorChange: (content: string) => void;
	initialValue: string;
	height?: string | number | undefined;
}

const TinyMceEditor = ({ handleEditorChange, initialValue, height = 300 }: TinyMceEditorProps) => {
	const apiKey = import.meta.env.VITE_TINY_MCE_API_KEY;

	return (
		<Editor
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
					view: {
						title: 'View',
						items: 'preview fullscreen',
					},
					insert: {
						title: 'Insert',
						items: 'pageembed inserttable | charmap hr | insertdatetime',
					},
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
			}}
			onEditorChange={handleEditorChange}
		/>
	);
};

export default TinyMceEditor;
