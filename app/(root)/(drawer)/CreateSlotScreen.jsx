import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Alert,
  Modal,
  Pressable,    
  TextInput,  
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from "react-native";
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Calendar } from "react-native-calendars";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CheckBox from '@react-native-community/checkbox';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, DollarSign, Tag, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { BASE_URL } from '@/utils/constants';

const CreateSlotScreen = () => {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isResell, setIsResell] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const { image, message, selectedOccasion } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [resellAmount, setResellAmount] = useState('');

  // Helper function to show toast (works on both platforms)
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  // get userId from storage
  useFocusEffect(
    useCallback(() => {
      const fetchUserId = async () => {
        const id = await AsyncStorage.getItem("userId");
        setCurrentUserId(id);
        console.log("Current User ID:.........", id);
      };

      fetchUserId();

      return () => {
        // optional cleanup
      };
    }, [])
  );

  useEffect(() => {
    const loadName = async () => {
      try {
        const userName = await AsyncStorage.getItem('userName');
        setName(`${userName || ''} `.trim());
      } catch (err) {
        console.log('Error loading name:', err);
      }
    };
    loadName();
  }, []);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - Resetting states');
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlots([]);
      setShowDialog(false);
      setIsResell(false);
      setResellAmount('');
    }, [])
  );

  // Fetch slots when selectedDate or currentUserId changes
  useEffect(() => {
    if (selectedDate && currentUserId) {
      fetchSlots();
    }
  }, [selectedDate, currentUserId]);

  const fetchSlots = async () => {
    if (!selectedDate || !currentUserId) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/v1/slot?date=${selectedDate}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        let filteredSlots = data.slots;

        const today = new Date().toISOString().split("T")[0];
        if (selectedDate === today) {
          const now = new Date();
          now.setHours(now.getHours() + 4);
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          filteredSlots = filteredSlots.filter((slot) => {
            const [h, m] = slot.startTime.split(":").map(Number);
            return h * 60 + m > currentMinutes;
          });
        }

        setSlots(filteredSlots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // CASE 1: No postId exists - Create post first, then schedule
      if (!postId) {
        try {
          setLoading(true);

          const token = await AsyncStorage.getItem("authToken");
          if (!token) {
            Alert.alert("Error", "No token found. Please login again.");
            setLoading(false);
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

          if (!signedData?.url || !signedData?.key) {
            Alert.alert("Error", "Failed to get signed URL");
            setLoading(false);
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
            throw new Error(`Upload failed with status ${uploadRes.status}`);
          }

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

          const postData = await postRes.json();
          const newPostId = postData._id;

          if (!selectedDate || !selectedSlot) {
            Alert.alert("Error", "Please select a date and time slot");
            setLoading(false);
            return;
          }

          const payload = {
            date: selectedDate,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            postId: newPostId,
          };

          const slotRes = await fetch(`${BASE_URL}/v1/slot`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const slotData = await slotRes.json();

          if (slotData.success) {
            const secondRes = await fetch(`${BASE_URL}/v1/slot/sell`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                slotId: slotData.slot._id,
                salePrice: resellAmount,
                saleDescription: "",
              }),
            });

            const secondData = await secondRes.json();
            Alert.alert(
              "Success",
              `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
              [
                {
                  text: "OK",
                  onPress: () => router.push("/(tabs)"),
                },
              ]
            );
          } else {
            Alert.alert("Error", slotData.message || "Failed to schedule slot");
          }
        } catch (err) {
          console.error("Photo submit error:", err);
          Alert.alert("Error", "Something went wrong. Try again.");
          setLoading(false);
        }
      }
      // CASE 2: postId already exists - Just schedule the slot
      else {
        if (!selectedDate || !selectedSlot) {
          Alert.alert("Error", "Please select a date and time slot");
          return;
        }

        try {
          setLoading(true);

          const token = await AsyncStorage.getItem("authToken");
          if (!token) {
            Alert.alert("Error", "No token found");
            setLoading(false);
            return;
          }

          const payload = {
            date: selectedDate,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            postId: postId,
          };

          const res = await fetch(`${BASE_URL}/v1/slot`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          setLoading(false);

          if (data.success) {
            const secondRes = await fetch(`${BASE_URL}/v1/slot/sell`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                slotId: data.slot._id,
                salePrice: resellAmount,
                saleDescription: "",
              }),
            });

            const secondData = await secondRes.json();
            Alert.alert(
              "Success",
              `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
              [
                {
                  text: "OK",
                  onPress: () => router.push("/(tabs)"),
                },
              ]
            );
          } else {
            Alert.alert("Error", data.message || "Failed to schedule slot");
          }
        } catch (err) {
          setLoading(false);
          console.error("Error scheduling slot:", err);
          Alert.alert("Error", "Something went wrong while scheduling the slot");
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ Booking cancelled');
    setShowDialog(false);
    setIsResell(false);
    setResellAmount('');
  };

  const handleConfirm = () => {
    if (isResell && !resellAmount.trim()) {
      Alert.alert(
        'Amount Required',
        'Please enter the resell amount in rupees',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isResell && (isNaN(resellAmount) || parseFloat(resellAmount) <= 0)) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ Booking confirmed');
    console.log('Date:', selectedDate);
    console.log('Slot:', selectedSlot);
    console.log('Is Resell:', isResell);
    console.log('Resell Amount:', resellAmount);

    setShowDialog(false);
    // Keep the resellAmount for when handleSchedule is called
  };

  const handleSlotPress = (item) => {
    console.log('🕒 Slot clicked - FULL ITEM:', JSON.stringify(item, null, 2));
    console.log('🔍 Sale Status:', item.saleStatus);
    console.log('👤 User exists?:', !!item.user);
    console.log('👤 User Data:', item.user);
    console.log('🆔 User ID:', item.user?._id);
    console.log('🆔 Current User ID:', currentUserId);
    console.log('📝 Post ID:', item.post?._id);
    console.log('🎫 Slot ID:', item.slotId);

    // If it's a resell slot, ONLY show toast - don't open dialog
    if (item.saleStatus === "available") {
      console.log('✅ This IS a resell slot!');
      console.log('📌 Resell Post ID:', item.post?._id);
      console.log('📌 Resell Slot ID:', item.slotId);

      if (item.user?._id) {
        const userId = item.user._id;

        // Check if this resell slot belongs to the current user
        if (userId === currentUserId) {
          console.log('⭐ This is YOUR resell slot!');
          showToast('This is your resell slot');
        } else {
          // Show other user's info
          Alert.alert(
            "Confirm Purchase",
            "Do you really want to buy this slot?",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Buy",
                style: "default",
                onPress: () => {
                  buyResellSlot(item);
                },
              },
            ]
          );
        }
      } else {
        console.log('⚠️ Resell slot but NO USER DATA');
        showToast('Resell slot - User info not available');
      }

      // Don't open dialog for resell slots
      return;
    }

    console.log('❌ NOT a resell slot. Status:', item.saleStatus);

    // Only open dialog for non-resell slots
    setSelectedSlot(item);
    setIsResell(false);
    setResellAmount('');
    setShowDialog(true);
  };

  const buyResellSlot = async (slotItem) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/buy`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slotItem.slotId,
          salePrice: slotItem.salePrice,
        }),
      });

      const data = await res.json();
      console.log("Buy resell response:", data);

      if (res.ok && data.success) {
        Alert.alert(
          "Success 🎉",
          "Slot purchased successfully",
          [
            {
              text: "OK",
              onPress: () => {
                fetchSlots(); // refresh slots
              },
            },
          ]
        );
      } else {
        Alert.alert("Failed", data?.message || "Unable to buy slot");
      }
    } catch (err) {
      console.error("Buy resell error:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderSlot = ({ item }) => {
    const isSelected =
      selectedSlot &&
      selectedSlot.startTime === item.startTime &&
      selectedSlot.endTime === item.endTime;

    // Determine slot status
    const isBooked = item.isBooked && item.saleStatus !== "available";
    const isResellSlot = item.saleStatus === "available";
    const isAvailable = !item.isBooked && !isResellSlot;

    return (
      <TouchableOpacity
        disabled={isBooked}
        onPress={() => handleSlotPress(item)}
        style={[
          styles.slot,
          isBooked && styles.bookedSlot,
          isResellSlot && styles.resaleSlot,
          isAvailable && styles.availableSlot,
          isSelected && styles.selectedSlot,
        ]}
        activeOpacity={0.8}
      >
        <Clock size={14} color={isSelected ? "#FFFFFF" : (isBooked ? "#FFFFFF" : (isResellSlot ? "#0A3A9E" : "#FFFFFF"))} style={styles.slotIcon} />
        <Text style={[styles.slotText, isSelected && styles.selectedSlotText]}>
          {item.startTime} - {item.endTime}
        </Text>
        {isResellSlot && (
          <View style={styles.resellBadge}>
            <Tag size={10} color="#0A3A9E" />
            <Text style={styles.resellBadgeText}>Resell</Text>
          </View>
        )}
        {item.isPremium && !isBooked && (
          <View style={styles.premiumBadge}>
            <Sparkles size={10} color="#F7CD00" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Schedule Slot",
          headerStyle: { backgroundColor: "#0A3A9E" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700", fontSize: 18 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/posts")} style={styles.backButton}>
              <Text style={{ color: "white", marginLeft: 10, fontSize: 16, fontWeight: "600" }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <CalendarIcon size={24} color="#0A3A9E" />
          <Text style={styles.header}>Select a Date</Text>
        </View>

        <View style={styles.calendarWrapper}>
          <Calendar
            minDate={new Date().toISOString().split("T")[0]}
            onDayPress={(day) => {
              console.log('📅 Date selected:', day.dateString);
              setSelectedDate(day.dateString);
              setSelectedSlot(null);
              setResellAmount('');
            }}
            markedDates={
              selectedDate ? {
                [selectedDate]: {
                  selected: true,
                  selectedColor: "#F7CD00",
                  selectedTextColor: "#0A3A9E",
                  customStyles: {
                    container: {
                      borderRadius: 25,
                    }
                  }
                }
              } : {}
            }
            theme={{
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#0A3A9E',
              textSectionTitleFontWeight: '600',
              selectedDayBackgroundColor: '#F7CD00',
              selectedDayTextColor: '#0A3A9E',
              todayTextColor: '#0A3A9E',
              todayBackgroundColor: '#F3F4F6',
              dayTextColor: '#374151',
              textDisabledColor: '#D1D5DB',
              dotColor: '#F7CD00',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#0A3A9E',
              monthTextColor: '#0A3A9E',
              indicatorColor: '#0A3A9E',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
              'stylesheet.calendar.header': {
                dayTextAtIndex0: {
                  color: '#EF4444'
                },
                dayTextAtIndex6: {
                  color: '#EF4444'
                }
              }
            }}
            style={styles.calendar}
          />
        </View>

        {selectedDate && (
          <>
            <View style={styles.headerSection}>
              <Clock size={24} color="#0A3A9E" />
              <Text style={styles.header}>Available Slots</Text>
            </View>

            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#F7CD00" />
                <Text style={styles.loaderText}>Loading slots...</Text>
              </View>
            ) : slots.length > 0 ? (
              <FlatList
                data={slots}
                numColumns={2}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderSlot}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.slotsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <XCircle size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No slots available</Text>
                <Text style={styles.emptySubtext}>Please select another date</Text>
              </View>
            )}
          </>
        )}
      </View>

      <Modal
        visible={showDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCancel}
        >
          <Pressable
            style={styles.dialogContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dialogHeader}>
              <CheckCircle size={28} color="#10B981" />
              <Text style={styles.dialogTitle}>Confirm Booking</Text>
            </View>

            <View style={styles.dialogInfoRow}>
              <CalendarIcon size={18} color="#0A3A9E" />
              <Text style={styles.dialogText}>{selectedDate}</Text>
            </View>

            <View style={styles.dialogInfoRow}>
              <Clock size={18} color="#0A3A9E" />
              <Text style={styles.dialogText}>{selectedSlot?.startTime} - {selectedSlot?.endTime}</Text>
            </View>

            {selectedSlot?.isPremium && (
              <View style={styles.dialogPremiumBadge}>
                <Sparkles size={14} color="#F7CD00" />
                <Text style={styles.dialogPremiumText}>Premium Slot</Text>
              </View>
            )}

            <View style={styles.checkboxContainer}>
              <CheckBox
                value={isResell}
                onValueChange={setIsResell}
                tintColors={{ true: '#F7CD00', false: '#D1D5DB' }}
              />
              <Text style={styles.checkboxLabel}>This is a resell slot</Text>
            </View>

            {isResell && (
              <View style={styles.amountContainer}>
                <View style={styles.amountLabelContainer}>
{/*                   <DollarSign size={16} color="#0A3A9E" /> */}
                  <Text style={styles.amountLabel}>Resell Amount (₹)</Text>
                </View>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount in rupees"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={resellAmount}
                  onChangeText={setResellAmount}
                />
              </View>
            )}

            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogButton, styles.confirmButton]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {selectedDate && selectedSlot && (
        <TouchableOpacity
          style={[styles.scheduleButton, loading && styles.scheduleButtonDisabled]}
          onPress={handleSchedule}
          disabled={loading}
          activeOpacity={loading ? 1 : 0.8}
        >
          {loading ? (
            <ActivityIndicator color="#0A3A9E" />
          ) : (
            <>
              <CheckCircle size={20} color="#0A3A9E" />
              <Text style={styles.scheduleText}>Schedule Slot</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default CreateSlotScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    padding: 8,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A3A9E",
  },
  calendarWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calendar: {
    borderRadius: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 12,
  },
  slotsList: {
    paddingBottom: 20,
  },
  slot: {
    flex: 1,
    marginVertical: 4,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
   shadowColor: "transparent",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slotIcon: {
    marginRight: 4,
  },
  availableSlot: {
    backgroundColor: "#10B981",
  },
  bookedSlot: {
    backgroundColor: "#EF4444",
    opacity: 0.7,
  },
  resaleSlot: {
    backgroundColor: "#F7CD00",
  },
  selectedSlot: {
    backgroundColor: "#0A3A9E",
    borderWidth: 2,
    borderColor: "#F7CD00",
    transform: [{ scale: 1.02 }],
  },
  slotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectedSlotText: {
    color: "#FFFFFF",
  },
  premiumBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#0A3A9E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#F7CD00",
  },
  resellBadge: {
    position: "absolute",
    top: -8,
    left: -8,
    backgroundColor: "#0A3A9E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resellBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
    color: '#0A3A9E',
  },
  dialogInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  dialogText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  dialogPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 12,
  },
  dialogPremiumText: {
    fontSize: 14,
    color: '#F7CD00',
    fontWeight: '700',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  dialogButtons: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#F7CD00',
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#0A3A9E',
    fontSize: 15,
    fontWeight: '700',
  },
  amountContainer: {
    width: '100%',
    marginBottom: 16,
  },
  amountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  amountInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontWeight: '500',
  },
  scheduleButton: {
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: "#F7CD00",
    padding: 16,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#F7CD00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  scheduleButtonDisabled: {
    opacity: 0.6,
  },
  scheduleText: {
    color: "#0A3A9E",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
  },
});