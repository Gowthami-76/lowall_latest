import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  Clock,
  MessageCircle,
  DollarSign,
  Star,
  Settings,
  Sparkles,
  Bell,
  Heart,
  TrendingUp,
  Crown
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: 'approved',
    title: 'Wallpaper Approved!',
    message: 'Your wallpaper "Good morning! Make today amazing!" has been approved and is now live.',
    timestamp: '2 mins ago',
    isRead: false,
    wallpaperId: 1,
    icon: CheckCircle,
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
  },
  {
    id: 2,
    type: 'comment',
    title: 'New Comment',
    message: 'Sarah commented on your wallpaper: "Love this motivation!"',
    timestamp: '5 mins ago',
    isRead: false,
    wallpaperId: 1,
    userImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    icon: MessageCircle,
    iconColor: '#0A3A9E',
    iconBg: '#E8F0FE',
  },
  {
    id: 3,
    type: 'resale_offer',
    title: 'Resale Offer Accepted',
    message: 'Your premium slot for Dec 25, 6:00 PM has been sold for ₹28.',
    timestamp: '1 hour ago',
    isRead: true,
    slotId: 1,
    icon: DollarSign,
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
  },
  {
    id: 4,
    type: 'rejected',
    title: 'Wallpaper Rejected',
    message: 'Your wallpaper submission did not meet our guidelines. Please review and resubmit.',
    timestamp: '2 hours ago',
    isRead: true,
    wallpaperId: 3,
    icon: XCircle,
    iconColor: '#EF4444',
    iconBg: '#FEE2E2',
  },
  {
    id: 5,
    type: 'premium_reminder',
    title: 'Premium Slot Reminder',
    message: 'Your premium slot starts in 30 minutes. Make sure to have your wallpaper ready!',
    timestamp: '3 hours ago',
    isRead: true,
    slotId: 2,
    icon: Crown,
    iconColor: '#F7CD00',
    iconBg: '#FEF3C7',
  },
  {
    id: 6,
    type: 'live_now',
    title: 'Wallpaper is Live!',
    message: 'Your wallpaper "Happy Birthday!" is now live and being viewed by users.',
    timestamp: '5 hours ago',
    isRead: true,
    wallpaperId: 2,
    icon: Sparkles,
    iconColor: '#8B5CF6',
    iconBg: '#EDE9FE',
  },
];

export default function NotificationsScreen() {
  const [notificationList, setNotificationList] = useState(notifications);

  const handleNotificationPress = (notification) => {
    // Mark as read with animation
    setNotificationList(prev =>
      prev.map(n =>
        n.id === notification.id
          ? { ...n, isRead: true }
          : n
      )
    );

    // Navigate based on notification type
    switch (notification.type) {
      case 'approved':
      case 'rejected':
      case 'live_now':
        if (notification.wallpaperId) {
          router.push(`/wallpaper/${notification.wallpaperId}`);
        }
        break;
      case 'comment':
        if (notification.wallpaperId) {
          router.push(`/comments/${notification.wallpaperId}`);
        }
        break;
      case 'resale_offer':
      case 'premium_reminder':
        router.push('/(tabs)/profile');
        break;
    }
  };

  const markAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const NotificationItem = ({ notification }) => {
    const scaleValue = useSharedValue(1);
    const shineValue = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const onPressIn = () => {
      scaleValue.value = withSpring(0.98);
    };

    const onPressOut = () => {
      scaleValue.value = withSpring(1);
    };

    const Icon = notification.icon;

    return (
      <Animated.View style={[styles.notificationItem, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleNotificationPress(notification)}
          style={[
            styles.notificationContent,
            !notification.isRead && styles.unreadNotification
          ]}
        >
          <View style={styles.notificationLeft}>
            {notification.userImage ? (
              <Image
                source={{ uri: notification.userImage }}
                style={styles.userImage}
              />
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: notification.iconBg }]}>
                <Icon size={20} color={notification.iconColor} />
              </View>
            )}

            <View style={styles.notificationText}>
              <Text style={[
                styles.notificationTitle,
                !notification.isRead && styles.unreadTitle
              ]}>
                {notification.title}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.notificationTimestamp}>
                {notification.timestamp}
              </Text>
            </View>
          </View>

          {!notification.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const unreadCount = notificationList.filter(n => !n.isRead).length;

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

        <View style={styles.headerCenter}>
          <Bell size={20} color="#F7CD00" />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/notification-settings')}
        >
          <Settings size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Mark All as Read */}
      {unreadCount > 0 && (
        <View style={styles.markAllContainer}>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Sparkles size={14} color="#F7CD00" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {notificationList.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}

        {notificationList.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Bell size={48} color="#F7CD00" />
            </View>
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll see notifications about your wallpapers and premium slots here
            </Text>
          </View>
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  unreadBadge: {
    backgroundColor: '#F7CD00',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#0A3A9E',
    fontSize: 11,
    fontWeight: '800',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  markAllButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 12,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  unreadNotification: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F7CD00',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A3A9E',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F7CD00',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});