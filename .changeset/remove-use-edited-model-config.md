---
'@baseplate-dev/project-builder-web': patch
---

Replace `useEditedModelConfig` Zustand store with direct `useWatch` calls and lightweight `useOriginalModel` context hook for more reliable form state synchronization
