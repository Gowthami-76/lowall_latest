import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, ArrowLeft, CircleCheck as CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { BASE_URL } from '@/utils/constants';

export default function ResetPasswordScreen() {
  const { email, otp } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const shakeValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeValue.value },
      { scale: scaleValue.value },
    ],
  }));

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleResetPassword = async() => {
    if (!password || !confirmPassword) {
      shakeValue.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-10),
        withSpring(0)
      );
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (!validatePassword(password)) {
      shakeValue.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-10),
        withSpring(0)
      );
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      shakeValue.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-10),
        withSpring(0)
      );
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    scaleValue.value = withSpring(0.95);

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          newPassword: password,
          OTP: otp
        })
      });

      const data = await response.json();
      setIsLoading(false);
      scaleValue.value = withSpring(1);

      if (response.ok) {
        console.log('login success');
        setIsSuccess(true);
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password.');
      }
    } catch (error) {
      setIsLoading(false);
      scaleValue.value = withSpring(1);
      Alert.alert('Network Error', 'Something went wrong. Please try again.');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth/login');
  };

  const handleBack = () => {
    router.back();
  };

  if (isSuccess) {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Success Icon */}
            <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.successContainer}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.successIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <CheckCircle size={80} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            {/* Success Header */}
            <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.header}>
              <Text style={styles.successTitle}>Password Reset Successful!</Text>
              <Text style={styles.subtitle}>
                Your password has been successfully reset. You can now sign in with your new password.
              </Text>
            </Animated.View>

            {/* Back to Login Button */}
            <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.successButtonContainer}>
              <TouchableOpacity
                style={styles.successButton}
                onPress={handleBackToLogin}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#0A3A9E', '#1E4BB5']}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.successButtonText}>Back to Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFF']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#0A3A9E" />
          </TouchableOpacity>

          {/* Logo */}
          <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/lowalllogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Header */}
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Create a new password for your account
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeIn.delay(300).duration(500)} style={[styles.form, shakeStyle]}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#0A3A9E" />
              <TextInput
                style={styles.textInput}
                placeholder="New Password"
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
                placeholder="Confirm New Password"
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

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <Text style={[
                styles.requirementText,
                password.length >= 8 ? styles.requirementMet : styles.requirementNotMet
              ]}>
                • At least 8 characters
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
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
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E9ECF0',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F7CD00',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  form: {
    gap: 16,
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
  requirementsContainer: {
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E9ECF0',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A3A9E',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  requirementText: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  requirementMet: {
    color: '#10B981',
  },
  requirementNotMet: {
    color: '#9CA3AF',
  },
  resetButton: {
    marginTop: 16,
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
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successButtonContainer: {
    marginTop: 40,
  },
  successButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  successButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});