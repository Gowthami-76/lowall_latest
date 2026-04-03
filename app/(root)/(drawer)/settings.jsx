import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Lock, Bell, Shield, FileText, CircleHelp as HelpCircle, LogOut, ChevronRight, Camera, CreditCard as Edit, Info } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@/utils/constants';
import { useFocusEffect } from "@react-navigation/native";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState({
    wallpaperApproved: true,
    newComments: true,
    premiumReminders: true,
    marketplaceOffers: false,
    emailUpdates: true,
  });

  // Add user data state
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Check login status and get userId
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const id = await AsyncStorage.getItem("userId");

        if (token && id) {
          setUserId(id);
        }
      } catch (err) {
        console.error("Error checking login:", err);
      }
    };

    checkLoginStatus();
  }, []);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingProfile(true);
      setProfileError(null);
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found for profile fetch");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/users/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      
      if (json.success && json.data) {
        setUserData(json.data);
        console.log("Profile data fetched in settings:", json.data);
      } else {
        setProfileError("Failed to fetch profile data");
        console.error("Profile API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError("Network error while fetching profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // Fetch profile when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId, fetchUserProfile]);

  // Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Settings screen focused, refreshing profile");
      if (userId) {
        fetchUserProfile();
      }
    }, [userId, fetchUserProfile])
  );

  // Helper functions for displaying user data
  const getDisplayName = (userData) => {
    if (!userData) return 'Loading...';
    if (userData.fullName) return userData.fullName;
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData.firstName || 'User';
  };

  const getUserEmail = (userData) => {
    return userData?.email || 'Loading...';
  };

  const getUserAvatar = (userData) => {
    return userData?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage
              await AsyncStorage.removeItem("authToken");
              await AsyncStorage.removeItem("userId");
              
              // Clear local state
              setUserData(null);
              setUserId(null);
              
              // Navigate to login
              router.replace('/auth/login');
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert('Error', 'Failed to logout properly. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const SettingsItem = ({ icon: Icon, title, subtitle, onPress, rightElement, showChevron = true }) => {
    const scaleValue = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const handlePress = () => {
      scaleValue.value = withSpring(0.98, {}, () => {
        scaleValue.value = withSpring(1);
      });
      onPress?.();
    };

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={styles.settingsItem}
          onPress={handlePress}
          disabled={!onPress}
        >
          <View style={styles.settingsItemLeft}>
            <View style={styles.iconContainer}>
              <Icon size={20} color="#0A3A9E" />
            </View>
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{title}</Text>
              {subtitle && (
                <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
              )}
            </View>
          </View>

          <View style={styles.settingsItemRight}>
            {rightElement}
            {showChevron && onPress && (
              <ChevronRight size={20} color="#0A3A9E" />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const NotificationToggle = ({ label, value, onValueChange }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#FEF3C7' }}
        thumbColor={value ? '#F7CD00' : '#F3F4F6'}
      />
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

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              {loadingProfile ? (
                <View style={styles.profileImagePlaceholder}>
                  <ActivityIndicator size="small" color="#F7CD00" />
                </View>
              ) : (
                <Image
                  source={{ uri: getUserAvatar(userData) }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.log('Profile image load error in settings:', e.nativeEvent.error);
                  }}
                />
              )}
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {getDisplayName(userData)}
              </Text>
              <Text style={styles.profileEmail}>
                {getUserEmail(userData)}
              </Text>
              {userData?.location && (
                <Text style={styles.profileLocation}>
                  📍 {userData.location}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/wallpaper/edit-profile')}
            >
              <Edit size={18} color="#F7CD00" />
            </TouchableOpacity>
          </View>

          {/* Error state */}
          {profileError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{profileError}</Text>
              <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingsItem
            icon={User}
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/wallpaper/edit-profile')}
          />

          <SettingsItem
            icon={Lock}
            title="Change Password"
            subtitle="Update your password"
            onPress={() => router.push('/wallpaper/change-password')}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.notificationsCard}>
            <NotificationToggle
              label="Wallpaper Approved"
              value={notifications.wallpaperApproved}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, wallpaperApproved: value }))}
            />

            <NotificationToggle
              label="New Comments"
              value={notifications.newComments}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, newComments: value }))}
            />

            <NotificationToggle
              label="Premium Reminders"
              value={notifications.premiumReminders}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, premiumReminders: value }))}
            />

            <NotificationToggle
              label="Marketplace Offers"
              value={notifications.marketplaceOffers}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, marketplaceOffers: value }))}
            />

            <NotificationToggle
              label="Email Updates"
              value={notifications.emailUpdates}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, emailUpdates: value }))}
            />
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>

          <SettingsItem
            icon={HelpCircle}
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => router.push('/wallpaper/help')}
          />

          <SettingsItem
            icon={FileText}
            title="Terms of Service"
            onPress={() => router.push('/wallpaper/terms')}
          />

          <SettingsItem
            icon={Shield}
            title="Privacy Policy"
            onPress={() => router.push('/wallpaper/privacy')}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <SettingsItem
            icon={Info}
            title="About App"
            subtitle="App information and version"
            onPress={() => router.push('/wallpaper/about')}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>

          <SettingsItem
            icon={LogOut}
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showChevron={false}
          />

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    marginBottom: 12,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F7CD00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  profileLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  settingsItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A3A9E',
  },
  settingsItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0A3A9E',
    flex: 1,
  },
  deleteAccountButton: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  bottomPadding: {
    height: 40,
  },
});