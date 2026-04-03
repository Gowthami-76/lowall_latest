import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Sparkles,
  Crown,
  Zap,
  CheckCircle,
  IndianRupee
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/utils/constants';

import moment from "moment";

export default function PremiumBookingScreen() {
  const [categories] = useState(["Premium", "Standard", "VIP"]);
  const [selectedCategory, setSelectedCategory] = useState("Premium");

  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [dates, setDates] = useState([]);
  const [dateRange, setDateRange] = useState({ start: 0, end: 10 });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate next 7 days
  const generateNextDays = (start = 0, end = 7) => {
    return Array.from({ length: end - start }, (_, i) => {
      const date = moment().add(start + i, "days");
      return {
        key: date.format("YYYY-MM-DD"),
        label: date.format("MMM D"),
        day: date.format("ddd"),
      };
    });
  };

  useEffect(() => {
    const nextDays = generateNextDays(dateRange.start, dateRange.end);
    setDates(nextDays);
  }, []);

  // Load more dates on scroll
  const loadMoreDates = () => {
    const newEnd = dateRange.end + 7;
    const moreDates = generateNextDays(dateRange.end, newEnd);
    setDates((prev) => [...prev, ...moreDates]);
    setDateRange({ start: dateRange.start, end: newEnd });
  };

  const getToken = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    if (authToken) return authToken;
    const anonymousToken = await AsyncStorage.getItem("anonymousToken");
    return anonymousToken || null;
  };

  // Fetch slots from API
  const fetchSlots = async (date) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(`${BASE_URL}/v1/slot?date=${date}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      console.log("response from premium slots", data);
      if (data.success && Array.isArray(data.slots)) {
        const premiumOnly = data.slots
          .filter((s) => s.isPremium)
          .map((s, idx) => ({
            id: idx + 1,
            time: `${s.startTime} - ${s.endTime}`,
            price: 100,
            category: 'Premium',
            popularity: 'High',
            available: !s.isBooked,
          }));
        setSlots(premiumOnly);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch slots whenever selectedDate changes
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  // Handle category (just toggles UI for now)
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const getPopularityColor = (popularity) => {
    switch (popularity) {
      case 'Medium': return '#10B981';
      case 'High': return '#F7CD00';
      case 'Very High': return '#EF4444';
      case 'Extreme': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getPopularityIcon = (popularity) => {
    switch (popularity) {
      case 'Medium': return <Users size={12} color="#10B981" />;
      case 'High': return <TrendingUp size={12} color="#F7CD00" />;
      case 'Very High': return <Star size={12} color="#EF4444" />;
      case 'Extreme': return <Star size={12} color="#8B5CF6" fill="#8B5CF6" />;
      default: return <Users size={12} color="#6B7280" />;
    }
  };

  const SlotCard = ({ slot }) => {
    const scaleValue = useSharedValue(1);
    const isSelected = selectedSlot?.id === slot.id;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const onPressIn = () => {
      scaleValue.value = withSpring(0.98);
    };

    const onPressOut = () => {
      scaleValue.value = withSpring(1);
    };

    const handlePress = () => {
      if (slot.available) {
        setSelectedSlot(slot);
      }
    };

    return (
      <Animated.View style={[styles.slotCard, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={slot.available ? 0.7 : 1}
          onPressIn={slot.available ? onPressIn : undefined}
          onPressOut={slot.available ? onPressOut : undefined}
          onPress={handlePress}
          style={[
            styles.slotContent,
            !slot.available && styles.unavailableSlot,
            isSelected && styles.selectedSlot,
          ]}
        >
          <View style={styles.slotHeader}>
            <View style={styles.timeContainer}>
              <Clock size={16} color={!slot.available ? '#9CA3AF' : '#0A3A9E'} />
              <Text style={[
                styles.timeText,
                !slot.available && styles.unavailableText
              ]}>
                {slot.time}
              </Text>
            </View>

            <View style={styles.popularityContainer}>
              {getPopularityIcon(slot.popularity)}
              <Text style={[
                styles.popularityText,
                { color: getPopularityColor(slot.popularity) }
              ]}>
                {slot.popularity}
              </Text>
            </View>
          </View>

          <View style={styles.categoryBadge}>
            <Crown size={12} color="#F7CD00" />
            <Text style={styles.categoryText}>{slot.category}</Text>
          </View>

          <View style={styles.slotFooter}>
            <View style={styles.priceContainer}>
              <IndianRupee size={16} color={!slot.available ? '#9CA3AF' : '#10B981'} />
              <Text style={[
                styles.priceText,
                !slot.available && styles.unavailableText
              ]}>
                {slot.price}
              </Text>
            </View>

            {!slot.available && (
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleBookSlot = () => {
    if (selectedSlot) {
      router.push(`/payment/${selectedSlot.id}?date=${selectedDate}`);
    }
  };

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateCard, selectedDate === item.key && styles.selectedDateCard]}
      onPress={() => setSelectedDate(item.key)}
    >
      <CalendarIcon size={14} color={selectedDate === item.key ? '#FFFFFF' : '#F7CD00'} />
      <Text style={[styles.dateText, selectedDate === item.key && styles.selectedDateText]}>
        {item.day} {item.label}
      </Text>
    </TouchableOpacity>
  );

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

        <Text style={styles.headerTitle}>Premium Slots</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Sparkles size={32} color="#F7CD00" />
          </View>
          <Text style={styles.heroTitle}>Book Premium Time Slots</Text>
          <Text style={styles.heroSubtitle}>
            Choose your preferred date and time slot to maximize your reach
          </Text>
        </View>

        {/* Date Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color="#F7CD00" />
            <Text style={styles.sectionTitle}>Choose Date</Text>
          </View>
          <FlatList
            data={dates}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            onEndReached={loadMoreDates}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.dateScrollContent}
          />
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#F7CD00" />
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#F7CD00" />
              <Text style={styles.loaderText}>Loading slots...</Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Zap size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No premium slots available</Text>
              <Text style={styles.emptySubtext}>Try selecting another date</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => <SlotCard key={slot.id} slot={slot} />)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Selection Summary */}
      {selectedSlot && (
        <Animated.View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.summaryTitle}>Booking Summary</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {new Date(selectedDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedSlot.time}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Category:</Text>
              <View style={styles.summaryCategoryBadge}>
                <Crown size={12} color="#F7CD00" />
                <Text style={styles.summaryValue}>{selectedSlot.category}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <View style={styles.priceRow}>
                <IndianRupee size={14} color="#10B981" />
                <Text style={styles.summaryPrice}>{selectedSlot.price}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookSlot}
          >
            <Sparkles size={18} color="#0A3A9E" />
            <Text style={styles.bookButtonText}>
              Book for ₹{selectedSlot.price}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.bottomPadding} />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  dateScrollContent: {
    paddingHorizontal: 20,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  selectedDateCard: {
    backgroundColor: '#0A3A9E',
    borderColor: '#0A3A9E',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A3A9E',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  slotsGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  slotCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  slotContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
  },
  unavailableSlot: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  selectedSlot: {
    borderColor: '#F7CD00',
    backgroundColor: '#FEF3C7',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  unavailableText: {
    color: '#9CA3AF',
  },
  slotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summarySection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A3A9E',
  },
  summaryCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  bookButton: {
    backgroundColor: '#F7CD00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: '#0A3A9E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 20,
  },
});