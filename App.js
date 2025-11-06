import React, { useState } from "react";
import {
  View,
  Button,
  Image,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import CryptoJS from "crypto-js";

export default function App() {
  const [image, setImage] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Credenciais Cloudinary
  const cloudName = "dgyr3qwph";
  const folder = "ifpe";
  const apiKey = "553237575988372";
  const apiSecret = "h0KS2H_WNrG-mh7B39Y81hHUgq8";

  // 🔹 Selecionar imagem
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão negada", "Você precisa permitir o acesso à galeria.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        console.log("Imagem selecionada:", imageUri);
        uploadImage(imageUri);
      } else {
        console.log("Nenhuma imagem selecionada.");
      }
    } catch (error) {
      console.error("Erro ao abrir a galeria:", error);
      Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  };

  // 🔹 Upload para o Cloudinary
  const uploadImage = async (uri) => {
    try {
      setLoading(true);
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = CryptoJS.SHA1(stringToSign).toString();

      let base64Img;

      if (Platform.OS === "web") {
        const blob = await fetch(uri).then((r) => r.blob());
        base64Img = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64Img = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${base64Img}`);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Resultado do upload:", data);

      if (data.secure_url) {
        setUploadResult(data);
        Alert.alert("✅ Upload concluído!", "Imagem enviada com sucesso!");
      } else {
        Alert.alert("Erro no upload", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      Alert.alert("Erro no upload", "Não foi possível enviar a imagem.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Excluir imagem do Cloudinary
  const deleteImageFromCloudinary = async () => {
    if (!uploadResult?.public_id) return;

    try {
      setLoading(true);
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `public_id=${uploadResult.public_id}&timestamp=${timestamp}${apiSecret}`;
      const signature = CryptoJS.SHA1(stringToSign).toString();

      const formData = new FormData();
      formData.append("public_id", uploadResult.public_id);
      formData.append("signature", signature);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      console.log("Resultado exclusão:", result);

      if (result.result === "ok") {
        Alert.alert("🗑️ Imagem excluída com sucesso!");
      } else {
        Alert.alert("⚠️ Falha ao excluir", JSON.stringify(result));
      }
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);
      Alert.alert("Erro", "Não foi possível excluir a imagem do Cloudinary.");
    } finally {
      setImage(null);
      setUploadResult(null);
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📸 Upload para Cloudinary</Text>

      {!image && !loading && (
        <Button title="Selecionar imagem" onPress={pickImage} color="#007AFF" />
      )}

      {loading && <Text style={{ marginTop: 20 }}>⏳ Processando...</Text>}

      {image && (
        <View style={styles.imageBox}>
          <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />

          {uploadResult && (
            <Text style={styles.successText}>✅ Upload realizado com sucesso!</Text>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteImageFromCloudinary}
          >
            <Text style={styles.deleteButtonText}>🗑️ Excluir imagem</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// 🔹 Estilos
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  imageBox: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: "#ff3b30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  successText: {
    marginTop: 10,
    color: "green",
    fontWeight: "600",
  },
});
