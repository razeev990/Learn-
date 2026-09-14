import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

export const PinToken = React.memo(({ colorHex, stackCount }) => (
  <View style={styles.pinWrapper}>
    {stackCount > 1 && <View style={styles.stackBadgeBubble}><Text style={styles.stackBadgeText}>{stackCount}</Text></View>}
    <View style={[styles.pinPedestalRing, { borderColor: colorHex }]}>
      <View style={[styles.pinHeadCircle, { backgroundColor: colorHex }]}>
        <View style={styles.pinWhiteInnerCore}><View style={[styles.pinDotCenter, { backgroundColor: colorHex }]} /></View>
      </View>
    </View>
  </View>
));
