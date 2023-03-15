import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Camera, CameraType } from "expo-camera";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Button,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import supabase from "../lib/supabaseClient";
import { Video } from "expo-av";

export default function RecordScreen({ route, navigation }) {
  let cameraRef = useRef();
  let videoRef = useRef();
  const [type, setType] = useState(CameraType.front);
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [video, setVideo] = useState();
  const [countDown, setCountDown] = useState(null);
  const [ready, setReady] = useState(true);
  const [countDownRecord, setCountDownRecord] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  // const [id, setId] = useState(undefined);
  const [publicId, setPublicId] = useState(undefined);
  // setId(route.params.id);

  supabase
    .channel("record")
    .on("broadcast", { event: "supa" }, (payload) => {
      if (payload) {
        setReady(false);
        showCountdown();
      }
    })
    .subscribe();

  // if(route && route.params.id) {
  //   setId(route.params.id);

  //   if(id !== undefined) {
  //     (async() => {

  //     })()
  //     try {
  //       const {data, error} = await supabase.from("Events").select('*').eq('id', id).single()

  //     } catch (error) {

  //     }
  //   }
  //   setPublicId(route.params.id)
  // }
  const { id } = route.params;
  const getPublicId = async () => {
    const { data, error } = await supabase
      .from("Events")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error(error);
      alert("Something went wrong");
      navigation.goBack();
    }
    setPublicId(data.public_id);
  };

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      getPublicId();
    })();
  }, []);

  const setNotReady = async () => {
    let { data, error } = await supabase
      .from("Events")
      .update({ is_ready: false })
      .eq("id", id);
    if (error) {
      console.log(error);
    }
    const channel = supabase.channel("ready").subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "supa",
          payload: { org: "supabase" },
        });
      }
    });
  };

  if (hasCameraPermission === undefined) {
    return <Text>Request permission...</Text>;
  } else if (!hasCameraPermission) {
    return <Text>Camera permission not granted.</Text>;
  }

  let showCountdownRecord = () => {
    let count = 6;
    const countdown = setInterval(() => {
      setCountDownRecord(count);
      count--;
      if (count < 0) {
        clearInterval(countdown);
        setCountDownRecord(0);
        stopRecording();
      }
    }, 1000);
  };

  // countdow to start recording

  let showCountdown = () => {
    setCountDown(3);
    setTimeout(() => {
      setCountDown(2);
    }, 1500);
    setTimeout(() => {
      setCountDown(1);
    }, 2500);
    setTimeout(() => {
      showCountdownRecord();
      setCountDown(null);
      recordVideo();
    }, 3500);
  };

  let recordVideo = async () => {
    setIsRecording(true);
    let options = {
      quality: "1080p",
      maxDuration: 60,
      codec: "avc1",
      mute: true,
    };

    cameraRef.current.recordAsync(options).then((recordedVideo) => {
      setVideo(recordedVideo);
      setIsRecording(false);
      uploadVideo(recordedVideo);
      // convertVideo(recordedVideo);
    });
  };

  let stopRecording = async () => {
    setIsRecording(false);
    cameraRef.current.stopRecording();
  };

  // let convertVideo = async (recordedVideo) => {
  //   FFmpegKit.execute(
  //     `-i ${recordedVideo.uri} -vcodec h264 -acodec mp2 result.mp4`
  //   ).then(async (session) => {
  //     // Unique session id created for this execution
  //     const sessionId = session.getSessionId();
  //     console.log("sessionId:", sessionId);

  //     // Command arguments as a single string
  //     const command = session.getCommand();
  //     console.log("command:", command);

  //     // Command arguments
  //     const commandArguments = session.getArguments();
  //     console.log("commandArguments:", commandArguments);

  //     // State of the execution. Shows whether it is still running or completed
  //     const state = await session.getState();
  //     console.log("state:", state);

  //     // Return code for completed sessions. Will be undefined if session is still running or FFmpegKit fails to run it
  //     const returnCode = await session.getReturnCode();
  //     console.log("returnCode:", returnCode);

  //     const startTime = session.getStartTime();
  //     console.log("startTime:", startTime);
  //     const endTime = await session.getEndTime();
  //     console.log("endTime:", endTime);
  //     const duration = await session.getDuration();
  //     console.log("duration:", duration);

  //     // Console output generated for this execution
  //     const output = await session.getOutput();
  //     console.log("output:", output);

  //     // The stack trace if FFmpegKit fails to run a command
  //     const failStackTrace = await session.getFailStackTrace();
  //     console.log("failStackTrace:", failStackTrace);

  //     // The list of logs generated for this execution
  //     const logs = await session.getLogs();
  //     console.log("logs:", logs);

  //     // The list of statistics generated for this execution (only available on FFmpegSession)
  //     const statistics = await session.getStatistics();
  //     console.log("statistics:", statistics);
  //   });
  // };

  let uploadVideo = async (recordedVideo) => {
    setIsUploading(true);
    // get the extension
    const ext = recordedVideo.uri.substring(
      recordedVideo.uri.lastIndexOf(".") + 1
    );

    // get filename
    const filename = recordedVideo.uri.replace(/^.*[\\\/]/, "");

    // console.log(ext, filename);

    const file = new FormData();
    file.append("files", {
      uri: recordedVideo.uri,
      name: filename,
      type: `video/${ext}`,
    });

    const { data, error } = await supabase.storage
      .from("videos")
      .upload(filename, file);

    if (error) {
      console.error("Error uploading video:", error);
      setIsUploading(false);
    } else {
      console.log("Video uploaded successfully:", data);
      insertVideo(data.path);
    }
  };

  let insertVideo = async (file_path) => {
    const { data, error } = await supabase.from("Videos").insert([
      {
        file_path,
        public_id: publicId,
      },
    ]);

    if (error) {
      console.error("Error insert video :", error.message);
      setIsUploading(false);
      alert("something went wrong");
      navigation.goBack();
    }

    setIsUploading(false);
    alert("success, your video is being proccessing");
    setReady(true);
    const channel = supabase.channel("uploaded").subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "supa",
          payload: { org: "supabase", file_path },
        });
      }
    });
  };

  // if (video) {
  //   return (
  //     <View className="flex-1 items-center justify-center">
  //       <Video
  //         className="self-stretch flex-1"
  //         source={{ uri: video.uri }}
  //         useNativeControls
  //         resizeMode="contain"
  //         ref={videoRef}
  //         rate={0.5}
  //       ></Video>
  //       <Button
  //         title="Discard"
  //         onPress={() => {
  //           setVideo(undefined);
  //           setReady(true);
  //         }}
  //       ></Button>
  //     </View>
  //   );
  // }

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }

  if (isUploading) {
    return (
      <View className="flex-1 w-full justify-center items-center gap-4">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-sm font-bold text-blue-600">Loading...</Text>
      </View>
    );
  }

  return (
    <Camera
      type={type}
      ref={cameraRef}
      className="flex-1 items-center justify-center"
    >
      <Pressable
        className="absolute top-14 rounded-full p-2 left-5 w-[50px] h-[50px] flex-1 justify-center items-center"
        style={styles.flip}
        onPress={() => {
          navigation.goBack(), setNotReady();
        }}
      >
        <FontAwesome5 name="times" size={30} color="white" />
      </Pressable>
      {countDownRecord !== 0 ? (
        <Pressable
          className="absolute bottom-24"
          style={styles.recordButton}
          onPress={() => {
            showCountdown();
            setReady(false);
          }}
        >
          <Pressable
            className="absolute bg-transparent"
            style={styles.whiteRounded}
          >
            <Text>.</Text>
          </Pressable>
          <Text className="text-4xl font-bold text-center text-white">
            {countDownRecord}
          </Text>
        </Pressable>
      ) : (
        ""
      )}

      {ready && (
        <Text className="text-white font-bold text-lg uppercase">
          Ready to Spin !
        </Text>
      )}
      <Text className="text-9xl font-black text-red-600">{countDown}</Text>

      <Pressable
        className="absolute bottom-20 rounded-full p-2 right-8"
        style={styles.flip}
        onPress={toggleCameraType}
      >
        <MaterialIcons name="flip-camera-android" size={30} color="white" />
      </Pressable>
    </Camera>
  );
}

const styles = StyleSheet.create({
  flip: {
    backgroundColor: "rgba(0, 0, 0, 0.336)",
  },

  recordButton: {
    backgroundColor: "#FF0000",
    padding: 10,
    borderRadius: 100,
    height: 80,
    width: 80,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  whiteRounded: {
    height: 100,
    width: 100,
    borderColor: "white",
    borderWidth: 6,
    borderRadius: 100,
  },
});
