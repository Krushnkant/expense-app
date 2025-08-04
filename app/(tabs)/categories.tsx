import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Lock, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { router } from 'expo-router';
import AddCategoryModal from '@/components/AddCategoryModal';
import EditCategoryModal from '@/components/EditCategoryModal';
import BottomSheet, { BottomSheetAction } from '@/components/BottomSheet';
import CustomAlert from '@/components/CustomAlert';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Category } from '@/types';

export default function Categories() {
  const { state, deleteCategory, showToast } = useApp();
  const { state: themeState } = useTheme();
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [selectedScope, setSelectedScope] = useState<'personal' | 'family'>('family');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { colors } = themeState.theme;
  const styles = createStyles(colors);

  const filteredCategories = state.categories.filter(category => 
    category.type === selectedType && category.scopes.includes(selectedScope)
  );
  const defaultCategories = filteredCategories.filter(category => category.isDefault);
  const userCategories = filteredCategories.filter(category => !category.isDefault);

  // Get actual counts for each type and scope combination
  const getCount = (type: 'expense' | 'income', scope: 'personal' | 'family') => {
    return state.categories.filter(c => c.type === type && c.scopes.includes(scope)).length;
  };

  const expensePersonalCount = getCount('expense', 'personal');
  const expenseFamilyCount = getCount('expense', 'family');
  const incomePersonalCount = getCount('income', 'personal');
  const incomeFamilyCount = getCount('income', 'family');

  const getCurrentCount = () => {
    if (selectedType === 'expense') {
      return selectedScope === 'personal' ? expensePersonalCount : expenseFamilyCount;
    } else {
      return selectedScope === 'personal' ? incomePersonalCount : incomeFamilyCount;
    }
  };

  const handleCategoryPress = (category: Category) => {
    if (category.isDefault) {
      showToast({
        type: 'warning',
        message: 'Default categories cannot be modified',
      });
      return;
    }
    
    setSelectedCategory(category);
    setShowActionSheet(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
    setShowActionSheet(false);
  };

  const handleDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
    setShowActionSheet(false);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      showToast({
        type: 'success',
        message: 'Category deleted successfully!',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete category. Please try again.',
      });
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    setSelectedCategory(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
  };

  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  const renderCategoryItem = (category: Category) => {
    const IconComponent = (Icons as any)[category.icon] || Icons.Circle;
    
    return (
      <TouchableOpacity 
        key={category.id} 
        style={styles.categoryItem}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <IconComponent size={24} color={category.color} />
          </View>
          <View style={styles.categoryDetails}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.isDefault && (
                <View style={styles.defaultBadge}>
                  <Lock size={12} color="#6B7280" />
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.categoryType}>
              {category.type} • {category.scopes.join(', ')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const actionSheetActions: BottomSheetAction[] = [
    {
      id: 'edit',
      title: 'Edit Category',
      icon: Edit3,
      color: '#4facfe',
      onPress: () => {
        if (selectedCategory) {
          handleEditCategory(selectedCategory);
        }
      },
    },
    {
      id: 'delete',
      title: 'Delete Category',
      icon: Trash2,
      color: '#EF4444',
      onPress: () => {
        if (selectedCategory) {
          handleDeleteCategory(selectedCategory);
        }
      },
    },
  ];

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
        <Text style={styles.title}>Manage Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCategory}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Combined Filter Section */}
      <View style={styles.filtersSection}>
        {/* Scope Selector */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Scope</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonLeft,
                selectedScope === 'personal' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedScope('personal')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedScope === 'personal' && styles.segmentButtonTextActive
              ]}>
                Personal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonRight,
                selectedScope === 'family' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedScope('family')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedScope === 'family' && styles.segmentButtonTextActive
              ]}>
                Family
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type Selector */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonLeft,
                selectedType === 'expense' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedType('expense')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedType === 'expense' && styles.segmentButtonTextActive
              ]}>
                Expenses ({getCurrentCount()})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonRight,
                selectedType === 'income' && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedType('income')}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedType === 'income' && styles.segmentButtonTextActive
              ]}>
                Income ({getCurrentCount()})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Default Categories */}
        {defaultCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Categories</Text>
            <Text style={styles.sectionSubtitle}>
              These categories are provided by the system and cannot be modified. They are available for both personal and family use.
            </Text>
            {/* No edit/delete actions for default categories */}
            {defaultCategories.map(renderCategoryItem)}
          </View>
        )}

        {/* User Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Categories</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedScope === 'personal' 
              ? 'Personal categories you\'ve created - only visible to you'
              : 'Family categories you\'ve created - shared with family members'
            }
          </Text>
          
          {userCategories.length > 0 ? (
            userCategories.map(category => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    {React.createElement((Icons as any)[category.icon] || Icons.Circle, {
                      size: 24,
                      color: category.color
                    })}
                  </View>
                  <View style={styles.categoryDetails}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                    <Text style={styles.categoryType}>
                      {category.type} • {category.scopes.join(', ')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No {selectedScope} categories yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to create your first {selectedScope} category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddCategoryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <EditCategoryModal
        visible={showEditModal}
        onClose={handleCloseEditModal}
        category={selectedCategory}
      />

      <BottomSheet
        visible={showActionSheet}
        onClose={handleCloseActionSheet}
        title="Category Actions"
        actions={actionSheetActions}
      />

      <CustomAlert
        visible={showDeleteConfirm}
        type="warning"
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
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
  title: {
    fontSize: 20,
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
  filtersSection: {
    backgroundColor: colors.surface,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  filterGroup: {
    marginTop: 4,
    marginBottom: 8,
  },
  filterGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonLeft: {
    marginRight: 1,
  },
  segmentButtonRight: {
    marginLeft: 1,
  },
  segmentButtonActive: {
    backgroundColor: '#4facfe',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryType: {
    fontSize: 14,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 16,
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