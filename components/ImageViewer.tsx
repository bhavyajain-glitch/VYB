import { View, Modal, Image, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageViewer({ visible, imageUrl, onClose }: ImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
            <Image 
                source={{ uri: imageUrl }} 
                style={styles.image} 
                resizeMode="contain" 
            />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
});
