import * as Haptics from 'expo-haptics';

let hapticsEnabled = true;

export const setHapticsEnabled = (enabled) => {
  hapticsEnabled = !!enabled;
};

export const isHapticsEnabled = () => hapticsEnabled;

export const haptics = {
  selection: () => {
    if (!hapticsEnabled) return;
    try { Haptics.selectionAsync(); } catch (e) {}
  },
  light: () => {
    if (!hapticsEnabled) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
  },
  medium: () => {
    if (!hapticsEnabled) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
  },
  heavy: () => {
    if (!hapticsEnabled) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
  },
  success: () => {
    if (!hapticsEnabled) return;
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  },
  warning: () => {
    if (!hapticsEnabled) return;
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
  },
  error: () => {
    if (!hapticsEnabled) return;
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
  },
};
