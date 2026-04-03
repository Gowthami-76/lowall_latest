import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  NativeModules,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Download,
  Clock,
  Heart,
  ArrowLeft,
  ArrowRight,
  Upload,
  ChevronLeft,
  MoreVertical,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../../utils/constants';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";
import { DrawerActions } from '@react-navigation/native';

const { WallpaperModule } = NativeModules;
const { WallpaperScheduler } = NativeModules;

const { width, height } = Dimensions.get('window');

const wallpaper = {
  id: 1,
  image: 'https://img.freepik.com/free-photo/photorealistic-view-tree-nature-with-branches-trunk_23-2151478092.jpg?t=st=1753692411~exp=1753696011~hmac=43fd18ba1526f72cf9bc328040697fcbec9834f25afb13b890b1b946187792c6&w=826',
  message: 'Make today amazing! ✨',
  sender: 'Suresh',
  occasion: 'Motivation',
  category: 'motivation',
  timestamp: '5 mins ago',
  date: '2025-01-26',
  likes: 42,
  dislikes: 3,
  comments: 8,
  hits: 15200,
  isLiked: false,
  isDisliked: false,
  isHit: false,
  timeRemaining: 25 * 60,
};

export default function HomeScreen() {
  const [wallpaperData, setWallpaperData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(wallpaper.timeRemaining);
  const [greeting, setGreeting] = useState('');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [endDateTime, setEndDateTime] = useState(null);
  const isFetchingRef = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMoreOldData, setHasMoreOldData] = useState(true);
  const navigation = useNavigation();
  const [loadingPage, setLoadingPage] = useState(false);
  const hasTriggeredFetchRef = useRef(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setCurrentUserId(id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    setGreeting(getGreeting());
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => {
      clearInterval(greetingInterval);
    };
  }, []);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getToken = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    if (authToken) return authToken;
    const anonymousToken = await AsyncStorage.getItem("anonymousToken");
    return anonymousToken || null;
  };

  const handleHit = async (postId) => {
    setWallpaperData((prev) => ({
      ...prev,
      isHit: !prev.isHit,
      hits: prev.isHit ? prev.hits - 1 : prev.hits + 1,
    }));

    try {
      const token = await getToken();
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/${postId}/view`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Hit (view) response:", data);

      if (res.ok && data.success) {
        setWallpaperData((prev) => ({
          ...prev,
          hits: data?.slot?.views?.length ?? prev.hits,
          isHit: data?.slot?.views?.includes(currentUserId),
        }));
      } else {
        console.warn("Failed to update view:", data.message || data.error);
        setWallpaperData((prev) => ({
          ...prev,
          isHit: !prev.isHit,
          hits: prev.isHit ? prev.hits + 1 : prev.hits - 1,
        }));
      }
    } catch (err) {
      console.error("Error hitting view API:", err);
      setWallpaperData((prev) => ({
        ...prev,
        isHit: !prev.isHit,
        hits: prev.isHit ? prev.hits + 1 : prev.hits - 1,
      }));
    }
  };

  const handleDownloadOption = async (option) => {
    setShowDownloadDropdown(false);
    setShowMenu(false);

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      Alert.alert('Error', 'You need to be logged in to perform this action.');
      console.log('Download blocked: No auth token');
      return;
    }

    console.log('Dropdown option pressed', option);

    if (option === 'Save Live Wallpaper') {
      const imageUrl = wallpaperData?.image;
      try {
        WallpaperModule.setWallpaperFromUrl(imageUrl);
        setTimeout(() => {
          Alert.alert('Success', 'Wallpaper set successfully!');
        }, 300);
      } catch (error) {
        Alert.alert('Error', 'Failed to set wallpaper.');
        console.error(error);
      }
    } else if (option === 'Save as Live Screen Saver') {
      const imageUrl = wallpaperData?.image;
      try {
        WallpaperModule.setLockScreenFromUrl(imageUrl);
        setTimeout(() => {
          Alert.alert('Success', 'Live Wallpaper set successfully!');
        }, 300);
      } catch (error) {
        Alert.alert('Error', 'Failed to set wallpaper.');
        console.error(error);
      }
    } else if (option === 'Download') {
      console.log('Download clicked');
      saveImage(wallpaperData.image);
    } else if (option === 'Set as Background') {
      const imageUrl = wallpaperData?.image;
      console.log("image url", "to background........$ima  " + imageUrl);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      await Promise.race([
        WallpaperModule.setWallpaperFromUrlBack(imageUrl),
        timeoutPromise
      ]);
    } else {
      setTimeout(() => {
        Alert.alert('Success', `${option} completed successfully!`);
      }, 300);
    }
  };

  async function saveImage(imageUrl) {
    if (!imageUrl) {
      console.error("No image URL provided");
      return;
    }
    const fileName = "wallpaper.png";

    try {
      setDownloading(true);
      console.log("Image saved at:", imageUrl);
      const localPath = await WallpaperModule.downloadImageFromUrl(imageUrl, fileName);
      Alert.alert('Success', 'Wallpaper downloaded successfully ✅');
      console.log("Image saved at:", localPath);
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert('Error', 'Download failed ❌');
    } finally {
      setDownloading(false);
    }
  }

  const thumbsUpScale = useSharedValue(1);
  const thumbsDownScale = useSharedValue(1);
  const hitScale = useSharedValue(1);

  const thumbsUpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbsUpScale.value }],
  }));

  const thumbsDownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbsDownScale.value }],
  }));

  const hitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hitScale.value }],
  }));

  const onLike = () => {
    thumbsUpScale.value = withSpring(1.3, {}, () => {
      thumbsUpScale.value = withSpring(1);
    });
    setWallpaperData((prev) => {
      const wasLiked = prev.isLiked;
      const wasDisliked = prev.isDisliked;

      let newLikes = prev.likes;
      let newDislikes = prev.dislikes;

      if (wasLiked) {
        newLikes = prev.likes - 1;
      } else {
        newLikes = prev.likes + 1;
        if (wasDisliked) {
          newDislikes = prev.dislikes - 1;
        }
      }

      handleLikeApi(prev.id || prev.postId);

      return {
        ...prev,
        isLiked: !wasLiked,
        isDisliked: false,
        likes: newLikes,
        dislikes: newDislikes,
      };
    });
  };

  const handleLikeApi = async (postId) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Like API response:", data);
      const slot = data.slot;

      setWallpaperData((prev) => ({
        ...prev,
        likes: slot.likes.length,
        dislikes: slot.dislikes.length,
        isLiked: slot.likes.includes(currentUserId),
        isDisliked: slot.dislikes.includes(currentUserId),
      }));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const onDislike = () => {
    thumbsDownScale.value = withSpring(1.3, {}, () => {
      thumbsDownScale.value = withSpring(1);
    });
    setWallpaperData((prev) => {
      const wasLiked = prev.isLiked;
      const wasDisliked = prev.isDisliked;

      let newLikes = prev.likes;
      let newDislikes = prev.dislikes;

      if (wasDisliked) {
        newDislikes = prev.dislikes - 1;
      } else {
        newDislikes = prev.dislikes + 1;
        if (wasLiked) {
          newLikes = prev.likes - 1;
        }
      }

      handleDislikeApi(prev.id || prev.postId);

      return {
        ...prev,
        isLiked: false,
        isDisliked: !wasDisliked,
        likes: newLikes,
        dislikes: newDislikes,
      };
    });
  };

  const handleDislikeApi = async (postId) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/${postId}/dislike`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Dislike API response:", data);
      const slot = data.slot;

      setWallpaperData((prev) => ({
        ...prev,
        likes: slot.likes.length,
        dislikes: slot.dislikes.length,
        isLiked: slot.likes.includes(currentUserId),
        isDisliked: slot.dislikes.includes(currentUserId),
      }));
    } catch (err) {
      console.error("Error disliking post:", err);
    }
  };

  const onHit = () => {
    hitScale.value = withSpring(1.3, {}, () => {
      hitScale.value = withSpring(1);
    });
    handleHit(wallpaperData.id || wallpaperData.postId);
  };

  const fetchWallpaperByPage = async (pageNumber) => {
    try {
      if (pageNumber <= 0) return;
      setLoadingPage(true);

      const token = await getToken();
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot/old?page=${pageNumber}&limit=1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("previous API response:", data);

      if (data.data?.length > 0) {
        const slot = data.data?.[0];
        if (!slot) {
          setHasMoreOldData(false);
          return;
        }

        console.log("api response log", slot._id);
        const mediaUrl = slot.postId.mediaUrl;
        console.log("media url", mediaUrl);

        await Image.prefetch(mediaUrl);

        setWallpaperData({
          id: slot._id,
          image: mediaUrl,
          title: slot.postId?.title || '',
          message: slot.postId?.title || '',
          sender: slot.postId?.createdBy?.fullName || '',
          occasion: slot.saleStatus || '',
          date: slot.date,
          likes: slot.likes?.length || 0,
          dislikes: slot.dislikes?.length || 0,
          comments: slot.commentCount || 0,
          hits: slot.views?.length || 0,
          isLiked: slot.likes?.some(id => id?.toString() === currentUserId?.toString()),
          isDisliked: slot.dislikes?.some(id => id?.toString() === currentUserId?.toString()),
          isHit: slot.views?.some(id => id?.toString() === currentUserId?.toString()),
          timeRemaining,
        });

        console.log("api response set completed");
        setHasMoreOldData(true);
        setPage(pageNumber);
      } else {
        setHasMoreOldData(false);
      }
    } catch (e) {
      console.log('Wallpaper API error', e);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (!endDateTime) {
      console.log("⏳ No end time set yet, skipping timer");
      return;
    }

    console.log("⏳ Starting UI countdown timer");
    console.log("📅 Target end time:", endDateTime.toLocaleString());

    const timer = setInterval(() => {
      const now = new Date();
      const diffMs = endDateTime.getTime() - now.getTime();
      const remaining = Math.max(0, Math.floor(diffMs / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        console.log("⏰ Timer reached 0 - AlarmManager will handle update");
        clearInterval(timer);
        fetchWallpaper(false);
      }
    }, 1000);

    return () => {
      console.log("🛑 Stopping UI countdown timer");
      clearInterval(timer);
    };
  }, [endDateTime]);

  useEffect(() => {
    console.log("🚀 Initial mount - fetching wallpaper");
    fetchWallpaper(false);
  }, []);

  const goToPage = (targetPage) => {
    if (targetPage < 0) return;

    if (targetPage === 0) {
      fetchWallpaper(false);
      setPage(0);
    } else {
      fetchWallpaperByPage(targetPage);
      setPage(targetPage);
    }
  };

  const getPreviousWallpaper = async () => {
    goToPage(page + 1);
  };

  const getNextWallpaper = async () => {
    goToPage(page - 1);
  };

  const fetchWallpaper = useCallback(async (fromBackground = false) => {
    isFetchingRef.current = true;
    try {
      const token = await getToken();
      const cUser = await AsyncStorage.getItem("userId");
      console.log("current user", cUser);

      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }
      setPage(0);
      setHasMoreOldData(true);

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const queryParams = new URLSearchParams({
        date: currentDate,
        time: currentTime
      });

      if (WallpaperScheduler && typeof WallpaperScheduler.saveApiCredentials === 'function') {
        try {
          await WallpaperScheduler.saveApiCredentials(token, BASE_URL);
          console.log('✅ API credentials saved');
        } catch (err) {
          console.error('❌ Failed to save credentials:', err);
        }
      } else {
        console.warn('⚠️ WallpaperScheduler.saveApiCredentials not available');
      }

      const slotRes = await fetch(`${BASE_URL}/v1/slot/current?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const slotData = await slotRes.json();
      console.log('API Response:', slotData);

      if (!slotData?.slot?.postId?.mediaUrl) {
        console.error('No mediaUrl found in slot data');
        return;
      }

      const mediaUrl = slotData.slot.postId.mediaUrl;
      console.log("media url", mediaUrl);

      const fileRes = await fetch(`${BASE_URL}/v1/file/get-signed-urls`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: [mediaUrl],
        }),
      });

      const fileData = await fileRes.json();
      console.log("fileData url", fileData);

      const signedImageUrl = fileData.signedUrls[mediaUrl];
      if (!signedImageUrl) {
        console.error("No signed URL found");
        return;
      }

      await Image.prefetch(signedImageUrl);

      if (slotData.success && slotData.slot) {
        const slot = slotData.slot;

        const slotDate = slot.date;
        const endTime = slot.endTime;
        const currentTime = new Date();

        let calculatedEndDateTime = null;
        let timeRemaining = 0;

        if (slotDate && endTime) {
          const [hours, minutes] = endTime.split(":").map(Number);
          const [year, month, day] = slotDate.split("-").map(Number);
          calculatedEndDateTime = new Date(year, month - 1, day, hours, minutes, 0);

          console.log("📅 Slot end time:", calculatedEndDateTime.toLocaleString());

          const isToday = (
            currentTime.getFullYear() === calculatedEndDateTime.getFullYear() &&
            currentTime.getMonth() === calculatedEndDateTime.getMonth() &&
            currentTime.getDate() === calculatedEndDateTime.getDate()
          );

          if (isToday) {
            const diffMs = calculatedEndDateTime.getTime() - currentTime.getTime();
            timeRemaining = Math.max(0, Math.floor(diffMs / 1000));
            console.log(`⏱️ Time remaining: ${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`);
            setEndDateTime(calculatedEndDateTime);
          } else {
            console.log("❌ Slot date is not today, skipping countdown");
            timeRemaining = 0;
            setEndDateTime(null);
          }
        } else {
          console.log("⚠️ No valid endTime or date, using fallback 25 mins");
          timeRemaining = 25 * 60;
          const fallbackEnd = new Date(currentTime.getTime() + (25 * 60 * 1000));
          setEndDateTime(fallbackEnd);
        }

        setWallpaperData({
          id: slot._id,
          image: signedImageUrl,
          title: slot.postId?.title,
          message: slot.postId?.title || '',
          sender: slot.postId?.createdBy?.fullName || '',
          occasion: slot.saleStatus || '',
          category: 'motivation',
          timestamp: 'Just now',
          date: slot.date,
          likes: slot.likes?.length || 0,
          dislikes: slot.dislikes?.length || 0,
          comments: slot.commentCount || 0,
          hits: slot.views?.length || 0,
          isLiked: slot.likes?.some(id => id.toString() === cUser?.toString()),
          isDisliked: slot.dislikes?.some(id => id.toString() === cUser?.toString()),
          isHit: slot.views?.some(id => id.toString() === cUser?.toString()),
          timeRemaining,
        });

        setTimeRemaining(timeRemaining);

        const lastPostId = await AsyncStorage.getItem("lastWallpaperPostId");
        console.log("image url" + slot._id, lastPostId + "to background.......  " + signedImageUrl);

        if (fromBackground && lastPostId !== slot._id) {
          console.log("🖼️ New wallpaper detected, setting as background");
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
          );

          await Promise.race([
            WallpaperModule.setWallpaperFromUrlBack(signedImageUrl),
            timeoutPromise
          ]);
          await AsyncStorage.setItem("lastWallpaperPostId", slot._id);
        }

        if (!lastPostId) {
          await AsyncStorage.setItem("lastWallpaperPostId", slot._id);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  if (!wallpaperData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>No data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.fullscreenContainer}>
          <Image
            source={{ uri: wallpaperData.image }}
            style={styles.fullscreenImage}
            resizeMode="cover"
          />

          {/* Arrow Overlay */}
          <View style={styles.arrowOverlay}>
            {hasMoreOldData ? (
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={getPreviousWallpaper}
                activeOpacity={0.7}
              >
                <ChevronLeft size={36} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.arrowPlaceholder} />
            )}

            {page !== 0 ? (
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={getNextWallpaper}
                activeOpacity={0.7}
              >
                <ArrowRight size={36} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.arrowPlaceholder} />
            )}
          </View>

          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '600' }}>☰</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.logoText}>LOWALL</Text>
              {wallpaperData.title && (
                <Text style={styles.wallpaperTitle} numberOfLines={1}>
                  {wallpaperData.title}
                </Text>
              )}
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/postsscreen')}
              >
                <Upload size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <MoreVertical size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Dropdown */}
          {showMenu && (
            <>
              <TouchableOpacity
                style={styles.invisibleOverlay}
                activeOpacity={1}
                onPress={() => setShowMenu(false)}
              />
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/profile');
                  }}
                >
                  <Text style={styles.menuText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/settings');
                  }}
                >
                  <Text style={styles.menuText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Previous Button */}
          <TouchableOpacity
            style={styles.previousButton}
            onPress={() => router.push('/wallpaper/previous')}
          >
            <ArrowLeft size={16} color="white" />
            <Text style={styles.previousText}>Previous</Text>
          </TouchableOpacity>

          {/* Top Badges */}
          <View style={styles.topBadges}>
            {wallpaperData.occasion && (
              <View style={styles.occasionBadge}>
                <Sparkles size={12} color="#F59E0B" />
                <Text style={styles.occasionText}>{wallpaperData.occasion}</Text>
              </View>
            )}
            <View style={styles.timerBadge}>
              <Clock size={14} color="white" />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>

          {/* Loading Overlay */}
          {downloading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loaderText}>Downloading...</Text>
            </View>
          )}

          {loadingPage && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loaderText}>Loading...</Text>
            </View>
          )}

          {/* Bottom Actions */}
          <View style={styles.bottomContent}>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                <Animated.View style={thumbsUpAnimatedStyle}>
                  <ThumbsUp
                    size={24}
                    color={wallpaperData.isLiked ? "#10B981" : "#9CA3AF"}
                    fill={wallpaperData.isLiked ? "#10B981" : "none"}
                  />
                </Animated.View>
                <Text style={[styles.actionText, wallpaperData.isLiked && styles.actionTextActive]}>
                  {wallpaperData.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={onDislike}>
                <Animated.View style={thumbsDownAnimatedStyle}>
                  <ThumbsDown
                    size={24}
                    color={wallpaperData.isDisliked ? "#EF4444" : "#9CA3AF"}
                    fill={wallpaperData.isDisliked ? "#EF4444" : "none"}
                  />
                </Animated.View>
                <Text style={[styles.actionText, wallpaperData.isDisliked && styles.actionTextActive]}>
                  {wallpaperData.dislikes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={onHit}>
                <Animated.View style={hitAnimatedStyle}>
                  <Heart
                    size={24}
                    color={wallpaperData.isHit ? "#F59E0B" : "#9CA3AF"}
                    fill={wallpaperData.isHit ? "#F59E0B" : "none"}
                  />
                </Animated.View>
                <Text style={[styles.actionText, wallpaperData.isHit && styles.actionTextActive]}>
                  {wallpaperData.hits}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/comments/${wallpaperData.id}`)}
              >
                <MessageCircle size={24} color="#9CA3AF" />
                <Text style={styles.actionText}>{wallpaperData.comments}</Text>
              </TouchableOpacity>

              <View style={styles.downloadContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowDownloadDropdown(!showDownloadDropdown)}
                >
                  <Download size={24} color="#9CA3AF" />
                </TouchableOpacity>

                {showDownloadDropdown && (
                  <>
                    <TouchableOpacity
                      style={styles.invisibleOverlay}
                      activeOpacity={1}
                      onPress={() => setShowDownloadDropdown(false)}
                    />
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDownloadOption('Save Live Wallpaper')}
                      >
                        <Text style={styles.dropdownText}>Set as Home Screen</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDownloadOption('Save as Live Screen Saver')}
                      >
                        <Text style={styles.dropdownText}>Set as Lock Screen</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDownloadOption('Set as Background')}
                      >
                        <Text style={styles.dropdownText}>Set as Both</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.dropdownItem, styles.dropdownItemLast]}
                        onPress={() => handleDownloadOption('Download')}
                      >
                        <Text style={styles.dropdownText}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    flex: 1,
    position: 'relative',
  },
  fullscreenImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  arrowOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 100,
    pointerEvents: 'box-none',
  },
  arrowButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  arrowPlaceholder: {
    width: 48,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  wallpaperTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    maxWidth: 150,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  previousButton: {
    position: 'absolute',
    top: 120,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    zIndex: 20,
    backdropFilter: 'blur(10px)',
  },
  previousText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  topBadges: {
    position: 'absolute',
    top: 120,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 20,
  },
  occasionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(10px)',
  },
  occasionText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(10px)',
  },
  timerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionTextActive: {
    fontWeight: '700',
  },
  downloadContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    bottom: 50,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 16,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  menuDropdown: {
    position: 'absolute',
    top: 110,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    minWidth: 150,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loaderText: {
    marginTop: 10,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  invisibleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
  },
});