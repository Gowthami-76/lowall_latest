import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  Upload,
  CircleCheck as CheckCircle,
  Monitor,
  Calendar,
  DollarSign,
  ArrowRight,
  SkipBack as Skip,
  Sparkles,
  Crown,
  Rocket,
  TrendingUp,
  Zap,
  Heart
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { BASE_URL } from '@/utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Share Your Message',
    subtitle: 'Upload beautiful wallpapers with personal messages, quotes, or wishes to express yourself',
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Upload,
    color: '#0A3A9E',
    bgColor: '#E8F0FE',
    gradient: ['#0A3A9E', '#1E5BC3'],
  },
  {
    id: 2,
    title: 'Get Approved',
    subtitle: 'Our team reviews your submission to ensure quality and appropriateness for all users',
    image: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: CheckCircle,
    color: '#10B981',
    bgColor: '#D1FAE5',
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: 3,
    title: 'Go Live',
    subtitle: 'Your wallpaper appears on users\' screens for everyone to enjoy and appreciate',
    image: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Rocket,
    color: '#F7CD00',
    bgColor: '#FEF3C7',
    gradient: ['#F7CD00', '#FDE047'],
  },
  {
    id: 4,
    title: 'Book Premium Slots',
    subtitle: 'Get priority placement during peak hours for maximum visibility and reach',
    image: 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: Crown,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  {
    id: 5,
    title: 'Resale Marketplace',
    subtitle: 'Buy and sell premium time slots with other users for the best deals',
    image: 'https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: TrendingUp,
    color: '#EF4444',
    bgColor: '#FEE2E2',
    gradient: ['#EF4444', '#F87171'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-50);

  useEffect(() => {
    // Animate logo on mount
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoTranslateY.value = withSpring(0, { damping: 12 });
  }, []);

  useEffect(() => {
    const signup = async () => {
      try {
        const deviceId = Application.androidId || Device.osInternalBuildId || "unknown_device";
        const alreadySignedUp = await AsyncStorage.getItem('anonymousToken');
        if (alreadySignedUp) return;

        const response = await fetch(`${BASE_URL}/auth/anonymous-signup`, {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            anonymousId: deviceId,
            deviceInfo: {
              deviceToken: 'string',
              deviceType: Device.osName?.toLowerCase() || "android",
            },
          }),
        });

        const data = await response.json();
        console.log('Signup Response:', data);

        if (data?.token) {
          await AsyncStorage.setItem('anonymousToken', data.token);
        }
      } catch (error) {
        console.error('Anonymous signup failed:', error);
      }
    };

    signup();
  }, []);

  const handleNext = () => {
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    router.replace('/(tabs)');
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const OnboardingSlide = ({ item, index }) => {
    const Icon = item.icon;

    const slideAnimatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.85, 1, 0.85],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolate.CLAMP
      );

      const translateY = interpolate(
        scrollX.value,
        inputRange,
        [50, 0, 50],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }, { translateY }],
        opacity,
      };
    });

    const iconAnimatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

      // Use numeric values instead of strings to avoid NaN
      const rotateValue = interpolate(
        scrollX.value,
        inputRange,
        [-10, 0, 10],
        Extrapolate.CLAMP
      );

      // Safety check for NaN
      const rotateDeg = isNaN(rotateValue) ? 0 : rotateValue;

      return {
        transform: [{ rotate: `${rotateDeg}deg` }],
      };
    });

    return (
      <Animated.View style={[styles.slide, slideAnimatedStyle]}>
        <View style={[styles.imageContainer, { backgroundColor: item.bgColor }]}>
          <Image source={{ uri: item.image }} style={styles.slideImage} />
          <Animated.View style={[styles.iconOverlay, { backgroundColor: item.color }, iconAnimatedStyle]}>
            <Icon size={32} color="white" />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </Animated.View>
    );
  };

  const PaginationDot = ({ index }) => {
    const dotAnimatedStyle = useAnimatedStyle(() => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.6, 1.2, 0.6],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.3, 1, 0.3],
        Extrapolate.CLAMP
      );

      const dotWidth = interpolate(
        scrollX.value,
        inputRange,
        [6, 20, 6],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
        width: dotWidth,
      };
    });

    return (
      <Animated.View
        style={[
          styles.paginationDot,
          dotAnimatedStyle,
          currentIndex === index && styles.activePaginationDot
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Skip size={18} color="#0A3A9E" />
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logoWrapper}>
          <Sparkles size={24} color="#F7CD00" />
          <Text style={styles.logoText}>Lowall</Text>
        </View>
        <View style={styles.logoBadge}>
          <Heart size={10} color="#EF4444" fill="#EF4444" />
          <Text style={styles.logoBadgeText}>Premium Wallpapers</Text>
        </View>
      </Animated.View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <OnboardingSlide key={item.id} item={item} index={index} />
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <PaginationDot key={index} index={index} />
          ))}
        </View>

        {/* Action Button */}
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={18} color="#0A3A9E" />
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Text */}
        <Text style={styles.progressText}>
          {currentIndex + 1} of {onboardingData.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  skipText: {
    fontSize: 13,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 1,
    alignItems: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A3A9E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F7CD00',
    letterSpacing: 1,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  logoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0A3A9E',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 200,
    paddingBottom: 0,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 50,
    borderRadius: 40,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  slideImage: {
    width: 220,
    height: 220,
    borderRadius: 30,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A3A9E',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  activePaginationDot: {
    backgroundColor: '#F7CD00',
  },
  nextButton: {
    backgroundColor: '#F7CD00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 180,
    gap: 10,
    shadowColor: '#F7CD00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#0A3A9E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
    fontWeight: '500',
  },
});