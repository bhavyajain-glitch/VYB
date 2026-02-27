import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, ActivityIndicator, Platform, Alert, ScrollView } from 'react-native';
import { X, RotateCcw, FlipHorizontal, FlipVertical, Check, Square, Tablet, Smartphone, Maximize, Sliders, Crop as CropIcon, Sun, Contrast, Droplets } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Canvas, Image as SkiaImage, ColorMatrix, useImage, Skia, SkSurface } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageEditorProps {
    visible: boolean;
    onClose: () => void;
    uri: string;
    onSave: (newUri: string) => void;
}

type Tab = 'crop' | 'adjust';

export default function ImageEditor({ visible, onClose, uri, onSave }: ImageEditorProps) {
    const [currentUri, setCurrentUri] = useState(uri);
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [activeTab, setActiveTab] = useState<Tab>('crop');

    // Adjustments
    const [brightness, setBrightness] = useState(1);
    const [contrast, setContrast] = useState(1);
    const [saturation, setSaturation] = useState(1);

    const skImage = useImage(currentUri);
    const canvasRef = useRef<any>(null);

    useEffect(() => {
        if (visible && uri) {
            setCurrentUri(uri);
            Image.getSize(uri, (width, height) => {
                setImageSize({ width, height });
            });
            // Reset adjustments
            setBrightness(1);
            setContrast(1);
            setSaturation(1);
        }
    }, [visible, uri]);

    // Color Matrix Calculation
    const matrix = useMemo(() => {
        const b = brightness - 1;
        const c = contrast;
        const s = saturation;

        // Contrast & Brightness
        const t = (1.0 - c) / 2.0;

        // Saturation coefficients
        const lumR = 0.212671;
        const lumG = 0.715160;
        const lumB = 0.072169;

        const sr = (1 - s) * lumR;
        const sg = (1 - s) * lumG;
        const sb = (1 - s) * lumB;

        // Combined Matrix
        return [
            c * (sr + s), c * sg, c * sb, 0, (t + b) * 255,
            c * sr, c * (sg + s), c * sb, 0, (t + b) * 255,
            c * sr, c * sg, c * (sb + s), 0, (t + b) * 255,
            0, 0, 0, 1, 0,
        ];
    }, [brightness, contrast, saturation]);

    const handleRotate = async () => {
        setIsProcessing(true);
        try {
            const result = await ImageManipulator.manipulateAsync(
                currentUri,
                [{ rotate: 90 }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            setCurrentUri(result.uri);
            setImageSize({ width: imageSize.height, height: imageSize.width });
        } catch (error) {
            console.error('Rotate error:', error);
            Alert.alert('Error', 'Failed to rotate image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFlip = async (orientation: 'horizontal' | 'vertical') => {
        setIsProcessing(true);
        try {
            const result = await ImageManipulator.manipulateAsync(
                currentUri,
                [{ flip: orientation === 'horizontal' ? ImageManipulator.FlipType.Horizontal : ImageManipulator.FlipType.Vertical }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            setCurrentUri(result.uri);
        } catch (error) {
            console.error('Flip error:', error);
            Alert.alert('Error', 'Failed to flip image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCrop = async (ratio: '1:1' | '4:5' | '16:9' | 'original') => {
        if (ratio === 'original') return;

        setIsProcessing(true);
        try {
            let targetRatio = 1;
            if (ratio === '1:1') targetRatio = 1;
            else if (ratio === '4:5') targetRatio = 4 / 5;
            else if (ratio === '16:9') targetRatio = 16 / 9;

            const { width, height } = imageSize;
            const currentRatio = width / height;

            let cropWidth = width;
            let cropHeight = height;
            let originX = 0;
            let originY = 0;

            if (currentRatio > targetRatio) {
                cropWidth = height * targetRatio;
                originX = (width - cropWidth) / 2;
            } else {
                cropHeight = width / targetRatio;
                originY = (height - cropHeight) / 2;
            }

            const result = await ImageManipulator.manipulateAsync(
                currentUri,
                [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            setCurrentUri(result.uri);
            setImageSize({ width: cropWidth, height: cropHeight });
        } catch (error) {
            console.error('Crop error:', error);
            Alert.alert('Error', 'Failed to crop image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        setIsProcessing(true);
        try {
            // Apply color filters using Skia and save
            if (skImage) {
                const surface = Skia.Surface.Make(skImage.width(), skImage.height());
                if (surface) {
                    const canvas = surface.getCanvas();
                    const paint = Skia.Paint();
                    paint.setColorFilter(Skia.ColorFilter.MakeMatrix(matrix));
                    canvas.drawImage(skImage, 0, 0, paint);

                    const image = surface.makeImageSnapshot();
                    const data = image.encodeToBytes(Skia.ImageFormat.JPEG, 90);
                    const base64 = Skia.Data.fromBytes(data).toString('base64');

                    const fileName = `${FileSystem.cacheDirectory}edited_${Date.now()}.jpg`;
                    await FileSystem.writeAsStringAsync(fileName, base64, { encoding: FileSystem.EncodingType.Base64 });

                    onSave(fileName);
                    onClose();
                    return;
                }
            }

            // Fallback if Skia failed but geometric edits happened
            onSave(currentUri);
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save image changes');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderCropTools = () => (
        <View style={styles.toolbarContent}>
            <View style={styles.ratioRow}>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleCrop('1:1')}>
                    <Square size={20} color="white" />
                    <Text style={styles.toolLabel}>1:1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleCrop('4:5')}>
                    <Tablet size={20} color="white" />
                    <Text style={styles.toolLabel}>4:5</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleCrop('16:9')}>
                    <Smartphone size={20} color="white" />
                    <Text style={styles.toolLabel}>16:9</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.toolBtn} onPress={handleRotate}>
                    <RotateCcw size={24} color="white" />
                    <Text style={styles.toolLabel}>Rotate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleFlip('horizontal')}>
                    <FlipHorizontal size={24} color="white" />
                    <Text style={styles.toolLabel}>Flip H</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={() => handleFlip('vertical')}>
                    <FlipVertical size={24} color="white" />
                    <Text style={styles.toolLabel}>Flip V</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAdjustTools = () => (
        <ScrollView style={styles.toolbarContent} showsVerticalScrollIndicator={false}>
            <View style={styles.adjustmentItem}>
                <View style={styles.adjustmentHeader}>
                    <Sun size={18} color="#D4FF00" />
                    <Text style={styles.adjustmentLabel}>Brightness</Text>
                    <Text style={styles.adjustmentValue}>{Math.round(brightness * 100)}%</Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={1.5}
                    value={brightness}
                    onValueChange={setBrightness}
                    minimumTrackTintColor="#D4FF00"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#D4FF00"
                />
            </View>

            <View style={styles.adjustmentItem}>
                <View style={styles.adjustmentHeader}>
                    <Contrast size={18} color="#D4FF00" />
                    <Text style={styles.adjustmentLabel}>Contrast</Text>
                    <Text style={styles.adjustmentValue}>{Math.round(contrast * 100)}%</Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={1.5}
                    value={contrast}
                    onValueChange={setContrast}
                    minimumTrackTintColor="#D4FF00"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#D4FF00"
                />
            </View>

            <View style={styles.adjustmentItem}>
                <View style={styles.adjustmentHeader}>
                    <Droplets size={18} color="#D4FF00" />
                    <Text style={styles.adjustmentLabel}>Saturation</Text>
                    <Text style={styles.adjustmentValue}>{Math.round(saturation * 100)}%</Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={2}
                    value={saturation}
                    onValueChange={setSaturation}
                    minimumTrackTintColor="#D4FF00"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#D4FF00"
                />
            </View>
        </ScrollView>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <LinearGradient colors={['#111', '#000']} style={styles.background} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{activeTab === 'crop' ? 'Transform' : 'Adjust'}</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
                        <Check size={24} color="#D4FF00" />
                    </TouchableOpacity>
                </View>

                {/* Preview Area */}
                <View style={styles.previewContainer}>
                    {isProcessing ? (
                        <ActivityIndicator size="large" color="#D4FF00" />
                    ) : skImage ? (
                        <Canvas style={[styles.canvas, { aspectRatio: imageSize.width / imageSize.height || 1 }]}>
                            <SkiaImage
                                image={skImage}
                                x={0}
                                y={0}
                                width={SCREEN_WIDTH - 40}
                                height={(SCREEN_WIDTH - 40) / (imageSize.width / imageSize.height || 1)}
                                fit="contain"
                            >
                                <ColorMatrix matrix={matrix} />
                            </SkiaImage>
                        </Canvas>
                    ) : (
                        <Image
                            source={{ uri: currentUri }}
                            style={[styles.previewImage, { aspectRatio: imageSize.width / imageSize.height || 1 }]}
                            resizeMode="contain"
                        />
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'crop' && styles.activeTab]}
                        onPress={() => setActiveTab('crop')}
                    >
                        <CropIcon size={20} color={activeTab === 'crop' ? '#D4FF00' : 'white'} />
                        <Text style={[styles.tabText, activeTab === 'crop' && styles.activeTabText]}>Crop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'adjust' && styles.activeTab]}
                        onPress={() => setActiveTab('adjust')}
                    >
                        <Sliders size={20} color={activeTab === 'adjust' ? '#D4FF00' : 'white'} />
                        <Text style={[styles.tabText, activeTab === 'adjust' && styles.activeTabText]}>Adjust</Text>
                    </TouchableOpacity>
                </View>

                {/* Toolbar */}
                <View style={styles.toolbar}>
                    {activeTab === 'crop' ? renderCropTools() : renderAdjustTools()}
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
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20,
    },
    canvas: {
        width: SCREEN_WIDTH - 40,
        maxHeight: SCREEN_HEIGHT * 0.6,
    },
    previewImage: {
        width: SCREEN_WIDTH - 40,
        maxHeight: SCREEN_HEIGHT * 0.6,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#111',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 10,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#D4FF00',
    },
    tabText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#D4FF00',
    },
    toolbar: {
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: '#111',
        paddingHorizontal: 20,
        height: 180,
    },
    toolbarContent: {
        paddingTop: 10,
    },
    ratioRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
    },
    toolBtn: {
        alignItems: 'center',
        gap: 8,
        minWidth: 60,
    },
    toolLabel: {
        color: '#888',
        fontSize: 11,
        fontWeight: '600',
    },
    adjustmentItem: {
        marginBottom: 20,
    },
    adjustmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    adjustmentLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    adjustmentValue: {
        color: '#D4FF00',
        fontSize: 14,
        fontWeight: 'bold',
    },
    slider: {
        width: '100%',
        height: 40,
    },
});
