import { builder } from '@src/plugins/graphql/builder.js';

import { userProfilePolicy } from '../authorizers/user-profile.policy.js';

export const userProfileObjectType = builder.prismaObject('UserProfile', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.expose('userId', { type: 'Uuid' }),
    bio: t.exposeString('bio', { nullable: true }),
    birthDay: t.expose('birthDay', { nullable: true, type: 'Date' }),
    avatarId: t.expose('avatarId', { nullable: true, type: 'Uuid' }),
    twitterHandle: t.exposeString('twitterHandle', { nullable: true }),
    avatar: t.relation('avatar', {
      authorize: [userProfilePolicy.roles.owner.check],
      nullable: true,
    }),
    user: t.relation('user'),
  }),
});
