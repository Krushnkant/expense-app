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
import { User, Settings, Bell, Download, CircleHelp as HelpCircle, Shield, Trash2, Pencil, Check, X, LogOut, Smartphone, Sun, Moon, Monitor, CreditCard, Tag, DollarSign } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { formatAmount, formatAmountWithSign, SUPPORTED_CURRENCIES, getCurrencyName } from '@/utils/currency';
import ChangePinModal from '@/components/ChangePinModal';
import BottomSheet, { BottomSheetAction } from '@/components/BottomSheet';
import CustomAlert from '@/components/CustomAlert';

export default function Profile() {
  const { state, dispatch, showToast, calculateStats, updateUserCurrency } = useApp();
  const { logout, state: authState } = useAuth();
  const { isGuest } = useGuest();
  const { state: themeState, setColorScheme, toggleTheme } = useTheme();
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(state.user?.monthlyBudget.toString() || '');
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const { colors } = themeState.theme;

  const handleBudgetSave = () => {
    const newBudget = parseFloat(budgetInput);
    if (isNaN(newBudget) || newBudget <= 0) {
      showToast({
        type: 'error',
        message: 'Please enter a valid budget amount',
      });
      return;
    }

    if (state.user) {
      const updatedUser = { ...state.user, monthlyBudget: newBudget };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      // Recalculate stats with the new budget
      setTimeout(() => {
        calculateStats();
      }, 100);
      
      showToast({
        type: 'success',
        message: 'Budget updated successfully!',
      });
    }
    setEditingBudget(false);
  };

  const handleBudgetCancel = () => {
    setBudgetInput(state.user?.monthlyBudget.toString() || '');
    setEditingBudget(false);
  };

  // Function to validate and format budget input
  const handleBudgetInputChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    let cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (cleanedText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDecimalIndex = cleanedText.indexOf('.');
      cleanedText = cleanedText.substring(0, firstDecimalIndex + 1) + 
                   cleanedText.substring(firstDecimalIndex + 1).replace(/\./g, '');
    }
    
    // If starts with decimal point, prefix with 0
    if (cleanedText.startsWith('.')) {
      cleanedText = '0' + cleanedText;
    }
    
    // Limit to 2 decimal places
    const parts = cleanedText.split('.');
    if (parts.length === 2 && parts[1].length > 2) {
      cleanedText = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setBudgetInput(cleanedText);
  };
  const handleExportData = () => {
    showToast({
      type: 'info',
      message: 'Export functionality will be available in a future update.',
    });
  };

  const handleDeleteData = () => {
    setShowDeleteAlert(true);
  };

  const handleConfirmDeleteData = () => {
    // Clear all data
    dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
    dispatch({ type: 'SET_EMIS', payload: [] });
    showToast({
      type: 'success',
      message: 'All data has been deleted',
    });
    setShowDeleteAlert(false);
  };

  const handleLogout = () => {
    if (isGuest) {
      setShowLogoutAlert(true);
    } else {
      setShowLogoutAlert(true);
    }
  };

  const handleConfirmLogout = () => {
    if (isGuest) {
      router.push('/(auth)/email-entry');
    } else {
      logout();
    }
    setShowLogoutAlert(false);
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    try {
      await updateUserCurrency(currencyCode);
      showToast({
        type: 'success',
        message: `Currency changed to ${getCurrencyName(currencyCode)}`,
      });
      setShowCurrencySelector(false);
      
      // Recalculate stats to update display
      setTimeout(() => {
        calculateStats();
      }, 100);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to update currency. Please try again.',
      });
    }
  };

  // Function to determine font size based on savings amount
  const getSavingsFontSize = (amount: number) => {
    const absAmount = Math.abs(amount);
    const amountString = absAmount.toString();
    
    if (absAmount >= 1000000) {
      return 16; // Very large amounts (millions)
    } else if (absAmount >= 100000) {
      return 18; // Large amounts (hundreds of thousands)
    } else if (absAmount >= 10000) {
      return 20; // Medium amounts (tens of thousands)
    } else {
      return 22; // Default size for smaller amounts
    }
  };

  const formatMobile = (mobile: string) => {
    if (!mobile) return '';
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `${cleaned.slice(0, 2)}***-***-${cleaned.slice(-4)}`;
    }
    return mobile;
  };

  const getUserDisplayName = () => {
    if (isGuest) return 'Guest User';
    return authState.user?.name || 'User';
  };

  const styles = createStyles(colors);

  const userCurrency = state.user?.currency || 'INR';

  const currencyActions: BottomSheetAction[] = SUPPORTED_CURRENCIES.map(currency => ({
    id: currency.code,
    title: `${currency.name} (${currency.symbol})`,
    icon: DollarSign,
    color: currency.code === userCurrency ? '#4facfe' : colors.text,
    onPress: () => handleCurrencyChange(currency.code),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={20} color={isGuest ? "#4facfe" : "#EF4444"} />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={32} color="#4facfe" />
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameAndPlan}>
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
              {/* Plan Badge */}
              <View style={[
                styles.planBadge,
                { backgroundColor: isGuest ? '#FEF3C7' : '#DBEAFE' }
              ]}>
                <Text style={[
                  styles.planText,
                  { color: isGuest ? '#92400E' : '#1E40AF' }
                ]}>
                  {isGuest ? 'Free Plan' : 'Premium Plan'}
                </Text>
              </View>
            </View>
            {!isGuest && (
              <View style={styles.contactInfo}>
                {authState.user?.mobile && (
                  <View style={styles.contactItem}>
                    <Smartphone size={16} color={colors.textTertiary} />
                    <Text style={styles.contactText}>
                      {formatMobile(authState.user.mobile)}
                    </Text>
                  </View>
                )}
                {authState.user?.email && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactText}>{authState.user.email}</Text>
                  </View>
                )}
              </View>
            )}
            {isGuest && (
              <TouchableOpacity 
                style={styles.createAccountButton}
                onPress={() => router.push('/(auth)/email-entry')}
              >
                <Text style={styles.createAccountText}>Save Your Data</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{state.transactions.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{state.emis.length}</Text>
              <Text style={styles.statLabel}>EMIs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{state.categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statCard}>
              <Text 
                style={[
                  styles.statValue, 
                  { 
                    color: state.monthlyStats.netSavings >= 0 ? '#4facfe' : '#EF4444',
                    fontSize: getSavingsFontSize(state.monthlyStats.netSavings),
                    lineHeight: getSavingsFontSize(state.monthlyStats.netSavings) + 4,
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.6}
              >
                {formatAmountWithSign(state.monthlyStats.netSavings, userCurrency)}
              </Text>
              <Text style={styles.statLabel}>
                {state.monthlyStats.netSavings >= 0 ? 'Personal Savings' : 'Over Personal Budget'}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Settings</Text>
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Personal Monthly Budget</Text>
              {!editingBudget && (
                <TouchableOpacity onPress={() => setEditingBudget(true)}>
                  <Pencil size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            {editingBudget ? (
              <View style={styles.budgetEditContainer}>
                <TextInput
                  style={styles.budgetInput}
                  value={budgetInput}
                  onChangeText={handleBudgetInputChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={styles.budgetActions}>
                  <TouchableOpacity onPress={handleBudgetCancel} style={styles.budgetCancelButton}>
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBudgetSave} style={styles.budgetSaveButton}>
                    <Check size={16} color="#4facfe" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.budgetValue}>
                {formatAmount(state.user?.monthlyBudget || 0, userCurrency)}
              </Text>
            )}
            
            <View style={styles.budgetProgress}>
              <View style={styles.budgetProgressBar}>
                <View 
                  style={[
                    styles.budgetProgressFill, 
                    { 
                      width: `${Math.min(state.monthlyStats.budgetUsed, 100)}%`,
                      backgroundColor: state.monthlyStats.budgetUsed > 80 ? '#EF4444' : '#4facfe'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.budgetProgressText}>
                {state.monthlyStats.budgetUsed.toFixed(1)}% of personal budget used this month
              </Text>
            </View>
          </View>
        </View>

        {/* Currency Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => setShowCurrencySelector(true)}
            >
              <DollarSign size={20} color={colors.textTertiary} />
              <View style={styles.currencyInfo}>
                <Text style={styles.menuItemText}>Currency</Text>
                <Text style={styles.currencyValue}>
                  {getCurrencyName(userCurrency)} ({SUPPORTED_CURRENCIES.find(c => c.code === userCurrency)?.symbol})
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Settings</Text>
          <View style={styles.menuContainer}>
            <View style={styles.themeSection}>
              <View style={styles.themeSectionHeader}>
                <Text style={styles.themeSectionTitle}>Appearance</Text>
                <Text style={styles.themeSectionSubtitle}>Choose your preferred theme</Text>
              </View>
              
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeState.colorScheme === 'light' && styles.themeOptionActive
                  ]}
                  onPress={() => setColorScheme('light')}
                >
                  <View style={styles.themeOptionIcon}>
                    <Sun size={20} color={themeState.colorScheme === 'light' ? '#4facfe' : colors.textTertiary} />
                  </View>
                  <Text style={[
                    styles.themeOptionText,
                    themeState.colorScheme === 'light' && styles.themeOptionTextActive
                  ]}>
                    Light
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeState.colorScheme === 'dark' && styles.themeOptionActive
                  ]}
                  onPress={() => setColorScheme('dark')}
                >
                  <View style={styles.themeOptionIcon}>
                    <Moon size={20} color={themeState.colorScheme === 'dark' ? '#4facfe' : colors.textTertiary} />
                  </View>
                  <Text style={[
                    styles.themeOptionText,
                    themeState.colorScheme === 'dark' && styles.themeOptionTextActive
                  ]}>
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Data & Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Analytics</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
              <Download size={20} color={colors.textTertiary} />
              <Text style={styles.menuItemText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Settings */}
        {!isGuest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => setShowChangePinModal(true)}
              >
                <Shield size={20} color={colors.textTertiary} />
                <Text style={styles.menuItemText}>Change PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              router.push('/(tabs)/notifications');
            }}>
              <Bell size={20} color={colors.textTertiary} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              router.push('/(tabs)/categories');
            }}>
              <Tag size={20} color={colors.textTertiary} />
              <Text style={styles.menuItemText}>Manage Categories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              router.push('/(tabs)/subscription');
            }}>
              <CreditCard size={20} color={colors.textTertiary} />
              <Text style={styles.menuItemText}>Subscription</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <HelpCircle size={20} color={colors.textTertiary} />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteData}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.dangerButtonText}>Delete All Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ExpenseTracker Pro v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Built with React Native & Expo</Text>
        </View>
      </ScrollView>

      {!isGuest && (
        <ChangePinModal
          visible={showChangePinModal}
          onClose={() => setShowChangePinModal(false)}
        />
      )}
      
      {/* Delete Data Confirmation */}
      <CustomAlert
        visible={showDeleteAlert}
        type="error"
        title="Delete All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone."
        onClose={() => setShowDeleteAlert(false)}
        onConfirm={handleConfirmDeleteData}
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      {/* Logout Confirmation */}
      <CustomAlert
        visible={showLogoutAlert}
        type={isGuest ? "info" : "warning"}
        title={isGuest ? "Create Account" : "Sign Out"}
        message={isGuest 
          ? "You are currently using the app as a guest. Would you like to create an account to save your data?"
          : "Are you sure you want to sign out?"
        }
        onClose={() => setShowLogoutAlert(false)}
        onConfirm={handleConfirmLogout}
        confirmText={isGuest ? "Create Account" : "Sign Out"}
        cancelText={isGuest ? "Continue as Guest" : "Cancel"}
      />
      
      {/* Currency Selector */}
      <BottomSheet
        visible={showCurrencySelector}
        onClose={() => setShowCurrencySelector(false)}
        title="Select Currency"
        actions={currencyActions}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userNameAndPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  createAccountButton: {
    backgroundColor: '#4facfe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    width: '47%',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'left',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  budgetCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  budgetEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  budgetInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: '#4facfe',
    paddingBottom: 4,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetCancelButton: {
    padding: 8,
  },
  budgetSaveButton: {
    padding: 8,
  },
  budgetProgress: {
    marginTop: 8,
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetProgressText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginLeft: 12,
  },
  themeSection: {
    padding: 16,
  },
  themeSectionHeader: {
    marginBottom: 16,
  },
  themeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  themeSectionSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: '#4facfe',
    backgroundColor: colors.primaryLight,
  },
  themeOptionIcon: {
    marginRight: 8,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  themeOptionTextActive: {
    color: '#4facfe',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    padding: 40,
  },
  appInfoText: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '500',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  currencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currencyValue: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
});