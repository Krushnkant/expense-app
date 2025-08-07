import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, Plus, Settings, Crown, UserPlus, DollarSign, TrendingUp, TrendingDown, Calendar, MoveVertical as MoreVertical, CreditCard as Edit3, Trash2, User } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatAmount } from '@/utils/currency';
import { FamilyGroup, FamilyBudgetCategory } from '@/types';
import CreateFamilyModal from '../../components/CreateFamilyModal';
import InviteMemberModal from '../../components/InviteMemberModal';
import FamilyBudgetModal from '../../components/FamilyBudgetModal';
import BottomSheet, { BottomSheetAction } from '@/components/BottomSheet';

export default function Family() {
  const { state, getFamilyCategories } = useApp();
  const { state: themeState } = useTheme();
  const [activeTab, setActiveTab] = useState<'budget' | 'members'>('budget');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const { colors } = themeState.theme;
  const styles = createStyles(colors);
  const userCurrency = state.user?.currency || 'INR';

  // Initialize family group with proper structure and persistence
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup>({
    id: '1',
    name: 'The Doe Family',
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    monthlyBudget: 4000, // Different from personal budget
    members: [
      { id: '1', userId: 'user1', name: 'John Doe', email: 'john@example.com', role: 'admin', avatar: '👨', joinedAt: new Date().toISOString(), status: 'active' },
      { id: '2', userId: 'user2', name: 'Jane Doe', email: 'jane@example.com', role: 'member', avatar: '👩', joinedAt: new Date().toISOString(), status: 'active' },
      { id: '3', userId: 'user3', name: 'Alex Doe', email: 'alex@example.com', role: 'member', avatar: '👦', joinedAt: new Date().toISOString(), status: 'active' },
    ],
    budget: {
      monthly: 4000,
      spent: 0, // Will be calculated from actual transactions
      categories: []
    }
  });

  // Load family group data from AsyncStorage
  useEffect(() => {
    loadFamilyGroup();
  }, []);

  // Update category spending based on actual transactions and sync with global categories
  useEffect(() => {
    updateCategorySpending();
  }, [state.familyCategoryStats, state.categories]);

  const loadFamilyGroup = async () => {
    try {
      const savedFamilyGroup = await AsyncStorage.getItem('familyGroup');
      if (savedFamilyGroup) {
        const parsed = JSON.parse(savedFamilyGroup);
        setFamilyGroup(parsed);
      } else {
        // Initialize with default categories from global family categories
        initializeDefaultFamilyBudget();
      }
    } catch (error) {
      console.error('Error loading family group:', error);
    }
  };

  const initializeDefaultFamilyBudget = () => {
    const familyCategories = getFamilyCategories('expense');
    const defaultBudgetCategories: FamilyBudgetCategory[] = familyCategories.map(category => ({
      id: `budget-${category.id}`,
      categoryId: category.id,
      name: category.name,
      budget: 0,
      spent: 0,
      color: category.color,
    }));

    const updatedGroup = {
      ...familyGroup,
      budget: {
        ...familyGroup.budget,
        categories: defaultBudgetCategories
      }
    };

    setFamilyGroup(updatedGroup);
    saveFamilyGroup(updatedGroup);
  };

  const saveFamilyGroup = async (updatedGroup: FamilyGroup) => {
    try {
      await AsyncStorage.setItem('familyGroup', JSON.stringify(updatedGroup));
      setFamilyGroup(updatedGroup);
    } catch (error) {
      console.error('Error saving family group:', error);
    }
  };

  const updateCategorySpending = () => {
    // Sync budget categories with global categories and update spending
    const familyCategories = getFamilyCategories('expense');
    
    const updatedCategories = familyGroup.budget.categories.map(budgetCategory => {
      // Find corresponding global category
      const globalCategory = familyCategories.find(gc => gc.id === budgetCategory.categoryId);
      
      // Find spending from family category stats (only family-scoped transactions)
      const categoryStats = state.familyCategoryStats.find(stat => stat.category === budgetCategory.name);
      
      return {
        ...budgetCategory,
        name: globalCategory?.name || budgetCategory.name, // Sync name from global category
        color: globalCategory?.color || budgetCategory.color, // Sync color from global category
        spent: categoryStats ? categoryStats.amount : 0
      };
    });

    // Add any new family categories that aren't in the budget yet
    const newCategories = familyCategories.filter(
      globalCat => !familyGroup.budget.categories.some(budgetCat => budgetCat.categoryId === globalCat.id)
    );

    const newBudgetCategories: FamilyBudgetCategory[] = newCategories.map(category => ({
      id: `budget-${category.id}`,
      categoryId: category.id,
      name: category.name,
      budget: 0,
      spent: state.familyCategoryStats.find(stat => stat.category === category.name)?.amount || 0,
      color: category.color,
    }));

    const allCategories = [...updatedCategories, ...newBudgetCategories];
    const totalSpent = allCategories.reduce((sum, cat) => sum + cat.spent, 0);

    const updatedGroup = {
      ...familyGroup,
      budget: {
        ...familyGroup.budget,
        spent: totalSpent,
        categories: allCategories
      }
    };

    if (JSON.stringify(updatedGroup) !== JSON.stringify(familyGroup)) {
      setFamilyGroup(updatedGroup);
      saveFamilyGroup(updatedGroup);
    }
  };

  const getBudgetUsedPercentage = () => {
    return familyGroup.budget.monthly > 0 ? (familyGroup.budget.spent / familyGroup.budget.monthly) * 100 : 0;
  };

  const handleInviteMember = () => {
    setShowInviteModal(true);
  };

  const handleManageBudget = () => {
    setShowBudgetModal(true);
  };

  const handleBudgetSave = (updatedBudget: { monthly: number; categories: FamilyBudgetCategory[] }) => {
    const updatedGroup = {
      ...familyGroup,
      monthlyBudget: updatedBudget.monthly,
      budget: {
        ...familyGroup.budget,
        monthly: updatedBudget.monthly,
        categories: updatedBudget.categories
      }
    };
    saveFamilyGroup(updatedGroup);
  };

  const handleMemberAction = (member: any) => {
    Alert.alert(
      'Member Actions',
      `What would you like to do with ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Profile', onPress: () => {} },
        { text: 'Remove Member', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  if (!familyGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Budget</Text>
        </View>

        <View style={styles.emptyState}>
          <Users size={64} color={colors.textTertiary} />
          <Text style={styles.emptyStateTitle}>No Family Group</Text>
          <Text style={styles.emptyStateSubtext}>
             {formatAmount(familyGroup.budget.monthly - familyGroup.budget.spent, userCurrency)}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>Create Family Group</Text>
          </TouchableOpacity>
        </View>

        <CreateFamilyModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Family Budget</Text>
          <Text style={styles.subtitle}>{familyGroup.name}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'budget' && styles.activeTab]}
          onPress={() => setActiveTab('budget')}
        >
          <Text style={[styles.tabText, activeTab === 'budget' && styles.activeTabText]}>
            Budget
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Budget Tab Content */}
        {activeTab === 'budget' && (
          <>
            {/* Budget Overview */}
            <View style={styles.budgetOverview}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Monthly Budget</Text>
                <TouchableOpacity onPress={handleManageBudget}>
                  <Text style={styles.manageBudgetText}>Manage</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.budgetStats}>
                <View style={styles.budgetStatItem}>
                  <DollarSign size={24} color="#4facfe" />
                  <Text style={styles.budgetStatValue}>{formatAmount(familyGroup.budget.monthly, userCurrency)}</Text>
                  <Text style={styles.budgetStatLabel}>Total Budget</Text>
                </View>
                <View style={styles.budgetStatItem}>
                  <TrendingUp size={24} color="#10B981" />
                  <Text style={styles.budgetStatValue}>{formatAmount(state.monthlyStats.familyIncome, userCurrency)}</Text>
                  <Text style={styles.budgetStatLabel}>Family Income</Text>
                </View>
                <View style={styles.budgetStatItem}>
                  <TrendingDown size={24} color="#EF4444" />
                  <Text style={styles.budgetStatValue}>{formatAmount(familyGroup.budget.spent, userCurrency)}</Text>
                  <Text style={styles.budgetStatLabel}>Spent</Text>
                </View>
                <View style={styles.budgetStatItem}>
                  <DollarSign size={24} color="#4facfe" />
                  <Text style={styles.budgetStatValue}>
                    {formatAmount(familyGroup.budget.monthly - familyGroup.budget.spent, userCurrency)}
                  </Text>
                  <Text style={styles.budgetStatLabel}>Remaining</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Budget Used</Text>
                  <Text style={styles.progressPercentage}>{getBudgetUsedPercentage().toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(getBudgetUsedPercentage(), 100)}%`,
                        backgroundColor: getBudgetUsedPercentage() > 80 ? '#EF4444' : '#4facfe'
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Category Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              {familyGroup.budget.categories.length > 0 ? (
                familyGroup.budget.categories.map((category) => {
                  const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
                  const isOverBudget = category.spent > category.budget;
                  
                  return (
                    <View key={category.id} style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryInfo}>
                          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                          <Text style={styles.categoryName}>{category.name}</Text>
                        </View>
                        <Text style={[
                          styles.categoryAmount,
                          { color: isOverBudget ? '#EF4444' : colors.text }
                        ]}>
                          {formatAmount(category.spent, userCurrency)} / {formatAmount(category.budget, userCurrency)}
                        </Text>
                      </View>
                      <View style={styles.categoryProgressBar}>
                        <View 
                          style={[
                            styles.categoryProgressFill, 
                            { 
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: isOverBudget ? '#EF4444' : category.color
                            }
                          ]} 
                        />
                      </View>
                      {isOverBudget && (
                        <Text style={styles.overBudgetText}>
                          Over budget by {formatAmount(category.spent - category.budget, userCurrency)}
                        </Text>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.noCategoriesContainer}>
                  <Text style={styles.noCategoriesText}>No budget categories set up</Text>
                  <Text style={styles.noCategoriesSubtext}>
                    Tap "Manage" to add categories to your family budget
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Members Tab Content */}
        {activeTab === 'members' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Members</Text>
              <TouchableOpacity onPress={handleInviteMember} style={styles.inviteButton}>
                <UserPlus size={16} color="#4facfe" />
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>
            
            {familyGroup.members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameContainer}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.role === 'admin' && (
                        <Crown size={16} color="#F59E0B" />
                      )}
                    </View>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleMemberAction(member)}>
                  <MoreVertical size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateFamilyModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      
      <FamilyBudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        budget={familyGroup.budget}
        onSave={handleBudgetSave}
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
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: '#4facfe',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  budgetOverview: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  manageBudgetText: {
    fontSize: 16,
    color: '#4facfe',
    fontWeight: '600',
  },
  budgetStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  budgetStatItem: {
    alignItems: 'center',
    width: '47%',
    backgroundColor: colors.borderLight,
    padding: 16,
    borderRadius: 12,
  },
  budgetStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  budgetStatLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
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
    marginBottom: 20, // Increased spacing between title and cards
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4facfe',
  },
  categoryCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  overBudgetText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  noCategoriesContainer: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  noCategoriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  noCategoriesSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  memberRole: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#4facfe',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});