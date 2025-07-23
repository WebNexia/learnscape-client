# Security Documentation

## Input Sanitization Implementation

### Overview

This document outlines the security measures implemented in the LearnScape application, focusing on input sanitization and XSS prevention.

### Core Sanitization Components

#### 1. DOMPurify Configuration (`src/utils/sanitizeHtml.tsx`)

**HTML Sanitization (`sanitizeHtml` function):**

- **Allowed Tags**: `['b', 'strong', 'i', 'em', 'u', 'a', 'p', 'br', 'div', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']`
- **Allowed Attributes**: `['href', 'title', 'class']`
- **Forbidden Tags**: `['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button']`
- **Forbidden Attributes**: `['onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'style']`
- **Security Options**: `KEEP_CONTENT: true`, `RETURN_DOM: false`, `RETURN_DOM_FRAGMENT: false`, `RETURN_TRUSTED_TYPE: false`

**Text Input Sanitization (`sanitizeTextInput` function):**

- Removes ALL HTML tags and attributes
- Type validation for input parameters (`typeof text !== 'string'`)
- Returns empty string for invalid inputs
- Enhanced with `FORBID_TAGS: ['*']` and `FORBID_ATTR: ['*']` for maximum security

**Email Input Sanitization (`sanitizeEmailInput` function):**

- Removes ALL HTML tags and attributes
- Type validation for input parameters
- Preserves email characters during typing (format validation should be done on form submission)
- Returns sanitized input without blocking partial email addresses

**Input Length Validation (`validateInputLength` function):**

- Validates input length against specified maximum
- Truncates input if it exceeds maximum length
- Type validation for parameters
- Integrates with sanitization functions

#### 2. CustomTextField Component (`src/components/forms/customFields/CustomTextField.tsx`)

**Security Features:**

- **Input Type Validation**: Validates and normalizes input types to prevent manipulation
- **Event Object Validation**: Validates event objects before processing to prevent crashes
- **Type-Specific Sanitization**: Different sanitization rules for different input types
- **Length Validation Integration**: Automatically applies length limits to sanitized content
- **Performance Optimization**: Uses `useCallback` to prevent unnecessary re-renders
- **Configurable Sanitization**: `disableSanitization` prop for edge cases

**Sanitized Input Types:**

- `text` - General text input (default)
- `email` - Email addresses with format validation
- `search` - Search queries
- `url` - URL inputs
- `password` - Password fields (preserves special characters)

**Non-Sanitized Input Types:**

- `number` - Numeric inputs (validated separately with `!isNaN(Number(value))`)

**Security Improvements Made:**

1. **Enhanced Type Validation**:

   ```tsx
   // Before: No type validation
   type?: string;

   // After: Comprehensive type validation
   type = 'text',
   const validatedType = typeof type === 'string' ? type.toLowerCase() : 'text';
   ```

2. **Event Object Security**:

   ```tsx
   // Before: No event validation
   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {

   // After: Comprehensive event validation
   if (!e || !e.target || typeof e.target.value !== 'string') {
     console.warn('Invalid input event detected');
     return;
   }
   ```

3. **Length Validation Integration**:

   ```tsx
   // New feature: Automatic length validation
   const maxLength = InputProps?.inputProps?.maxLength;
   if (maxLength && typeof maxLength === 'number') {
   	sanitizedValue = validateInputLength(sanitizedValue, maxLength);
   }
   ```

4. **Number Input Security**:

   ```tsx
   // Enhanced number validation with regex
   if (validatedType === 'number') {
   	const numValue = e.target.value;
   	// Allow empty string, valid numbers, decimal points, negative signs, and scientific notation
   	const numberRegex = /^[+-]?(\d*\.?\d*)([eE][+-]?\d*)?$/;
   	if (numValue === '' || numberRegex.test(numValue)) {
   		onChange(e);
   	}
   }
   ```

### Security Best Practices

#### 1. Input Validation

- Always validate input types before processing
- Use appropriate sanitization for different input types
- Implement length limits for all text inputs
- Validate email formats server-side as well
- Validate event objects to prevent crashes

#### 2. XSS Prevention

- Never use `dangerouslySetInnerHTML` without sanitization
- Always sanitize user-generated content before rendering
- Use DOMPurify for all HTML content sanitization
- Block all event handler attributes
- Block inline styles to prevent CSS-based attacks

#### 3. Component Usage

- Use `CustomTextField` for all text inputs
- Avoid raw HTML input elements
- Set appropriate `maxLength` for all inputs
- Use `disableSanitization` sparingly and only when necessary
- Validate input types and event objects

### Known Security Issues and Fixes

#### 1. Fixed Issues

- ✅ **Conflicting style attribute configuration** in DOMPurify
- ✅ **Missing input type validation** - Added comprehensive type checking
- ✅ **Incomplete event object validation** - Added event object security checks
- ✅ **Missing length validation integration** - Added automatic length validation
- ✅ **Inconsistent sanitization logic** - Standardized sanitization approach
- ✅ **Missing number input validation** - Added numeric validation
- ✅ **Performance issues** - Added useCallback optimization
- ✅ **Dailymotion video playback** - Added comprehensive Dailymotion support across all video components

#### 2. Remaining Considerations

