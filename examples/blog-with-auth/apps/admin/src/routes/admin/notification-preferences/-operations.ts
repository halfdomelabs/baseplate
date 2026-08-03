import { graphql } from '@src/gql';

/**
 * Every declared category with the current user's resolved state.
 *
 * `isDefault` distinguishes "on because the project defaults it on" from "on
 * because this user chose it", which is what lets the page offer a reset.
 */
export const notificationPreferencesQuery = graphql(`
  query NotificationPreferences {
    notificationPreferences {
      key
      label
      mandatory
      channels {
        channel
        enabled
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
        mandatory
        channels {
          channel
          enabled
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
        mandatory
        channels {
          channel
          enabled
          isDefault
        }
      }
    }
  }
`);
