import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const DraggableBlock = () => {
  const [numBlocks, setNumBlocks] = useState(0); // State to hold the random number of blocks
  const translateX = useSharedValue(0); // Tracks the x position of the whole block
  const translateY = useSharedValue(0); // Tracks the y position of the whole block
  const offsetX = useSharedValue(0); // Tracks the accumulated x offset
  const offsetY = useSharedValue(0); // Tracks the accumulated y offset

  // Function to generate a random number of blocks (between 1 and 9)
  const generateBlocks = () => Math.floor(Math.random() * 9) + 1;

  useEffect(() => {
    setNumBlocks(generateBlocks());
  }, []);

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Update the position with the current translation
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;
    })
    .onEnd(() => {
      // Store the final position as the new offset
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
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
      blocks.push(
        <View
          key={i}
          style={[
            styles.singleBlock,
            {
              marginRight: (i + 1) % 3 === 0 ? 0 : 5, // Add margin for grid alignment
              marginBottom: 5, // Add margin between rows
            },
          ]}
        />
      );
    }
    return blocks;
  };

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.blockContainer, animatedStyle]}>{renderBlocks()}</Animated.View>
    </GestureDetector>
  );
};

export default function App() {
  return (
    <View style={styles.container}>
      <DraggableBlock />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  blockContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Ensure blocks wrap to the next row
    width: 110, // Width of 3 blocks (including margins)
  },
  singleBlock: {
    width: 30,
    height: 30,
    backgroundColor: 'blue',
    borderWidth: 1,
    borderColor: 'white',
  },
});
