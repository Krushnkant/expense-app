import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Plus, Bell, Calendar, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useGuest } from '@/contexts/GuestContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatAmount } from '@/utils/currency';
import { Transaction } from '@/types';
import StatCard from '@/components/StatCard';
import TransactionItem from '@/components/TransactionItem';
import AddTransactionModal from '@/components/AddTransactionModal';
import GuestModeIndicator from '@/components/GuestModeIndicator';
import BottomSheet, { BottomSheetAction } from '@/components/BottomSheet';
import CustomAlert from '@/components/CustomAlert';

export default function Dashboard() {
  const { state, calculateStats, deleteTransaction } = useApp();
  const { isGuest } = useGuest();
  const { state: authState } = useAuth();
  const { state: themeState } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const { colors } = themeState.theme;
  const styles = createStyles(colors);

  const recentTransactions = state.transactions.slice(0, 5);
  const userCurrency = state.user?.currency || 'INR';
  
  // Get only the next upcoming EMI for each unique loan
  const getUpcomingEMIs = () => {
    const activeEMIs = state.emis.filter(emi => emi.status === 'active');
    
    // Group EMIs by loan name
    const emiGroups = activeEMIs.reduce((groups, emi) => {
      const loanName = emi.name;
      if (!groups[loanName]) {
        groups[loanName] = [];
      }
      groups[loanName].push(emi);
      return groups;
    }, {} as Record<string, typeof activeEMIs>);
    
    // For each loan, find the EMI with the earliest next due date
    const upcomingEMIs = Object.values(emiGroups).map(emiGroup => {
      return emiGroup.reduce((earliest, current) => {
        const earliestDate = new Date(earliest.nextDueDate);
        const currentDate = new Date(current.nextDueDate);
        return currentDate < earliestDate ? current : earliest;
      });
    });
    
    // Sort by next due date (most imminent first)
    return upcomingEMIs.sort((a, b) => {
      const dateA = new Date(a.nextDueDate);
      const dateB = new Date(b.nextDueDate);
      return dateA.getTime() - dateB.getTime();
    });
  };
  
  const upcomingEMIs = getUpcomingEMIs();

  const onRefresh = async () => {
    setRefreshing(true);
    calculateStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUserName = () => {
    if (!authState.isAuthenticated) {
      return 'Guest';
    }
    return authState.user?.name || 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning!';
    } else if (hour < 17) {
      return 'Good Afternoon!';
    } else {
      return 'Good Evening!';
    }
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

  const handleSeeAllTransactions = () => {
    router.push('/(tabs)/transactions');
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{getUserName()}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Bell size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Guest Mode Indicator */}
        <GuestModeIndicator />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Balance"
            value={formatAmount(state.monthlyStats.netSavings, userCurrency)}
            subtitle="This month"
            icon={DollarSign}
            color="#4facfe"
            backgroundColor={colors.surface}
          />
          
          <View style={styles.statsRow}>
            <View style={styles.statCardHalf}>
              <StatCard
                title="Income"
                value={formatAmount(state.monthlyStats.totalIncome, userCurrency)}
                icon={TrendingUp}
                color="#4facfe"
                backgroundColor={colors.surface}
              />
            </View>
            <View style={styles.statCardHalf}>
              <StatCard
                title="Expenses"
                value={formatAmount(state.monthlyStats.totalExpenses, userCurrency)}
                icon={TrendingDown}
                color="#EF4444"
                backgroundColor={colors.surface}
              />
            </View>
          </View>

          <StatCard
            title="Budget Used"
            value={`${state.monthlyStats.budgetUsed.toFixed(2)}%`}
           subtitle={`${formatAmount(state.monthlyStats.totalExpenses, userCurrency)} of ${formatAmount(state.user?.monthlyBudget || 0, userCurrency)}`}
            icon={PiggyBank}
            color={state.monthlyStats.budgetUsed > 80 ? '#EF4444' : '#4facfe'}
            backgroundColor={colors.surface}
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={handleSeeAllTransactions}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map(transaction => {
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
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first transaction to get started</Text>
            </View>
          )}
        </View>

        {/* Upcoming EMIs */}
        {upcomingEMIs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming EMIs</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingEMIs.map(emi => {
              const daysUntilDue = getDaysUntilDue(emi.nextDueDate);
              return (
                <View key={emi.id} style={styles.emiCard}>
                  <View style={styles.emiHeader}>
                    <Calendar size={20} color="#4facfe" />
                    <Text style={styles.emiName}>{emi.name}</Text>
                  </View>
                  <View style={styles.emiDetails}>
                    <Text style={styles.emiAmount}>{formatAmount(emi.monthlyAmount, userCurrency)}</Text>
                    <Text style={[
                      styles.emiDue,
                      { color: daysUntilDue <= 3 ? '#EF4444' : colors.textTertiary }
                    ]}>
                      Due in {daysUntilDue} days
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add some bottom padding for FAB */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingTransaction(null);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
  },
  greeting: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardHalf: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 16,
    color: '#4facfe',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
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
  emiCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emiName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  emiDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emiAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4facfe',
  },
  emiDue: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 120,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4facfe',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});