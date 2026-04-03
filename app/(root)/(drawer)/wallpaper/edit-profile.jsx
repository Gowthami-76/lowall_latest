import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, Camera, User, MapPin, Mail, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@/utils/constants';
import { useFocusEffect } from "@react-navigation/native";

export default function EditProfileScreen() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    avatar: '',
  });

  // API states
  const [userId, setUserId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  // Check login status and get userId
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const id = await AsyncStorage.getItem("userId");

        if (token && id) {
          setUserId(id);
        } else {
          Alert.alert('Error', 'Please login to edit your profile');
          router.back();
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
        Alert.alert('Error', 'Authentication token not found');
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
        const userData = json.data;
        setProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          bio: userData.bio || '',
          location: userData.location || '',
          avatar: userData.avatar || '',
        });
        console.log("Profile data loaded for editing:", userData);
      } else {
        setProfileError("Failed to load profile data");
        console.error("Profile API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError("Network error while loading profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // Update user profile
  const updateUserProfile = async () => {
    if (!userId) return;

    try {
      setSavingProfile(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      let avatarKey = profile.avatar;
      if (selectedImageUri) {
        console.log("Uploading new avatar image...");
        avatarKey = await uploadSelectedImage();
        if (!avatarKey) {
          throw new Error("Failed to upload avatar image");
        }
      }

      const updateData = {};
      if (profile.firstName.trim()) updateData.firstName = profile.firstName.trim();
      if (profile.lastName.trim()) updateData.lastName = profile.lastName.trim();
      if (profile.bio.trim()) updateData.bio = profile.bio.trim();
      if (profile.location.trim()) updateData.location = profile.location.trim();
      if (avatarKey) updateData.avatar = avatarKey;

      console.log("Updating profile with data:", updateData);

      const response = await fetch(`${BASE_URL}/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const json = await response.json();

      if (json.success) {
        setSelectedImageUri(null);

        if (avatarKey) {
          setProfile(prev => ({ ...prev, avatar: avatarKey }));
        }

        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', json.message || 'Failed to update profile');
        console.error("Profile update API error:", json);
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Load profile when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId, fetchUserProfile]);

  // Request camera and media library permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        console.log('Permissions not granted for camera or media library');
      }
    };

    requestPermissions();
  }, []);

  // Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("EditProfile screen focused, loading profile");
      if (userId) {
        fetchUserProfile();
      }
    }, [userId, fetchUserProfile])
  );

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Photo library permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadSelectedImage = async () => {
    if (!selectedImageUri) return null;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const fileName = `avatar_${userId}_${Date.now()}.jpg`;
      const mimeType = "image/jpeg";

      const signedRes = await fetch(
        `${BASE_URL}/v1/file/signed-url?fileName=${encodeURIComponent(fileName)}&mimeType=${encodeURIComponent(mimeType)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const signedData = await signedRes.json();
      console.log("Avatar upload signed URL response", signedData);

      if (!signedData?.url || !signedData?.key) {
        throw new Error("Failed to get signed URL for avatar upload");
      }

      const { key, url } = signedData;

      const fileResponse = await fetch(selectedImageUri);
      const fileBlob = await fileResponse.blob();

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: fileBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Avatar upload failed with status ${uploadRes.status}`);
      }

      console.log("✅ Avatar uploaded successfully!");
      return key;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSave = () => {
    if (!profile.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return;
    }

    if (!profile.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return;
    }

    Alert.alert(
      'Save Changes',
      'Are you sure you want to update your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: updateUserProfile
        }
      ]
    );
  };

  const getProfileImageUri = () => {
    return selectedImageUri || profile.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200';
  };

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

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={savingProfile || loadingProfile}
        >
          {savingProfile ? (
            <ActivityIndicator size={20} color="#FFFFFF" />
          ) : (
            <Save size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F7CD00" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Profile Photo */}
            <View style={styles.photoSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: getProfileImageUri() }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.log('Profile image load error:', e.nativeEvent.error);
                  }}
                />
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={showImagePickerOptions}
                  disabled={savingProfile}
                >
                  <Camera size={18} color="#0A3A9E" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={showImagePickerOptions}
                disabled={savingProfile}
              >
                <Text style={[styles.changePhotoText, savingProfile && styles.disabledText]}>
                  {selectedImageUri ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              {selectedImageUri && (
                <Text style={styles.imagePreviewText}>
                  New image selected. Save changes to upload.
                </Text>
              )}
            </View>

            {/* Error Display */}
            {profileError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{profileError}</Text>
                <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <User size={16} color="#F7CD00" />
                  <Text style={styles.label}>First Name *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={profile.firstName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                  placeholder="Enter first name"
                  placeholderTextColor="#9CA3AF"
                  editable={!savingProfile}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <User size={16} color="#F7CD00" />
                  <Text style={styles.label}>Last Name *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={profile.lastName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                  placeholder="Enter last name"
                  placeholderTextColor="#9CA3AF"
                  editable={!savingProfile}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Mail size={16} color="#F7CD00" />
                  <Text style={styles.label}>Email</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profile.email}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                />
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <MapPin size={16} color="#F7CD00" />
                  <Text style={styles.label}>Location</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={profile.location}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                  placeholder="Enter your location"
                  placeholderTextColor="#9CA3AF"
                  editable={!savingProfile}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <FileText size={16} color="#F7CD00" />
                  <Text style={styles.label}>Bio</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={profile.bio}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!savingProfile}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButtonLarge, savingProfile && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={savingProfile || loadingProfile}
            >
              {savingProfile ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color="#0A3A9E" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </>
        )}
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#F7CD00',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7CD00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#F7CD00',
    fontWeight: '700',
  },
  imagePreviewText: {
    fontSize: 11,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  saveButtonLarge: {
    backgroundColor: '#F7CD00',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A3A9E',
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 40,
  },
});