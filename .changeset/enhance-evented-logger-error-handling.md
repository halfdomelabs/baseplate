---
'@baseplate-dev/sync': patch
---

Enhance evented logger with Pino-style error handling and flexible message patterns

- Add error serialization following Pino patterns (type, message, stack, cause, custom properties)
- Support flexible message patterns: `logger.error(error)`, `logger.info({ message: 'text', userId: 123 })`, `logger.info({ msg: 'text' })`
- Support message priority: string arg > obj.message > obj.msg > error.message > ''
- Remove console logging from logger core (now pure event emitter)
- Maintain full backward compatibility with existing string-based logging
