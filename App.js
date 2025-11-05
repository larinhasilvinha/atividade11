import React, { useState } from "react";
import { View, Button, Image, StyleSheet, Text, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import CryptoJS from "crypto-js";

export default function App() {
  const [image, setImage] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  // 🔹 Credenciais do Cloudinary
  const cloudName = "dgyr3qwph";
  const uploadPreset = "ifpeaula"; // se não tiver, pode criar um no painel
  const apiKey = "553237575988372";
  const apiSecret = "h0KS2H_WNrG-mh7B39Y81hHUgq8";

  // 🔹 Abrir galeria
  const pickImage = async () => {
    try {
      // pedir permissão
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permissão negada", "É necessário permitir o acesso à galeria.");
        return;
      }

      // abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        quality: 1,
      });

      if (result.canceled) {
        console.log("Nenhuma imagem selecionada.");
        return;
      }

      const selectedImage = result.assets[0];
      console.log("Imagem selecionada:", selectedImage.uri);
      setImage(selectedImage.uri);

      await uploadImage(selectedImage.uri);
    } catch (error) {
      console.error("Erro ao abrir a galeria:", error);
    }
  };

  // 🔹 Fazer upload para Cloudinary
  const uploadImage = async (uri) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "ifpe";

      // gerar assinatura (SHA1)
      const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = CryptoJS.SHA1(stringToSign).toString();

      // converter imagem em base64
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // preparar dados do upload
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Resultado do upload:", data);

      if (data.secure_url) {
        Alert.alert("Upload concluído!", "A imagem foi enviada com sucesso.");
        setUploadResult(data);
      } else {
        Alert.alert("Erro no upload", "Verifique as credenciais e tente novamente.");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📸 Upload para Cloudinary</Text>

      <Button title="Selecionar imagem" onPress={pickImage} color="#007AFF" />

      {image && (
        <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
      )}

      {uploadResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>✅ Upload realizado!</Text>
          <Text selectable style={styles.urlText}>{uploadResult.secure_url}</Text>
          <Image source={{ uri: uploadResult.secure_url }} style={styles.uploadedImage} />
        </View>
      )}
    </ScrollView>
  );
}

// 🔹 Estilos
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginVertical: 20,
  },
  resultBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  urlText: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 10,
  },
  uploadedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
