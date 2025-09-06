import emojiRegex from 'emoji-regex';

export const renderMessageWithEmojis = (messageContent: string | any[], fontSize: string, isMobileSize: boolean) => {
	// Add defensive programming to handle undefined or null messageContent
	if (!messageContent) {
		return [];
	}

	const regex = emojiRegex();

	// Helper function to split and render text with emojis
	const renderTextWithEmojis = (text: string) => {
		const parts = text.split(regex);
		const emojis = [...text.matchAll(regex)];

		return (
			parts?.reduce((acc: any[], part: string, index: number) => {
				if (part) {
					acc.push(
						<span key={`text-${index}`} style={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', verticalAlign: 'middle' }}>
							{part}
						</span>
					);
				}
				if (emojis?.[index]) {
					acc.push(
						<span key={`emoji-${index}`} style={{ fontSize: fontSize, verticalAlign: 'middle' }}>
							{emojis[index][0]}
						</span>
					);
				}
				return acc;
			}, []) || []
		);
	};

	// If content is a string, process it normally
	if (typeof messageContent === 'string') {
		return renderTextWithEmojis(messageContent);
	}

	// If content is an array of React elements, iterate and apply emoji rendering on text elements only
	return (
		messageContent?.map((item, _) => {
			if (typeof item === 'string') {
				return renderTextWithEmojis(item);
			} else {
				return item; // Return any non-string elements as-is (e.g., <Link> elements for mentions)
			}
		}) || []
	);
};
