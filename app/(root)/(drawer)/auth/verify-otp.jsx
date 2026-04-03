import { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';

export default function VerifyOTPScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const shakeValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setShowAnimation(true); // Runs only once when screen first loads
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeValue.value },
      { scale: scaleValue.value },
    ],
  }));

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      shakeValue.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-10),
        withSpring(0)
      );
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    scaleValue.value = withSpring(0.95);

    // Simulate API call to verify OTP
    setTimeout(() => {
      setIsLoading(false);
      scaleValue.value = withSpring(1);

      // For demo purposes, accept any 6-digit code
      if (otpString === '123456' || otpString.length === 6) {
        // Navigate to reset password page or success page
        router.push({
          pathname: '/auth/reset-password',
          params: { email: email, otp: otpString }
        });
      } else {
        shakeValue.value = withSequence(
          withSpring(-10),
          withSpring(10),
          withSpring(-10),
          withSpring(0)
        );
        Alert.alert('Invalid OTP', 'The verification code you entered is incorrect. Please try again.');
      }
    }, 2000);
  };

  const handleResendOTP = () => {
    if (!canResend) return;

    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);

    // Focus first input
    inputRefs.current[0]?.focus();

    Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
  };

  const handleBack = () => {
    router.back();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#0A3A9E" />
          </TouchableOpacity>

          {/* Logo */}
          {showAnimation && (
            <Animated.View
              entering={FadeIn.delay(100).duration(500)}
              style={styles.logoContainer}
            >
              <Image
                source={require('@/assets/images/lowalllogo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          )}

          {/* Header */}
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={styles.header}
          >
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View
            entering={FadeIn.delay(300).duration(500)}
            style={[styles.otpContainer, shakeStyle]}
          >
            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  placeholderTextColor="#9CA3AF"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
              onPress={handleVerifyOTP}
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
                  <Text style={styles.verifyButtonText}>Verify Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Resend Section */}
          <Animated.View
            entering={FadeIn.delay(400).duration(500)}
            style={styles.resendContainer}
          >
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>Resend in {formatTime(timer)}</Text>
            )}
          </Animated.View>

          {/* Help Text */}
          <Animated.View
            entering={FadeIn.delay(500).duration(500)}
            style={styles.helpContainer}
          >
            <Mail size={16} color="#F7CD00" />
            <Text style={styles.helpText}>
              Check your spam folder if you don't see the email
            </Text>
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
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7CD00',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  otpContainer: {
    gap: 24,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E9ECF0',
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#F7CD00',
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    color: '#F7CD00',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timerText: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});