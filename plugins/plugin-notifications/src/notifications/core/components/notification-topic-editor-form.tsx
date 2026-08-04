import type { Control } from 'react-hook-form';

import {
  Button,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

import type {
  NotificationsPluginDefinitionInput,
  NotificationTopicInput,
} from '../schema/plugin-definition.js';

import { notificationTopicEntityType } from '../schema/plugin-definition.js';
import { NotificationTopicDialog } from './notification-topic-dialog.js';

/** Renders a topic's per-channel defaults as "channel: mode" pairs. */
function describeDefaults(
  defaults: NotificationTopicInput['defaults'],
): string {
  const described = Object.entries(defaults ?? {})
    .map(([channel, setting]) =>
      setting.mode === 'off' ? undefined : `${channel}: ${setting.mode}`,
    )
    .filter((entry) => entry !== undefined);
  return described.length > 0 ? described.join(', ') : 'None';
}

interface Props {
  className?: string;
  control: Control<NotificationsPluginDefinitionInput>;
}

function NotificationTopicEditorForm({
  className,
  control,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { append, update, remove } = useFieldArray({
    control,
    name: 'topics',
  });
  const [topicToEdit, setTopicToEdit] = useState<
    NotificationTopicInput | undefined
  >();
  const [isEditing, setIsEditing] = useState(false);

  const topics = useWatch({ control, name: 'topics' });

  function handleSaveTopic(newTopic: NotificationTopicInput): void {
    const existingIndex = topics.findIndex((topic) => topic.id === newTopic.id);
    if (existingIndex === -1) {
      append(newTopic);
    } else {
      update(existingIndex, newTopic);
    }
  }

  function handleDeleteTopic(topicIdx: number): void {
    const topic = topics[topicIdx];
    if (!topic) return;
    requestConfirm({
      title: 'Delete Topic',
      content: `Are you sure you want to delete the notification topic "${topic.key}"? Any notification type declaring it will stop compiling, and existing preference rows for it will be ignored.`,
      onConfirm: () => {
        remove(topicIdx);
      },
    });
  }

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Topics</SectionListSectionTitle>
        <SectionListSectionDescription>
          The buckets notification types are grouped under. These are the rows a
          user sees on their notification settings page, and the unit their
          preferences are stored against. A type belonging to no topic consults
          no preference and cannot be silenced.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="notifications:space-y-4">
        {topics.map((topic, topicIdx) => (
          <RecordView key={topic.id}>
            <RecordViewItemList>
              <RecordViewItem title="Key">{topic.key}</RecordViewItem>
              <RecordViewItem title="Label">{topic.label}</RecordViewItem>
              <RecordViewItem title="Default Delivery">
                {describeDefaults(topic.defaults)}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                aria-label="Edit notification topic"
                onClick={() => {
                  setTopicToEdit(topic);
                  setIsEditing(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                aria-label="Delete notification topic"
                // At least one topic must survive: the generated key union
                // would otherwise be `never`, which no type can satisfy.
                disabled={topics.length <= 1}
                onClick={() => {
                  handleDeleteTopic(topicIdx);
                }}
              >
                Delete
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <NotificationTopicDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          topic={topicToEdit}
          isNew={
            topicToEdit
              ? !topics.some((topic) => topic.id === topicToEdit.id)
              : true
          }
          onSave={handleSaveTopic}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setTopicToEdit({
              id: notificationTopicEntityType.generateNewId(),
              key: '',
              label: '',
              defaults: { inApp: { mode: 'immediate' } },
            });
            setIsEditing(true);
          }}
        >
          Add Topic
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

export default NotificationTopicEditorForm;
