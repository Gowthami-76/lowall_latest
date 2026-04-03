import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  Settings,
  Bell,
  Calendar,
  Image as ImageIcon,
  Clock,
  Heart,
  Star,
  MessageCircle,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CircleAlert as AlertCircle,
  Share2,
  Wallet,
  User,
  MapPin,
  Mail,
  Calendar as CalendarIcon,
  Award,
  TrendingUp,
  CreditCard,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@/utils/constants';
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('wallpapers');
  const [userWallpapers, setUserWallpapers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsPage, setSlotsPage] = useState(1);
  const [hasMoreSlots, setHasMoreSlots] = useState(true);

  // Add new state for user profile data
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Add new state for user stats data
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Add new state for wallet balance
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);



  // New function to fetch user profile data
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
  await AsyncStorage.setItem('userProfile', JSON.stringify(json.data));

        console.log("Profile data fetched:", json.data);
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

  // New function to fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingStats(true);
      setStatsError(null);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found for stats fetch");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/users/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (json.success && json.data) {
        setUserStats(json.data);
        console.log("User stats fetched:", json.data);
      } else {
        setStatsError("Failed to fetch user stats");
        console.error("Stats API error:", json);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setStatsError("Network error while fetching stats");
    } finally {
      setLoadingStats(false);
    }
  }, [userId]);

  // New function to fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingWallet(true);
      setWalletError(null);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found for wallet fetch");
        return;
      }

      const response = await fetch(`${BASE_URL}/v1/wallet/balance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (json.balance !== undefined) {
        setWalletBalance(json);
        console.log("Wallet balance fetched:", json);
      } else {
        setWalletError("Failed to fetch wallet balance");
        console.error("Wallet API error:", json);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletError("Network error while fetching wallet");
    } finally {
      setLoadingWallet(false);
    }
  }, [userId]);

  // Combined function to fetch profile, stats, and wallet
  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    // Fetch profile, stats, and wallet concurrently
    await Promise.all([
      fetchUserProfile(),
      fetchUserStats(),
      fetchWalletBalance()
    ]);
  }, [userId, fetchUserProfile, fetchUserStats, fetchWalletBalance]);

const checkLoginStatus = useCallback(async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const id = await AsyncStorage.getItem("userId");

    console.log("checkLoginStatus called");

    if (token && id) {
      setIsLoggedIn(true);
      setUserId(id);
    } else {
      setIsLoggedIn(false);
      setUserId(null);
    }
  } catch (err) {
    console.error("Error checking login:", err);
  }
}, []);

  useEffect(() => {
  checkLoginStatus();
}, [checkLoginStatus]);
  // Refresh API when Profile tab is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Profile screen focused, refreshing:", activeTab);
    checkLoginStatus();

      if (activeTab === "wallpapers") {
        fetchWallpapers(1, true);
      } else if (activeTab === "slots") {
        fetchSlots(1, true);
      }

      // Also refresh profile data, stats, and wallet
      if (isLoggedIn && userId) {
        fetchUserData();
      }
    }, [activeTab, userId, isLoggedIn, fetchUserData])
  );

  const fetchWallpapers = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      console.log("fetch wall paper");
      if (loading) return;
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        const id = await AsyncStorage.getItem("userId");

        if (!token) {
          console.log("No token found");
          return;
        }

        console.log("fetch wall paper 111", userId);

        const res = await fetch(`${BASE_URL}/v1/post?page=${pageNum}&limit=${limit}&createdBy=${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();

        console.log("response", json.data);
        if (isRefresh) {
          setUserWallpapers(json.data);
        } else {
          setUserWallpapers((prev) => [...prev, ...json.data]);
        }

        setHasMore(json.data.length > 0);
      } catch (e) {
        console.error("Error fetching wallpapers", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading, limit]
  );

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);

    // Refresh profile data, stats, wallet, and tab content
    fetchUserData();

    if (activeTab === "wallpapers") {
      setPage(1);
      await fetchWallpapers(1, true);
    } else if (activeTab === "slots") {
      console.log("refresh");
      await fetchSlots(1, true);
    }
  };

  const loadMore = () => {
    if (activeTab === 'wallpapers' && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWallpapers(nextPage);
    } else if (activeTab === 'slots' && !loadingSlots && hasMoreSlots) {
      console.log("loadmore");
      const nextPage = slotsPage + 1;
      setSlotsPage(nextPage);
      fetchSlots(nextPage, true);
    }
  };

  const fetchSlots = async (page = 1, isRefresh = false) => {
    if (!userId) return;
    if (loadingSlots) return;
    try {
      setLoadingSlots(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(
        `${BASE_URL}/v1/slot/${userId}?page=${page}&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await res.json();
      console.log("Slots API Response:", res.url);
      console.log("Slots API Response:", json);

      const slotData = Array.isArray(json.slots) ? json.slots : [];

      if (slotData.length > 0) {
        if (isRefresh) {
          setSlots(slotData);
          setSlotsPage(1);
        } else {
          setSlots((prev) => [...prev, ...slotData]);
          setSlotsPage(page);
        }
        setHasMoreSlots(true);
      } else {
        setHasMoreSlots(false);
      }

      setHasMoreSlots(slotData.length > 0);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
      setRefreshing(false);
    }
  };

  const handleRefreshSlots = () => {
    setRefreshing(true);
    fetchSlots(1, true);
  };

  const loadMoreSlots = () => {
    if (!loadingSlots && hasMoreSlots) {
      fetchSlots(slotsPage + 1);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isLoggedIn) return;

    console.log("activetab", activeTab);
    if (activeTab === "wallpapers" && userWallpapers.length === 0) {
      fetchWallpapers(1, true);
    } else if (activeTab === "slots" && slots.length === 0) {
      fetchSlots(1, true);
    }
  }, [isLoggedIn, activeTab]);

  // Simple login function for demo
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userId");
    setIsLoggedIn(false);
    setUserData(null); // Clear profile data
    setUserStats(null); // Clear stats data
    setWalletBalance(null); // Clear wallet data
    setActiveTab('wallpapers');
  };

  // Share app function
  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: 'Check out Lowall - The best app for beautiful wallpapers and custom messages! Download it now and make your phone screen amazing! 🎨✨',
        title: 'Share Lowall App',
        url: 'https://lowall.app',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('App shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share the app. Please try again.');
      console.error('Share error:', error);
    }
  };

  // Helper function to get user's join date
  const getJoinDate = (createdAt) => {
    if (!createdAt) return 'Recently';
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper function to get display name
  const getDisplayName = (userData) => {
    if (!userData) return 'Loading...';
    return userData.fullName || userData.firstName + ' ' + userData.lastName || 'User';
  };

  // Helper function to format wallet balance
  const formatBalance = (balance, currency = 'INR') => {
    if (balance === null || balance === undefined) return '...';
    return `₹${balance.toLocaleString('en-IN')}`;
  };

  const StatCard = ({ icon: Icon, title, value, color = '#0A3A9E' }) => {
    const scaleValue = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));
    const onPress = () => {
      scaleValue.value = withSpring(0.95, {}, () => {
        scaleValue.value = withSpring(1);
      });
    };
    return (
      <Animated.View style={[styles.statCard, animatedStyle]}>
        <TouchableOpacity onPress={onPress}>
          <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
            <Icon size={22} color={color} />
          </View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle size={14} color="#10B981" />,
          text: "Approved",
          bg: "#D1FAE5",
          color: "#065F46"
        };
      case "pending":
        return {
          icon: <AlertCircle size={14} color="#F7CD00" />,
          text: "Pending",
          bg: "#FEF3C7",
          color: "#92400E"
        };
      case "rejected":
        return {
          icon: <XCircle size={14} color="#EF4444" />,
          text: "Rejected",
          bg: "#FEE2E2",
          color: "#991B1B"
        };
      default:
        return {
          icon: null,
          text: "Unknown",
          bg: "#E5E7EB",
          color: "#374151"
        };
    }
  };

  const WallpaperItem = ({ wallpaper }) => {
    const status = getStatusBadge(wallpaper.approveStatus);
    const formatDateTime = (isoString) => {
      const d = new Date(isoString);

      const date = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const time = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return `${date} ${time}`;
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/wallpaper/${wallpaper._id}`)}
      >
        <Image
          source={{ uri: wallpaper.mediaUrl || "https://via.placeholder.com/100" }}
          style={styles.wallpaperImage}
        />

        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>{wallpaper.title}</Text>

          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            {status.icon}
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>

          <View style={styles.row}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.text}>
              {formatDateTime(wallpaper.createdAt)}
            </Text>
          </View>

          <View style={styles.row}>
            <Heart size={16} color="#EF4444" />
            <Text style={styles.count}>{wallpaper.likes || 0} Likes</Text>
            <MessageCircle size={16} color="#0A3A9E" style={{ marginLeft: 10 }} />
            <Text style={styles.count}>{wallpaper.comments || 0} Comments</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const PremiumSlotItem = ({ slot }) => {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    const isFutureSlot = slotDateTime > new Date();
    const isResellDisabled = slot.saleStatus === 'available';

    return (
      <View style={styles.slotItem}>
        <View style={styles.slotInfo}>
          <Text style={styles.slotDate}>{slot.date}</Text>
          <Text style={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
          <View style={styles.slotCategoryBadge}>
            <Star size={12} color="#F7CD00" />
            <Text style={styles.slotCategory}>{slot.isPremium ? 'Premium' : 'Standard'}</Text>
          </View>
          <View style={styles.slotStatusBadge}>
            <Text style={{ fontSize: 12, color: slot.isBooked ? '#EF4444' : '#10B981' }}>
              {slot.isBooked ? 'Booked' : 'Available'}
            </Text>
          </View>
        </View>
        <View style={styles.slotPrice}>
          <Text style={styles.priceText}>₹{slot.price || 0}</Text>
          {isFutureSlot && (
            <TouchableOpacity
              style={[styles.resellButton,
              isResellDisabled && { backgroundColor: '#F3F4F6' }
              ]}
              disabled={isResellDisabled}
              onPress={() =>
                router.push({
                  pathname: `/resell/[slot]`,
                  params: { slot: encodeURIComponent(JSON.stringify(slot)) },
                })
              }
            >
              <Text style={[
                styles.resellButtonText,
                isResellDisabled
                  ? { color: '#9CA3AF' }
                  : { color: '#FFFFFF' }
              ]}>Resell</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isLoggedIn ? (
          <>
            <View style={styles.headerContent}>
              {loadingProfile ? (
                <View style={styles.profileImagePlaceholder}>
                  <ActivityIndicator size="small" color="#F7CD00" />
                </View>
              ) : (
                <Image
                  source={{
                    uri: userData?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'
                  }}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.log('Profile image load error:', e.nativeEvent.error);
                  }}
                />
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {getDisplayName(userData)}
                </Text>
                <View style={styles.userDetailRow}>
                  <Mail size={12} color="#6B7280" />
                  <Text style={styles.userEmail}>
                    {userData?.email || 'Loading...'}
                  </Text>
                </View>
                <View style={styles.userDetailRow}>
                  <CalendarIcon size={12} color="#6B7280" />
                  <Text style={styles.joinDate}>
                    Member since {getJoinDate(userData?.createdAt)}
                  </Text>
                </View>
                {userData?.location && (
                  <View style={styles.userDetailRow}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.userLocation}>{userData.location}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Wallet Balance Display */}
            <TouchableOpacity
              style={styles.walletContainer}
              onPress={() => router.push('/wallet')}
            >
              <View style={styles.walletIconContainer}>
                <Wallet size={20} color="#F7CD00" />
              </View>
              <View style={styles.walletInfo}>
                {loadingWallet ? (
                  <ActivityIndicator size="small" color="#F7CD00" />
                ) : walletError ? (
                  <Text style={styles.walletErrorText}>Error</Text>
                ) : (
                  <>
                    <Text style={styles.walletLabel}>Wallet Balance</Text>
                    <Text style={styles.walletBalance}>
                      {formatBalance(walletBalance?.balance, walletBalance?.currency)}
                    </Text>
                  </>
                )}
              </View>
              <CreditCard size={16} color="#0A3A9E" />
            </TouchableOpacity>

            {(profileError || statsError || walletError) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {profileError || statsError || walletError}
                </Text>
                <TouchableOpacity onPress={fetchUserData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShareApp}>
                <Share2 size={22} color="#0A3A9E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/notifications')}>
                <Bell size={22} color="#0A3A9E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/settings')}>
                <Settings size={22} color="#0A3A9E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View>
            <TouchableOpacity style={styles.loginCard} onPress={() => router.push('/auth/login')}>
              <Text style={styles.welcomeText}>Welcome to Lowall</Text>
              <Text style={styles.subText}>Login to manage your wallpapers, profile and membership</Text>
              <View style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login / Register</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareAppButton} onPress={handleShareApp}>
              <Share2 size={20} color="#F7CD00" />
              <Text style={styles.shareAppButtonText}>Share Lowall with Friends</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoggedIn && (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatCard
              icon={ImageIcon}
              title="Uploaded"
              value={userStats?.posts || 0}
              color="#0A3A9E"
            />
            <StatCard
              icon={CheckCircle}
              title="Approved"
              value={userStats?.approvedPosts || 0}
              color="#10B981"
            />
            <StatCard
              icon={Star}
              title="Premium"
              value={userStats?.premiumSlots || 0}
              color="#F7CD00"
            />
            <StatCard
              icon={TrendingUp}
              title="Likes"
              value={userStats?.likes || 0}
              color="#EC4899"
            />
            {(loadingStats) && (
              <View style={styles.statsLoadingOverlay}>
                <ActivityIndicator size="small" color="#F7CD00" />
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'wallpapers' && styles.activeTab]}
              onPress={() => setActiveTab('wallpapers')}
            >
              <ImageIcon size={16} color={activeTab === 'wallpapers' ? '#F7CD00' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'wallpapers' && styles.activeTabText]}>
                My Wallpapers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'slots' && styles.activeTab]}
              onPress={() => setActiveTab('slots')}
            >
              <Star size={16} color={activeTab === 'slots' ? '#F7CD00' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'slots' && styles.activeTabText]}>
                Slots
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#F7CD00']} tintColor="#F7CD00" />
        }
        onMomentumScrollEnd={loadMore}
      >
        {!isLoggedIn && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Please login to access your profile</Text>
            <Text style={styles.loginPromptSubText}>
              View your wallpapers, manage premium slots, and track your stats
            </Text>
          </View>
        )}

        {isLoggedIn && activeTab === "wallpapers" && (
          <View style={styles.wallpapersList}>
            {userWallpapers.map((wallpaper) => (
              <WallpaperItem key={wallpaper._id} wallpaper={wallpaper} />
            ))}

            {loading && <ActivityIndicator style={{ margin: 20 }} color="#F7CD00" />}
            {!hasMore && <Text style={styles.endText}>No more wallpapers</Text>}
          </View>
        )}

        {isLoggedIn && activeTab === 'slots' && (
          <View style={styles.slotsList}>
            <TouchableOpacity
              style={styles.bookSlotButton}
              onPress={() => router.push('/premium-booking')}
            >
              <Calendar size={20} color="#0A3A9E" />
              <Text style={styles.bookSlotButtonText}>Book New Premium Slot</Text>
            </TouchableOpacity>
            {slots.length === 0 && !loadingSlots ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No slots found</Text>
            ) : (
              <>
                {slots.map((slot) => (
                  <PremiumSlotItem key={slot._id} slot={slot} />
                ))}
                {loadingSlots && <ActivityIndicator style={{ marginVertical: 20 }} color="#F7CD00" />}
                {!loadingSlots && !hasMoreSlots && slots.length > 0 && (
                  <Text style={styles.endText}>No more slots</Text>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileImage: { width: 70, height: 70, borderRadius: 35, marginRight: 16, borderWidth: 3, borderColor: '#F7CD00' },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#0A3A9E', marginBottom: 4 },
  userDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  userEmail: { fontSize: 13, color: '#6B7280' },
  joinDate: { fontSize: 12, color: '#9CA3AF' },
  userLocation: { fontSize: 12, color: '#6B7280' },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  walletIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A3A9E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A3A9E',
    marginTop: 2,
  },
  walletErrorText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    padding: 10,
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  headerButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  logoutButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  loginCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    borderColor: '#F7CD00',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeText: { fontSize: 20, fontWeight: '800', color: '#0A3A9E', marginBottom: 8 },
  subText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  loginButton: {
    backgroundColor: '#F7CD00',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  loginButtonText: { color: '#0A3A9E', fontWeight: '700', fontSize: 16 },
  shareAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  shareAppButtonText: {
    color: '#0A3A9E',
    fontSize: 14,
    fontWeight: '600',
  },
  loginPrompt: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginPromptSubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: 'white',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0A3A9E', marginTop: 4 },
  statTitle: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center', fontWeight: '500' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#F7CD00' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#F7CD00' },
  content: { flex: 1 },
  wallpapersList: { padding: 16 },
  slotsList: { padding: 16 },
  bookSlotButton: {
    backgroundColor: '#F7CD00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
    gap: 10,
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookSlotButtonText: { color: '#0A3A9E', fontSize: 16, fontWeight: '700' },
  slotItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  slotInfo: { flex: 1 },
  slotDate: { fontSize: 16, fontWeight: '700', color: '#0A3A9E' },
  slotTime: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  slotCategoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  slotCategory: { fontSize: 11, color: '#F7CD00', fontWeight: '600' },
  slotStatusBadge: { marginTop: 4 },
  slotPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 20, fontWeight: '800', color: '#10B981', marginBottom: 8 },
  resellButton: {
    backgroundColor: '#0A3A9E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resellButtonText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  wallpaperImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  text: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 6,
  },
  count: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  endText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
    marginBottom: 20,
    fontSize: 13,
  },
});