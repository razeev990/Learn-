import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { CELL_SIZE } from '../constants';
import { getInverseRotationAngle } from '../utils';
import { styles } from '../styles';

const BoardCells = React.memo(({ myColor }) => {
  const cells = useMemo(() => {
    const result = [];
    const inverseRot = getInverseRotationAngle(myColor);

    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (row < 6 && col < 6) continue;
        if (row < 6 && col > 8) continue;
        if (row > 8 && col < 6) continue;
        if (row > 8 && col > 8) continue;
        if (row >= 6 && row <= 8 && col >= 6 && col <= 8) continue;

        let bgColor = '#ffffff';
        if (row === 7 && col >= 1 && col <= 5) bgColor = '#ef4444';
        if (col === 7 && row >= 1 && row <= 5) bgColor = '#16a34a';
        if (row === 7 && col >= 9 && col <= 13) bgColor = '#eab308';
        if (col === 7 && row >= 9 && row <= 13) bgColor = '#2563eb';
        if (row === 6 && col === 1) bgColor = '#ef4444';
        if (row === 1 && col === 8) bgColor = '#16a34a';
        if (row === 8 && col === 13) bgColor = '#eab308';
        if (row === 13 && col === 6) bgColor = '#2563eb';

        const isStar = (row === 2 && col === 6) || (row === 6 && col === 12) || (row === 12 && col === 8) || (row === 8 && col === 2);
        let arrowIcon = '', arrowColor = '#000';
        if (row === 7 && col === 0) { arrowIcon = '➔'; arrowColor = '#ef4444'; }
        if (row === 0 && col === 7) { arrowIcon = '⬇'; arrowColor = '#16a34a'; }
        if (row === 7 && col === 14) { arrowIcon = '⬅'; arrowColor = '#eab308'; }
        if (row === 14 && col === 7) { arrowIcon = '⬆'; arrowColor = '#2563eb'; }

        const left = col * CELL_SIZE;
        const top = row * CELL_SIZE;

        result.push(
          <View key={`${row}-${col}`} style={[styles.cell, { left, top, backgroundColor: bgColor }]}>
            {isStar && <Text style={[styles.starCleanText, { transform: [{ rotate: inverseRot }] }]}>☆</Text>}
            {arrowIcon !== '' && <Text style={[styles.arrowCleanText, { color: arrowColor }]}>{arrowIcon}</Text>}
          </View>
        );
      }
    }
    return result;
  }, [myColor]);

  return <>{cells}</>;
});

export default BoardCells;
