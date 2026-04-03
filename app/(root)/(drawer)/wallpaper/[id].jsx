import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  NativeModules,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  HeartOff,
  MessageCircle,
  Download,
  Share as ShareIcon,
  Clock,
  User,
  Flag,
  Tag,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@/utils/constants';

const { WallpaperModule } = NativeModules;
const { width, height } = Dimensions.get('window');

export default function WallpaperDetailScreen() {
  const { id } = useLocalSearchParams();
  const [wallpaper, setWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const heartScale = useSharedValue(1);
  const downloadScale = useSharedValue(1);

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.log("No token found");
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/post/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        console.log("data.....", data);
        setWallpaper(data);
        setTimeRemaining(25 * 60);
      } catch (error) {
        console.error("Error fetching wallpaper:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpaper();
  }, [id]);

  useEffect(() => {
    if (!timeRemaining) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const downloadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: downloadScale.value }],
  }));

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = () => {
    heartScale.value = withSequence(withSpring(1.3), withSpring(1));
    setWallpaper(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing wallpaper: ${wallpaper.title}\n\nShared from Lowall App`,
        title: 'Share Wallpaper',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = () => {
    downloadScale.value = withSequence(withSpring(1.3), withSpring(1));
    saveImage(wallpaper.mediaUrl);
    Alert.alert("Download Complete", "Wallpaper saved to your gallery!");
  };

  async function saveImage(imageUrl) {
    if (!imageUrl) {
      console.error("No image URL provided");
      return;
    }
    const fileName = "wallpaper.png";

    try {
      console.log("Image saved at:", imageUrl);
      const localPath = await WallpaperModule.downloadImageFromUrl(imageUrl, fileName);
      console.log("Image saved at:", localPath);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F7CD00" />
        <Text style={styles.loaderText}>Loading wallpaper...</Text>
      </View>
    );
  }

  if (!wallpaper) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <MessageCircle size={64} color="#F7CD00" />
        </View>
        <Text style={styles.errorText}>Wallpaper not found</Text>
        <Text style={styles.errorSubtext}>The wallpaper you're looking for doesn't exist</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonErrorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Transparent */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Clock size={16} color="#F7CD00" />
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => Alert.alert("Report", "Report this wallpaper?")}
        >
          <Flag size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallpaper Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: wallpaper.mediaUrl }} style={styles.wallpaperImage} />

          {/* Overlay Actions */}
          <View style={styles.imageOverlay}>
            <View style={styles.actionButtons}>
              <Animated.View style={heartAnimatedStyle}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  {wallpaper.isLiked ? (
                    <Heart size={24} color="#EC4899" fill="#EC4899" />
                  ) : (
                    <Heart size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/comments/${wallpaper._id}`)}
              >
                <MessageCircle size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Animated.View style={downloadAnimatedStyle}>
                <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                  <Download size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <ShareIcon size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.messageText}>{wallpaper.title}</Text>

          <View style={styles.senderContainer}>
            <View style={styles.senderInfo}>
              <User size={16} color="#F7CD00" />
              <Text style={styles.senderText}>By {wallpaper.user?.fullName || wallpaper.user?.name || "Unknown"}</Text>
            </View>
            <View style={styles.occasionBadge}>
              <Tag size={12} color="#0A3A9E" />
              <Text style={styles.occasionText}>{wallpaper.category || wallpaper.title || "General"}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>{wallpaper.content || "No description available"}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Heart size={16} color="#EC4899" />
              <Text style={styles.statText}>{wallpaper.likes || 0} likes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MessageCircle size={16} color="#0A3A9E" />
              <Text style={styles.statText}>{wallpaper.comments?.length || 0} comments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CalendarIcon size={16} color="#6B7280" />
              <Text style={styles.statText}>{new Date(wallpaper.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.commentButton}
          onPress={() => router.push(`/comments/${wallpaper._id}`)}
        >
          <MessageCircle size={20} color="#0A3A9E" />
          <Text style={styles.commentButtonText}>View Comments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
        >
          <Download size={20} color="#0A3A9E" />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    color: '#F7CD00',
    fontSize: 14,
    fontWeight: '700',
  },
  reportButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: height * 0.6,
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    minHeight: height * 0.5,
  },
  messageText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 16,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  senderText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  occasionBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  occasionText: {
    color: '#0A3A9E',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  commentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  commentButtonText: {
    fontSize: 14,
    color: "#0A3A9E",
    fontWeight: "700",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7CD00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    shadowColor: "#F7CD00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadButtonText: {
    fontSize: 14,
    color: "#0A3A9E",
    fontWeight: "800",
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
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
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