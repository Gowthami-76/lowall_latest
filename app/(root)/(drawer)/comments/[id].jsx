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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Heart, MessageCircle, User, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/utils/constants';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  const sendButtonScale = useSharedValue(1);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Add user profile state
  const [userData, setUserData] = useState(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  console.log("slot id", id);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    if (!userId) return;

    try {
      setLoadingUserProfile(true);

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
        console.log("User profile loaded in comments:", json.data);
      } else {
        console.error("Profile API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoadingUserProfile(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUserId = async () => {
        const id = await AsyncStorage.getItem("userId");
        setCurrentUserId(id);
        console.log("Current User ID:", id);
        if (id) {
          fetchUserProfile(id);
        }
      };

      fetchUserId();

      return () => {
        // optional cleanup
      };
    }, [])
  );

  // Fetch API comments
  useEffect(() => {
    const fetchComments = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId");
      setCurrentUserId(userId);

      if (!token) {
        console.log("No token found");
        return;
      }
      try {
        const response = await fetch(`${BASE_URL}/v1/comment?slotId=${id}&page=1&limit=10`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();

        const mapped = result.data.map(item => {
          const isOwn = item.user._id === userId;
          console.log("API Comment:", item.text, "by", item.user.fullName, "| isOwn:", isOwn);
          return {
            id: item._id,
            username: isOwn ? "You" : item.user.fullName,
            userImage: item.user.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            message: item.text,
            timestamp: new Date(item.createdAt).toLocaleString(),
            likes: 0,
            isLiked: false,
            isOwn,
          };
        });

        setComments(mapped);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [id]);

  // Helper function to get current user's avatar
  const getCurrentUserAvatar = () => {
    return userData?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    sendButtonScale.value = withSpring(1.2, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    try {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        Alert.alert("Error", "You must be logged in to comment.");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot: id,
          text: newComment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Comment failed:", result);
        Alert.alert("Error", result.message || "Failed to post comment");
        return;
      }

      const newCommentObj = {
        id: result._id,
        username: "You",
        userImage: getCurrentUserAvatar(),
        message: result.text,
        timestamp: new Date(result.createdAt).toLocaleString(),
        likes: 0,
        isLiked: false,
        isOwn: true,
      };

      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      Keyboard.dismiss();
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleLikeComment = (commentId) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
        : comment
    ));
  };

  const CommentItem = ({ comment }) => {
    const likeScale = useSharedValue(1);

    const likeAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: likeScale.value }],
    }));

    const onLike = () => {
      likeScale.value = withSpring(1.3, {}, () => {
        likeScale.value = withSpring(1);
      });
      handleLikeComment(comment.id);
    };

    return (
      <View style={styles.commentItem}>
        <Image source={{ uri: comment.userImage }} style={styles.userImage} />

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <View style={styles.userInfoContainer}>
              <User size={12} color="#F7CD00" />
              <Text style={styles.username}>{comment.username}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Clock size={10} color="#9CA3AF" />
              <Text style={styles.timestamp}>{comment.timestamp}</Text>
            </View>
          </View>

          <Text style={styles.commentMessage}>{comment.message}</Text>

          <View style={styles.commentActions}>
            <Animated.View style={likeAnimatedStyle}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={onLike}
              >
                <Heart
                  size={16}
                  color={comment.isLiked ? '#EC4899' : '#6B7280'}
                  fill={comment.isLiked ? '#EC4899' : 'none'}
                />
                <Text style={[
                  styles.likeText,
                  comment.isLiked && styles.likedText
                ]}>
                  {comment.likes}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    );
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <MessageCircle size={20} color="#F7CD00" />
              <Text style={styles.headerTitle}>Comments ({comments.length})</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#F7CD00" />
              <Text style={styles.loaderText}>Loading comments...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.commentsContent}
              keyboardShouldPersistTaps="handled"
            >
              {displayedComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {comments.length > 3 && !showAllComments && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAllComments(true)}
                >
                  <Text style={styles.viewAllText}>
                    View all {comments.length} comments
                  </Text>
                </TouchableOpacity>
              )}

              {comments.length === 0 && (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color="#F7CD00" />
                  <Text style={styles.emptyStateText}>No comments yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Be the first to share your thoughts!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            {loadingUserProfile ? (
              <View style={styles.inputUserImagePlaceholder}>
                <ActivityIndicator size="small" color="#F7CD00" />
              </View>
            ) : (
              <Image
                source={{ uri: getCurrentUserAvatar() }}
                style={styles.inputUserImage}
                onError={(e) => {
                  console.log('User avatar load error in comments:', e.nativeEvent.error);
                }}
              />
            )}

            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                autoCorrect={true}
                spellCheck={true}
                contextMenuHidden={false}
                enablesReturnKeyAutomatically={true}
                returnKeyType="send"
                onSubmitEditing={handleSendComment}
              />
            </View>

            <Animated.View style={sendButtonAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newComment.trim() && styles.sendButtonActive
                ]}
                onPress={handleSendComment}
                disabled={!newComment.trim()}
              >
                <Send size={20} color={newComment.trim() ? '#FFFFFF' : '#9CA3AF'} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#0A3A9E',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
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
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 16,
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  commentMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  likeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  likedText: {
    color: '#EC4899',
  },
  viewAllButton: {
    backgroundColor: '#F7CD00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F7CD00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A3A9E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  inputUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  inputUserImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
});