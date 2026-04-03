import { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Text, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const [animationProgress] = useState(new Animated.Value(0));
  const brandName = 'LOWALL';
  const letters = brandName.split('');

  useEffect(() => {
    const checkOnboarding = async () => {
      // Start letter animation
      Animated.timing(animationProgress, {
        toValue: letters.length,
        duration: 1500,
        useNativeDriver: true,
      }).start();

      // Wait for animation to complete before checking onboarding
      setTimeout(async () => {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 1800);
    };

    checkOnboarding();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#092C7D" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.lettersContainer}>
            {letters.map((letter, index) => {
              const opacity = animationProgress.interpolate({
                inputRange: [index, index + 1],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              });

              const translateY = animationProgress.interpolate({
                inputRange: [index, index + 1],
                outputRange: [30, 0],
                extrapolate: 'clamp',
              });

              return (
                <Animated.Text
                  key={index}
                  style={[
                    styles.letter,
                    {
                      opacity: opacity,
                      transform: [{ translateY: translateY }],
                    },
                  ]}
                >
                  {letter}
                </Animated.Text>
              );
            })}
          </View>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>Wallpapers that inspire</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#092C7D',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  lettersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  letter: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F7CD00',
    letterSpacing: 2,
    marginHorizontal: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    marginTop: 20,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});