import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

export const TurnTimer = React.memo(({ active, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!active) return;
    setTimeLeft(30);
    let pendingTimeout = null;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          pendingTimeout = setTimeout(() => {
            if (onTimeoutRef.current) onTimeoutRef.current();
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      if (pendingTimeout) clearTimeout(pendingTimeout);
    };
  }, [active]);

  if (!active) return null;
  return (
    <View style={[styles.targetGapTimerBadge, timeLeft <= 10 && styles.timerDangerPulse]}>
      <Text style={styles.targetGapTimerText}>⏱️ {timeLeft}s</Text>
    </View>
  );
});
