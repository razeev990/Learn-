import * as Haptics from 'expo-haptics';

export const haptics = {
  // Very light tap - token movement
  selection: () => {
    try { Haptics.selectionAsync(); } catch (e) {}
  },
  // Light tap
  light: () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
  },
  // Medium buzz - dice roll
  medium: () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
  },
  // Heavy buzz - capture
  heavy: () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
  },
  // Success notification (double-tap pattern on iOS)
  success: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  },
  // Warning notification
  warning: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
  },
  // Error notification
  error: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
  },
};
