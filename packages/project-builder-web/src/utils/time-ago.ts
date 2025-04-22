import { makeIntlFormatter } from 'react-timeago/defaultFormatter';

const formatter = makeIntlFormatter({
  locale: 'en',
});

export const timeAgoFormatter: ReturnType<typeof makeIntlFormatter> = (
  ...args
) => {
  if (args[1] === 'second') {
    return 'Just now';
  }
  return formatter(...args);
};
