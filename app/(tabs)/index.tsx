import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type DraggableBlockProps = {
  isStatic: boolean;
  onSnap?: (dynamicTranslateX: Animated.SharedValue<number>, dynamicTranslateY: Animated.SharedValue<number>) => void;
  numBlocks: number;
  initialOffsetY: number;
};

const generateBlocks = (): number => Math.floor(Math.random() * 9) + 1;

const DraggableBlock: React.FC<DraggableBlockProps> = ({ isStatic, onSnap, numBlocks, initialOffsetY }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(initialOffsetY);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(initialOffsetY);

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!isStatic) {
        translateX.value = offsetX.value + event.translationX;
        translateY.value = offsetY.value + event.translationY;
      }
    })
    .onEnd(() => {
      if (!isStatic) {
        offsetX.value = translateX.value;
        offsetY.value = translateY.value;

        if (onSnap) {
          runOnJS(onSnap)(translateX, translateY);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const renderBlocks = () => {
    const blocks = [];
    for (let i = 0; i < numBlocks; i++) {
      blocks.push(<View key={i} style={styles.singleBlock} />);
    }
    return blocks;
  };

  const view = (
    <Animated.View style={[styles.blockContainer, animatedStyle]}>{renderBlocks()}</Animated.View>
  );

  return isStatic ? view : <GestureDetector gesture={dragGesture}>{view}</GestureDetector>;
};

const App: React.FC = () => {
  const [staticBlocks, setStaticBlocks] = useState<number>(2);
  const [dynamicBlocks, setDynamicBlocks] = useState<number>(generateBlocks());

  const staticX = useSharedValue(0);
  const staticY = useSharedValue(200);

  const snapThreshold = 40; // Half a centimeter (~40 pixels on average screen DPI)

  const handleSnap = (
    dynamicTranslateX: Animated.SharedValue<number>,
    dynamicTranslateY: Animated.SharedValue<number>
  ) => {
    // Calculate the edges of the snap zone based on the static block's position and size
    const staticLeftEdge = staticX.value - snapThreshold - 90;
    const staticRightEdge = staticX.value + 90 + snapThreshold; // 90 is the width of 3 blocks
    const staticTopEdge = staticY.value - snapThreshold - 90;
    const staticBottomEdge = staticY.value + 30 * staticBlocks + snapThreshold; // 30 is block height

    const isWithinSnapZone =
      dynamicTranslateX.value >= staticLeftEdge &&
      dynamicTranslateX.value <= staticRightEdge &&
      dynamicTranslateY.value >= staticTopEdge &&
      dynamicTranslateY.value <= staticBottomEdge;

    if (isWithinSnapZone) {
      dynamicTranslateX.value = withTiming(staticX.value, { duration: 200 });
      dynamicTranslateY.value = withTiming(staticY.value + staticBlocks * 30, { duration: 200 }); // Stack below the existing static blocks
      runOnJS(() => {
        setStaticBlocks((prev) => prev + dynamicBlocks);
        setDynamicBlocks(0);
      })();
    }
  };

  return (
    <View style={styles.container}>
      <DraggableBlock isStatic={true} numBlocks={staticBlocks} initialOffsetY={200} />
      {dynamicBlocks > 0 && (
        <DraggableBlock
          isStatic={false}
          onSnap={handleSnap}
          numBlocks={dynamicBlocks}
          initialOffsetY={50}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  blockContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: 120, // Adjust width for larger grids
    height: 'auto',
  },
  singleBlock: {
    width: 30,
    height: 30,
    backgroundColor: 'blue',
    borderWidth: 1,
    borderColor: 'white',
  },
});

export default App;
