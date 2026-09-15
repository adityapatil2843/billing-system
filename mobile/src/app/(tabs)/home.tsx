import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { CreateProductInput, Product } from "../../types/api";

export default function HomeScreen() {
  const router = useRouter();
  const {
    serverUrl,
    serverStatus,
    serverLatency,
    checkConnection,
    updateServerUrl,
    createProduct,
  } = useCart();

  // Server IP Settings State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  // Form Fields
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setBarcode("");
    setName("");
    setBrand("");
    setCategory("");
    setPrice("");
    setImage("");
    setUnit("");
    setDescription("");
    setFormError(null);
  };

  const handleFillSample = () => {
    setBarcode("9780812968255");
    setName("Meditation");
    setBrand("Modern Library");
    setCategory("Books");
    setPrice("10");
    setImage("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500");
    setUnit("1 book");
    setDescription("A book about meditation and mindfulness.");
    setFormError(null);
  };

  // Flow 2: Submit Add Product
  const handleSubmitProduct = async () => {
    setFormError(null);

    // Validate empty required fields
    if (!barcode.trim()) {
      setFormError("Barcode is required.");
      return;
    }
    if (!name.trim()) {
      setFormError("Product Name is required.");
      return;
    }
    if (!price.trim()) {
      setFormError("Price is required.");
      return;
    }

    const numPrice = Number(price.trim());
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError("Price must be a valid positive number.");
      return;
    }

    const productPayload: CreateProductInput = {
      barcode: barcode.trim(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      category: category.trim() || undefined,
      price: numPrice,
      image: image.trim() || undefined,
      unit: unit.trim() || undefined,
      description: description.trim() || undefined,
    };

    setIsSubmitting(true);
    const res = await createProduct(productPayload);
    setIsSubmitting(false);

    if (res.success && res.product) {
      setCreatedProduct(res.product);
      resetForm();
    } else {
      setFormError(res.message || "Failed to create product.");
    }
  };

  // Server URL update
  const handleSaveServerUrl = async () => {
    setIsSavingUrl(true);
    const success = await updateServerUrl(customUrl.trim());
    setIsSavingUrl(false);
    if (success) {
      setShowConfigModal(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Server Status Header */}
      <View style={styles.serverCard}>
        <View style={styles.serverRow}>
          <View style={styles.serverStatusInfo}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: serverStatus === "connected" ? "#10b981" : "#ef4444" },
              ]}
            />
            <Text style={styles.serverStatusLabel}>
              {serverStatus === "connected"
                ? `Server Connected (${serverLatency ?? 0}ms)`
                : serverStatus === "checking"
                ? "Checking server..."
                : "Server Offline"}
            </Text>
          </View>

          <View style={styles.serverActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => checkConnection()}>
              <Ionicons name="refresh" size={18} color="#00a2ff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setCustomUrl(serverUrl);
                setShowConfigModal(true);
              }}
            >
              <Ionicons name="settings-outline" size={18} color="#8e96a0" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.serverUrlText} numberOfLines={1}>
          {serverUrl}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Barcode Shopping</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose an option below to scan an existing product or add a new product to MongoDB.
          </Text>
        </View>

        {/* ======================================== */}
        {/* OPTION 1: SCAN PRODUCT                   */}
        {/* ======================================== */}
        <TouchableOpacity
          style={styles.optionCard}
          activeOpacity={0.7}
          onPress={() => router.push("/")}
        >
          <View style={[styles.optionIconCircle, { backgroundColor: "rgba(0, 162, 255, 0.15)" }]}>
            <Ionicons name="scan" size={32} color="#00a2ff" />
          </View>
          <View style={styles.optionTextContainer}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>Scan Product</Text>
              <View style={styles.optionBadgeBlue}>
                <Text style={styles.optionBadgeTextBlue}>Option 1</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Open the existing barcode scanner to scan any product barcode and lookup its details in MongoDB.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* ======================================== */}
        {/* OPTION 2: ADD PRODUCT                    */}
        {/* ======================================== */}
        <TouchableOpacity
          style={styles.optionCard}
          activeOpacity={0.7}
          onPress={() => {
            setFormError(null);
            setShowAddForm(true);
          }}
        >
          <View style={[styles.optionIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
            <Ionicons name="add-circle" size={32} color="#10b981" />
          </View>
          <View style={styles.optionTextContainer}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>Add Product</Text>
              <View style={styles.optionBadgeGreen}>
                <Text style={styles.optionBadgeTextGreen}>Option 2</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Enter product details (barcode, name, brand, category, price) and save directly to MongoDB.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Information Box */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#38bdf8" style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Flow Separation</Text>
            <Text style={styles.infoText}>
              • Option 1 searches MongoDB by barcode and shows whether the product exists without modifying the database.
            </Text>
            <Text style={styles.infoText}>
              • Option 2 opens the Add Product form to create and insert new records with duplicate protection.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ======================================== */}
      {/* FLOW 2: ADD PRODUCT MODAL / FORM        */}
      {/* ======================================== */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formScreen}
        >
          {/* Form Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowAddForm(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.formHeaderTitle}>Add Product</Text>
            <TouchableOpacity style={styles.sampleBtn} onPress={handleFillSample}>
              <Text style={styles.sampleBtnText}>Sample</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.formSubtitle}>
              Fill in the fields below to create a new product in MongoDB.
            </Text>

            {formError && (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={20} color="#f87171" style={{ marginRight: 8 }} />
                <Text style={styles.errorAlertText}>{formError}</Text>
              </View>
            )}

            {/* Field: Barcode */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Barcode <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="e.g. 9780812968255"
                placeholderTextColor="#64748b"
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>

            {/* Field: Product Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Product Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Meditation"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Field: Price */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Price (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 10.00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            {/* Field: Brand */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Brand</Text>
              <TextInput
                style={styles.textInput}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g. Modern Library"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Field: Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Books, Food, Beverages"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Field: Unit */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <TextInput
                style={styles.textInput}
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g. 1 book, 100g, 250ml"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Field: Image URL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Image URL</Text>
              <TextInput
                style={styles.textInput}
                value={image}
                onChangeText={setImage}
                placeholder="e.g. https://example.com/image.jpg"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
            </View>

            {/* Field: Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. A book about meditation and mindfulness."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Create Product in MongoDB</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======================================== */}
      {/* FLOW 2: SUCCESS MODAL                   */}
      {/* ======================================== */}
      <Modal
        visible={!!createdProduct}
        transparent
        animationType="fade"
        onRequestClose={() => setCreatedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={36} color="#10b981" />
            </View>
            <Text style={styles.successTitle}>Product Created Successfully!</Text>
            <Text style={styles.successSubtitle}>Saved into MongoDB database.</Text>

            {createdProduct && (
              <View style={styles.createdProductCard}>
                <Text style={styles.createdName}>{createdProduct.name}</Text>
                <Text style={styles.createdBarcode}>Barcode: {createdProduct.barcode}</Text>
                <Text style={styles.createdPrice}>Price: ₹{createdProduct.price.toFixed(2)}</Text>
                {createdProduct.brand ? (
                  <Text style={styles.createdMeta}>Brand: {createdProduct.brand}</Text>
                ) : null}
                {createdProduct.category ? (
                  <Text style={styles.createdMeta}>Category: {createdProduct.category}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.primaryBtnFull}
                onPress={() => {
                  setCreatedProduct(null);
                  setShowAddForm(false);
                }}
              >
                <Text style={styles.primaryBtnFullText}>Back to Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtnFull}
                onPress={() => {
                  setCreatedProduct(null);
                  resetForm();
                }}
              >
                <Text style={styles.secondaryBtnFullText}>Add Another Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Server IP Config Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.configModal}>
            <Text style={styles.configTitle}>Server Connection Settings</Text>
            <Text style={styles.configDesc}>
              Enter backend API URL for device or emulator:
            </Text>

            <TextInput
              style={styles.urlInput}
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="http://10.237.222.252:5000/api"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.configModalActions}>
              <TouchableOpacity
                style={styles.configCancelBtn}
                onPress={() => setShowConfigModal(false)}
              >
                <Text style={styles.configCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.configSaveBtn}
                onPress={handleSaveServerUrl}
                disabled={isSavingUrl}
              >
                {isSavingUrl ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.configSaveText}>Save & Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#13161a",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  serverCard: {
    backgroundColor: "#1e2227",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2b3038",
  },
  serverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serverStatusInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  serverStatusLabel: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "600",
  },
  serverActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#2b3038",
  },
  serverUrlText: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 6,
    fontFamily: "monospace",
  },
  welcomeSection: {
    marginVertical: 14,
  },
  welcomeTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  welcomeSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: "#1e2227",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2b3038",
  },
  optionIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  optionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  optionBadgeBlue: {
    backgroundColor: "rgba(0, 162, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionBadgeTextBlue: {
    color: "#00a2ff",
    fontSize: 11,
    fontWeight: "bold",
  },
  optionBadgeGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionBadgeTextGreen: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "bold",
  },
  optionDescription: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    marginTop: 10,
  },
  infoTitle: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  // Form Screen Styles
  formScreen: {
    flex: 1,
    backgroundColor: "#13161a",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#1a1d21",
    borderBottomWidth: 1,
    borderBottomColor: "#2b3038",
  },
  closeBtn: {
    padding: 6,
  },
  formHeaderTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sampleBtn: {
    backgroundColor: "rgba(0, 162, 255, 0.15)",
    borderWidth: 1,
    borderColor: "#00a2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sampleBtnText: {
    color: "#00a2ff",
    fontSize: 12,
    fontWeight: "bold",
  },
  formContent: {
    padding: 20,
    paddingBottom: 50,
  },
  formSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 16,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.4)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorAlertText: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  requiredStar: {
    color: "#f87171",
  },
  textInput: {
    backgroundColor: "#1e2227",
    borderWidth: 1,
    borderColor: "#2b3038",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 12,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1e2227",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2b3038",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  successTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
  },
  successSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  createdProductCard: {
    width: "100%",
    backgroundColor: "#272c34",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  createdName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  createdBarcode: {
    color: "#00a2ff",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 4,
  },
  createdPrice: {
    color: "#10b981",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },
  createdMeta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  successActions: {
    width: "100%",
    gap: 10,
  },
  primaryBtnFull: {
    backgroundColor: "#00a2ff",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnFullText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  secondaryBtnFull: {
    backgroundColor: "#2b3038",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnFullText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "600",
  },
  // Config Modal
  configModal: {
    width: "100%",
    backgroundColor: "#1e2227",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2b3038",
  },
  configTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  configDesc: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: "#13161a",
    borderWidth: 1,
    borderColor: "#3a414c",
    borderRadius: 10,
    color: "#ffffff",
    padding: 12,
    fontSize: 14,
    fontFamily: "monospace",
  },
  configModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  configCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2b3038",
  },
  configCancelText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  configSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#00a2ff",
  },
  configSaveText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
