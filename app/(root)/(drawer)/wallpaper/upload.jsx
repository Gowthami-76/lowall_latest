import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera as CameraIcon, Image as ImageIcon, Upload as UploadIcon, User as User2, ChevronLeft, ChevronRight, CircleCheck as CheckCircle, Clock, Calendar as CalendarIcon, Sparkles, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/utils/constants';

const occasionOptions = ['Birthday', 'Anniversary', 'Motivation', 'Love', 'ETC'];

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

const disabledSlotsByDate = {};

const Calendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDate === dateKey;
      const isPast = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedCalendarDay,
            isPast && styles.pastDay
          ]}
          onPress={() => !isPast && onDateSelect(dateKey)}
          disabled={isPast}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedCalendarDayText,
            isPast && styles.pastDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
          <ChevronLeft size={20} color="#0A3A9E" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
          <ChevronRight size={20} color="#0A3A9E" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>
    </View>
  );
};

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [imageHeight, setImageHeight] = useState(200);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [showEtcModal, setShowEtcModal] = useState(false);
  const [customOccasion, setCustomOccasion] = useState('');

  const currentDisabledSlots = selectedDate ? (disabledSlotsByDate[selectedDate] || []) : [];

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required to choose an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      Image.getSize(uri, (width, height) => {
        const screenWidth = Dimensions.get('window').width - 48;
        const scaledHeight = (height / width) * screenWidth;
        setImageHeight(scaledHeight);
      });
      setImage(uri);
    }
  };

  useEffect(() => {
    const loadName = async () => {
      try {
        const userName = await AsyncStorage.getItem('userName');
        setName(`${userName || ''}`.trim());
      } catch (err) {
        console.log('Error loading name:', err);
      }
    };
    loadName();
  }, []);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleOccasionPress = (item) => {
    if (item === 'ETC') {
      setShowEtcModal(true);
      setCustomOccasion('');
    } else {
      setSelectedOccasion(item);
    }
  };

  const handleCustomOccasionSubmit = () => {
    if (customOccasion.trim()) {
      setSelectedOccasion(customOccasion.trim());
      setShowEtcModal(false);
      setCustomOccasion('');
    } else {
      Alert.alert('Error', 'Please enter an occasion');
    }
  };

  const handlePhotoSubmit = async () => {
    if (!image || !message) {
      Alert.alert("Validation", "Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      setCurrentStep("pending");

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No token found. Please login again.");
        return;
      }

      const fileName = `photo_${Date.now()}.jpg`;
      const mimeType = "image/jpeg";

      const signedRes = await fetch(
        `${BASE_URL}/v1/file/signed-url?fileName=${encodeURIComponent(fileName)}&mimeType=${encodeURIComponent(mimeType)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const signedData = await signedRes.json();
      console.log("upload response", signedData);

      if (!signedData?.url || !signedData?.key) {
        Alert.alert("Error", "Failed to get signed URL");
        setCurrentStep("rejected");
        return;
      }
      const { key, url } = signedData;

      const fileResponse = await fetch(image);
      const fileBlob = await fileResponse.blob();

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: fileBlob,
      });

      if (!uploadRes.ok) {
        setCurrentStep("rejected");
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }
      console.log("✅ File uploaded successfully!");

      const postRes = await fetch(`${BASE_URL}/v1/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: name,
          content: message,
          mediaUrl: key,
          tags: selectedOccasion ? [selectedOccasion] : [],
        }),
      });
      console.log("📌 Create Post Response:", name, message, selectedOccasion);

      const postData = await postRes.json();
      console.log("📌 Create Post Response:", postData);
      setCurrentStep('pending');
      setSelectedOccasion(null);
      setImage(null);
      setMessage('');
      setName('');

      setTimeout(() => {
        setCurrentStep('upload');
        router.push("/(tabs)");
      }, 5000);

    } catch (err) {
      console.error("Photo submit error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
      setCurrentStep("rejected");
    } finally {
      setLoading(false);
    }
  };

  const proceedToScheduling = () => {
    setCurrentStep('schedule');
  };

  const proceedToSchedulingNew = () => {
    if (!image || !message) {
      Alert.alert("Validation", "Please fill in all required fields.");
      return;
    }
    router.push({
      pathname: "/CreateSlotScreen",
      params: {
        image: image,
        message: message,
        occassion: selectedOccasion
      }
    });
  };

  const handleScheduleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Validation', 'Please select both date and time.');
      return;
    }

    Alert.alert('Success!', `Your wallpaper has been scheduled for ${selectedDate} at ${selectedTime}`);

    setImage(null);
    setMessage('');
    setName('');
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedOccasion(null);
    setCurrentStep('upload');

    router.push('/(tabs)');
  };

  const resetToUpload = () => {
    setCurrentStep('upload');
    setImage(null);
    setMessage('');
    setName('');
    setSelectedOccasion(null);
    setCustomOccasion('');
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep !== 'upload' && styles.completedStep]}>
          <Text style={[styles.stepNumber, currentStep !== 'upload' && styles.completedStepText]}>1</Text>
        </View>
        <Text style={styles.stepLabel}>Upload</Text>
      </View>

      <View style={[styles.stepLine, currentStep === 'schedule' && styles.completedStepLine]} />

      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep === 'schedule' && styles.activeStep]}>
          <Text style={[styles.stepNumber, currentStep === 'schedule' && styles.activeStepText]}>2</Text>
        </View>
        <Text style={styles.stepLabel}>Schedule</Text>
      </View>
    </View>
  );

  if (currentStep === 'pending') {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <View style={styles.statusCard}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#F7CD00" />
                <Text style={[styles.statusTitle, { marginTop: 12 }]}>
                  Uploading...
                </Text>
                <Text style={styles.statusMessage}>
                  Please wait while your wallpaper is being uploaded securely.
                </Text>
              </>
            ) : (
              <>
                <Clock size={48} color="#F7CD00" />
                <Text style={styles.statusTitle}>Pending Approval</Text>
                <Text style={styles.statusMessage}>
                  Your wallpaper has been submitted for admin review. You'll be
                  notified once it's approved.
                </Text>
                <View style={styles.loadingIndicator}>
                  <View style={styles.loadingDot} />
                  <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
                  <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  if (currentStep === 'rejected') {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <View style={styles.statusCard}>
            <View style={styles.rejectionIcon}>
              <Text style={styles.rejectionX}>✕</Text>
            </View>
            <Text style={styles.statusTitle}>Rejected</Text>
            <Text style={styles.statusMessage}>
              Sorry, your wallpaper didn't meet our guidelines. Please review our content policy and try uploading a different image.
            </Text>
            <TouchableOpacity style={styles.tryAgainButton} onPress={resetToUpload}>
              <UploadIcon size={18} color="white" />
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  if (currentStep === 'approved') {
    return (
      <SafeAreaProvider>
        <View style={styles.centerContainer}>
          <View style={styles.statusCard}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.statusTitle}>Approved!</Text>
            <Text style={styles.statusMessage}>
              Great! Your wallpaper has been approved. Now you can schedule when it goes live.
            </Text>
            <TouchableOpacity style={styles.proceedButton} onPress={proceedToScheduling}>
              <CalendarIcon size={18} color="white" />
              <Text style={styles.proceedButtonTextSchedule}>Proceed to Scheduling</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={resetToUpload}>
              <Text style={styles.backButtonText}>Upload New Wallpaper</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  if (currentStep === 'schedule') {
    return (
      <SafeAreaProvider>
        <ScrollView contentContainerStyle={styles.container}>
          {renderStepIndicator()}

          <Text style={styles.title}>Schedule Your Wallpaper</Text>
          <Text style={styles.subtitle}>Choose when your approved wallpaper goes live</Text>

          <View style={styles.imagePreview}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <Text style={styles.previewLabel}>Approved Wallpaper</Text>
            </View>
          </View>

          <Text style={styles.label}>Select Date</Text>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
          />

          {selectedDate && (
            <>
              <Text style={styles.label}>Available Time Slots</Text>
              <FlatList
                data={timeSlots}
                numColumns={3}
                key={selectedDate}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.timeGrid}
                renderItem={({ item }) => {
                  const isDisabled = currentDisabledSlots.includes(item);
                  const isSelected = selectedTime === item;

                  return (
                    <TouchableOpacity
                      disabled={isDisabled}
                      style={[
                        styles.timeBox,
                        isSelected && styles.selectedTimeBox,
                        isDisabled && styles.disabledBox
                      ]}
                      onPress={() => setSelectedTime(item)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          isSelected && styles.selectedTimeText,
                          isDisabled && styles.disabledText
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {currentDisabledSlots.length === timeSlots.length && (
                <Text style={styles.noSlotsText}>
                  No time slots available for this date
                </Text>
              )}
            </>
          )}

          <View style={styles.scheduleButtonsContainer}>
            <TouchableOpacity style={styles.backScheduleButton} onPress={resetToUpload}>
              <Text style={styles.backScheduleButtonText}>Back to Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleSubmitButton} onPress={handleScheduleSubmit}>
              <CalendarIcon size={18} color="white" />
              <Text style={styles.scheduleSubmitButtonText}>Schedule Wallpaper</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}

        <View style={styles.headerSection}>
          <Text style={styles.title}>Create New Wallpaper</Text>
          <Text style={styles.subtitle}>Share your beautiful message with everyone</Text>
        </View>

        <View style={styles.charCountContainer}>
          <View style={styles.charCountBadge}>
            <Text style={styles.charCount}>{message.length}/200</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.imageBox, image && styles.imageBoxWithImage]}
          onPress={pickFromGallery}
          activeOpacity={0.9}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.imageIconCircle}>
                <ImageIcon size={40} color="#0A3A9E" />
              </View>
              <Text style={styles.placeholderText}>Tap to select an image</Text>
              <Text style={styles.placeholderSubtext}>JPG, PNG supported</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={openCamera}>
            <CameraIcon size={18} color="white" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
            <ImageIcon size={18} color="white" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWithIcon}>
          <User2 size={18} color="#0A3A9E" />
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor="#9CA3AF"
            value={name}
            editable={false}
            selectTextOnFocus={false}
          />
        </View>

        <View style={styles.messageContainer}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your heartfelt message..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={(text) => {
              if (text.length <= 200) setMessage(text);
            }}
            multiline
          />
        </View>

        <Text style={styles.label}>Select Occasion</Text>
        <View style={styles.tagsContainer}>
          {occasionOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.tag, selectedOccasion === item && styles.selectedTag]}
              onPress={() => handleOccasionPress(item)}
            >
              <Text
                style={[styles.tagText, selectedOccasion === item && styles.selectedTagText]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedOccasion && selectedOccasion !== 'Birthday' && selectedOccasion !== 'Anniversary' && selectedOccasion !== 'Motivation' && selectedOccasion !== 'Love' && selectedOccasion !== 'ETC' && (
          <View style={styles.customOccasionBadge}>
            <Text style={styles.customOccasionText}>Selected: {selectedOccasion}</Text>
            <TouchableOpacity onPress={() => setSelectedOccasion(null)}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.proceedButtonNew, (!image || !message) && styles.proceedButtonDisabled]}
            onPress={proceedToSchedulingNew}
            disabled={!image || !message}
            activeOpacity={0.85}
          >
            <Sparkles size={20} color="#0A3A9E" />
            <Text style={styles.proceedButtonText}>Proceed to Scheduling</Text>
            <ArrowRight size={20} color="#0A3A9E" />
          </TouchableOpacity>
        </View>

        {/* ETC Modal */}
        <Modal
          visible={showEtcModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEtcModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Enter Occasion</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Festival, Holiday, Celebration..."
                placeholderTextColor="#9CA3AF"
                value={customOccasion}
                onChangeText={setCustomOccasion}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEtcModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCustomOccasionSubmit}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeStep: {
    backgroundColor: '#0A3A9E',
    borderColor: '#0A3A9E',
  },
  completedStep: {
    backgroundColor: '#F7CD00',
    borderColor: '#F7CD00',
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  activeStepText: {
    color: 'white',
  },
  completedStepText: {
    color: '#0A3A9E',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  completedStepLine: {
    backgroundColor: '#F7CD00',
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A3A9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  charCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  imageBox: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageBoxWithImage: {
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    marginTop: 8,
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  placeholderSubtext: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  buttonWrapper: {
    marginTop: 24,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0A3A9E',
    paddingVertical: 14,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontWeight: '500',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  messageContainer: {
    marginBottom: 20,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    marginBottom: 12,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  tag: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  selectedTag: {
    backgroundColor: '#F7CD00',
    borderColor: '#F7CD00',
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  selectedTagText: {
    color: '#0A3A9E',
    fontWeight: '700',
  },
  customOccasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7CD00',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  customOccasionText: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '700',
  },
  clearText: {
    fontSize: 16,
    color: '#0A3A9E',
    fontWeight: '700',
    marginLeft: 10,
  },
  proceedButtonNew: {
    flexDirection: 'row',
    backgroundColor: '#F7CD00',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  proceedButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  proceedButtonText: {
    color: '#0A3A9E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    maxWidth: 340,
    width: '100%',
  },
  statusTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A3A9E',
    marginTop: 20,
    marginBottom: 10,
  },
  statusMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  loadingIndicator: {
    flexDirection: 'row',
    gap: 10,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F7CD00',
    opacity: 0.6,
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: '#0A3A9E',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  proceedButtonTextSchedule: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 58, 158, 0.95)',
    padding: 12,
  },
  previewLabel: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    width: 40,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 44,
  },
  calendarDay: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  selectedCalendarDay: {
    backgroundColor: '#0A3A9E',
  },
  pastDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  selectedCalendarDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pastDayText: {
    color: '#9CA3AF',
  },
  timeGrid: {
    paddingBottom: 20,
  },
  timeBox: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  selectedTimeBox: {
    backgroundColor: '#F7CD00',
    borderColor: '#F7CD00',
  },
  disabledBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  timeText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedTimeText: {
    color: '#0A3A9E',
    fontWeight: '700',
  },
  disabledText: {
    color: '#EF4444',
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  scheduleButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backScheduleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  backScheduleButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleSubmitButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0A3A9E',
    paddingVertical: 14,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0A3A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  scheduleSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectionIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectionX: {
    fontSize: 32,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  tryAgainButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  tryAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A3A9E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0A3A9E',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});