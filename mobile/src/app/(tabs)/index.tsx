import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCart } from "../../context/CartContext";
import { Product } from "../../types/api";

// Seeded & test barcodes for easy verification without physical barcodes
const TEST_BARCODES = [
  { barcode: "8901234567890", name: "Britannia Good Day Cookies", exists: true },
  { barcode: "8901030383456", name: "Amul Butter Salted", exists: true },
  { barcode: "8901058852309", name: "Maggi 2-Minute Noodles", exists: true },
  { barcode: "8901491101837", name: "Lays Magic Masala", exists: true },
  { barcode: "8901725181222", name: "Tata Tea Gold", exists: true },
  { barcode: "8901063012644", name: "Colgate Strong Teeth", exists: true },
  { barcode: "0000000000000", name: "Non-Existent Test Barcode", exists: false },
];

export default function ScanProductScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { serverStatus, serverLatency, lookupBarcode, checkConnection } = useCart();

  const [scanned, setScanned] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [productData, setProductData] = useState<Product | null>(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTestSheet, setShowTestSheet] = useState(false);

  // Send barcode to backend and process response
  const processBarcode = async (barcode: string) => {
    setScanned(true);
    setScannedBarcode(barcode);
    setIsSearching(true);
    setProductData(null);
    setProductNotFound(false);
    setErrorMessage(null);

    const res = await lookupBarcode(barcode);
    setIsSearching(false);

    if (res.success && res.exists && res.product) {
      setProductData(res.product);
      setProductNotFound(false);
    } else {
      setProductData(null);
      setProductNotFound(true);
      if (!res.success && res.message && res.message !== "Product not found") {
        setErrorMessage(res.message);
      }
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || isSearching) return;
    processBarcode(data);
  };

  const handleResetScan = () => {
    setScanned(false);
    setScannedBarcode(null);
    setProductData(null);
    setProductNotFound(false);
    setErrorMessage(null);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={64} color="#00a2ff" style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Existing Camera View */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"],
        }}
        onBarcodeScanned={scanned || isSearching ? undefined : handleBarcodeScanned}
      />

      {/* Header Overlay */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/home")}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusBadge,
            serverStatus === "connected" ? styles.statusConnected : styles.statusError,
          ]}
          onPress={() => checkConnection()}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: serverStatus === "connected" ? "#10b981" : "#ef4444" },
            ]}
          />
          <Text style={styles.statusText}>
            {serverStatus === "connected"
              ? `Server (${serverLatency ?? 0}ms)`
              : serverStatus === "checking"
              ? "Connecting..."
              : "Offline"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Viewfinder Target */}
      <View style={styles.overlay}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {isSearching && (
            <View style={styles.searchingOverlay}>
              <ActivityIndicator size="large" color="#00a2ff" />
              <Text style={styles.searchingText}>Searching database...</Text>
            </View>
          )}
        </View>

        <Text style={styles.instructionText}>
          Point camera at product barcode
        </Text>

        {/* Quick Test Barcodes Trigger */}
        <TouchableOpacity style={styles.testBarcodesButton} onPress={() => setShowTestSheet(true)}>
          <Ionicons name="flash" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
          <Text style={styles.testBarcodesButtonText}>Simulate / Test Barcodes</Text>
        </TouchableOpacity>
      </View>

      {/* FLOW 1 RESULT: Product Exists Modal */}
      <Modal
        visible={!!productData}
        transparent
        animationType="slide"
        onRequestClose={handleResetScan}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.resultSheet}>
            <View style={styles.sheetHandle} />

            {productData && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                <View style={styles.foundBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={styles.foundBadgeText}>Product Found in Database</Text>
                </View>

                {/* Product Header */}
                <View style={styles.productHeader}>
                  {productData.image ? (
                    <Image source={{ uri: productData.image }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImageFallback}>
                      <Ionicons name="cube-outline" size={36} color="#64748b" />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    {productData.brand ? (
                      <Text style={styles.productBrand}>{productData.brand}</Text>
                    ) : null}
                    <Text style={styles.productName}>{productData.name}</Text>
                    <Text style={styles.productPrice}>₹{productData.price.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Details Table */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Barcode</Text>
                    <Text style={styles.detailValueCode}>{productData.barcode}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>{productData.category || "General"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Unit</Text>
                    <Text style={styles.detailValue}>{productData.unit || "1 pc"}</Text>
                  </View>
                  {productData.description ? (
                    <View style={[styles.detailRow, { flexDirection: "column", alignItems: "flex-start" }]}>
                      <Text style={[styles.detailLabel, { marginBottom: 4 }]}>Description</Text>
                      <Text style={styles.detailDesc}>{productData.description}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={handleResetScan}
                  >
                    <Ionicons name="scan" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>Scan Another Product</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => {
                      handleResetScan();
                      router.push("/home");
                    }}
                  >
                    <Ionicons name="home-outline" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FLOW 1 RESULT: Product NOT Found Modal */}
      <Modal
        visible={productNotFound}
        transparent
        animationType="fade"
        onRequestClose={handleResetScan}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.notFoundCard}>
            <View style={styles.notFoundIconCircle}>
              <Ionicons name="alert-circle" size={40} color="#f87171" />
            </View>

            <Text style={styles.notFoundTitle}>Product not found</Text>
            <Text style={styles.notFoundDesc}>
              No product matches barcode:
            </Text>
            <View style={styles.barcodeBox}>
              <Text style={styles.barcodeText}>{scannedBarcode}</Text>
            </View>

            {errorMessage && (
              <Text style={styles.errorSubtext}>{errorMessage}</Text>
            )}

            <View style={styles.notFoundActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleResetScan}>
                <Ionicons name="scan" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>Scan Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  handleResetScan();
                  router.push("/home");
                }}
              >
                <Text style={styles.secondaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Test Barcodes Picker Modal */}
      <Modal
        visible={showTestSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTestSheet(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.testSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.testSheetHeader}>
              <Text style={styles.testSheetTitle}>Simulate Barcode Scan</Text>
              <TouchableOpacity onPress={() => setShowTestSheet(false)}>
                <Ionicons name="close-circle" size={26} color="#8e96a0" />
              </TouchableOpacity>
            </View>
            <Text style={styles.testSheetSubtitle}>
              Tap any barcode below to simulate scanning and test backend lookup:
            </Text>

            <ScrollView style={{ maxHeight: 340 }}>
              {TEST_BARCODES.map((item) => (
                <TouchableOpacity
                  key={item.barcode}
                  style={styles.testItemRow}
                  onPress={() => {
                    setShowTestSheet(false);
                    processBarcode(item.barcode);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testItemName}>{item.name}</Text>
                    <Text style={styles.testItemBarcode}>{item.barcode}</Text>
                  </View>
                  <View
                    style={[
                      styles.testBadge,
                      item.exists ? styles.testBadgeGreen : styles.testBadgeRed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.testBadgeText,
                        item.exists ? { color: "#10b981" } : { color: "#f87171" },
                      ]}
                    >
                      {item.exists ? "In DB" : "Not In DB"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8e96a0" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  center: {
    flex: 1,
    backgroundColor: "#13161a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  headerBar: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  statusConnected: {
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.5)",
  },
  statusError: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 270,
    height: 190,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#00a2ff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  searchingOverlay: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  searchingText: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  instructionText: {
    color: "#ffffff",
    marginTop: 24,
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  testBarcodesButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  testBarcodesButtonText: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "600",
  },
  permissionText: {
    color: "#ffffff",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#00a2ff",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#2b3038",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultSheet: {
    backgroundColor: "#1e2227",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#4a515d",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  foundBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  foundBadgeText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "bold",
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#2b3038",
    marginRight: 16,
  },
  productImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#2b3038",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  productName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  productPrice: {
    color: "#00a2ff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
  },
  detailsCard: {
    backgroundColor: "#272c34",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#323842",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#323842",
  },
  detailLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  detailValue: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "500",
  },
  detailValueCode: {
    color: "#00a2ff",
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  detailDesc: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  homeButton: {
    backgroundColor: "#2b3038",
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundCard: {
    backgroundColor: "#1e2227",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#3a414c",
  },
  notFoundIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  notFoundTitle: {
    color: "#f87171",
    fontSize: 20,
    fontWeight: "bold",
  },
  notFoundDesc: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  barcodeBox: {
    backgroundColor: "#13161a",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  barcodeText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  errorSubtext: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  notFoundActions: {
    width: "100%",
    gap: 10,
    marginTop: 6,
  },
  testSheet: {
    backgroundColor: "#1e2227",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "75%",
  },
  testSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  testSheetTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  testSheetSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  testItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2b3038",
  },
  testItemName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  testItemBarcode: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "monospace",
  },
  testBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  testBadgeGreen: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  testBadgeRed: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  testBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
