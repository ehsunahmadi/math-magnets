import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type DraggableBlockProps = {
  isStatic: boolean;
  onSnap?: (dynamicTranslateX: SharedValue<number>, dynamicTranslateY: SharedValue<number>) => void;
  numBlocks: number;
  initialOffsetY: number;
};

const generateBlocks = (): number => Math.floor(Math.random() * 9) + 1;
const width = 30;

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
      blocks.push(<View key={i} style={[styles.singleBlock, isStatic ? styles.static : styles.draggable]} />);
    }
    return blocks;
  };

  const view = (
    <Animated.View style={[styles.blockContainer, animatedStyle]}>{renderBlocks()}</Animated.View>
  );

  return isStatic ? view : <GestureDetector gesture={dragGesture}>{view}</GestureDetector>;
};

const App: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  let [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.moreButton} onPress={() => setRefreshKey(k => k +1)}>
        Give me more!
      </TouchableOpacity>
     <View key={refreshKey}>
      <Addition/>
     </View>
    </View>
  );
};

const Addition = () => {
  const [staticBlocks, setStaticBlocks] = useState<number>(generateBlocks());
  const [dynamicBlocks, setDynamicBlocks] = useState<number>(generateBlocks());

  const staticX = useSharedValue(0);
  const staticY = useSharedValue(200);

  const snapThreshold = 20;

  const handleSnap = (
    dynamicTranslateX: SharedValue<number>,
    dynamicTranslateY: SharedValue<number>
  ) => {
    const dynamicWidth = Math.abs(dynamicTranslateX.value) - (Math.min(2, dynamicBlocks/2) * width)
    const staticWidth = staticX.value + (Math.min(2, staticBlocks/2) * width)
    const horizontallyClose = dynamicWidth - staticWidth < snapThreshold;    
    const staticHeight = (Math.max(Math.ceil(staticBlocks/4),1))*width
    const dynamicHeight = (Math.max(Math.ceil(dynamicBlocks/4),1))*width
    const isBelow = staticY.value < dynamicTranslateY.value
    const distance = staticHeight + dynamicHeight + dynamicTranslateY.value
    const closeFromAbove =  staticY.value - distance < snapThreshold && !isBelow
    const closeFromBelow = isBelow && dynamicTranslateY.value - staticY.value < snapThreshold

    const isWithinSnapZone = horizontallyClose && (closeFromAbove || closeFromBelow);
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
      <Text style={styles.desc}>{dynamicBlocks === 0 ? staticBlocks : dynamicBlocks + " + " + staticBlocks}</Text>
      <DraggableBlock isStatic={true} numBlocks={staticBlocks} initialOffsetY={200}  />
      {dynamicBlocks > 0 && (
        <DraggableBlock
          isStatic={false}
          onSnap={handleSnap}
          numBlocks={dynamicBlocks}
          initialOffsetY={0}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  moreButton: {
    borderWidth: 2,
    borderColor: "deeppink",
    backgroundColor: 'lightpink',
    borderRadius: 8,
    padding: 8,
    marginBottom: 24,
    fontSize: 18,
  },
  desc: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Inter_400Regular',
  },
  blockContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'center',
    alignItems: 'center',
    maxWidth: width * 4,
    height: 'auto',
  },
  singleBlock: {
    width: width,
    height: width,
    borderWidth: 1,
  },
  static: {
    backgroundColor: 'mediumblue',
    borderColor: 'darkcyan',
  },
  draggable: {
    backgroundColor: 'orangered',
    borderColor: 'gold',
  }
});

export default App;
