import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { useFocusEffect } from '@react-navigation/native';

const PostsScreen = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const router = useRouter();

    const fetchPosts = async (pageNum = 1) => {
        try {
            const token = await AsyncStorage.getItem("authToken");
            const cUser = await AsyncStorage.getItem("userId");

            if (!token) {
                Alert.alert("Error", "No token found. Please login again.");
                return;
            }

            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await fetch(
                `http://35.154.98.17:3000/v1/post?page=${pageNum}&limit=10&createdBy=${cUser}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const data = await res.json();
            console.log("Posts API Response:", data);
            if (pageNum === 1) {
                setPosts(data?.data || []);
            } else {
                setPosts((prev) => [...prev, ...(data?.data || [])]);
            }

            // Check if more data exists
            if (data?.data?.length < 10) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPosts(1);
    }, []);

    // Fetch whenever screen is focused and reset selection
    useFocusEffect(
        useCallback(() => {
            console.log('PostsScreen focused - Resetting states');
            setSelectedPostId(null); // Clear selected post
            fetchPosts(1);
            setPage(1);
            setHasMore(true);
        }, [])
    );

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    };

    const handleBookSlot = () => {
        if (!selectedPostId) {
            Alert.alert("No Post Selected", "Please select a post first to book a slot.");
            return;
        }
        
        router.push({
            pathname: "/CreateSlotScreen",
            params: { postId: selectedPostId }
        });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedPostId(item._id);
            }}
            style={[
                styles.card,
                selectedPostId === item._id && { borderColor: "#2563EB", borderWidth: 2 }
            ]}
        >
            <Image source={{ uri: item.mediaUrl }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.meta}>
                By {item.createdBy.fullName} • {item.approveStatus}
            </Text>
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {item.tags.map((tag, index) => (
                        <View key={index} style={[styles.tagBadge, index !== 0 && { marginLeft: 6 }]}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text>Loading posts...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Upload Button and Book Slot at the top */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => router.push("/wallpaper/upload")}
                >
                    <Text style={styles.uploadText}>Create New Post</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleBookSlot}
                >
                    <Text style={styles.secondaryText}>Book Slot</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={posts}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator size="small" color="#2563EB" style={{ margin: 10 }} />
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

export default PostsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        padding: 10,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 10,
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    content: {
        fontSize: 14,
        color: "#374151",
        marginBottom: 6,
    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        marginTop: 30,
    },
    secondaryButton: {
        backgroundColor: "#10B981",
        padding: 12,
        borderRadius: 10,
        flex: 1,
        marginLeft: 10,
        alignItems: "center",
    },
    secondaryText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    uploadButton: {
        backgroundColor: "#2563EB",
        padding: 12,
        borderRadius: 10,
        flex: 1,
        alignItems: "center",
    },
    uploadText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    meta: {
        fontSize: 12,
        color: "#6B7280",
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
    },
    tagBadge: {
        backgroundColor: "#EDE9FE",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    tagText: {
        color: "#8B5CF6",
        fontSize: 12,
        fontWeight: "600",
    },
});
