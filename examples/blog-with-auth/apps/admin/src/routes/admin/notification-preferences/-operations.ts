import { graphql } from '@src/gql';

/**
 * Every declared topic with the current user's resolved state.
 *
 * `isDefault` distinguishes "immediate because the project defaults it on" from
 * "immediate because this user chose it", which is what lets the page offer a
 * reset. Types belonging to no topic are absent by construction — they consult
 * no preference, so there is nothing here to render.
 */
export const notificationPreferencesQuery = graphql(`
  query NotificationPreferences {
    notificationPreferences {
      key
      label
      description
      channels {
        channel
        mode
        digestWindowSeconds
        isDefault
      }
    }
  }
`);

/**
 * Both mutations return the full resolved list, so the page re-renders from
 * server state rather than recomputing the default-vs-override rule locally.
 */
export const setNotificationPreferenceMutation = graphql(`
  mutation SetNotificationPreference($input: SetNotificationPreferenceInput!) {
    setNotificationPreference(input: $input) {
      preferences {
        key
        label
        description
        channels {
          channel
          mode
          digestWindowSeconds
          isDefault
        }
      }
    }
  }
`);

export const clearNotificationPreferenceMutation = graphql(`
  mutation ClearNotificationPreference(
    $input: ClearNotificationPreferenceInput!
  ) {
    clearNotificationPreference(input: $input) {
      cleared
      preferences {
        key
        label
        description
        channels {
          channel
          mode
          digestWindowSeconds
          isDefault
        }
      }
    }
  }
`);
