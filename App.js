import React, { useState } from "react";
import { View, Button, Image, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import SHA1 from "crypto-js/sha1";
export default function App() {
const [images, setImages] = useState([]);
const [uploading, setUploading] = useState(false);
const CLOUD_NAME = "dgyr3qwph";
const UPLOAD_PRESET = "atividade11";
const API_KEY = "553237575988372";
const API_SECRET = "h0KS2H_WNrG-mh7B39Y81hHUgq8";
const pickImage = async () => {
const result = await ImagePicker.launchImageLibraryAsync({
mediaTypes: ImagePicker.MediaTypeOptions.Images,
allowsEditing: true,
quality: 1,
});
if (!result.canceled) {
uploadImage(result.assets[0].uri);
}
};
const uploadImage = async (uri) => {
try {
setUploading(true);
const response = await fetch(uri);
const blob = await response.blob();
const data = new FormData();
const publicId = `ifpe_${Date.now()}`;
data.append("public_id", publicId);
data.append("file", blob);
data.append("upload_preset", UPLOAD_PRESET);
data.append("folder", "ifpe");
data.append("tags", "ifpeaula");
const upload = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
method: "POST",
body: data,
});
const result = await upload.json();
if (result.secure_url) {
const newImage = {
url: result.secure_url,
public_id: result.public_id,
};
setImages([...images, newImage]);
} else {
alert("Erro ao fazer upload");
}
} catch (error) {
alert("Erro no upload!");
console.log(error);
} finally {

setUploading(false);
}
};
const deleteImage = async (publicId) => {
try {
const timestamp = Math.floor(Date.now() / 1000);
const signature = SHA1(
`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`
).toString();
const formData = new FormData();
formData.append("public_id", publicId);
formData.append("signature", signature);
formData.append("api_key", API_KEY);
formData.append("timestamp", timestamp);
const del = await fetch(
`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
{
method: "POST",
body: formData,
}
);
const result = await del.json();
console.log("Delete result:", result);
if (result.result === "ok") {
setImages((prev) => prev.filter((img) => img.public_id !== publicId));
alert("Imagem excluída com sucesso!");
} else {
alert("■■ Erro ao excluir no Cloudinary!");
}
} catch (error) {
console.log("Erro ao excluir", error);
alert("Não foi possível excluir");
}
};
return (
<View style={styles.container}>
<Button title={uploading ? "Enviando..." : "Selecionar Imagem"} onPress={pickImage} />
<FlatList
data={images}
keyExtractor={(item) => item.public_id}
renderItem={({ item }) => (
<View style={styles.item}>
<Image source={{ uri: item.url }} style={styles.image} />
<TouchableOpacity style={styles.deleteBtn} onPress={() => deleteImage(item.public_id)}>
<Text style={{ color: "#fff" }}>Excluir</Text>
</TouchableOpacity>
</View>
)}
/>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, paddingTop: 40, paddingHorizontal: 10 },
item: {
marginVertical: 10,
backgroundColor: "#eee",
padding: 10,
borderRadius: 10,
alignItems: "center",
},
image: { width: 200, height: 400, borderRadius: 10 },
deleteBtn: {
marginTop: 10,
backgroundColor: "red",
padding: 10,
borderRadius: 8,
},
});
