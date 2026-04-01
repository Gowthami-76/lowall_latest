import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Calendar,
  Star,
  TrendingUp,
  X
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BASE_URL } from '@/utils/constants';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const categories = ['All', 'Prime Morning', 'Evening Peak', 'New Year Special', 'Afternoon'];

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [marketplaceSlots, setMarketplaceSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [postDialogVisible, setPostDialogVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postPage, setPostPage] = useState(1);
  const [postLoading, setPostLoading] = useState(false);
  const [postLoadingMore, setPostLoadingMore] = useState(false);
  const [postHasMore, setPostHasMore] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Animation for bottom sheet
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Debug logging
  useEffect(() => {
    console.log('🔵 Modal visible state changed:', postDialogVisible);
    console.log('🔵 Posts count:', posts.length);
    console.log('🔵 Post loading:', postLoading);
  }, [postDialogVisible, posts.length, postLoading]);

  // Animate bottom sheet
  useEffect(() => {
    if (postDialogVisible) {
      translateY.value = withSpring(0, { damping: 15 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [postDialogVisible]);
  
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const requestSlotAndFetchMessages = async (slot) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No token found. Please login again.");
        return null;
      }
      console.log("Slot Request slotid:", slot._id);

      const reqRes = await fetch(
        `${BASE_URL}/v1/slot-request/${slot._id}/request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            post: String(slot.postId?._id),
            message: "Requesting slot",
          }),
        }
      );

      const reqData = await reqRes.json();
      console.log("Slot Request Response:", reqData);

      if (!reqRes.ok || !reqData.success) {
        Alert.alert("Failed", reqData?.message || "Slot request failed");
        return null;
      }

      const slotRequestId = reqData?.slotRequest?._id;
      if (!slotRequestId) {
        Alert.alert("Error", "Slot request ID not returned");
        return null;
      }

      const msgRes = await fetch(
        `${BASE_URL}/v1/slot-message/${slotRequestId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const msgData = await msgRes.json();
      console.log("Slot Message Response:", msgData);

      if (!msgRes.ok) {
        Alert.alert("Failed", msgData?.message || "Unable to fetch messages");
        return null;
      }

      return slotRequestId;

    } catch (err) {
      console.error("Slot Request Error:", err);
      Alert.alert("Error", "Something went wrong");
      return null;
    }
  };

  const fetchMarketplaceSlots = async (pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'No token found. Please login again.');
        setMarketplaceSlots([]);
        return;
      } 

      const res = await fetch(`${BASE_URL}/v1/slot/marketplace?page=${pageNum}&limit=10`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      console.log("market place response", pageNum, data);

      if (res.ok) {
        setMarketplaceSlots(prev =>
          pageNum === 1 ? data?.data : [...prev, ...data?.data]
        );
        setHasMore(data?.data?.length >= 10);
      } else {
        Alert.alert('Failed', data?.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unable to fetch slots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - refreshing marketplace slots');
      setLoading(true);
      setPage(1);
      fetchMarketplaceSlots(1);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchMarketplaceSlots(1);
  };

  const loadMore = () => {
    if (!loading && hasMore && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMarketplaceSlots(nextPage).finally(() => setLoadingMore(false));
    }
  };

  const filteredData =
    selectedCategory === 'All'
      ? marketplaceSlots
      : marketplaceSlots.filter(slot => slot.postId?.title === selectedCategory);

  const fetchPosts = async (userId, pageNum = 1) => {
    try {
      console.log('=== FETCHING POSTS ===');
      console.log('User ID:', userId);
      console.log('Page:', pageNum);

      if (pageNum === 1) {
        setPostLoading(true);
        setPosts([]);
      } else {
        setPostLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('authToken');

      const res = await fetch(
        `${BASE_URL}/v1/post?page=${pageNum}&limit=10&createdBy=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await res.json();
      console.log("Posts API response:", result);

      if (res.ok) {
        const newPosts = pageNum === 1 ? result.data : [...posts, ...result.data];
        console.log('Updated posts count:', newPosts.length);
        setPosts(newPosts);
        setPostHasMore(pageNum < result.totalPages);
        setPostPage(pageNum);
      } else {
        Alert.alert('Failed', result?.message || 'Unable to fetch posts');
      }
    } catch (e) {
      console.error('Fetch posts error:', e);
      Alert.alert('Error', 'Unable to fetch posts');
    } finally {
      setPostLoading(false);
      setPostLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!postLoadingMore && postHasMore && currentUserId) {
      fetchPosts(currentUserId, postPage + 1);
    }
  };

  const handleBuyNowPress = (slot) => {
    console.log('=== BUY NOW CLICKED ===');
    console.log('Slot ID:', slot._id);
    console.log('User ID:', slot.userId?._id);
    console.log('Current modal visible:', postDialogVisible);

    const userId = slot.userId?._id;
    
    if (!userId) {
      Alert.alert('Error', 'Invalid user ID');
      return;
    }

    // Store IDs
    setSelectedSlotId(slot._id);
    setCurrentUserId(userId);

    // Reset modal state
    setPosts([]);
    setPostPage(1);
    setPostHasMore(true);

    // Open modal
    console.log('Setting modal visible to TRUE');
    setPostDialogVisible(true);

    // Fetch posts
    console.log('Calling fetchPosts...');
    fetchPosts(userId, 1);
  };

  const handleCloseModal = () => {
    console.log('=== CLOSING MODAL ===');
    setPostDialogVisible(false);
    setPosts([]);
    setSelectedSlotId(null);
    setCurrentUserId(null);
    setPostPage(1);
    setPostLoading(false);
    setPostLoadingMore(false);
  };

  const handlePurchase = async (postId, postTitle) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'No token found. Please login again.');
        return;
      }

      console.log('Purchasing slot with:', { slotId: selectedSlotId, postId });

      const response = await fetch(`${BASE_URL}/v1/slot/buy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: selectedSlotId,
          postId: postId,
        }),
      });

      const data = await response.json();
      console.log('Purchase API Response:', data);

      if (response.ok && data.success) {
        Alert.alert(
          'Purchase Successful! 🎉',
          data.message || 'Your slot has been purchased successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleCloseModal();
                // Refresh marketplace slots
                setPage(1);
                fetchMarketplaceSlots(1);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          data.message || 'Unable to complete the purchase. Please try again.'
        );
      }
    } catch (error) {
      console.error('Purchase Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handlePostClick = (item) => {
    console.log('Post clicked - Post ID:', item._id);
    console.log('Selected Slot ID:', selectedSlotId);
    console.log('Post Status:', item.approveStatus);
    
    // Show confirmation alert for all posts
    Alert.alert(
      'Confirm Purchase',
      `Do you want to purchase this slot with the post`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Confirm Purchase', 
          onPress: () => handlePurchase(item._id, item.title),
          style: 'default'
        }
      ]
    );
  };

  const renderPostItem = ({ item }) => {
    // Determine badge color based on status
    const getStatusColor = (status) => {
      switch (status) {
        case 'approved':
          return '#10B981'; // Green
        case 'pending':
          return '#F59E0B'; // Orange
        case 'rejected':
          return '#EF4444'; // Red
        default:
          return '#6B7280'; // Gray
      }
    };

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => handlePostClick(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
        <View style={styles.postInfo}>
          <Text style={styles.postTitle}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approveStatus) }]}>
            <Text style={styles.statusText}>{item.approveStatus?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.postContent}>
          {item.content}
        </Text>
      
      </TouchableOpacity>
    );
  };

  const SlotCard = ({ slot }) => {
    const scaleValue = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleValue.value }] }));

    const onPressIn = () => { scaleValue.value = withSpring(0.98); };
    const onPressOut = () => { scaleValue.value = withSpring(1); };

    const handleChatPress = async (slot) => {
      setChatLoading(true);
      const slotRequestId = await requestSlotAndFetchMessages(slot);
      setChatLoading(false);

      if (slotRequestId) {
        router.push(`/comments/${slotRequestId}`);
      }
    };

    return (
      <Animated.View style={[styles.slotCard, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => router.push(`/slot-details/${slot._id}`)}
        >
          {slot.salePrice && (
            <View style={styles.premiumBadge}>
              <Star size={12} color="white" fill="white" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}

          <View style={styles.sellerContainer}>
            <Image
              source={{ uri: slot.postId?.mediaUrl || 'https://via.placeholder.com/150' }} 
              style={styles.sellerImage}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{slot.userId?.fullName || 'Unknown'}</Text>
              <Text style={styles.categoryText}>{slot.postId?.title || ''}</Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <View style={styles.timeRow}>
              <Clock size={16} color="#8B5CF6" />
              <Text style={styles.timeSlotText}>{slot.startTime} - {slot.endTime}</Text>
            </View>
            <View style={styles.timeRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.dateText}>{slot.date}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>{slot.saleDescription}</Text>

          {slot.salePrice && (
            <View style={styles.pricingContainer}>
              <Text style={styles.askingPrice}>{slot.salePrice}</Text>
            </View>
          )}

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={(e) => {
                e.stopPropagation();
                handleChatPress(slot);
              }}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <>
                  <MessageSquare size={16} color="#8B5CF6" />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </>
              )}
            </TouchableOpacity>

            {slot.salePrice && (
              <TouchableOpacity 
                style={styles.buyButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  handleBuyNowPress(slot);
                }}
              >
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  if (loading && page === 1)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Slot Marketplace</Text>
        <Text style={styles.headerSubtitle}>Buy premium time slots from other users</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected
            ]}
            onPress={() => handleCategoryFilter(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextSelected
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        style={styles.marketplaceList}
        contentContainerStyle={styles.marketplaceContent}
        data={filteredData}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={({ item }) => <SlotCard slot={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8B5CF6']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#8B5CF6" style={{ marginVertical: 16 }} />
          ) : null
        }
      />

      {/* CUSTOM BOTTOM SHEET - Alternative to Modal */}
      {postDialogVisible && (
        <View style={styles.bottomSheetContainer}>
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />
          </Animated.View>

          {/* Bottom Sheet */}
          <Animated.View style={[styles.bottomSheet, animatedSheetStyle]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Seller Posts ({posts.length})</Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sheetContent}>
              {postLoading ? (
                <View style={styles.sheetLoaderContainer}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={styles.loadingText}>Loading posts...</Text>
                </View>
              ) : posts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts available</Text>
                </View>
              ) : (
                <FlatList
                  data={posts}
                  keyExtractor={(item) => item._id}
                  renderItem={renderPostItem}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={true}
                  onEndReached={loadMorePosts}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={
                    postLoadingMore ? (
                      <ActivityIndicator size="small" color="#8B5CF6" style={{ marginTop: 10 }} />
                    ) : null
                  }
                />
              )}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: 'white',
  },
  marketplaceList: {
    flex: 1,
  },
  marketplaceContent: {
    padding: 16,
  },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  timeContainer: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  pricingContainer: {
    marginBottom: 16,
  },
  askingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  buyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  // Bottom Sheet Styles
  bottomSheetContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  postCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  postImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  postInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  postTitleDisabled: {
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  postContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  postContentDisabled: {
    color: '#9CA3AF',
  },
  tapIndicator: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  tapIndicatorText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  sheetLoaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
