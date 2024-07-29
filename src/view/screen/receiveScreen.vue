<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import Peer from "peerjs";
import ClipBoard from "clipboardy";
import { useDebounceFn, useKeyPress } from "vue-hooks-plus";
import { usePeer } from "../../store/peer";
import { createMediaStreamFake } from "../../utils/webrtc/fakeCamera";
import { useRoute } from "vue-router";

const route = useRoute();
const PeerStore = usePeer();
const videoVolume = ref(0); // 视频音量
const isLoading = ref(false); // 是否正在加载
const findStream = ref(false); // 是否找到流
const videoIsPlay = ref(false); // 视频是否播放
const videoIsFitscreen = ref(false); // 视频是否网页全屏
const screenVideo = ref(null as HTMLVideoElement | null); // 屏幕分享 DOM

if (route.query.uid) {
    PeerStore.targetUID = route.query.uid as string;
}

function changeVideoPlay() {
    if (!screenVideo.value) return;
    if (videoIsPlay.value) {
        screenVideo.value.pause();
        videoIsPlay.value = false;
    } else {
        screenVideo.value.play();
        videoIsPlay.value = true;
    }
}

function videoFitscreen() {
    if (!screenVideo.value) return;
    videoIsFitscreen.value = !videoIsFitscreen.value;
    const app = document.getElementById("app");
    if (app) app.style.display = videoIsFitscreen.value ? "none" : "block";
}

function videoFullscreen() {
    if (!screenVideo.value) return;
    screenVideo.value.requestFullscreen();
}

useKeyPress("Space", changeVideoPlay);
useKeyPress("1", videoFitscreen);
useKeyPress("2", videoFullscreen);

const changeVideoVolumn = useDebounceFn(
    (value: number) => {
        if (!screenVideo.value) return;
        screenVideo.value.volume = value / 100;
    },
    {
        wait: 500,
    }
);

watch(videoVolume, (c) => {
    changeVideoVolumn.run(c);
});

function receiveStream() {
    if (!PeerStore.targetUID || !screenVideo.value) {
        return;
    }
    isLoading.value = true;
    console.log("开始接收流");
    const peerInstance = new Peer();
    peerInstance.on("open", (id) => {
        console.log("Peer ID 为: " + id);
        const videoStream = createMediaStreamFake();
        let call = peerInstance.call(PeerStore.targetUID, videoStream);

        call.on("stream", (stream) => {
            console.log("stream 加载完成", stream);
            isLoading.value = false;
            findStream.value = true;
            screenVideo.value!.srcObject = stream;
            screenVideo.value!.play();
            videoVolume.value = 100;
            videoIsPlay.value = true;
        });
    });
}

function readPaste() {
    ClipBoard.read().then((text) => {
        PeerStore.targetUID = text;
    });
}
</script>

<template>
    <div class="mt-5">
        <div class="mt-5">
            <VaCard class="m-auto flex flex-col w-5/6 mb-4">
                <VaCardTitle class="text-lg"> 接收 Receive Panel </VaCardTitle>
                <VaCardContent>
                    <div class="flex flex-1 items-end flex-wrap">
                        <VaInput
                            label="目标 UID"
                            class="grow w-24 md:w-auto"
                            v-model="PeerStore.targetUID"
                        />
                        <div class="flex flex-none flex-row justify-end ml-4">
                            <VaButton
                                @click="readPaste"
                                style="height: 34px"
                                round
                                class="flex-none"
                                icon="content_paste"
                            />
                            <VaButton
                                @click="receiveStream"
                                style="height: 34px"
                                round
                                :loading="isLoading"
                                class="flex-none ml-2"
                                icon="connected_tv"
                            />
                        </div>
                    </div>
                </VaCardContent>
            </VaCard>
        </div>
        <Teleport to="body" :disabled="!videoIsFitscreen">
            <video
                v-show="findStream"
                class="w-5/6 m-auto shadow-md"
                :class="{ 'video-fit-screen': videoIsFitscreen }"
                ref="screenVideo"
                autoplay
                controls
            ></video>
        </Teleport>
        <div
            class="w-5/6 m-auto p-2 bg-gray-200 flex items-center justify-end"
            v-if="findStream"
        >
            <div class="ml-4">
                <VaSlider
                    color="#154EC1"
                    class="w-40"
                    v-model="videoVolume"
                    track-label-visible
                />
            </div>
            <Teleport to="body" :disabled="!videoIsFitscreen">
                <div
                    class="grow-0"
                    :class="{ 'video-fit-screen-btn': videoIsFitscreen }"
                >
                    <VaButton
                        :disabled="!findStream"
                        round
                        class="ml-3"
                        @click="videoFitscreen"
                        icon="fit_screen"
                        color="#154EC1"
                        :class="{
                            'opacity-20 hover:opacity-100': videoIsFitscreen,
                        }"
                    />

                    <VaButton
                        :disabled="!findStream"
                        round
                        class="ml-3"
                        @click="videoFullscreen"
                        icon="fullscreen"
                        color="#154EC1"
                        v-show="!videoIsFitscreen"
                    />

                    <VaButton
                        round
                        class="ml-3"
                        @click="changeVideoPlay"
                        :icon="videoIsPlay ? 'pause' : 'play_arrow'"
                        color="#154EC1"
                        v-show="!videoIsFitscreen"
                    />
                </div>
            </Teleport>
        </div>
    </div>
</template>

<style scoped>
.video-fit-screen {
    object-fit: cover;
    position: absolute;
    width: 100% !important;
}

.video-fit-screen-btn {
    right: 0;
    bottom: 0;
    margin-right: 0.5em;
    margin-bottom: 0.5em;
    position: fixed;
}
</style>
