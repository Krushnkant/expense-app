import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
}

const availableColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
  '#06B6D4', '#7C3AED', '#D946EF', '#F43F5E', '#6B7280'
];

const availableIcons = [
  'Utensils', 'Car', 'ShoppingBag', 'Tv', 'Receipt', 'Heart', 'Book', 
  'Sparkles', 'Plane', 'ShoppingCart', 'Home', 'Briefcase', 'Laptop', 
  'TrendingUp', 'Building', 'Gift', 'Coffee', 'Gamepad2', 'Music', 
  'Camera', 'Dumbbell', 'Stethoscope', 'GraduationCap', 'Wrench',
  'Shirt', 'Fuel', 'Phone', 'Wifi', 'Zap', 'MoreHorizontal'
];

export default function AddCategoryModal({ visible, onClose }: AddCategoryModalProps) {
  const { addCategory, showToast } = useApp();
  const { state: themeState } = useTheme();
  const { colors } = themeState.theme;
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedScope, setSelectedScope] = useState<'personal' | 'family'>('family');
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);
  const [selectedIcon, setSelectedIcon] = useState(availableIcons[0]);
  
  // Error states
  const [nameError, setNameError] = useState('');

  const resetForm = () => {
    setName('');
    setType('expense');
    setSelectedScope('family');
    setSelectedColor(availableColors[0]);
    setSelectedIcon(availableIcons[0]);
    setNameError('');
  };

  const handleSubmit = async () => {
    // Reset errors
    setNameError('');
    
    if (!name.trim()) {
      setNameError('Category name is required');
      return;
    }

    if (name.trim().length < 2) {
      setNameError('Category name must be at least 2 characters');
      return;
    }

    try {
      await addCategory({
        name: name.trim(),
        type,
        color: selectedColor,
        icon: selectedIcon,
        scopes: [selectedScope],
      });

      showToast({
        type: 'success',
        message: 'Category added successfully!',
      });
      
      resetForm();
      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to add category. Please try again.',
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.textTertiary} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Category</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Check size={24} color="#4facfe" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Name *</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              placeholder="Enter category name"
              placeholderTextColor={colors.textTertiary}
              maxLength={30}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scope Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Scope</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, selectedScope === 'personal' && styles.typeButtonActive]}
                onPress={() => setSelectedScope('personal')}
              >
                <Text style={[styles.typeButtonText, selectedScope === 'personal' && styles.typeButtonTextActive]}>
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, selectedScope === 'family' && styles.typeButtonActive]}
                onPress={() => setSelectedScope('family')}
              >
                <Text style={[styles.typeButtonText, selectedScope === 'family' && styles.typeButtonTextActive]}>
                  Family
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {selectedScope === 'personal' 
                ? 'Personal categories are only visible to you' 
                : 'Family categories are shared with family members'
              }
            </Text>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <View style={styles.colorGrid}>
              {availableColors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setSelectedColor(color)}
                  activeOpacity={0.8}
                >
                  {selectedColor === color && (
                    <Check size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Icon</Text>
            <View style={styles.iconGrid}>
              {availableIcons.map(iconName => {
                const IconComponent = (Icons as any)[iconName] || Icons.Circle;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconOption,
                      selectedIcon === iconName && styles.iconOptionSelected,
                      { borderColor: selectedIcon === iconName ? selectedColor : colors.border }
                    ]}
                    onPress={() => setSelectedIcon(iconName)}
                    activeOpacity={0.7}
                  >
                    <IconComponent 
                      size={24} 
                      color={selectedIcon === iconName ? selectedColor : colors.textTertiary} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                {React.createElement((Icons as any)[selectedIcon] || Icons.Circle, {
                  size: 32,
                  color: selectedColor
                })}
              </View>
              <View style={styles.previewDetails}>
                <Text style={styles.previewName}>{name || 'Category Name'}</Text>
                <Text style={styles.previewType}>{type} • {selectedScope}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4facfe',
    backgroundColor: '#4facfe',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  iconOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewDetails: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  previewType: {
    fontSize: 14,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
});