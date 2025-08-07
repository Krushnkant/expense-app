import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Plus, CreditCard as Edit3, Trash2, ChevronDown, X, Calendar, Users, Tag } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatAmount } from '@/utils/currency';
import { Transaction } from '@/types';
import TransactionItem from '@/components/TransactionItem';
import AddTransactionModal from '@/components/AddTransactionModal';
import BottomSheet, { BottomSheetAction } from '@/components/BottomSheet';
import CustomAlert from '@/components/CustomAlert';
import DatePicker from '@/components/DatePicker';

export default function Transactions() {
  const { state, deleteTransaction, showToast } = useApp();
  const { state: themeState } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'family'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'yesterday' | 'last7days' | 'thismonth' | 'custom'>('thismonth');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const { colors } = themeState.theme;
  const styles = createStyles(colors);
  const userCurrency = state.user?.currency || 'INR';

  // Get unique categories from transactions
  const availableCategories = Array.from(new Set(state.transactions.map(t => t.category)))
    .map(categoryName => {
      const category = state.categories.find(c => c.name === categoryName);
      return {
        name: categoryName,
        color: category?.color || '#6B7280'
      };
    });

  // Mock family members (in real app, this would come from family context)
  const familyMembers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Doe' },
    { id: 'user3', name: 'Alex Doe' },
  ];

  const getDateRange = (range: typeof dateRangeFilter) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (range) {
      case 'today':
        return {
          start: startOfToday,
          end: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'yesterday':
        const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'last7days':
        return {
          start: new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        };
      case 'thismonth':
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: new Date()
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : new Date(0),
          end: customEndDate ? new Date(customEndDate) : new Date()
        };
      default:
        return { start: new Date(0), end: new Date() };
    }
  };

  const filteredTransactions = state.transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Scope filter
    const matchesScope = scopeFilter === 'all' || transaction.scope === scopeFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    
    // Date range filter
    const { start, end } = getDateRange(dateRangeFilter);
    const transactionDate = new Date(transaction.date);
    const matchesDateRange = transactionDate >= start && transactionDate <= end;
    
    // Member filter (for now, all transactions are considered from current user)
    const matchesMember = memberFilter === 'all'; // TODO: Implement when user tracking is added
    
    return matchesSearch && matchesScope && matchesCategory && matchesDateRange && matchesMember;
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (scopeFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (dateRangeFilter !== 'thismonth') count++;
    if (memberFilter !== 'all') count++;
    return count;
  };

  const clearAllFilters = () => {
    setScopeFilter('all');
    setCategoryFilter('all');
    setDateRangeFilter('thismonth');
    setMemberFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleDatePickerOpen = (type: 'start' | 'end') => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const handleDateSelect = (selectedDate: string) => {
    if (datePickerType === 'start') {
      setCustomStartDate(selectedDate);
    } else {
      setCustomEndDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupTransactionsByDate = (transactions: typeof state.transactions) => {
    const groups: { [key: string]: typeof state.transactions } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  };

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  const formatDateGroup = (date: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTotalForDay = (transactions: typeof state.transactions) => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowAddModal(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
    setShowActionSheet(false);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction(transactionToDelete.id);
      showToast({
        type: 'success',
        message: 'Transaction deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast({
        type: 'error',
        message: 'Failed to delete transaction. Please try again.',
      });
    } finally {
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowActionSheet(true);
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    setSelectedTransaction(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTransaction(null);
  };

  const actionSheetActions: BottomSheetAction[] = [
    {
      id: 'edit',
      title: 'Edit Transaction',
      icon: Edit3,
      color: '#4facfe',
      onPress: () => {
        if (selectedTransaction) {
          handleEditTransaction(selectedTransaction);
        }
      },
    },
    {
      id: 'delete',
      title: 'Delete Transaction',
      icon: Trash2,
      color: '#EF4444',
      onPress: () => {
        if (selectedTransaction) {
          handleDeleteTransaction(selectedTransaction);
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingTransaction(null);
            setShowAddModal(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <View style={styles.filtersActions}>
              {getActiveFilterCount() > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeFiltersButton}>
                <X size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scope Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Scope</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'All' },
                { key: 'personal', label: 'Personal' },
                { key: 'family', label: 'Family' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    scopeFilter === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setScopeFilter(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    scopeFilter === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.categoryFilterContainer}>
              <View style={styles.categoryFilterSelected}>
                <Tag size={16} color={colors.textTertiary} />
                <Text style={styles.categoryFilterText}>
                  {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                </Text>
                <ChevronDown size={16} color={colors.textTertiary} />
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
                contentContainerStyle={styles.categoryScrollContent}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    categoryFilter === 'all' && styles.categoryChipActive
                  ]}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    categoryFilter === 'all' && styles.categoryChipTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {availableCategories.map(category => (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.categoryChip,
                      categoryFilter === category.name && styles.categoryChipActive
                    ]}
                    onPress={() => setCategoryFilter(category.name)}
                  >
                    <View style={[styles.categoryChipDot, { backgroundColor: category.color }]} />
                    <Text style={[
                      styles.categoryChipText,
                      categoryFilter === category.name && styles.categoryChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'last7days', label: 'Last 7 days' },
                { key: 'thismonth', label: 'This Month' },
                { key: 'custom', label: 'Custom' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    dateRangeFilter === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setDateRangeFilter(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    dateRangeFilter === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Custom Date Range */}
            {dateRangeFilter === 'custom' && (
              <View style={styles.customDateContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => handleDatePickerOpen('start')}
                >
                  <Calendar size={16} color={colors.textTertiary} />
                  <Text style={styles.dateButtonText}>
                    From: {formatDateForDisplay(customStartDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => handleDatePickerOpen('end')}
                >
                  <Calendar size={16} color={colors.textTertiary} />
                  <Text style={styles.dateButtonText}>
                    To: {formatDateForDisplay(customEndDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Member Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Member</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  memberFilter === 'all' && styles.filterOptionActive
                ]}
                onPress={() => setMemberFilter('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  memberFilter === 'all' && styles.filterOptionTextActive
                ]}>
                  All Members
                </Text>
              </TouchableOpacity>
              {familyMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.filterOption,
                    memberFilter === member.id && styles.filterOptionActive
                  ]}
                  onPress={() => setMemberFilter(member.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    memberFilter === member.id && styles.filterOptionTextActive
                  ]}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Transactions List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Results Summary */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </Text>
          {getActiveFilterCount() > 0 && (
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {groupedTransactions.length > 0 ? (
          groupedTransactions.map(([date, transactions]) => {
            const dayTotal = getTotalForDay(transactions);
            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{formatDateGroup(date)}</Text>
                  <View style={styles.dayTotalContainer}>
                    {dayTotal.income > 0 && (
                      <Text style={styles.dayIncome}>+{formatAmount(dayTotal.income, userCurrency)}</Text>
                    )}
                    {dayTotal.expenses > 0 && (
                      <Text style={styles.dayExpenses}>-{formatAmount(dayTotal.expenses, userCurrency)}</Text>
                    )}
                  </View>
                </View>
                
                {transactions.map(transaction => {
                  const category = state.categories.find(c => c.name === transaction.category);
                  return (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      categoryColor={category?.color}
                      categoryIcon={category?.icon}
                      onMorePress={handleTransactionPress}
                    />
                  );
                })}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || getActiveFilterCount() > 0 ? 'Try adjusting your search or filters' : 'Add your first transaction to get started'}
            </Text>
          </View>
        )}
      </ScrollView>

      <AddTransactionModal
        visible={showAddModal}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />

      <BottomSheet
        visible={showActionSheet}
        onClose={handleCloseActionSheet}
        title="Transaction Actions"
        actions={actionSheetActions}
      />

      <CustomAlert
        visible={showDeleteConfirm}
        type="warning"
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.description}"? This action cannot be undone.`}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Date Picker for Custom Range */}
      <DatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={datePickerType === 'start' ? customStartDate : customEndDate}
        onDateSelect={handleDateSelect}
        title={`Select ${datePickerType === 'start' ? 'Start' : 'End'} Date`}
        maxDate={new Date().toISOString().split('T')[0]}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4facfe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#4facfe',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  filtersActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  closeFiltersButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  categoryFilterContainer: {
    gap: 12,
  },
  categoryFilterSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  categoryFilterText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryScrollView: {
    maxHeight: 40,
  },
  categoryScrollContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#4facfe',
  },
  categoryChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#4facfe',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayTotalContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayIncome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4facfe',
  },
  dayExpenses: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});