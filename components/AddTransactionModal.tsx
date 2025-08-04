import React, { useState, useEffect } from 'react';
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
import { X, Check, Calendar, ChevronDown } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import DatePicker from '@/components/DatePicker';
import { useApp } from '@/contexts/AppContext';
import { useGuest } from '@/contexts/GuestContext';
import { Transaction } from '@/types';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: Transaction | null; // For editing existing transactions
}

export default function AddTransactionModal({ visible, onClose, transaction }: AddTransactionModalProps) {
  const { addTransaction, updateTransaction, showToast, getCategories, getPersonalCategories, getFamilyCategories } = useApp();
  const { incrementTransactionCount } = useGuest();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [scope, setScope] = useState<'personal' | 'family'>('personal');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Error states
  const [amountError, setAmountError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const isEditing = !!transaction;
  // Get categories based on selected scope
  const categories = scope === 'personal' ? getPersonalCategories(type) : getFamilyCategories(type);

  // Pre-fill form when editing
  useEffect(() => {
    if (transaction && visible) {
      setType(transaction.type);
      // For existing transactions, default to personal scope since we don't have scope data
      setScope('personal');
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setSelectedCategory(transaction.category);
      setDate(transaction.date);
    } else if (!transaction && visible) {
      // Reset form for new transaction
      resetForm();
    }
  }, [transaction, visible]);

  // Reset category when type or scope changes and not editing
  useEffect(() => {
    if (!isEditing) {
      setSelectedCategory('');
    }
  }, [type, scope, isEditing]);

  const resetForm = () => {
    setType('expense');
    setScope('personal');
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmountError('');
    setDescriptionError('');
    setCategoryError('');
  };

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    if (!isEditing) {
      setSelectedCategory(''); // Reset category when type changes for new transactions
    }
  };

  const handleScopeChange = (newScope: 'personal' | 'family') => {
    setScope(newScope);
    if (!isEditing) {
      setSelectedCategory(''); // Reset category when scope changes for new transactions
    }
  };
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateSelect = (selectedDate: string) => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    // Add today and previous 30 days
    for (let i = 0; i < 31; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const handleSubmit = () => {
    // Reset errors
    setAmountError('');
    setDescriptionError('');
    setCategoryError('');
    
    let hasErrors = false;

    if (!amount || !description || !selectedCategory) {
      if (!amount) {
        setAmountError('Amount is required');
        hasErrors = true;
      }
      if (!description.trim()) {
        setDescriptionError('Description is required');
        hasErrors = true;
      }
      if (!selectedCategory) {
        setCategoryError('Please select a category');
        hasErrors = true;
      }
      return;
    }

    if (!description.trim()) {
      setDescriptionError('Please enter a valid description');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter a valid amount greater than zero');
      return;
    }

    try {
      if (isEditing && transaction) {
        // Update existing transaction
        const updatedTransaction: Transaction = {
          ...transaction,
          amount: numAmount,
          type,
          category: selectedCategory,
          description: description.trim(),
          date,
          updatedAt: new Date().toISOString(),
        };
        
        updateTransaction(updatedTransaction);
        showToast({
          type: 'success',
          message: 'Transaction updated successfully!',
        });
      } else {
        // Add new transaction
        addTransaction({
          amount: numAmount,
          type,
          category: selectedCategory,
          description: description.trim(),
          date,
        });

        // Increment transaction count for guest users
        incrementTransactionCount();
        showToast({
          type: 'success',
          message: 'Transaction added successfully!',
        });
      }
      
      if (!isEditing) {
        resetForm();
      }
      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to ${isEditing ? 'update' : 'add'} transaction. Please try again.`,
      });
    }
  };

  // Function to validate and format amount input
  const handleAmountChange = (text: string) => {
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
    
    setAmount(cleanedText);
    if (amountError) setAmountError('');
  };
  const getSelectedCategoryInfo = () => {
    return categories.find(c => c.name === selectedCategory);
  };

  const selectedCategoryInfo = getSelectedCategoryInfo();

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Check size={24} color="#4facfe" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => handleTypeChange('expense')}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                onPress={() => handleTypeChange('income')}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scope Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, scope === 'personal' && styles.typeButtonActive]}
                onPress={() => handleScopeChange('personal')}
              >
                <Text style={[styles.typeButtonText, scope === 'personal' && styles.typeButtonTextActive]}>
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, scope === 'family' && styles.typeButtonActive]}
                onPress={() => handleScopeChange('family')}
              >
                <Text style={[styles.typeButtonText, scope === 'family' && styles.typeButtonTextActive]}>
                  Family
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {scope === 'personal' 
                ? 'Personal transactions are only visible to you and count towards your personal budget' 
                : 'Family transactions are shared with family members and count towards the family budget'
              }
            </Text>
          </View>
          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount *</Text>
            <TextInput
              style={[styles.amountInput, amountError && styles.inputError]}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={[styles.input, descriptionError && styles.inputError]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (descriptionError) setDescriptionError('');
              }}
              placeholder="Enter description"
              placeholderTextColor="#9CA3AF"
            />
            {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formatDateForDisplay(date)}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <View style={styles.categoryHeader}>
              <Text style={styles.sectionTitle}>Category *</Text>
              <Text style={styles.categoryScopeIndicator}>
                {scope === 'personal' ? 'Personal Categories' : 'Family Categories'}
              </Text>
            </View>
            {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
            
            {/* Selected Category Display */}
            {selectedCategoryInfo && (
              <View style={styles.selectedCategoryContainer}>
                <View style={[styles.selectedCategoryCard, { borderColor: selectedCategoryInfo.color }]}>
                  <View style={styles.selectedCategoryContent}>
                    <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategoryInfo.color + '20' }]}>
                      {React.createElement((Icons as any)[selectedCategoryInfo.icon] || Icons.Circle, {
                        size: 20,
                        color: selectedCategoryInfo.color
                      })}
                    </View>
                    <Text style={styles.selectedCategoryText}>{selectedCategoryInfo.name}</Text>
                  </View>
                  <View style={[styles.selectedCategoryCheck, { backgroundColor: selectedCategoryInfo.color }]}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            )}

            {/* Category Grid */}
            <View style={styles.categoryGrid}>
              {categories.map(category => {
                const IconComponent = (Icons as any)[category.icon] || Icons.Circle;
                const isSelected = selectedCategory === category.name;
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonActive,
                      { borderColor: isSelected ? category.color : categoryError ? '#EF4444' : '#E5E7EB' }
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.name);
                      if (categoryError) setCategoryError('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: isSelected ? category.color + '20' : '#F3F4F6' }
                    ]}>
                      <IconComponent 
                        size={20} 
                        color={isSelected ? category.color : '#6B7280'} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryButtonText,
                      { color: isSelected ? category.color : '#6B7280' }
                    ]}>
                      {category.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.categoryCheckmark, { backgroundColor: category.color }]}>
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* No Categories Message */}
            {categories.length === 0 && (
              <View style={styles.noCategoriesContainer}>
                <Text style={styles.noCategoriesText}>
                  No {scope} {type} categories available.
                </Text>
                <Text style={styles.noCategoriesSubtext}>
                  Switch to {scope === 'personal' ? 'family' : 'personal'} scope or manage categories in settings.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Date Picker */}
        <DatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          selectedDate={date}
          onDateSelect={(selectedDate) => {
            setDate(selectedDate);
            setShowDatePicker(false);
          }}
          title="Select Transaction Date"
          maxDate={new Date().toISOString().split('T')[0]}
        />
      </View>
    </Modal>
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryScopeIndicator: {
    fontSize: 12,
    color: '#4facfe',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4facfe',
    backgroundColor: '#4facfe',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  selectedCategoryContainer: {
    marginBottom: 16,
  },
  selectedCategoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCategoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  selectedCategoryCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCategoriesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noCategoriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  noCategoriesSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});