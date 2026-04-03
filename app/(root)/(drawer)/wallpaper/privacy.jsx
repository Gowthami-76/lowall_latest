import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Lock, Eye, Database, Share2, Cookie, Users, FileText, Mail } from 'lucide-react-native';

export default function PrivacyScreen() {
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

        <Text style={styles.headerTitle}>Privacy Policy</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <Shield size={48} color="#F7CD00" />
          </View>
          <Text style={styles.iconText}>Privacy Policy</Text>
          <Text style={styles.iconSubtext}>Last updated: January 2025</Text>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          {/* Information We Collect */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Database size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Information We Collect</Text>
            </View>
            <Text style={styles.paragraph}>
              We collect information you provide directly to us, such as when you create an account,
              upload content, or contact us for support. This may include your name, email address,
              and profile information.
            </Text>
          </View>

          {/* How We Use Your Information */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Eye size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            </View>
            <Text style={styles.paragraph}>
              We use the information we collect to provide, maintain, and improve our services, process
              transactions, send you technical notices and support messages, and communicate with you about
              products, services, and promotional offers.
            </Text>
          </View>

          {/* Information Sharing */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Share2 size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Information Sharing</Text>
            </View>
            <Text style={styles.paragraph}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without
              your consent, except as described in this policy. We may share information with trusted service
              providers who assist us in operating our app.
            </Text>
          </View>

          {/* Data Security */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Lock size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Data Security</Text>
            </View>
            <Text style={styles.paragraph}>
              We implement appropriate security measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. However, no method of transmission over the internet
              is 100% secure.
            </Text>
          </View>

          {/* Cookies and Analytics */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Cookie size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Cookies and Analytics</Text>
            </View>
            <Text style={styles.paragraph}>
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and
              improve our services. You can control cookie settings through your device preferences.
            </Text>
          </View>

          {/* Third-Party Services */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Share2 size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Third-Party Services</Text>
            </View>
            <Text style={styles.paragraph}>
              Our app may contain links to third-party websites or services. We are not responsible for the
              privacy practices of these external sites. We encourage you to review their privacy policies.
            </Text>
          </View>

          {/* Children's Privacy */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Children's Privacy</Text>
            </View>
            <Text style={styles.paragraph}>
              Our service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If we learn we have collected such information,
              we will take steps to delete it.
            </Text>
          </View>

          {/* Your Rights */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Your Rights</Text>
            </View>
            <Text style={styles.paragraph}>
              You have the right to access, update, or delete your personal information. You may also opt out
              of certain communications from us. Contact us to exercise these rights or if you have questions
              about our privacy practices.
            </Text>
          </View>

          {/* Changes to This Policy */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            </View>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new policy on this page and updating the "last updated" date. Your continued use of our service
              constitutes acceptance of the updated policy.
            </Text>
          </View>

          {/* Contact Us */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Mail size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>Contact Us</Text>
            </View>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy, please contact us at privacy@wallpaperapp.com
              or through our Help Center in the app.
            </Text>
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
  iconSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  iconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  iconSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  contentCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionWrapper: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    letterSpacing: 0.3,
  },
  paragraph: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    paddingLeft: 30,
  },
  bottomPadding: {
    height: 40,
  },
});