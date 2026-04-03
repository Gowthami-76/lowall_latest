import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Shield, CheckCircle } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    Alert.alert('Success', 'Password changed successfully!');
    router.back();
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const PasswordInput = ({ label, value, onChangeText, placeholder, field }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPasswords[field]}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => togglePasswordVisibility(field)}
        >
          {showPasswords[field] ? (
            <EyeOff size={20} color="#0A3A9E" />
          ) : (
            <Eye size={20} color="#0A3A9E" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Change Password</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Icon */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <Shield size={40} color="#F7CD00" />
          </View>
          <Text style={styles.iconText}>Keep your account secure</Text>
          <Text style={styles.iconSubtext}>
            Choose a strong password with at least 8 characters
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <PasswordInput
            label="Current Password"
            value={passwords.current}
            onChangeText={(text) => setPasswords(prev => ({ ...prev, current: text }))}
            placeholder="Enter current password"
            field="current"
          />

          <PasswordInput
            label="New Password"
            value={passwords.new}
            onChangeText={(text) => setPasswords(prev => ({ ...prev, new: text }))}
            placeholder="Enter new password"
            field="new"
          />

          <PasswordInput
            label="Confirm New Password"
            value={passwords.confirm}
            onChangeText={(text) => setPasswords(prev => ({ ...prev, confirm: text }))}
            placeholder="Confirm new password"
            field="confirm"
          />

          {/* Password Requirements */}
          <View style={styles.requirementsSection}>
            <View style={styles.requirementsHeader}>
              <Lock size={16} color="#F7CD00" />
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            </View>
            <View style={styles.requirementItem}>
              <CheckCircle size={12} color="#10B981" />
              <Text style={styles.requirement}>At least 8 characters long</Text>
            </View>
            <View style={styles.requirementItem}>
              <CheckCircle size={12} color="#10B981" />
              <Text style={styles.requirement}>Contains uppercase and lowercase letters</Text>
            </View>
            <View style={styles.requirementItem}>
              <CheckCircle size={12} color="#10B981" />
              <Text style={styles.requirement}>Contains at least one number</Text>
            </View>
            <View style={styles.requirementItem}>
              <CheckCircle size={12} color="#10B981" />
              <Text style={styles.requirement}>Contains at least one special character</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.changeButton} onPress={handleChangePassword}>
          <Lock size={18} color="#0A3A9E" />
          <Text style={styles.changeButtonText}>Change Password</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0A3A9E',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  iconText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  iconSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A3A9E',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 12,
  },
  requirementsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  requirement: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  changeButton: {
    backgroundColor: '#F7CD00',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A3A9E',
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 40,
  },
});