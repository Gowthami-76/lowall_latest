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
            // if (secondData.success) {
            //   Alert.alert(
            //     "Success",
            //     `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
            //     [
            //       {
            //         text: "OK",
            //         onPress: () => router.push("/(tabs)"),
            //       },
            //     ]
            //   );
            // } else {
            //   Alert.alert(
            //     "Slot booked",
            //     "Slot booked successfully, but resell failed"
            //   );
            // }
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
            // if (secondData.success) {
            //   Alert.alert(
            //     "Success",
            //     `Slot booked for ${selectedDate} (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
            //     [
            //       {
            //         text: "OK",
            //         onPress: () => router.push("/(tabs)"),
            //       },
            //     ]
            //   );
            // } else {
            //   Alert.alert(
            //     "Slot booked",
            //     "Slot booked successfully, but resell failed"
            //   );
            // }
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

    // Only disable if booked AND NOT a resell slot
    const isDisabled = item.isBooked && item.saleStatus !== "available";

    return (
      <TouchableOpacity
        disabled={isDisabled}
        onPress={() => handleSlotPress(item)}
        style={[
          styles.slot,
          item.isBooked && item.saleStatus !== "available" && styles.bookedSlot,
          item.saleStatus === "available" && styles.resaleSlot,
          isSelected && styles.selectedSlot,
        ]}
      >
        <Text style={[styles.slotText, isSelected && { color: "white" }]}>
          {item.startTime} - {item.endTime}
        </Text>

        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>♔ Premium</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Create Slot",
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/posts")}>
              <Text style={{ color: "white", marginLeft: 10 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={styles.header}>Select a Date</Text>
      <Calendar
        minDate={new Date().toISOString().split("T")[0]}
        onDayPress={(day) => {
          console.log('📅 Date selected:', day.dateString);
          setSelectedDate(day.dateString);
          setSelectedSlot(null); // Clear slot selection when date changes
          setResellAmount(''); // Clear resell amount
        }}
        markedDates={
          selectedDate ? { [selectedDate]: { selected: true } } : {}
        }
      />

      {selectedDate && (
        <>
          <Text style={styles.header}>Available Slots</Text>

          {loading ? (
            <ActivityIndicator size="large" color="blue" />
          ) : slots.length > 0 ? (
            <FlatList
              data={slots}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderSlot}
              columnWrapperStyle={{ justifyContent: "space-between" }}
            />
          ) : (
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No slots available
            </Text>
          )}
        </>
      )}

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
            <Text style={styles.dialogTitle}>Confirm Booking</Text>
            
            <Text style={styles.dialogText}>
              📅 {selectedDate}
            </Text>
            
            <Text style={styles.dialogText}>
              🕒 {selectedSlot?.startTime} - {selectedSlot?.endTime}
            </Text>
            
            {selectedSlot?.isPremium && (
              <Text style={styles.premiumLabel}>♔ Premium Slot</Text>
            )}

            <View style={styles.checkboxContainer}>
              <CheckBox
                value={isResell}
                onValueChange={setIsResell}
                tintColors={{ true: '#007AFF', false: '#999' }}
              />
              <Text style={styles.checkboxLabel}>This is a resell</Text>
            </View>

            {isResell && (
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Resell Amount (₹)</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount in rupees"
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
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {selectedDate && selectedSlot && (
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={handleSchedule}
          disabled={loading}
          activeOpacity={loading ? 1 : 0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scheduleText}>Schedule Slot</Text>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default CreateSlotScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  header: { fontSize: 18, fontWeight: "600", marginVertical: 12 },
  slot: {
    flex: 1,
    margin: 5,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: "#56b75eff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bookedSlot: {
    backgroundColor: "#f44336",
  },
  resaleSlot: {
    backgroundColor: "#ea8417e9",
  },
  selectedSlot: {
    backgroundColor: "#2563EB",
  },
  slotText: { fontSize: 14, fontWeight: "500", color: "#111827" },
  premiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "gold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumLabel: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dialogButtons: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  amountContainer: {
    width: '100%',
    marginTop: 15,
  },
  amountLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  premiumText: { fontSize: 10, fontWeight: "bold", color: "#000" },
  scheduleButton: {
    marginTop: 20,
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  scheduleText: { color: "white", fontSize: 16, fontWeight: "600" },
});
