import { Tabs } from 'expo-router';
import { Home, Upload, ShoppingBag, User } from 'lucide-react-native';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const TAB_WIDTH = (width - 40) / 4;

function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(translateX.value, { duration: 300 }),
      },
    ],
  }));

  // Update pill position when tab changes
  translateX.value = state.index * TAB_WIDTH;

  return (
    <View style={styles.container}>
      {/* Sliding Pill with Gradient */}
      <Animated.View style={[styles.pill, animatedStyle]}>
        <LinearGradient
          colors={['#F7CD00', '#FFD93D']}
          style={styles.pillGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let Icon;
        if (route.name === 'index') Icon = Home;
        else if (route.name === 'postsscreen') Icon = Upload;
        else if (route.name === 'marketplace') Icon = ShoppingBag;
        else if (route.name === 'profile') Icon = User;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Icon
              size={isFocused ? 26 : 24}
              color={isFocused ? '#1F2937' : '#9CA3AF'}
              strokeWidth={isFocused ? 2.5 : 2}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="postsscreen" />
      <Tabs.Screen name="marketplace" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E9ECF0',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  pill: {
    position: 'absolute',
    height: 60,
    width: TAB_WIDTH - 8,
    borderRadius: 30,
    top: 5,
    left: 5,
    overflow: 'hidden',
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pillGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});