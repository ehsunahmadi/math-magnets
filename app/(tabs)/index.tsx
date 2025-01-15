import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	runOnJS,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

type DraggableBlockProps = {
	isStatic: boolean;
	onSnap?: (
		dynamicTranslateX: SharedValue<number>,
		dynamicTranslateY: SharedValue<number>
	) => void;
	numBlocks: number;
	initialOffsetY: number;
};

const generateBlocks = (): number => Math.floor(Math.random() * 19) + 1;
const width = 28;

const DraggableBlock: React.FC<DraggableBlockProps> = ({
	isStatic,
	onSnap,
	numBlocks,
	initialOffsetY,
}) => {
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
			blocks.push(
				<View
					key={i}
					style={[
						styles.singleBlock,
						isStatic ? styles.static : styles.draggable,
					]}
				/>
			);
		}
		return blocks;
	};

	const view = (
		<Animated.View style={[styles.blockContainer, animatedStyle]}>
			{renderBlocks()}
		</Animated.View>
	);

	return isStatic ? (
		view
	) : (
		<GestureDetector gesture={dragGesture}>{view}</GestureDetector>
	);
};

const App: React.FC = () => {
	const [refreshKey, setRefreshKey] = useState(0);
	const [success, setSuccess] = useState(false);

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={success ? styles.success : styles.moreButton}
				onPress={() => {
					setRefreshKey((k) => k + 1);
					setSuccess(false);
				}}
			>
				Give me more!
			</TouchableOpacity>
			<View key={refreshKey}>
				<Addition onSuccess={() => setSuccess(true)} />
			</View>
		</View>
	);
};

const Addition = ({ onSuccess }: { onSuccess: () => void }) => {
	const staticNumber = useMemo(() => generateBlocks(), []);
	const dynamicNumber = useMemo(() => generateBlocks(), []);
	const [answer, setAnswer] = useState<number>();
	const answerInputRef = useRef<TextInput | null>(null);
	const [staticBlocks, setStaticBlocks] = useState<number>(staticNumber);
	const [dynamicBlocks, setDynamicBlocks] = useState<number>(dynamicNumber);

	const staticX = useSharedValue(0);
	const staticY = useSharedValue(200);

	const snapThreshold = 20;

	const handleSnap = (
		dynamicTranslateX: SharedValue<number>,
		dynamicTranslateY: SharedValue<number>
	) => {
		const dynamicWidth =
			Math.abs(dynamicTranslateX.value) -
			Math.min(2, dynamicBlocks / 2) * width;
		const staticWidth = staticX.value + Math.min(2, staticBlocks / 2) * width;
		const horizontallyClose = dynamicWidth - staticWidth < snapThreshold;
		const staticHeight = Math.max(Math.ceil(staticBlocks / 4), 1) * width;
		const dynamicHeight = Math.max(Math.ceil(dynamicBlocks / 4), 1) * width;
		const isBelow = staticY.value < dynamicTranslateY.value;
		const distance = staticHeight + dynamicHeight + dynamicTranslateY.value;
		const closeFromAbove = staticY.value - distance < snapThreshold && !isBelow;
		const closeFromBelow =
			isBelow && dynamicTranslateY.value - staticY.value < snapThreshold;

		const isWithinSnapZone =
			horizontallyClose && (closeFromAbove || closeFromBelow);
		if (isWithinSnapZone) {
			dynamicTranslateX.value = withTiming(staticX.value, { duration: 200 });
			dynamicTranslateY.value = withTiming(
				staticY.value + staticBlocks * width,
				{
					duration: 200,
				}
			); // Stack below the existing static blocks
			runOnJS(() => {
				setStaticBlocks((prev) => prev + dynamicBlocks);
				setDynamicBlocks(0);
			})();
			answerInputRef?.current?.focus();
		}
	};

	const answerFound = answer === staticNumber + dynamicNumber;

	useEffect(() => {
		if (answerFound) {
			if (dynamicBlocks !== 0) {
				runOnJS(() => {
					setStaticBlocks((prev) => prev + dynamicBlocks);
					setDynamicBlocks(0);
				})();
			}
			onSuccess();
		}
	}, [answerFound, dynamicBlocks, onSuccess]);

	useEffect(() => {
		answerInputRef?.current?.focus();
	}, []);

	return (
		<View style={styles.container}>
			<View style={styles.questionContainer}>
				<Text style={styles.desc}>
					{`${staticNumber} + ${dynamicNumber} = ${answerFound ? answer : ''}`}
				</Text>
				{!answerFound && (
					<TextInput
						style={styles.answerInput}
						onChangeText={(text) => setAnswer(Number.parseInt(text))}
						value={answer ? String(answer) : ''}
						keyboardType="numeric"
						ref={answerInputRef}
					/>
				)}
			</View>
			<DraggableBlock
				isStatic={true}
				numBlocks={staticBlocks}
				initialOffsetY={
					(Math.ceil(dynamicBlocks / 8) + Math.ceil(staticBlocks / 8)) * width +
					width * 5
				}
			/>
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
};
const styles = StyleSheet.create({
	moreButton: {
		borderWidth: 2,
		borderColor: 'deeppink',
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
		borderRadius: 4,
	},
	static: {
		backgroundColor: 'mediumblue',
		borderColor: 'darkcyan',
	},
	draggable: {
		backgroundColor: 'orangered',
		borderColor: 'gold',
	},
	questionContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24,
	},
	answerInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 8,
		fontSize: 24,
		marginLeft: 16,
		width: 64,
		textAlign: 'center',
	},
	success: {
		borderWidth: 2,
		borderColor: 'green',
		backgroundColor: 'lightgreen',
		borderRadius: 8,
		padding: 8,
		marginBottom: 24,
		fontSize: 18,
	},
});

export default App;
