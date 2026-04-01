import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from '@/utils/constants';

export default function WalletScreen() {
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      setLoadingBalance(true);
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        Alert.alert("Error", "Please login to view your wallet");
        router.back();
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
        setError("Failed to fetch wallet balance");
        console.error("Wallet balance API error:", json);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setError("Network error while fetching balance");
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // Fetch transactions with continuous scroll loading
  const fetchTransactions = useCallback(async (skipCount = 0, isRefresh = false) => {
    // Prevent duplicate calls
    if ((loading || loadingMore) && !isRefresh) {
      console.log('Already loading, skipping...', { loading, loadingMore });
      return;
    }

    // Don't load more if we've reached the end
    if (!isRefresh && !hasMore) {
      console.log('No more data to load');
      return;
    }
    
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        Alert.alert("Error", "Please login to view transactions");
        router.back();
        return;
      }

      // Calculate page number from skip for API
      const pageNum = Math.floor(skipCount / limit) + 1;
      
      console.log(`Fetching transactions - Skip: ${skipCount}, Limit: ${limit}, Page: ${pageNum}, IsRefresh: ${isRefresh}`);

      const response = await fetch(
        `${BASE_URL}/v1/wallet/transactions?page=${pageNum}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();
      console.log(`Transactions API Response:`, {
        transactionsCount: json.transactions?.length,
        total: json.total,
        currentLoaded: isRefresh ? json.transactions?.length : transactions.length + (json.transactions?.length || 0)
      });

      if (json.transactions && Array.isArray(json.transactions)) {
        if (isRefresh) {
          // Reset everything on refresh
          setTransactions(json.transactions);
          setSkip(json.transactions.length);
          setHasMore(json.transactions.length < (json.total || 0));
        } else {
          // Append new transactions
          setTransactions(prev => {
            // Prevent duplicates by checking IDs
            const existingIds = new Set(prev.map(t => t._id));
            const newTransactions = json.transactions.filter(t => !existingIds.has(t._id));
            return [...prev, ...newTransactions];
          });
          
          // Update skip count
          const newSkip = skipCount + json.transactions.length;
          setSkip(newSkip);
          
          // Check if there are more items
          setHasMore(newSkip < (json.total || 0));
        }
        
        setTotal(json.total || 0);
      } else {
        setError("Failed to fetch transactions");
        console.error("Transactions API error:", json);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Network error while fetching transactions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [loading, loadingMore, limit, transactions.length, hasMore]);

  // Initial load
  useEffect(() => {
    fetchWalletBalance();
    fetchTransactions(0, true); // Start from skip = 0
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    console.log('Refreshing...');
    setRefreshing(true);
    setHasMore(true); // Reset hasMore on refresh
    await Promise.all([
      fetchWalletBalance(),
      fetchTransactions(0, true) // Start from beginning
    ]);
  };

  // Load more transactions - load next 10 records
  const handleLoadMore = () => {
    console.log('handleLoadMore triggered', { 
      loading, 
      loadingMore,
      hasMore, 
      currentSkip: skip, 
      transactionsCount: transactions.length,
      total 
    });
    
    // Don't load if already loading or no more data
    if (loading || loadingMore || !hasMore) {
      console.log('Load more prevented:', { loading, loadingMore, hasMore });
      return;
    }
    
    console.log('Loading next 10 records from skip:', skip);
    fetchTransactions(skip, false); // Load from current skip position
  };

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date and time
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    
    const formattedDate = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    
    const formattedTime = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    return { date: formattedDate, time: formattedTime };
  };

  // Get transaction type info
  const getTransactionTypeInfo = (type, reason) => {
    const isCredit = type === 'credit';
    
    const reasonMap = {
      slot_sale: { label: 'Slot Sale', icon: '💰', color: '#10B981' },
      slot_refund: { label: 'Slot Refund', icon: '↩️', color: '#3B82F6' },
      slot_purchase: { label: 'Slot Purchase', icon: '🛒', color: '#EF4444' },
      withdrawal: { label: 'Withdrawal', icon: '💸', color: '#EF4444' },
      deposit: { label: 'Deposit', icon: '💵', color: '#10B981' },
      commission: { label: 'Commission', icon: '🎯', color: '#F59E0B' },
      penalty: { label: 'Penalty', icon: '⚠️', color: '#EF4444' },
      reward: { label: 'Reward', icon: '🎁', color: '#10B981' },
    };

    const typeInfo = reasonMap[reason] || {
      label: reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      icon: isCredit ? '➕' : '➖',
      color: isCredit ? '#10B981' : '#EF4444'
    };

    return {
      ...typeInfo,
      isCredit,
      iconComponent: isCredit ? ArrowDownCircle : ArrowUpCircle,
    };
  };

  // Transaction Item Component
  const TransactionItem = ({ transaction }) => {
    const { date, time } = formatDateTime(transaction.createdAt);
    const typeInfo = getTransactionTypeInfo(transaction.type, transaction.reason);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIconContainer}>
            <typeInfo.iconComponent 
              size={24} 
              color={typeInfo.color}
              fill={typeInfo.isCredit ? typeInfo.color : 'transparent'}
            />
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>
              {typeInfo.icon} {typeInfo.label}
            </Text>
            <Text style={styles.transactionDescription} numberOfLines={2}>
              {transaction.description}
            </Text>
            
            {transaction.slotMetadata && (
              <View style={styles.slotMetadata}>
                <Calendar size={12} color="#6B7280" />
                <Text style={styles.slotMetadataText}>
                  {transaction.slotMetadata.date} • {transaction.slotMetadata.startTime} - {transaction.slotMetadata.endTime}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              { color: typeInfo.isCredit ? '#10B981' : '#EF4444' }
            ]}>
              {typeInfo.isCredit ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
            </Text>
          </View>
        </View>
        
        <View style={styles.transactionFooter}>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.timeText}>{date} • {time}</Text>
          </View>
          
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Balance: </Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(transaction.balanceAfter, transaction.currency)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Wallet size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyStateText}>
        Your transaction history will appear here
      </Text>
    </View>
  );

  // Error State Component
  const ErrorState = () => (
    <View style={styles.errorState}>
      <AlertCircle size={64} color="#EF4444" />
      <Text style={styles.errorStateTitle}>Something went wrong</Text>
      <Text style={styles.errorStateText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <RefreshCw size={20} color="white" />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Footer Component for FlatList
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={styles.loadMoreText}>Loading more transactions...</Text>
        </View>
      );
    }
    
    if (!hasMore && transactions.length > 0) {
      return (
        <View style={styles.endContainer}>
          <View style={styles.endLine} />
          <Text style={styles.endText}>You've reached the end</Text>
          <View style={styles.endLine} />
        </View>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <RefreshCw size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceIconContainer}>
          <Wallet size={32} color="#8B5CF6" />
        </View>
        
        <Text style={styles.balanceLabel}>Total Balance</Text>
        
        {loadingBalance ? (
          <ActivityIndicator size="large" color="#8B5CF6" style={styles.balanceLoader} />
        ) : (
          <>
            <Text style={styles.balanceAmount}>
              {formatCurrency(walletBalance?.balance || 0, walletBalance?.currency)}
            </Text>
            <Text style={styles.balanceCurrency}>{walletBalance?.currency || 'INR'}</Text>
          </>
        )}
        
        {/* Action Buttons
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <ArrowDownCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Add Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
            <ArrowUpCircle size={20} color="#8B5CF6" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Withdraw
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Transaction Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {transactions.filter(t => t.type === 'credit').length}
          </Text>
          <Text style={styles.statLabel}>Credits</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {transactions.filter(t => t.type === 'debit').length}
          </Text>
          <Text style={styles.statLabel}>Debits</Text>
        </View>
      </View>

      {/* Transactions List
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Transaction History</Text>
        {transactions.length > 0 && (
          <Text style={styles.transactionsCount}>
            Showing {transactions.length} of {total}
          </Text>
        )}
      </View> */}

      {error && !loading && transactions.length === 0 ? (
        <View style={styles.transactionsList}>
          <ErrorState />
        </View>
      ) : transactions.length === 0 && !loading ? (
        <View style={styles.transactionsList}>
          <EmptyState />
        </View>
      ) : (
        <FlatList
          style={styles.transactionsList}
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#8B5CF6']}
              tintColor="#8B5CF6"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
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
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  balanceCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceLoader: {
    marginVertical: 20,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#8B5CF6',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionsCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionsList: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  slotMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  slotMetadataText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  balanceAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  endContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  endLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  endText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
