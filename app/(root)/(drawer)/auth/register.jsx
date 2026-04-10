import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/utils/constants';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shakeValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeValue.value },
      { scale: scaleValue.value },
    ],
  }));

const handleRegister = async () => {
const showError = (msg) => {
    Alert.alert('Error', msg);
    shakeValue.value = withSequence(
      withSpring(-10),
      withSpring(10),
      withSpring(-10),
      withSpring(0)
    );
  };
     const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const trimmedConfirmPassword = confirmPassword.trim();
  let trimmedPhone = phone.trim();

  // First name validation
  if (!trimmedFirstName || trimmedFirstName.length < 2) {
    showError("Please enter your first name (at least 2 characters)");
    return;
  }

  // Last name validation
  if (!trimmedLastName || trimmedLastName.length < 2) {
    showError("Please enter your last name (at least 2 characters)");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    showError("Please enter a valid email address");
    return;
  }

  // Phone validation with country code +91
  // Remove any non-digit characters and clean the phone number
  let cleanPhone = trimmedPhone.replace(/\D/g, '');

  // If phone is provided, validate it
  if (trimmedPhone) {
    // Check if phone already has country code
    if (cleanPhone.startsWith('91')) {
      // If it starts with 91, ensure it has exactly 12 digits (91 + 10 digits)
      if (cleanPhone.length === 12) {
        trimmedPhone = `+${cleanPhone}`;
      } else if (cleanPhone.length === 10) {
        // If it's just 10 digits, add +91
        trimmedPhone = `+91${cleanPhone}`;
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        // If it starts with 0, remove 0 and add +91
        cleanPhone = cleanPhone.substring(1);
        if (cleanPhone.length === 10) {
          trimmedPhone = `+91${cleanPhone}`;
        } else {
          showError("Please enter a valid 10-digit phone number");
          return;
        }
      } else {
        showError("Please enter a valid 10-digit phone number");
        return;
      }
    } else {
      // If no country code, add +91
      if (cleanPhone.length === 10) {
        trimmedPhone = `+91${cleanPhone}`;
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
        if (cleanPhone.length === 10) {
          trimmedPhone = `+91${cleanPhone}`;
        } else {
          showError("Please enter a valid 10-digit phone number");
          return;
        }
      } else {
        showError("Please enter a valid 10-digit phone number");
        return;
      }
    }
  }

  // Password validation
  if (!trimmedPassword || trimmedPassword.length < 6) {
    showError("Password must be at least 6 characters long");
    return;
  }

  // Confirm password match
  if (trimmedPassword !== trimmedConfirmPassword) {
    showError("Passwords do not match");
    return;
  }


   try {
    setIsLoading(true);
    scaleValue.value = withSpring(0.95);

    const anonymousToken = await AsyncStorage.getItem('anonymousToken');

    if (!anonymousToken) {
      console.warn('No anonymous token found');
      showError('Session expired. Please restart the app.');
      return;
    }

    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anonymousId: anonymousToken,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password: trimmedPassword,
        phoneNumber: trimmedPhone || null, // Send phone with country code or null if empty
        deviceInfo: {
          deviceToken: "string", // replace with actual device token if available
          deviceType: Platform.OS, // "ios" or "android"
        },
      }),
    });

    const data = await response.json();
    console.log("Signup response:", data);

    if (response.ok) {
      await AsyncStorage.setItem('authToken', data.token);

      // Show success alert dialog
      Alert.alert(
        'Account Created Successfully!',
        'Welcome to the wallpaper community. You can now sign in with your credentials.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ],
        { cancelable: false } // Prevent dismissing by tapping outside
      );
    } else {
      showError(data.message || "Signup failed");
    }
  } catch (error) {
    console.error("Signup error:", error);
    showError("Something went wrong: " + error.message);
  } finally {
    setIsLoading(false);
    scaleValue.value = withSpring(1);
  }
  };

  // Format phone number as user types
  const handlePhoneChange = (text) => {
    // Remove any non-digit characters
    let cleaned = text.replace(/\D/g, '');

    // Limit to 10 digits (since we'll add +91)
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }

    setPhone(cleaned);
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the wallpaper community</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.form, shakeStyle]}>
              {/* Name Fields Row */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <User size={20} color="#0A3A9E" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={[styles.inputContainer, styles.nameInput]}>
                  <User size={20} color="#0A3A9E" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Last Name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#0A3A9E" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Phone size={20} color="#0A3A9E" />
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+91</Text>
                  <View style={styles.countryCodeSeparator} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Phone Number (Optional)"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="#0A3A9E" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#0A3A9E" />
                  ) : (
                    <Eye size={20} color="#0A3A9E" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="#0A3A9E" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#0A3A9E" />
                  ) : (
                    <Eye size={20} color="#0A3A9E" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={isLoading ? ['#CCCCCC', '#BBBBBB'] : ['#0A3A9E', '#1E4BB5']}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>{' '}
                and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>

            {/* Sign In Link */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  form: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E9ECF0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  countryCodeSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E9ECF0',
    marginLeft: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  termsLink: {
    color: '#F7CD00',
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 14,
    color: '#F7CD00',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});