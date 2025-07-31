import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Users, Crown, CreditCard, TrendingUp, Calendar, CircleCheck as CheckCircle, X, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { Notification } from '@/types';
import { formatAmount } from '@/utils/currency';

export default function Notifications() {
  const { state: themeState } = useTheme();
  const { showToast, state } = useApp();
  const { colors } = themeState.theme;
  const styles = createStyles(colors);
  const userCurrency = state.user?.currency || 'INR';

  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'invitation',
      title: 'Family Budget Invitation',
      message: 'John Doe invited you to join "The Smith Family" budget group',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: false,
      status: 'pending',
      data: {
        familyGroupId: 'family-1',
        familyGroupName: 'The Smith Family',
        invitedBy: 'John Doe',
        actionRequired: true,
      },
    },
    {
      id: '2',
      type: 'invitation',
      title: 'Family Budget Invitation',
      message: 'Sarah Wilson invited you to join "Wilson Household" budget group',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: false,
      status: 'pending',
      data: {
        familyGroupId: 'family-2',
        familyGroupName: 'Wilson Household',
        invitedBy: 'Sarah Wilson',
        actionRequired: true,
      },
    },
    {
      id: '3',
      type: 'subscription',
      title: 'Subscription Expired',
      message: 'Your Premium subscription has expired. Renew now to continue enjoying premium features.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: false,
      data: {
        subscriptionPlan: 'Premium',
        actionRequired: true,
      },
    },
    {
      id: '4',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Your subscription payment of ₹369 has been processed successfully.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      isRead: true,
      data: {
        subscriptionPlan: '3-Month Premium',
        amount: 369,
        currency: 'INR',
      },
    },
    {
      id: '5',
      type: 'budget',
      title: 'Budget Limit Exceeded',
      message: 'You have exceeded 90% of your Food & Dining budget for this month.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      isRead: false,
      data: {
        budgetCategory: 'Food & Dining',
        budgetLimit: 5000,
        actionRequired: false,
      },
    },
    {
      id: '6',
      type: 'reminder',
      title: 'EMI Due Tomorrow',
      message: 'Your Home Loan EMI of ₹25,000 is due tomorrow. Don\'t forget to make the payment.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      isRead: true,
      data: {
        amount: 25000,
        currency: 'INR',
      },
    },
    {
      id: '7',
      type: 'system',
      title: 'New Feature Available',
      message: 'Check out our new Investment Tracking feature to monitor your portfolio performance.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      isRead: true,
      data: {
        actionRequired: false,
      },
    },
    {
      id: '8',
      type: 'invitation',
      title: 'Family Budget Invitation',
      message: 'Mike Johnson invited you to join "Johnson Family" budget group',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      isRead: true,
      status: 'accepted',
      data: {
        familyGroupId: 'family-3',
        familyGroupName: 'Johnson Family',
        invitedBy: 'Mike Johnson',
        actionRequired: false,
      },
    },
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return Users;
      case 'subscription':
        return Crown;
      case 'payment':
        return CreditCard;
      case 'budget':
        return TrendingUp;
      case 'reminder':
        return Calendar;
      case 'system':
        return Bell;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return '#4facfe';
      case 'subscription':
        return '#F59E0B';
      case 'payment':
        return '#10B981';
      case 'budget':
        return '#EF4444';
      case 'reminder':
        return '#8B5CF6';
      case 'system':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleAcceptInvitation = (notification: Notification) => {
    Alert.alert(
      'Accept Invitation',
      `Are you sure you want to join "${notification.data?.familyGroupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            // Update notification status
            setNotifications(prev =>
              prev.map(n =>
                n.id === notification.id
                  ? { ...n, status: 'accepted', isRead: true }
                  : n
              )
            );
            
            showToast({
              type: 'success',
              message: `Successfully joined ${notification.data?.familyGroupName}!`,
            });
          },
        },
      ]
    );
  };

  const handleRejectInvitation = (notification: Notification) => {
    Alert.alert(
      'Reject Invitation',
      `Are you sure you want to reject the invitation to join "${notification.data?.familyGroupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // Update notification status
            setNotifications(prev =>
              prev.map(n =>
                n.id === notification.id
                  ? { ...n, status: 'rejected', isRead: true }
                  : n
              )
            );
            
            showToast({
              type: 'info',
              message: 'Invitation rejected',
            });
          },
        },
      ]
    );
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    showToast({
      type: 'success',
      message: 'All notifications marked as read',
    });
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'subscription':
        router.push('/(tabs)/subscription');
        break;
      case 'budget':
        router.push('/(tabs)/family');
        break;
      case 'reminder':
        router.push('/(tabs)/emis');
        break;
      default:
        // For other types, just mark as read
        break;
    }
  };

  // Filter notifications based on selected tab
  const pendingInvitations = notifications.filter(n => n.type === 'invitation' && n.status === 'pending');
  const allNotifications = notifications.filter(n => 
    !(n.type === 'invitation' && n.status === 'pending') && 
    !n.data?.actionRequired
  );
  const displayedNotifications = selectedTab === 'pending' ? pendingInvitations : allNotifications;
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingCount = pendingInvitations.length;

  const renderNotificationItem = (notification: Notification) => {
    const IconComponent = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    const isInvitation = notification.type === 'invitation' && notification.status === 'pending';

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
              <IconComponent size={20} color={iconColor} />
            </View>
            <View style={styles.notificationDetails}>
              <View style={styles.titleRow}>
                <Text style={[styles.notificationTitle, !notification.isRead && styles.unreadTitle]}>
                  {notification.title}
                </Text>
                {!notification.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>{formatTimestamp(notification.timestamp)}</Text>
            </View>
          </View>

          {/* Status Badge */}
          {notification.status && notification.type === 'invitation' && notification.status !== 'pending' && (
            <View style={styles.statusContainer}>
              {notification.status === 'accepted' && (
                <View style={[styles.statusBadge, styles.acceptedBadge]}>
                  <CheckCircle size={12} color="#10B981" />
                  <Text style={styles.acceptedText}>Accepted</Text>
                </View>
              )}
              {notification.status === 'rejected' && (
                <View style={[styles.statusBadge, styles.rejectedBadge]}>
                  <View style={styles.rejectedIcon}>
                    <X size={12} color="#EF4444" />
                  </View>
                  <Text style={styles.rejectedText}>Rejected</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons for Invitations */}
          {isInvitation && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectInvitation(notification)}
                activeOpacity={0.8}
              >
                <View style={styles.rejectIconContainer}>
                  <X size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptInvitation(notification)}
                activeOpacity={0.8}
              >
                <CheckCircle size={16} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabSpacing} />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Action Required
          </Text>
          {pendingCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All Activity
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications List */}
        <View style={styles.section}>
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map(renderNotificationItem)
          ) : (
            <View style={styles.emptyState}>
              {selectedTab === 'pending' ? (
                <>
                  <Users size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyStateText}>No actions required</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Items requiring your attention will appear here
                  </Text>
                </>
              ) : (
                <>
                  <Bell size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyStateText}>No activity yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    All your notifications and updates will appear here
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4facfe',
    borderRadius: 12,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabSpacing: {
    height: 16,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 0,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  notificationItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4facfe',
    backgroundColor: colors.primaryLight,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4facfe',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  acceptedBadge: {
    backgroundColor: '#D1FAE5',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  acceptedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  rejectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  rejectedIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  rejectIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});