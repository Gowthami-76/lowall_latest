import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, MessageCircle, Mail, Phone, ChevronRight, HelpCircle, Headphones } from 'lucide-react-native';

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqItems = [
    {
      question: 'How do I download wallpapers?',
      answer: 'Browse our collection and tap the download button on any wallpaper you like.',
    },
    {
      question: 'What formats are available?',
      answer: 'We offer wallpapers in various resolutions including 4K, HD, and mobile-optimized formats.',
    },
    {
      question: 'How do I upload my own wallpapers?',
      answer: 'Go to the Upload section and follow the guidelines for submitting your artwork.',
    },
    {
      question: 'What is Premium membership?',
      answer: 'Premium gives you access to exclusive wallpapers, unlimited downloads, and ad-free browsing.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can manage your subscription in your account settings or contact our support team.',
    },
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      subtitle: 'Get instant help from our team',
      action: () => {},
    },
    {
      icon: Mail,
      title: 'Email Support',
      subtitle: 'support@wallpaperapp.com',
      action: () => Linking.openURL('mailto:support@wallpaperapp.com'),
    },
    {
      icon: Phone,
      title: 'Phone Support',
      subtitle: '+1 (555) 123-4567',
      action: () => Linking.openURL('tel:+15551234567'),
    },
  ];

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FAQItem = ({ question, answer }) => (
    <View style={styles.faqItem}>
      <View style={styles.faqHeader}>
        <HelpCircle size={16} color="#F7CD00" />
        <Text style={styles.faqQuestion}>{question}</Text>
      </View>
      <Text style={styles.faqAnswer}>{answer}</Text>
    </View>
  );

  const ContactItem = ({ icon: Icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.contactItem} onPress={onPress}>
      <View style={styles.contactItemLeft}>
        <View style={styles.contactIconContainer}>
          <Icon size={20} color="#0A3A9E" />
        </View>
        <View>
          <Text style={styles.contactTitle}>{title}</Text>
          <Text style={styles.contactSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#F7CD00" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help Center</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Headphones size={48} color="#F7CD00" />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or contact our support team
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#F7CD00" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help topics..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          <View style={styles.contactCard}>
            {contactOptions.map((option, index) => (
              <ContactItem
                key={index}
                icon={option.icon}
                title={option.title}
                subtitle={option.subtitle}
                onPress={option.action}
              />
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqCard}>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item, index) => (
                <FAQItem
                  key={index}
                  question={item.question}
                  answer={item.answer}
                />
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <HelpCircle size={48} color="#D1D5DB" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0A3A9E',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 12,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  contactCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  faqCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  faqItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    paddingLeft: 24,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});