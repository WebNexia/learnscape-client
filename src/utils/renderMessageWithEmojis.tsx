import emojiRegex from 'emoji-regex';

export const renderMessageWithEmojis = (message: string, fontSize: string) => {
	const regex = emojiRegex();
	const parts = message.split(regex); // Split the message based on where the emojis are
	const emojis = [...message.matchAll(regex)]; // Match all emojis

	return parts.reduce((acc: any[], part: string, index: number) => {
		if (part) {
			acc.push(
				<span key={`text-${index}`} style={{ fontSize: '0.85rem', verticalAlign: 'middle' }}>
					{part}
				</span>
			);
		}

		if (emojis[index]) {
			acc.push(
				<span key={`emoji-${index}`} style={{ fontSize: fontSize, verticalAlign: 'middle' }}>
					{emojis[index][0]}
				</span>
			);
		}

		return acc;
	}, []);
};