- ⚠️ Some components still use raw `<textarea>` elements (FlipCard components)
- ⚠️ Server-side validation should complement client-side
- ⚠️ Rate limiting for rapid input changes not implemented
- ⚠️ Character set validation could be enhanced
- ⚠️ Consider adding Content Security Policy (CSP) headers
- ⚠️ HTML entity decoding should be applied consistently across all components
- ⚠️ Video URL validation and formatting should be standardized across all video components

### Usage Examples

#### Basic Text Input

```tsx
<CustomTextField
	label='Name'
	value={name}
	onChange={(e) => setName(e.target.value)}
	InputProps={{
		inputProps: { maxLength: 50 },
	}}
/>
```

#### Email Input with Validation

```tsx
<CustomTextField
	label='Email'
	type='email'
	value={email}
	onChange={(e) => setEmail(e.target.value)}
	InputProps={{
		inputProps: { maxLength: 254 },
	}}
/>
```

#### Number Input with Validation

```tsx
<CustomTextField
	label='Age'
	type='number'
	value={age}
	onChange={(e) => setAge(e.target.value)}
	InputProps={{
		inputProps: { min: 0, max: 120 },
	}}
/>
```

#### Disabled Sanitization (Use with extreme caution)

```tsx
<CustomTextField
	label='Special Input'
	value={value}
	onChange={(e) => setValue(e.target.value)}
	disableSanitization={true} // Only use when absolutely necessary
/>
```

### Testing Security

#### Manual Testing

1. Try injecting HTML tags in text inputs: `<script>alert('xss')</script>`
2. Test XSS payloads in various input fields: `javascript:alert('xss')`
3. Verify email format validation: `invalid-email@`
4. Test input length limits: Enter text longer than maxLength
5. Check event handler injection attempts: `onclick="alert('xss')"`
6. Test type manipulation: Try changing input type dynamically
7. Test malformed events: Pass null or undefined to onChange

#### Automated Testing

- Implement unit tests for sanitization functions
- Add integration tests for form components
- Test edge cases and malformed inputs
- Verify sanitization bypass attempts
- Test type validation and normalization
- Test event object validation
- Test length validation integration

### Security Attack Vectors Prevented

#### 1. XSS Attacks

- **HTML Injection**: Blocked by DOMPurify tag filtering
- **JavaScript Injection**: Blocked by forbidden attributes
- **CSS Injection**: Blocked by forbidden style attributes
- **Event Handler Injection**: Blocked by forbidden on\* attributes

#### 2. Input Manipulation

- **Type Manipulation**: Prevented by type validation
- **Event Object Tampering**: Prevented by event validation
- **Length Bypass**: Prevented by length validation integration
- **Character Encoding Attacks**: Mitigated by comprehensive sanitization

#### 3. Performance Attacks

- **Memory Exhaustion**: Prevented by length limits
- **CPU Exhaustion**: Mitigated by input validation
- **DOM Pollution**: Prevented by sanitization

### Maintenance

#### Regular Security Updates

- Keep DOMPurify updated to latest version
- Monitor security advisories for dependencies
- Review and update allowed/forbidden tags/attributes
- Test sanitization with new attack vectors
- Update type validation as new input types are added

#### Code Review Checklist

- [ ] All text inputs use `CustomTextField`
- [ ] No raw HTML input elements
- [ ] Appropriate `maxLength` set for all inputs
- [ ] `disableSanitization` used only when absolutely necessary
- [ ] Server-side validation complements client-side
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Input types are validated and normalized
- [ ] Event objects are validated before processing
- [ ] Length validation is integrated with sanitization

#### Security Monitoring

- Monitor console warnings for invalid input events
- Log sanitization bypass attempts
- Track input validation failures
- Monitor for new attack vectors

### Video URL Handling

#### Platform Support

- **YouTube**: Full support via ReactPlayer with proper configuration
- **Vimeo**: Full support via ReactPlayer with proper configuration
- **Dailymotion**: Full support via dedicated iframe player (ReactPlayer doesn't support Dailymotion)
- **Twitch**: Full support via ReactPlayer with proper configuration
- **Direct Video Files**: Support for .mp4, .webm, .ogg, .mov, .avi, .mkv files

#### Security Measures

- **URL Validation**: Comprehensive validation for video URLs including hosting services
- **Universal Video Player**: Created UniversalVideoPlayer component for consistent cross-platform support
- **Dailymotion Support**: Dedicated DailymotionPlayer component using iframe for proper playback
- **ReactPlayer Integration**: Proper configuration for YouTube, Vimeo, and other supported platforms
- **Error Handling**: Graceful fallbacks for invalid or inaccessible URLs
- **Component Updates**: Updated all video components (QuestionMedia, LessonPage, LessonImageCourseDisplay, etc.) to support Dailymotion

#### Components Updated

- ✅ **VideoThumbnail**: Upload form video preview
- ✅ **QuestionMedia**: Question video display
- ✅ **LessonPage**: Lesson video playback
- ✅ **LessonImageCourseDisplay**: Lesson video thumbnails and dialogs
- ✅ **QuestionDialogContentNonEdit**: Question preview dialogs

### Emergency Contacts

- Security issues should be reported immediately
- Contact development team for urgent security fixes
- Document all security incidents and resolutions
- Review security measures after any security incidents
