import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Alert } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import Svg, { Rect, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const ballRadius = 15;
const speedFactor = 1.5;

const walls = [
  { x: 50, y: 100, width: 300, height: 20},
  { x: 100, y: 200, width: 20, height: 300},
  { x: 200, y: 400, width: 100, height: 20},
];

const goal = { x: width - 60, y: height - 100, radius: 30};

export default function App() {
  const [position, setPosition] = useState({x: 50, y: 50});
  const [subscription, setSubscription] = useState<any>(null);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission required');
      }
    })();
  }, [])

  const subscribe = () => {
    setSubscription(
      Accelerometer.addListener(({ x, y }) => {
        setPosition(prev => {
          const newX = prev.x + x * speedFactor * -1;
          const newY = prev.y + y * speedFactor;

          const clampedX = Math.max(ballRadius, Math.min(newX, width - ballRadius));
          const clampedY = Math.max(ballRadius, Math.min(newY, height - ballRadius));

          return { x: clampedX, y: clampedY};
        });
      })
    );
  };

  const unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [])

  useEffect(() => {
    const dx = position.x - goal.x;
    const dy = position.y - goal.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < ballRadius + goal.radius) {
      setHasWon(true);
    }
  }, [position]);

  const isColliding = (x: number, y: number) => {
    return walls.some(w =>
       x + ballRadius > w.x && 
       x - ballRadius < w.x + w.width &&
       y + ballRadius > w.y && 
       y - ballRadius < w.y + w.height);
  };

  return (
    <View style={styles.container}>
      <Svg height={height} width={width}>
        {walls.map((w, i)=> (
        <Rect key={i} x={w.x} y={w.y} width={w.width} height={w.height} fill="black" />
      ))}

      <Circle cx={goal.x} cy={goal.y} r={goal.radius} fill="green" />

      <Circle cx={position.x} cy={position.y} r={ballRadius} fill={isColliding(position.x, position.y) ? 'red' : 
        'blue'
      } />
      </Svg>

      {hasWon && (
        <View style={styles.winBox}>
          <Text style={styles.winText}>You Win!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
  },
  winBox: {
    position: 'absolute',
    top: height / 2 - 50,
    left: width / 2 - 75,
    backgroundColor: '#000000aa',
    padding: 20,
    borderRadius: 10,
  },
  winText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  }
})