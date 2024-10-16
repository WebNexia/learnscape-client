export const enum AuthForms {
	SIGN_IN = 'sign_in',
	SIGN_UP = 'sign_up',
	RESET = 'reset',
}

export const enum TextFieldTypes {
	EMAIL = 'email',
	PASSWORD = 'password',
	TEXT = 'text',
}

export const enum AuthFormErrorMessages {
	EMAIL_EXISTS = 'This email address is already in use!',
	INVALID_CREDENTIALS = 'Invalid email address or password',
	USERNAME_EXISTS = 'Username is already taken',
	EMAIL_NOT_VERIFIED = 'Email is not verified',
	UNKNOWN_ERROR_OCCURRED = 'An unknown error occurred',
	PASSWORD_TOO_SHORT = 'Password must be at least 6 characters long',
	PASSWORD_NO_LETTER = 'Password must contain at least one letter',
	// PASSWORD_NO_UPPERCASE = 'Password must contain at least one uppercase letter.',
	// PASSWORD_NO_LOWERCASE = 'Password must contain at least one lowercase letter.',
	PASSWORD_NO_NUMBER = 'Password must contain at least one number',
	// PASSWORD_NO_SPECIAL_CHAR = 'Password must contain at least one special character.',
	NETWORK_ERROR = 'Network error occurred. Please check your internet connection and try again.',
}

export const enum PasswordUpdateErrorMessages {
	PASSWORD_TOO_SHORT = 'Password must be at least 6 characters long',
	PASSWORD_NO_LETTER = 'Password must contain at least one letter',
	// PASSWORD_NO_UPPERCASE = 'Password must contain at least one uppercase letter.',
	// PASSWORD_NO_LOWERCASE = 'Password must contain at least one lowercase letter.',
	PASSWORD_NO_NUMBER = 'Password must contain at least one number',
	PASSWORDS_DO_NOT_MATCH = 'Passwords do not match',
	INVALID_CURRENT_PASSWORD = 'Invalid current password',
	SAME_PASSWORD = 'Enter a different password',
	// PASSWORD_NO_SPECIAL_CHAR = 'Password must contain at least one special character.',
}

export const enum Mode {
	DARK_MODE = 'dark',
	LIGHT_MODE = 'light',
}

export const enum PageName {
	ADMIN_DASHBOARD = 'Dashboard',
	ADMIN_USERS = 'Users',
	ADMIN_COURSES = 'Courses',
	ADMIN_LESSONS = 'Lessons',
	ADMIN_QUESTIONS = 'Questions',
	ADMIN_DOCUMENTS = 'Documents',
	ADMIN_SCHEDULE = 'Schedule',
	ADMIN_MESSAGES = 'Messages',
	ADMIN_COMMUNITY = 'Community',
	ADMIN_SETTINGS = 'Settings',
	ADMIN_QUIZ_SUBMISSIONS = 'Submissions',
	DASHBOARD = 'Dashboard',
	COURSES = 'Courses',
	SUBMISSIONS = 'Submissions',
	SCHEDULE = 'Schedule',
	MESSAGES = 'Messages',
	COMMUNITY = 'Community',
	SETTINGS = 'Settings',
}

export const enum Roles {
	ADMIN = 'admin',
	USER = 'learner',
}

export const enum QuestionType {
	MULTIPLE_CHOICE = 'Multiple Choice',
	OPEN_ENDED = 'Open-ended',
	TRUE_FALSE = 'True-False',
	FLIP_CARD = 'Flip Card',
	AUDIO_VIDEO = 'Audio/Video',
	MATCHING = 'Matching',
	FITB_TYPING = 'FITB-Typing',
	FITB_DRAG_DROP = 'FITB-Drag/Drop',
}

export const enum LessonType {
	INSTRUCTIONAL_LESSON = 'Instructional Lesson',
	PRACTICE_LESSON = 'Practice Lesson',
	QUIZ = 'Quiz',
}

export const enum NotificationType {
	QUIZ_SUBMISSION = 'QuizSubmission',
	MESSAGE_RECEIVED = 'MessageReceived',
	REPORT_TOPIC = 'ReportTopic',
	REPORT_MESSAGE = 'ReportMessage',
	REPLY_TO_COMMUNITY_MESSAGE = 'ReplyToCommunityMessage',
	REPLY_TO_COMMUNITY_TOPIC = 'ReplyToCommunityTopic',
	NEW_COMMUNITY_TOPIC = 'NewCommunityTopic',
	MENTION_USER = 'MentionUser',
	COMMUNITY_NOTIFICATION = 'CommunityNotification',
	ADD_TO_EVENT = 'AddToEvent',
}
