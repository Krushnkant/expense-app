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
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Category } from '@/types';

export default function Categories() {
  const { state, deleteCategory, showToast } = useApp();
  const { state: themeState } = useTheme();
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);

  const { colors } = themeState.theme;
  const styles = createStyles(colors);

  const filteredCategories = state.categories.filter(category => category.type === selectedType);
  const defaultCategories = filteredCategories.filter(category => category.isDefault);
  const userCategories = filteredCategories.filter(category => !category.isDefault);

  // Get actual counts for each type (not filtered by selectedType)
  const expenseCount = state.categories.filter(c => c.type === 'expense').length; // Correctly counts all expense categories
  const incomeCount = state.categories.filter(c => c.type === 'income').length;   // Correctly counts all income categories

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      showToast({
        type: 'warning',
        message: 'Default categories cannot be edited',
      });
      return;
    }
    
    // TODO: Navigate to edit category modal
    showToast({
      type: 'info',
      message: 'Edit category functionality coming soon!',
    });
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.isDefault) {
      showToast({
        type: 'warning',
        message: 'Default categories cannot be deleted',
      });
      return;
    }

    try {
      await deleteCategory(category.id);
      showToast({
        type: 'success',
        message: 'Category deleted successfully!',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete category. Please try again.',
      });
    }
  };

  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  const renderCategoryItem = (category: Category) => {
    const IconComponent = (Icons as any)[category.icon] || Icons.Circle;
    
    return (
      <View key={category.id} style={styles.categoryItem}>
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
            <Text style={styles.categoryType}>{category.type}</Text>
          </View>
        </View>
      </View>
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
        <Text style={styles.title}>Manage Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCategory}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'expense' && styles.filterButtonActive]}
          onPress={() => setSelectedType('expense')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedType === 'expense' && styles.filterButtonTextActive
          ]}>
            Expenses ({expenseCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'income' && styles.filterButtonActive]}
          onPress={() => setSelectedType('income')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedType === 'income' && styles.filterButtonTextActive
          ]}>
            Income ({incomeCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Default Categories */}
        {defaultCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Categories</Text>
            <Text style={styles.sectionSubtitle}>
              These categories are provided by the system and cannot be modified
            </Text>
            {/* No edit/delete actions for default categories */}
            {defaultCategories.map(renderCategoryItem)}
          </View>
        )}

        {/* User Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Categories you've created - you can edit or delete these
          </Text>
          
          {userCategories.length > 0 ? (
            userCategories.map(category => (
              <View key={category.id} style={styles.categoryItem}>
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
                    <Text style={styles.categoryType}>{category.type}</Text>
                  </View>
                </View>
                
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditCategory(category)}
                  >
                    <Edit3 size={16} color="#4facfe" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteCategory(category)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No custom categories yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to create your first custom category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddCategoryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.surface,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4facfe',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  filterButtonTextActive: {
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
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
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