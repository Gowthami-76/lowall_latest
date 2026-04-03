import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Send, Phone, Video, MoveVertical as MoreVertical, Calendar, Clock, Flag, UserX, Wallet, CheckCircle, IndianRupee } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@/utils/constants';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSlotDetails, setShowSlotDetails] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);

  const sendButtonScale = useSharedValue(1);

  // Fetch chat messages from API
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "Please login to view messages");
        router.back();
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/slot-message/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Messages fetched:", data);

      if (response.ok && data.success) {
        // Transform API data to match component structure
        const transformedMessages = data.messages?.map(msg => ({
          id: msg._id,
          senderId: msg.senderId?._id,
          message: msg.message,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: msg.senderId?._id === data.currentUserId,
        })) || [];

        setMessages(transformedMessages);

        // Set chat info from slot data
        if (data.slot) {
          setChatInfo({
            sellerId: data.slot.userId?._id,
            sellerName: data.slot.userId?.fullName || 'User',
            sellerImage: data.slot.userId?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
            slotDetails: {
              timeSlot: `${data.slot.startTime} - ${data.slot.endTime}`,
              date: data.slot.date,
              price: data.slot.salePrice || data.slot.price || 0,
              category: data.slot.postId?.title || 'Premium Slot',
            },
          });
        }
      } else {
        Alert.alert("Error", data.message || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Network error while loading messages");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Refresh messages when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Chat screen focused, refreshing messages");
      fetchMessages();

      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }, [fetchMessages])
  );

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    sendButtonScale.value = withSpring(1.2, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    try {
      setSending(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "Please login to send messages");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/slot-message/${id}/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add message locally
        const message = {
          id: Date.now(),
          senderId: 'me',
          message: newMessage.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert("Error", data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Network error while sending message");
    } finally {
      setSending(false);
    }
  };

  const handleAcceptOffer = () => {
    Alert.alert(
      'Accept Offer',
      `Accept the offer for ₹${chatInfo?.slotDetails.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            router.push(`/purchase/${id}`);
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam' },
        { text: 'Inappropriate Behavior' },
        { text: 'Fraud/Scam', style: 'destructive' }
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You won\'t receive messages from them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert('User Blocked', 'You have blocked this user.');
            router.back();
          }
        }
      ]
    );
  };

  const showMoreOptions = () => {
    Alert.alert(
      'More Options',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report User', onPress: handleReportUser },
        { text: 'Block User', onPress: handleBlockUser, style: 'destructive' }
      ]
    );
  };

  const MessageBubble = ({ message }) => (
    <View style={[
      styles.messageBubble,
      message.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <Text style={[
        styles.messageText,
        message.isOwn ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {message.message}
      </Text>
      <Text style={[
        styles.messageTime,
        message.isOwn ? styles.ownMessageTime : styles.otherMessageTime
      ]}>
        {message.timestamp}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F7CD00" />
        <Text style={styles.loaderText}>Loading messages...</Text>
      </View>
    );
  }

  if (!chatInfo) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <MessageCircle size={64} color="#F7CD00" />
        </View>
        <Text style={styles.errorText}>Chat not found</Text>
        <Text style={styles.errorSubText}>The conversation you're looking for doesn't exist</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonErrorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={{ uri: chatInfo.sellerImage }} style={styles.headerImage} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{chatInfo.sellerName}</Text>
            <View style={styles.statusDot} />
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Video size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={showMoreOptions}
          >
            <MoreVertical size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slot Details Card */}
      {showSlotDetails && (
        <Animated.View style={styles.slotDetailsCard}>
          <View style={styles.slotDetailsHeader}>
            <View style={styles.slotTitleContainer}>
              <Wallet size={18} color="#F7CD00" />
              <Text style={styles.slotDetailsTitle}>Premium Slot Details</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSlotDetails(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slotDetailsContent}>
            <View style={styles.slotDetailRow}>
              <Calendar size={16} color="#F7CD00" />
              <Text style={styles.slotDetailText}>{chatInfo.slotDetails.date}</Text>
            </View>
            <View style={styles.slotDetailRow}>
              <Clock size={16} color="#F7CD00" />
              <Text style={styles.slotDetailText}>{chatInfo.slotDetails.timeSlot}</Text>
            </View>
            <View style={styles.slotDetailRow}>
              <IndianRupee size={16} color="#10B981" />
              <Text style={styles.slotDetailPrice}>{chatInfo.slotDetails.price}</Text>
            </View>
            <View style={styles.slotDetailRow}>
              <CheckCircle size={16} color="#F7CD00" />
              <Text style={styles.slotDetailText}>{chatInfo.slotDetails.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.acceptOfferButton}
            onPress={handleAcceptOffer}
          >
            <Text style={styles.acceptOfferButtonText}>Accept Offer & Proceed</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />

        <Animated.View style={sendButtonAnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() && styles.sendButtonActive
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color={newMessage.trim() ? '#FFFFFF' : '#9CA3AF'} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotDetailsCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  slotDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  slotTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  slotDetailsContent: {
    gap: 12,
    marginBottom: 20,
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  slotDetailPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  acceptOfferButton: {
    backgroundColor: '#F7CD00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptOfferButtonText: {
    color: '#0A3A9E',
    fontSize: 15,
    fontWeight: '800',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#F7CD00',
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#0A3A9E',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(10, 58, 158, 0.6)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#F7CD00',
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  backButtonError: {
    backgroundColor: '#F7CD00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonErrorText: {
    color: '#0A3A9E',
    fontSize: 14,
    fontWeight: '700',
  },
});