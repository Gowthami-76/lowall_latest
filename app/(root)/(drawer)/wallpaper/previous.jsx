import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Filter,
  Heart,
  MessageCircle,
  Download,
  X,
  Clock,
  User,
  Tag,
} from 'lucide-react-native';
import { Calendar as CalendarPicker } from 'react-native-calendars';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/utils/constants';
import { todayString } from 'react-native-calendars/src/expandableCalendar/commons';

const { width } = Dimensions.get('window');

export default function PreviousScreen() {
  const [wallpapers, setWallpapers] = useState([]);
  const [filteredWallpapers, setFilteredWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const getToken = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    if (authToken) return authToken;

    // fallback to anonymous token
    const anonymousToken = await AsyncStorage.getItem("anonymousToken");
    return anonymousToken || null;
  };

  // Fetch API data
  useEffect(() => {
    fetchPreviousSlots(1);
  }, []);

  const loadMorePreviousSlots = () => {
    if (loadingMore || !hasMore) return;
    fetchPreviousSlots(page + 1);
  };

  const fetchPreviousSlots = async (pageNum = 1) => {
    if (!hasMore && pageNum !== 1) return;

    pageNum === 1 ? setLoading(true) : setLoadingMore(true);

    try {
      const token = await getToken();
      if (!token) return;

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        date: currentDate,
        time: currentTime,
      });

      const response = await fetch(
        `${BASE_URL}/v1/slot/old?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();
      console.log('Response.....', json.data);

      if (json.success) {
        const data = json.data.map(item => ({
          id: item._id,
          image: item.postId?.mediaUrl ?? 'https://via.placeholder.com/150',
          message: item.postId?.content ?? '',
          sender: item.userId?.fullName ?? 'Unknown',
          occasion: item.postId?.title ?? 'General',
          date: item.date,
          likes: item.likes?.length ?? 0,
          comments: item.dislikes?.length ?? 0,
          expired: true,
        }));

        setWallpapers(prev => pageNum === 1 ? data : [...prev, ...data]);
        setFilteredWallpapers(prev => pageNum === 1 ? data : [...prev, ...data]);
        setPage(pageNum);
        setHasMore(pageNum < json.totalPages);
      }
    } catch (error) {
      console.log('API fetch error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Calendar marking
  const getMarkedDates = () => {
    const marked = {};
    wallpapers.forEach((item) => {
      marked[item.date] = { marked: true, dotColor: '#F7CD00' };
    });
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#F7CD00',
        selectedTextColor: '#0A3A9E',
      };
    }
    return marked;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filterByDate = (date) => {
    const filtered = wallpapers.filter((item) => item.date === date);
    setFilteredWallpapers(filtered);
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const clearFilter = () => {
    setSelectedDate('');
    setFilteredWallpapers(wallpapers);
  };

  const renderWallpaperItem = ({ item }) => (
    <TouchableOpacity style={styles.wallpaperCard}>
      <Image source={{ uri: item.image }} style={styles.wallpaperImage} />
      {item.expired && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>EXPIRED</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.occasionBadge}>
            <Tag size={10} color="#F7CD00" />
            <Text style={styles.occasionText}>{item.occasion}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Clock size={10} color="#9CA3AF" />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
        </View>

        <Text style={styles.messageText} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.senderContainer}>
            <User size={12} color="#0A3A9E" />
            <Text style={styles.senderText}>From {item.sender}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Heart size={14} color="#EF4444" />
              <Text style={styles.statText}>{item.likes}</Text>
            </View>
            <View style={styles.stat}>
              <MessageCircle size={14} color="#0A3A9E" />
              <Text style={styles.statText}>{item.comments}</Text>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <Download size={14} color="#F7CD00" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Previous Wallpapers</Text>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterOptions(true)}
        >
          <Filter size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Date Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCalendar(true)}
        >
          <Calendar size={20} color="#F7CD00" />
          <Text style={styles.datePickerText}>
            {selectedDate ? formatDate(selectedDate) : 'Select Date'}
          </Text>
        </TouchableOpacity>

        {selectedDate && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
            <X size={16} color="#FFFFFF" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredWallpapers.length} wallpaper{filteredWallpapers.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Wallpapers List */}
      {loading ? (
        <ActivityIndicator size="large" color="#F7CD00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredWallpapers}
          renderItem={renderWallpaperItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          onEndReached={loadMorePreviousSlots}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#F7CD00" style={{ marginVertical: 16 }} /> : null
          }
        />
      )}

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarContainer}>
              <CalendarPicker
                onDayPress={(day) => {
                  filterByDate(day.dateString);
                }}
                markedDates={getMarkedDates()}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#0A3A9E',
                  selectedDayBackgroundColor: '#F7CD00',
                  selectedDayTextColor: '#0A3A9E',
                  todayTextColor: '#F7CD00',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#F7CD00',
                  selectedDotColor: '#0A3A9E',
                  arrowColor: '#F7CD00',
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: '#0A3A9E',
                  indicatorColor: '#F7CD00',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
                enableSwipeMonths={true}
                maxDate={today}
                minDate={'2024-01-01'}
              />
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => {
                  setSelectedDate('');
                  setFilteredWallpapers(wallpapers);
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.clearAllText}>Show All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Options Modal */}
      <Modal
        visible={showFilterOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Options</Text>
              <TouchableOpacity onPress={() => setShowFilterOptions(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Most Liked</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Most Commented</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Recent First</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Oldest First</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingVertical: 16,
    paddingTop: 60,
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  datePickerText: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  wallpaperCard: {
    width: (width - 36) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  wallpaperImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expiredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occasionBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  occasionText: {
    color: '#0A3A9E',
    fontSize: 10,
    fontWeight: '700',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 16,
  },
  cardFooter: {
    gap: 8,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  senderText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  downloadButton: {
    padding: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
  },
  calendarContainer: {
    padding: 20,
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  clearAllButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#F7CD00',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#F7CD00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  doneText: {
    fontSize: 14,
    color: '#0A3A9E',
    fontWeight: '800',
  },
  selectedDateText: {
    color: '#F7CD00',
    fontWeight: 'bold',
  },
  filterOptions: {
    padding: 20,
  },
  filterOption: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#0A3A9E',
    fontWeight: '600',
    textAlign: 'center',
  },
});